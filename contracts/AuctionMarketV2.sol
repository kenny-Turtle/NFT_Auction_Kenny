// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AuctionMarketUpgradeable.sol";

contract AuctionMarketV2 is AuctionMarketUpgradeable {
    uint256 public fee;

    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }
}
