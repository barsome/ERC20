// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

/*Interface for the optional metadata functions from the ERC20 standard.*/

interface IERC20Metadata is IERC20 {
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function decimal() external view returns(uint8);
}

