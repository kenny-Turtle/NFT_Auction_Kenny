// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AuctionMarketUpgradeable.sol";

contract AuctionMarketV2 is AuctionMarketUpgradeable {
    constructor() {
        _disableInitializers();
    }

    function getFee() external pure returns (uint256) {
        return 999;
    }
}
