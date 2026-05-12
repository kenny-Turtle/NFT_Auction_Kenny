// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// ERC20出价
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// 价格转换
import "./libraries/PriceConverter.sol";

contract AuctionMarket is IERC721Receiver, ReentrancyGuard {
    // 引入库
    using PriceConverter for uint256;

    struct Auction {
        address seller;
        address nftAddress;
        uint256 tokenId;
        address paymentToken; // 支付代币（0地址表示ETH，其他地址表示ERC20代币）
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool ended;
    }

    // 状态变量
    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;

    // chainlink语言机地址
    address public priceFeed;

    // 事件
    event AuctionCreated(
        uint256 auctionId,
        address seller,
        address nft,
        uint256 tokenId,
        address paymentToken
    );
    event Bid(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 hightestBid);

    constructor(address _priceFeed) {
        priceFeed = _priceFeed;
    }

    // 创建拍卖
    function createAuction(
        address nftAddress,
        uint256 tokenId,
        address paymentToken,
        uint256 duration
    ) external nonReentrant {
        // 获取NFT
        IERC721 nft = IERC721(nftAddress);

        // 校验：调用者必须是NFT拥有者
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");

        // 将NFT转入合约
        nft.transferFrom(msg.sender, address(this), tokenId);

        // 创建拍卖
        uint256 auctionId = auctionCounter++;
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            paymentToken: paymentToken,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            ended: false
        });
        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftAddress,
            tokenId,
            paymentToken
        );
    }

    // ETH出价
    function bidEth(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];

        // 校验
        require(!auction.ended, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.value > auction.highestBid, "Bid too low");

        // 退还上一个出价人的钱
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        // 更新最高出价
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit Bid(auctionId, msg.sender, msg.value);
    }

    // ERC20出价
    function bidErc20(uint256 auctionId, uint256 amount) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        address token = auction.paymentToken;

        require(token != address(0), "Only ERC20 auction");
        require(!auction.ended, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(amount > auction.highestBid, "Bid too low");

        IERC20 erc20 = IERC20(token);

        // 转账前先退还上一个出价人的钱
        if (auction.highestBidder != address(0)) {
            erc20.transfer(auction.highestBidder, auction.highestBid);
        }

        // 从用户账户扣钱 -》 进入合约
        erc20.transferFrom(msg.sender, address(this), amount);

        auction.highestBid = amount;
        auction.highestBidder = msg.sender;
        emit Bid(auctionId, msg.sender, amount);
    }

    // 结束拍卖
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        // 校验
        require(!auction.ended, "Auction ended");
        require(block.timestamp >= auction.endTime, "Auction not expired");

        auction.ended = true;
        IERC721 nft = IERC721(auction.nftAddress);

        if (auction.highestBidder != address(0)) {
            // 有出价，将NFT转给最高出价人，卖家拿钱
            nft.safeTransferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );
            if (auction.paymentToken != address(0)) {
                // ERC20支付
                IERC20(auction.paymentToken).transfer(
                    auction.seller,
                    auction.highestBid
                );
            } else {
                payable(auction.seller).transfer(auction.highestBid);
            }
        } else {
            // 无出价，将NFT退回卖家
            nft.safeTransferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
        }
        emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
    }

    // 获取美元价格
    function getEthUsdPrice() external view returns (uint256) {
        return PriceConverter.getEthUsdPrice(priceFeed);
    }

    // 计算ETH出价对应的美元价值
    function getBidValueInUsd(
        uint256 ethAmount
    ) external view returns (uint256) {
        return ethAmount.getEthValueInUsd(priceFeed);
    }

    // 实现IERC721Receiver接口，允许合约接收NFT
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
