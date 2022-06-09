//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";
contract MyToken is ERC20{
    constructor(string memory name, string memory symbol, uint8 decimal,uint256 amount)
     ERC20(name, symbol, decimal){
        _mint(_msgSender(), amount * 10 ** decimal);

    }
}