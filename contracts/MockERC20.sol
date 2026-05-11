// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MOCK Token", "MTK") {}

    // 铸造指定数量的代币给指定地址
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
