import { expect } from "chai";
import { network } from "hardhat";

const { provider, ethers } = await network.getOrCreate();

describe("AuctionMarketUpgradeable (UUPS)", function () {
  let nft: any;
  let auction: any;
  let erc20: any;
  let owner: any;
  let buyer: any;
  let buyer2: any;

  beforeEach(async function () {
    [owner, buyer, buyer2] = await ethers.getSigners();

    // 部署 NFT
    const NFT = await ethers.getContractFactory("NFTCollection");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // 部署 Mock ERC20
    const ERC20 = await ethers.getContractFactory("MockERC20");
    erc20 = await ERC20.deploy();
    await erc20.waitForDeployment();

    // 部署 Mock PriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockOracle = await MockPriceFeed.deploy(300000000000n);
    await mockOracle.waitForDeployment();
    const oracleAddr = await mockOracle.getAddress();

    // 部署 V1 实现合约
    const Auction = await ethers.getContractFactory("AuctionMarketUpgradeable");
    const implementation = await Auction.deploy();
    await implementation.waitForDeployment();

    // 初始化数据
    const initData = implementation.interface.encodeFunctionData("initialize", [oracleAddr]);

    // 部署代���
    const Proxy = await ethers.getContractFactory(
      "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
    );
    const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
    await proxy.waitForDeployment();

    // 绑定代理地址
    auction = Auction.attach(await proxy.getAddress());
  });

  it("should initialize correctly", async function () {
    expect(await auction.owner()).to.equal(owner.address);
  });

  it("should create auction successfully", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);

    await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);
    const a = await auction.getAuction(0n);

    expect(a.seller).to.equal(owner.address);
    expect(a.ended).to.equal(false);
  });

  it("should accept ETH bid", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);
    await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);

    await auction.connect(buyer).bidEth(0n, { value: ethers.parseEther("0.1") });
    const a = await auction.getAuction(0n);

    expect(a.highestBidder).to.equal(buyer.address);
    expect(a.highestBid).to.equal(ethers.parseEther("0.1"));
  });

  it("should refund previous ETH bidder", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);
    await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);

    await auction.connect(buyer).bidEth(0n, { value: ethers.parseEther("0.1") });
    await auction.connect(buyer2).bidEth(0n, { value: ethers.parseEther("0.2") });

    const a = await auction.getAuction(0n);
    expect(a.highestBidder).to.equal(buyer2.address);
    expect(a.highestBid).to.equal(ethers.parseEther("0.2"));
  });

  it("should bid ERC20", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);
    await auction.createAuction(nft.target, 1n, erc20.target, 3600);

    await erc20.mint(buyer.address, ethers.parseEther("1000"));
    await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));
    await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));

    const a = await auction.getAuction(0n);
    expect(a.highestBidder).to.equal(buyer.address);
    expect(a.highestBid).to.equal(ethers.parseEther("100"));
  });

  it("should refund previous ERC20 bidder", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);
    await auction.createAuction(nft.target, 1n, erc20.target, 3600);

    await erc20.mint(buyer.address, ethers.parseEther("1000"));
    await erc20.connect(buyer).approve(auction.target, ethers.parseEther("1000"));
    await auction.connect(buyer).bidErc20(0n, ethers.parseEther("100"));

    await erc20.mint(buyer2.address, ethers.parseEther("1000"));
    await erc20.connect(buyer2).approve(auction.target, ethers.parseEther("1000"));
    await auction.connect(buyer2).bidErc20(0n, ethers.parseEther("200"));

    const a = await auction.getAuction(0n);
    expect(a.highestBidder).to.equal(buyer2.address);
    expect(a.highestBid).to.equal(ethers.parseEther("200"));
  });

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
  });

  it("should return NFT when no bids", async function () {
    await nft.mintNext(owner.address);
    await nft.approve(auction.target, 1n);
    await auction.createAuction(nft.target, 1n, ethers.ZeroAddress, 3600);

    await provider.send("evm_increaseTime", [3601]);
    await provider.send("evm_mine", []);
    await auction.endAuction(0n);

    expect(await nft.ownerOf(1n)).to.equal(owner.address);
  });

  it("should get ETH USD price", async function () {
    const price = await auction.getEthUsdPrice();
    expect(price).to.gt(0);
  });

  it("should calculate USD value", async function () {
    const usd = await auction.getBidValueInUsd(ethers.parseEther("1"));
    expect(usd).to.gt(0);
  });

  it("should trigger onERC721Received", async function () {
    await nft.mintNext(owner.address);
    await nft["safeTransferFrom(address,address,uint256)"](
      owner.address,
      auction.target,
      1n
    );
  });

  it("should upgrade to V2 successfully", async function () {
    const AuctionV2 = await ethers.getContractFactory("AuctionMarketV2");
    const implementationV2 = await AuctionV2.deploy();
    await implementationV2.waitForDeployment();

    const tx = await auction.upgradeToAndCall(await implementationV2.getAddress(), "0x");
    await tx.wait();

    const upgraded = AuctionV2.attach(auction.target);
    expect(await upgraded.getFee()).to.equal(999n);
  });
});