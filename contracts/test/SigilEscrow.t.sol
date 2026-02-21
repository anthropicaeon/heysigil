// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {SigilEscrow} from "../src/SigilEscrow.sol";
import {ISigilEscrow} from "../src/interfaces/ISigilEscrow.sol";
import {SigilToken} from "../src/SigilToken.sol";

/// @title SigilEscrowTest
/// @notice Tests for the multi-token SigilEscrow DAO governance contract.
contract SigilEscrowTest is Test {
    SigilEscrow public escrow;
    SigilToken public tokenA;
    SigilToken public tokenB;

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
        // Deploy tokens — all supply minted to this test contract
        tokenA = new SigilToken("Token A", "TKA", TOTAL_SUPPLY, address(this));
        tokenB = new SigilToken("Token B", "TKB", TOTAL_SUPPLY, address(this));

        // Deploy multi-token escrow
        escrow = new SigilEscrow(dev, protocol);

        // Fund escrow with 10B of tokenA via direct transfer + sync
        tokenA.transfer(address(escrow), ESCROW_AMOUNT);
        escrow.syncBalance(address(tokenA));

        // Fund escrow with 10B of tokenB via direct transfer + sync
        tokenB.transfer(address(escrow), ESCROW_AMOUNT);
        escrow.syncBalance(address(tokenB));

        // Distribute tokenA for voting:
        //   voter1: 3B, voter2: 2B, voter3: 1B, smallHolder: 1000, dev: 50M
        tokenA.transfer(voter1, 3_000_000_000 ether);
        tokenA.transfer(voter2, 2_000_000_000 ether);
        tokenA.transfer(voter3, 1_000_000_000 ether);
        tokenA.transfer(smallHolder, 1000);
        tokenA.transfer(dev, 50_000_000 ether);

        // Distribute tokenB for voting (same amounts)
        tokenB.transfer(voter1, 3_000_000_000 ether);
        tokenB.transfer(voter2, 2_000_000_000 ether);
        tokenB.transfer(voter3, 1_000_000_000 ether);
        tokenB.transfer(smallHolder, 1000);
        tokenB.transfer(dev, 50_000_000 ether);
    }

    // ─── Deposit Tests ───────────────────────────────────

    function test_deposit() public {
        uint256 depositAmount = 100 ether;
        tokenA.approve(address(escrow), depositAmount);
        escrow.deposit(address(tokenA), depositAmount);
        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT + depositAmount);
    }

    function test_depositZeroReverts() public {
        vm.expectRevert(SigilEscrow.InvalidAmount.selector);
        escrow.deposit(address(tokenA), 0);
    }

    function test_depositZeroAddressReverts() public {
        vm.expectRevert(SigilEscrow.ZeroAddress.selector);
        escrow.deposit(address(0), 100 ether);
    }

    function test_syncBalance() public {
        // Direct transfer (simulating LPLocker's IERC20.transfer)
        uint256 directAmount = 500 ether;
        tokenA.transfer(address(escrow), directAmount);
        escrow.syncBalance(address(tokenA));
        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT + directAmount);
    }

    function test_syncBalanceZeroAddressReverts() public {
        vm.expectRevert(SigilEscrow.ZeroAddress.selector);
        escrow.syncBalance(address(0));
    }

    // ─── Multi-Token Deposit Tests ──────────────────────

    function test_multiTokenDeposit() public {
        // Verify independent balances after setUp
        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT);
        assertEq(escrow.escrowBalances(address(tokenB)), ESCROW_AMOUNT);

        // Add more to tokenA only
        uint256 extra = 777 ether;
        tokenA.approve(address(escrow), extra);
        escrow.deposit(address(tokenA), extra);

        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT + extra);
        assertEq(escrow.escrowBalances(address(tokenB)), ESCROW_AMOUNT); // unchanged
    }

    function test_syncBalance_multiToken() public {
        // Direct transfer of different amounts to each token
        tokenA.transfer(address(escrow), 100 ether);
        tokenB.transfer(address(escrow), 200 ether);

        escrow.syncBalance(address(tokenA));
        escrow.syncBalance(address(tokenB));

        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT + 100 ether);
        assertEq(escrow.escrowBalances(address(tokenB)), ESCROW_AMOUNT + 200 ether);
    }

    // ─── Proposal Creation Tests ─────────────────────────

    function test_devCanCreateProposal() public {
        vm.prank(dev);
        uint256 id = escrow.createProposal(
            address(tokenA),
            "Ship v2.0",
            "Complete refactor with new UI",
            PROPOSAL_AMOUNT,
            block.timestamp + 30 days
        );
        assertEq(id, 1);
        assertEq(escrow.proposalCount(), 1);

        (address proposer, address token,, uint256 targetDate, ISigilEscrow.ProposalStatus status,,) =
            escrow.getProposalCore(id);
        assertEq(proposer, dev);
        assertEq(token, address(tokenA));
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Voting));
        assertGt(targetDate, block.timestamp);
    }

    function test_holderAboveThresholdCanPropose() public {
        // voter1 has 3B > 50M threshold
        vm.prank(voter1);
        uint256 id = escrow.createProposal(
            address(tokenA),
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
            address(tokenA),
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
            address(tokenA),
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
            address(tokenA),
            "Past",
            "Target date in the past",
            PROPOSAL_AMOUNT,
            block.timestamp - 1
        );
    }

    function test_cannotProposeZeroAddressToken() public {
        vm.prank(dev);
        vm.expectRevert(SigilEscrow.ZeroAddress.selector);
        escrow.createProposal(
            address(0),
            "Bad token",
            "Zero address token",
            PROPOSAL_AMOUNT,
            block.timestamp + 7 days
        );
    }

    // ─── Voting Tests ────────────────────────────────────

    function test_voteYes() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(voter1);
        escrow.vote(id, true);

        (, uint256 yesVotes, uint256 noVotes,,,) = escrow.getProposalVotes(id);
        assertEq(yesVotes, 3_000_000_000 ether);
        assertEq(noVotes, 0);
    }

    function test_voteNo() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(voter1);
        escrow.vote(id, false);

        (, uint256 yesVotes, uint256 noVotes,,,) = escrow.getProposalVotes(id);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 3_000_000_000 ether);
    }

    function test_voteWithComment() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(voter1);
        vm.expectEmit(true, true, false, true);
        emit ISigilEscrow.VotedWithComment(id, voter1, true, 3_000_000_000 ether, "Great milestone!");
        escrow.voteWithComment(id, true, "Great milestone!");
    }

    function test_cannotVoteTwice() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(voter1);
        escrow.vote(id, true);

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.AlreadyVoted.selector);
        escrow.vote(id, true);
    }

    function test_cannotVoteAfterDeadline() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.warp(block.timestamp + 5 days + 1);

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.VotingEnded.selector);
        escrow.vote(id, true);
    }

    function test_zeroBalanceCannotVote() public {
        uint256 id = _createDevProposal(address(tokenA));

        address noTokens = makeAddr("noTokens");
        vm.prank(noTokens);
        vm.expectRevert(SigilEscrow.BelowThreshold.selector);
        escrow.vote(id, true);
    }

    // ─── Finalize Vote Tests ─────────────────────────────

    function test_finalizeVote_approved() public {
        uint256 id = _createDevProposal(address(tokenA));

        // voter1 (3B) + voter2 (2B) = 5B > 4B quorum
        vm.prank(voter1);
        escrow.vote(id, true);
        vm.prank(voter2);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,, ISigilEscrow.ProposalStatus status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Approved));
    }

    function test_finalizeVote_rejected() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(voter1);
        escrow.vote(id, false);
        vm.prank(voter2);
        escrow.vote(id, false);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,, ISigilEscrow.ProposalStatus status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Rejected));
    }

    function test_finalizeVote_expired_noQuorum() public {
        uint256 id = _createDevProposal(address(tokenA));

        // voter3 has 1B < 4B quorum
        vm.prank(voter3);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        (,,,, ISigilEscrow.ProposalStatus status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Expired));
    }

    function test_cannotFinalizeBeforeDeadline() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.expectRevert(SigilEscrow.VotingNotEnded.selector);
        escrow.finalizeVote(id);
    }

    // ─── Completion Phase Tests ──────────────────────────

    function test_fullLifecycle_completed() public {
        uint256 id = _approveProposal(address(tokenA));

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

        (,,,, ISigilEscrow.ProposalStatus status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Completed));

        // Tokens released to dev
        assertEq(tokenA.balanceOf(dev), 50_000_000 ether + PROPOSAL_AMOUNT);
        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT - PROPOSAL_AMOUNT);
    }

    function test_onlyDevCanSubmitProof() public {
        uint256 id = _approveProposal(address(tokenA));

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.OnlyDev.selector);
        escrow.submitProof(id, "https://fake.proof");
    }

    function test_cannotSubmitProofBeforeApproval() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(
            SigilEscrow.ProposalNotInStatus.selector,
            ISigilEscrow.ProposalStatus.Approved,
            ISigilEscrow.ProposalStatus.Voting
        ));
        escrow.submitProof(id, "https://too-early.proof");
    }

    function test_completionVoteWithComment() public {
        uint256 id = _approveProposal(address(tokenA));

        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");

        vm.prank(voter1);
        escrow.voteCompletionWithComment(id, true, "Looks legit, great work!");
    }

    // ─── Dispute + Protocol Override Tests ───────────────

    function test_disputed_then_protocolOverride() public {
        uint256 id = _approveProposal(address(tokenA));

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

        (,,,, ISigilEscrow.ProposalStatus status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Disputed));

        // Protocol overrides the unfair dispute
        uint256 devBalBefore = tokenA.balanceOf(dev);
        vm.prank(protocol);
        escrow.protocolOverride(id);

        (,,,, status,,) = escrow.getProposalCore(id);
        assertEq(uint8(status), uint8(ISigilEscrow.ProposalStatus.Overridden));
        assertEq(tokenA.balanceOf(dev), devBalBefore + PROPOSAL_AMOUNT);
    }

    function test_protocolCannotOverrideNonDisputed() public {
        uint256 id = _approveProposal(address(tokenA));

        vm.prank(protocol);
        vm.expectRevert(SigilEscrow.OnlyCompletionOverride.selector);
        escrow.protocolOverride(id);
    }

    function test_nonProtocolCannotOverride() public {
        uint256 id = _disputeProposal(address(tokenA));

        vm.prank(voter1);
        vm.expectRevert(SigilEscrow.OnlyProtocol.selector);
        escrow.protocolOverride(id);
    }

    function test_protocolCannotOverrideVotingPhase() public {
        uint256 id = _createDevProposal(address(tokenA));

        vm.prank(protocol);
        vm.expectRevert(SigilEscrow.OnlyCompletionOverride.selector);
        escrow.protocolOverride(id);
    }

    // ─── View Tests ──────────────────────────────────────

    function test_proposalThreshold() public view {
        assertEq(escrow.proposalThreshold(address(tokenA)), THRESHOLD);
    }

    function test_quorumThreshold() public view {
        assertEq(escrow.quorumThreshold(address(tokenA)), QUORUM);
    }

    function test_getProposalText() public {
        uint256 id = _createDevProposal(address(tokenA));
        (string memory title, string memory description, string memory proofUri) =
            escrow.getProposalText(id);
        assertEq(title, "Ship v2.0");
        assertEq(description, "Complete refactor");
        assertEq(bytes(proofUri).length, 0);
    }

    function test_getEscrowBalance() public view {
        assertEq(escrow.getEscrowBalance(address(tokenA)), ESCROW_AMOUNT);
        assertEq(escrow.getEscrowBalance(address(tokenB)), ESCROW_AMOUNT);
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

    // ─── Cross-Token Isolation Tests ─────────────────────

    function test_proposalForTokenA_doesNotAffectTokenB() public {
        // Create and complete a proposal for tokenA
        uint256 id = _approveProposal(address(tokenA));

        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");

        vm.prank(voter1);
        escrow.voteCompletion(id, true);
        vm.prank(voter2);
        escrow.voteCompletion(id, true);

        vm.warp(block.timestamp + 3 days + 1);
        escrow.finalizeCompletion(id);

        // tokenA escrow decreased
        assertEq(escrow.escrowBalances(address(tokenA)), ESCROW_AMOUNT - PROPOSAL_AMOUNT);
        // tokenB escrow untouched
        assertEq(escrow.escrowBalances(address(tokenB)), ESCROW_AMOUNT);
    }

    function test_voterCanVoteOnMultipleTokenProposals() public {
        // Create proposals for both tokens
        uint256 idA = _createDevProposal(address(tokenA));
        uint256 idB = _createDevProposal(address(tokenB));

        // voter1 votes on both
        vm.prank(voter1);
        escrow.vote(idA, true);
        vm.prank(voter1);
        escrow.vote(idB, true);

        (, uint256 yesA,,,,) = escrow.getProposalVotes(idA);
        (, uint256 yesB,,,,) = escrow.getProposalVotes(idB);

        assertEq(yesA, 3_000_000_000 ether);
        assertEq(yesB, 3_000_000_000 ether);
    }

    function test_releaseTokens_oneToken_doesNotAffectOther() public {
        // Complete lifecycle for tokenA
        uint256 id = _approveProposal(address(tokenA));
        vm.prank(dev);
        escrow.submitProof(id, "https://proof.example.com");
        vm.prank(voter1);
        escrow.voteCompletion(id, true);
        vm.prank(voter2);
        escrow.voteCompletion(id, true);
        vm.warp(block.timestamp + 3 days + 1);
        escrow.finalizeCompletion(id);

        // tokenA: dev received PROPOSAL_AMOUNT
        assertEq(tokenA.balanceOf(dev), 50_000_000 ether + PROPOSAL_AMOUNT);
        // tokenB: dev unchanged
        assertEq(tokenB.balanceOf(dev), 50_000_000 ether);
        // tokenB escrow unchanged
        assertEq(escrow.escrowBalances(address(tokenB)), ESCROW_AMOUNT);
    }

    function test_constructorZeroAddressReverts() public {
        vm.expectRevert(SigilEscrow.ZeroAddress.selector);
        new SigilEscrow(address(0), protocol);

        vm.expectRevert(SigilEscrow.ZeroAddress.selector);
        new SigilEscrow(dev, address(0));
    }

    // ─── Helpers ─────────────────────────────────────────

    function _createDevProposal(address token) internal returns (uint256) {
        vm.prank(dev);
        return escrow.createProposal(
            token,
            "Ship v2.0",
            "Complete refactor",
            PROPOSAL_AMOUNT,
            block.timestamp + 30 days
        );
    }

    function _approveProposal(address token) internal returns (uint256) {
        uint256 id = _createDevProposal(token);

        vm.prank(voter1);
        escrow.vote(id, true);
        vm.prank(voter2);
        escrow.vote(id, true);

        vm.warp(block.timestamp + 5 days + 1);
        escrow.finalizeVote(id);

        return id;
    }

    function _disputeProposal(address token) internal returns (uint256) {
        uint256 id = _approveProposal(token);

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
