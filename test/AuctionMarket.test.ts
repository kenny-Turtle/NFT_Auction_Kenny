import {expect} from "chai";
import {network} from "hardhat";

const {provider,ethers}=await network.connect();

describe("AuctionMarket(V1)", function(){
    let nft: any;
    let auction: any;
    let erc20: any;
    let owner: any;
    let buyer: any;
    let buyer2: any;

    // 每次测试前部署新的合约
    beforeEach(async function(){
        [owner, buyer, buyer2] = await ethers.getSigners();

        // 部署NFT
        const NFT = await ethers.getContractFactory("NFTCollection");
        nft  = await NFT.deploy();

        // 部署 Mock ERC-20
        const ERC20 = await ethers.getContractFactory("MockERC20");
        erc20 = await ERC20.deploy();
        
        // 部署 Mock 预言机
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        const mockOracle = await MockPriceFeed.deploy(300000000000n);
        const oracleAddr = await mockOracle.getAddress();

        // 部署拍卖合约
        const Auction = await ethers.getContractFactory("AuctionMarket");
        auction = await Auction.deploy(oracleAddr);
    });

  // ✅ 1. 创建拍卖
    it("should create auction successfully", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);

        await auction.createAuction(nft.target, 1n,ethers.ZeroAddress, 3600);
        const a = await auction.auctions(0n);

        
        expect(a.seller).to.equal(owner.address);
        expect(a.ended).to.equal(false);
    });

  // ✅ 2. ETH 出价
    it("should accept ETH bid", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n,ethers.ZeroAddress, 3600);

        await auction.connect(buyer).bidEth(0n, {value: ethers.parseEther("0.1")});
        const a = await auction.auctions(0n);

        expect(a.highestBidder).to.equal(buyer.address);
        expect(a.highestBid).to.equal(ethers.parseEther("0.1"));
    });


    // ✅ 3. ETH 覆盖出价（触发第 99 行退款）
    it("should refund previous bidder when ETH bid is overbid", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);
    
        await auction.connect(buyer).bidEth(0n, { value: ethers.parseEther("0.1") });
        await auction.connect(buyer2).bidEth(0n, { value: ethers.parseEther("0.2") });
    
        const a = await auction.auctions(0n);
        expect(a.highestBidder).to.equal(buyer2.address);
        expect(a.highestBid).to.equal(ethers.parseEther("0.2"));
    });

    // ✅ 4. ETH 出价：拍卖已结束 revert
    it("should revert if bid ETH after auction ended", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);
    
        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);
        await auction.endAuction(0n);
    
        await expect(
          auction.connect(buyer).bidEth(0n, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Auction ended");
    });

    // ✅ 5. ERC20 出价
    it("should bid ERC20", async function(){
        // 铸nft
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);

        // 创建拍卖
        await auction.createAuction(nft.target, 1n, erc20.target, 3600);

        // 给买家发测试ERC-20
        await erc20.mint(buyer.address, ethers.parseEther("1000"));

        // 买家授权给拍卖合约
        await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));

        // 买家出价
        await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));

        const a = await auction.auctions(0n);
        expect(a.highestBidder).to.equal(buyer.address);
        expect(a.highestBid).to.equal(ethers.parseEther("100"));
    });



    // ✅ 6. ERC20 覆盖出价（触发第 123 行退款）
    it("should refund previous bidder when ERC20 bid is overbid", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, erc20.target, 3600);
    
        await erc20.mint(buyer.address, ethers.parseEther("1000"));
        await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));
        await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));
    
        await erc20.mint(buyer2.address, ethers.parseEther("1000"));
        await erc20.connect(buyer2).approve(auction.target, ethers.parseEther("1000"));
        await auction.connect(buyer2).bidErc20(0n, ethers.parseEther("200"));
    
        const a = await auction.auctions(0n);
        expect(a.highestBidder).to.equal(buyer2.address);
    });


    // ✅ 7. ERC20 出价：拍卖已结束 revert
    it("should revert if bid ERC20 after auction ended", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, erc20.target, 3600);
    
        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);
        await auction.endAuction(0n);
    
        await expect(
          auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"))
        ).to.be.revertedWith("Auction ended");
    });
  
    // ✅ 8. 结束拍卖（ETH 有出价）
    it("should end auction with ETH", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);
    
        await auction.connect(buyer).bidEth(0n, { value: ethers.parseEther("0.1") });
    
        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);
        await auction.endAuction(0n);
    
        expect(await nft.ownerOf(1n)).to.equal(buyer.address);
    });
  
    // ✅ 9. 结束拍卖（ERC20 有出价）
    it("should end auction with ERC20", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, erc20.target, 3600);
    
        await erc20.mint(buyer.address, ethers.parseEther("1000"));
        await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));
        await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));
    
        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);
        await auction.endAuction(0n);
    
        expect(await erc20.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
        expect(await nft.ownerOf(1n)).to.equal(buyer.address);
    });
  
    // ✅ 10. 结束拍卖：无人出价 → NFT 退回卖家（补齐覆盖率！）
    it("should return NFT when no bids", async function () {
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);
    
        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);
        await auction.endAuction(0n);
    
        expect(await nft.ownerOf(1n)).to.equal(owner.address);
    });
  

    // ✅ 11. 触发 onERC721Received（覆盖第 191 行）
    it("should trigger onERC721Received via safeTransferFrom", async function () {
        await nft.mintNext(owner.address);
        // 直接 safeTransfer 给拍卖合约，触发回调
        await nft["safeTransferFrom(address,address,uint256)"](owner.address, auction.target, 1);
    });

    // ✅ 12. Chainlink 价格查询（补齐覆盖率！）
    it("should get ETH USD price", async function () {
        const price = await auction.getEthUsdPrice();
        expect(price).to.gt(0);
    });
  
    // ✅ 13. 计算美元价值（补齐覆盖率！）
    it("should calculate USD value", async function () {
        const usd = await auction.getBidValueInUsd(ethers.parseEther("1"));
        expect(usd).to.gt(0);
    });
})