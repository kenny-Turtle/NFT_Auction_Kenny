// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract AuctionMarketStorage {
    struct Auction {
        address seller;
        address nftAddress;
        uint256 tokenId;
        address paymentToken;
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool ended;
    }

    uint256 internal _auctionCounter;
    mapping(uint256 => Auction) internal _autctions;
}
