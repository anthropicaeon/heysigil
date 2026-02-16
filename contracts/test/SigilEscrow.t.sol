// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {SigilEscrow} from "../src/SigilEscrow.sol";
import {ISigilEscrow} from "../src/interfaces/ISigilEscrow.sol";
import {SigilToken} from "../src/SigilToken.sol";

/// @title SigilEscrowTest
/// @notice Tests for the SigilEscrow DAO governance contract.
contract SigilEscrowTest is Test {
    SigilEscrow public escrow;
    SigilToken public token;

    address dev = makeAddr("dev");
    address protocol = makeAddr("protocol");
    address voter1 = makeAddr("voter1");
    address voter2 = makeAddr("voter2");
    address voter3 = makeAddr("voter3");
    address smallHolder = makeAddr("smallHolder");

    uint256 constant TOTAL_SUPPLY = 100_000_000_000 ether; // 100B
    uint256 constant ESCROW_AMOUNT = 10_000_000_000 ether;  // 10B in escrow
    uint256 constant PROPOSAL_AMOUNT = 1_000_000_000 ether; // 1B unlock request

    // 0.05% of 100B = 50M tokens
    uint256 constant THRESHOLD = TOTAL_SUPPLY * 5 / 10_000;
    // 4% of 100B = 4B tokens
    uint256 constant QUORUM = TOTAL_SUPPLY * 400 / 10_000;

    function setUp() public {
        // Deploy token — all supply minted to this test contract
        token = new SigilToken("Test Token", "TEST", TOTAL_SUPPLY, address(this));

        // Deploy escrow
        escrow = new SigilEscrow(address(token), dev, protocol);

        // Fund escrow with 10B tokens
        token.transfer(address(escrow), ESCROW_AMOUNT);
        escrow.syncBalance();

        // Distribute tokens for voting:
        //   voter1: 3B (above quorum alone)
        //   voter2: 2B
        //   voter3: 1B
        //   smallHolder: 1000 (way below threshold)
        //   dev: 50M (exactly at threshold)
        token.transfer(voter1, 3_000_000_000 ether);
        token.transfer(voter2, 2_000_000_000 ether);
        token.transfer(voter3, 1_000_000_000 ether);
        token.transfer(smallHolder, 1000);
        token.transfer(dev, 50_000_000 ether);
    }

    // ─── Deposit Tests ───────────────────────────────────

    function test_deposit() public {
        uint256 depositAmount = 100 ether;
        token.approve(address(escrow), depositAmount);
        escrow.deposit(depositAmount);
        assertEq(escrow.escrowBalance(), ESCROW_AMOUNT + depositAmount);
    }

    function test_syncBalance() public {
        // Direct transfer (simulating hook's IERC20.transfer)
        uint256 directAmount = 500 ether;
        token.transfer(address(escrow), directAmount);
        escrow.syncBalance();
        assertEq(escrow.escrowBalance(), ESCROW_AMOUNT + directAmount);
    }

    // ─── Proposal Creation Tests ─────────────────────────

    function test_devCanCreateProposal() public {
        vm.prank(dev);
        uint256 id = escrow.createProposal(
            "Ship v2.0",
            "Complete refactor with new UI",
            PROPOSAL_AMOUNT,
            block.timestamp + 30 days
        );
        assertEq(id, 1);
        assertEq(escrow.proposalCount(), 1);

        (address proposer,, uint256 targetDate, ISigilEscrow.ProposalStatus status,) =
            escrow.getProposalCore(id);
        assertEq(proposer, dev);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Voting));
        assertGt(targetDate, block.timestamp);
    }

    function test_holderAboveThresholdCanPropose() public {
        // voter1 has 3B > 50M threshold
        vm.prank(voter1);
        uint256 id = escrow.createProposal(
            "Community Request",
            "Add dark mode",
            PROPOSAL_AMOUNT,
            block.timestamp + 14 days
        );
        assertEq(id, 1);
    }

    function test_holderBelowThresholdCannotPropose() public {
        vm.prank(smallHolder);
        vm.expectRevert(SigilEscrow.BelowThreshold.selector);
        escrow.createProposal(
            "Spam",
            "I have no tokens",
            PROPOSAL_AMOUNT,
            block.timestamp + 7 days
        );
    }

    function test_cannotProposeExceedingEscrow() public {
        vm.prank(dev);
        vm.expectRevert(SigilEscrow.InvalidAmount.selector);
        escrow.createProposal(
            "Too much",
            "Asking for more than escrow holds",
            ESCROW_AMOUNT + 1,
            block.timestamp + 7 days
        );
    }

    function test_cannotProposePastTargetDate() public {
        vm.prank(dev);
        vm.expectRevert(SigilEscrow.InvalidTargetDate.selector);
        escrow.createProposal(
            "Past",
            "Target date in the past",
            PROPOSAL_AMOUNT,
            block.timestamp - 1
        );
    }

    // ─── Voting Tests ────────────────────────────────────

    function test_voteYes() public {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        escrow.vote(id, true);

        (, uint256 yesVotes, uint256 noVotes,,,) = escrow.getProposalVotes(id);
        assertEq(yesVotes, 3_000_000_000 ether);
        assertEq(noVotes, 0);
    }

    function test_voteNo() public {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        escrow.vote(id, false);

        (, uint256 yesVotes, uint256 noVotes,,,) = escrow.getProposalVotes(id);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 3_000_000_000 ether);
    }

    function test_voteWithComment() public {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        vm.expectEmit(true, true, false, true);
        emit ISigilEscrow.VotedWithComment(id, voter1, true, 3_000_000_000 ether, "Great milestone!");
        escrow.voteWithComment(id, true, "Great milestone!");
    }

    function test_cannotVoteTwice() public {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        escrow.vote(id, true);

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.AlreadyVoted.selector);
        escrow.vote(id, true);
    }

    function test_cannotVoteAfterDeadline() public {
        uint256 id = _createDevProposal();

        vm.warp(block.timestamp + 5 days + 1);

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.VotingEnded.selector);
        escrow.vote(id, true);
    }

    function test_zeroBalanceCannotVote() public {
        uint256 id = _createDevProposal();

        address noTokens = makeAddr("noTokens");
        vm.prank(noTokens);
        vm.expectRevert(SigilEscrow.BelowThreshold.selector);
        escrow.vote(id, true);
    }

    // ─── Finalize Vote Tests ─────────────────────────────

    function test_finalizeVote_approved() public {
        uint256 id = _createDevProposal();

        // voter1 (3B) + voter2 (2B) = 5B > 4B quorum
        vm.prank(voter1);
        escrow.vote(id, true);
        vm.prank(voter2);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,ISigilEscrow.ProposalStatus status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Approved));
    }

    function test_finalizeVote_rejected() public {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        escrow.vote(id, false);
        vm.prank(voter2);
        escrow.vote(id, false);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,ISigilEscrow.ProposalStatus status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Rejected));
    }

    function test_finalizeVote_expired_noQuorum() public {
        uint256 id = _createDevProposal();

        // voter3 has 1B < 4B quorum
        vm.prank(voter3);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,ISigilEscrow.ProposalStatus status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Expired));
    }

    function test_cannotFinalizeBeforeDeadline() public {
        uint256 id = _createDevProposal();

        vm.expectRevert(SigilEscrow.VotingNotEnded.selector);
        escrow.finalizeVote(id);
    }

    // ─── Completion Phase Tests ──────────────────────────

    function test_fullLifecycle_completed() public {
        uint256 id = _approveProposal();

        // Dev submits proof
        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com/v2-shipped");

        // Community votes on completion
        vm.prank(voter1);
        escrow.voteCompletion(id, true);
        vm.prank(voter2);
        escrow.voteCompletion(id, true);

        // Finalize completion
        vm.warp(block.timestamp + 3 days + 1);
        escrow.finalizeCompletion(id);

        (,,,ISigilEscrow.ProposalStatus status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Completed));

        // Tokens released to dev
        assertEq(token.balanceOf(dev), 50_000_000 ether + PROPOSAL_AMOUNT);
        assertEq(escrow.escrowBalance(), ESCROW_AMOUNT - PROPOSAL_AMOUNT);
    }

    function test_onlyDevCanSubmitProof() public {
        uint256 id = _approveProposal();

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.OnlyDev.selector);
        escrow.submitProof(id, "https://fake.proof");
    }

    function test_cannotSubmitProofBeforeApproval() public {
        uint256 id = _createDevProposal();

        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(
            SigilEscrow.ProposalNotInStatus.selector,
            ISigilEscrow.ProposalStatus.Approved,
            ISigilEscrow.ProposalStatus.Voting
        ));
        escrow.submitProof(id, "https://too-early.proof");
    }

    function test_completionVoteWithComment() public {
        uint256 id = _approveProposal();

        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");

        vm.prank(voter1);
        escrow.voteCompletionWithComment(id, true, "Looks legit, great work!");
    }

    // ─── Dispute + Protocol Override Tests ───────────────

    function test_disputed_then_protocolOverride() public {
        uint256 id = _approveProposal();

        // Dev submits proof
        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");

        // Community rejects completion
        vm.prank(voter1);
        escrow.voteCompletion(id, false);
        vm.prank(voter2);
        escrow.voteCompletion(id, false);

        vm.warp(block.timestamp + 3 days + 1);
        escrow.finalizeCompletion(id);

        (,,,ISigilEscrow.ProposalStatus status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Disputed));

        // Protocol overrides the unfair dispute
        uint256 devBalBefore = token.balanceOf(dev);
        vm.prank(protocol);
        escrow.protocolOverride(id);

        (,,,status,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Overridden));
        assertEq(token.balanceOf(dev), devBalBefore + PROPOSAL_AMOUNT);
    }

    function test_protocolCannotOverrideNonDisputed() public {
        uint256 id = _approveProposal();

        vm.prank(protocol);
        vm.expectRevert(SigilEscrow.OnlyCompletionOverride.selector);
        escrow.protocolOverride(id);
    }

    function test_nonProtocolCannotOverride() public {
        uint256 id = _disputeProposal();

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.OnlyProtocol.selector);
        escrow.protocolOverride(id);
    }

    function test_protocolCannotOverrideVotingPhase() public {
        uint256 id = _createDevProposal();

        vm.prank(protocol);
        vm.expectRevert(SigilEscrow.OnlyCompletionOverride.selector);
        escrow.protocolOverride(id);
    }

    // ─── View Tests ──────────────────────────────────────

    function test_proposalThreshold() public view {
        assertEq(escrow.proposalThreshold(), THRESHOLD);
    }

    function test_quorumThreshold() public view {
        assertEq(escrow.quorumThreshold(), QUORUM);
    }

    function test_getProposalText() public {
        uint256 id = _createDevProposal();
        (string memory title, string memory description, string memory proofUri) =
            escrow.getProposalText(id);
        assertEq(title, "Ship v2.0");
        assertEq(description, "Complete refactor");
        assertEq(bytes(proofUri).length, 0);
    }

    // ─── Admin Tests ─────────────────────────────────────

    function test_setDevWallet() public {
        address newDev = makeAddr("newDev");
        vm.prank(protocol);
        escrow.setDevWallet(newDev);
        assertEq(escrow.devWallet(), newDev);
    }

    function test_onlyProtocolCanSetDevWallet() public {
        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.OnlyProtocol.selector);
        escrow.setDevWallet(makeAddr("hacker"));
    }

    // ─── Helpers ─────────────────────────────────────────

    function _createDevProposal() internal returns (uint256) {
        vm.prank(dev);
        return escrow.createProposal(
            "Ship v2.0",
            "Complete refactor",
            PROPOSAL_AMOUNT,
            block.timestamp + 30 days
        );
    }

    function _approveProposal() internal returns (uint256) {
        uint256 id = _createDevProposal();

        vm.prank(voter1);
        escrow.vote(id, true);
        vm.prank(voter2);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        return id;
    }

    function _disputeProposal() internal returns (uint256) {
        uint256 id = _approveProposal();

        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");

        vm.prank(voter1);
        escrow.voteCompletion(id, false);
        vm.prank(voter2);
        escrow.voteCompletion(id, false);

        vm.warp(block.timestamp + 3 days + 1);
        escrow.finalizeCompletion(id);

        return id;
    }
}
