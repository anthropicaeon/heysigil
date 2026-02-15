// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SigilToken
/// @notice Minimal ERC-20 token deployed by SigilFactory for each project.
///         Fixed supply, no mint/burn after creation. All tokens minted to the factory
///         which places them as single-sided liquidity in the V4 pool.
contract SigilToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _recipient) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[_recipient] = _totalSupply;
        emit Transfer(address(0), _recipient, _totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
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

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "SIGIL: FROM_ZERO");
        require(to != address(0), "SIGIL: TO_ZERO");
        require(balanceOf[from] >= amount, "SIGIL: BALANCE");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
