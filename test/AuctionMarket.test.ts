import {expect} from "chai";
import {network} from "hardhat";

const {provider,ethers}=await network.connect();

describe("AuctionMarket(V1)", function(){
    let nft: any;
    let auction: any;
    let erc20: any;
    let owner: any;
    let buyer: any;

    // 每次测试前部署新的合约
    beforeEach(async function(){
        [owner, buyer] = await ethers.getSigners();

        // 部署NFT
        const NFT = await ethers.getContractFactory("NFTCollection");
        nft  = await NFT.deploy();

        // 部署 Mock ERC-20
        const ERC20 = await ethers.getContractFactory("MockERC20");
        erc20 = await ERC20.deploy();
        
        // 部署拍卖合约
        const Auction = await ethers.getContractFactory("AuctionMarket");
        auction = await Auction.deploy();
    });

    // 创建拍卖
    it("should create auction successfully", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);

        await auction.createAuction(nft.target, 1n,ethers.ZeroAddress, 3600);
        const a = await auction.auctions(0n);

        
        expect(a.seller).to.equal(owner.address);
        expect(a.ended).to.equal(false);
    });

    // 竞价
    it("should accept ETH bid", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n,ethers.ZeroAddress, 3600);

        await auction.connect(buyer).bidEth(0n, {value: ethers.parseEther("0.1")});
        const a = await auction.auctions(0n);

        expect(a.highestBidder).to.equal(buyer.address);
        expect(a.highestBid).to.equal(ethers.parseEther("0.1"));
    });

    // ERC-20竞价
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
    })

    // 结束拍卖
    it("should end auction with ETH", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);

        await auction.connect(buyer).bidEth(0n, {value: ethers.parseEther("0.1")});

        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);

        await auction.endAuction(0n);

        expect(await nft.ownerOf(1n)).to.equal(buyer.address);
    })

    // 结束ERC-20拍卖
    it("should end auction with ERC20", async function(){
        await nft.mintNext(owner.address);
        await nft.approve(auction.target, 1n);
        await auction.createAuction(nft.target, 1n, erc20.target, 3600);

        await erc20.mint(buyer.address, ethers.parseEther("1000"));
        await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));
        await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));

        await provider.send("evm_increaseTime", [3601]);
        await provider.send("evm_mine", []);

        await auction.endAuction(0n);

        // 验证，卖家收到钱，买家收到nft
        expect(await erc20.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
        expect(await nft.ownerOf(1n)).to.equal(buyer.address);
    })
})