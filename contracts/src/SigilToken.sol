// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SigilToken
/// @notice ERC-20 token with EIP-2612 permit support for gasless transfers.
///         Deployed by SigilFactory for each project.
///         Fixed supply, no mint/burn after creation. All tokens minted to the factory
///         which places them as single-sided liquidity in the V4 pool.
contract SigilToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;

    // EIP-2612 Permit
    bytes32 public constant PERMIT_TYPEHASH =
        keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Permit(
        address indexed owner,
        address indexed spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _recipient
    ) {
        require(bytes(_name).length > 0, "SIGIL: EMPTY_NAME");
        require(bytes(_symbol).length > 0, "SIGIL: EMPTY_SYMBOL");
        require(_totalSupply > 0, "SIGIL: ZERO_SUPPLY");
        require(_recipient != address(0), "SIGIL: ZERO_RECIPIENT");

        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[_recipient] = _totalSupply;
        emit Transfer(address(0), _recipient, _totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "SIGIL: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice EIP-2612 permit: approve transfer via signature (gasless)
    /// @dev Owner signs off-chain, relayer submits with their gas
    /// @param owner Token owner
    /// @param spender Address authorized to spend
    /// @param value Amount to approve
    /// @param deadline Expiration timestamp
    /// @param v Signature component
    /// @param r Signature component
    /// @param s Signature component
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "SIGIL: PERMIT_EXPIRED");
        require(owner != address(0), "SIGIL: ZERO_OWNER");

        uint256 currentNonce = nonces[owner];

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                this.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        currentNonce,
                        deadline
                    )
                )
            )
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered == owner, "SIGIL: INVALID_SIGNATURE");

        nonces[owner] = currentNonce + 1;
        allowance[owner][spender] = value;

        emit Approval(owner, spender, value);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        require(from != address(0), "SIGIL: FROM_ZERO");
        require(to != address(0), "SIGIL: TO_ZERO");
        require(balanceOf[from] >= amount, "SIGIL: BALANCE");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    /// @notice Get the current EIP-712 domain separator
    /// @dev Domain separator updates if chainId changes
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
                    name,
                    "1",
                    block.chainid,
                    address(this)
                )
            );
    }
}
