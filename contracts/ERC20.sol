//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./utils/Context.sol";
import "./IERC20Metadata.sol";

contract ERC20 is Context, IERC20,IERC20Metadata {
    mapping(address => uint256) private _balance;
    mapping(address => mapping(address => uint256)) private _allowance;
    
    string private _name;
    string private _symbol;
    uint256 private _totalSupply;
    uint8 private _decimal;
    


    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimal_
  

    ) {
        _name = name_;
        _symbol = symbol_;
        _decimal = decimal_;
        
    }

    //Public view function
    function name() public view override returns (string memory) {
        return _name;
        
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function decimal() public view override returns (uint8) {
        return _decimal;
    }

    function totalSupply() public view  override returns (uint256) {
        return _totalSupply;
    }

    //view data
    function balanceOf(address account) public view override returns (uint256) {
        return _balance[account];
    }

    function allowance(address owner, address spender)
        public
        view  override
        returns (uint256)
    {
        return _allowance[owner][spender];
    }

    //External functions
    function transfer(address to, uint256 amount) external virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }
    
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }






    //Private functions
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) private {
        require(from != address(0), "transfer from zero address!");
        require(to != address(0), "transfer to zero address!");
        uint256 fromBalance = _balance[from];
        require(fromBalance >= amount, "not enough token to transfer!");
        unchecked {
            _balance[from] = fromBalance - amount;
        }
        _balance[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) private {
        require(owner != address(0), "approve from the zero address!");
        require(spender != address(0), "approve to zero address");
        _allowance[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) private {
        require(owner != address(0), "transfer from zero address!");
        require(spender != address(0), "transfer to zero address!");
        uint256 currentAllowance = _allowance[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "not enough allowance!");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    function _mint(address account, uint256 amount) internal  {
        require(account != address(0), "Mint to zero address!");
        _totalSupply += amount;
        _balance[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}
