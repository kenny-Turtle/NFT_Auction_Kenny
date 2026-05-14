import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
describe("Chainlink Oracle Price", function () {
  let priceFeedAddress: string;
  let auction: any;
  let networkName: string;

  // 超时调到 60 秒，稳一点
  this.timeout(60000);

  before(async function () {
    networkName = process.env.HARDHAT_NETWORK ?? "hardhat";
    console.log("Network:", networkName);

    const networkInfo = await ethers.provider.getNetwork();
    const chainId = networkInfo.chainId;
    console.log("Current chainId:", chainId.toString());

    // 1. 本地：部署 Mock；远程：用真实喂价地址
    if (networkName === "hardhat" || networkName === "localhost") {
      const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
      const mockOracle = await MockPriceFeed.deploy(300000000000n); // 3000.00 USD
      priceFeedAddress = await mockOracle.getAddress();
      console.log("Deployed Mock Oracle at:", priceFeedAddress);
    } else {
      // Sepolia ETH/USD
      priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
      console.log("Using real Chainlink at:", priceFeedAddress);
    }

    // 2. 部署 AuctionMarket（本地/远程统一写法）
    const Auction = await ethers.getContractFactory("AuctionMarket");
    auction = await Auction.deploy(priceFeedAddress);
    await auction.waitForDeployment();
    console.log("Deployed AuctionMarket at:", await auction.getAddress());

    // 3. 只在非本地环境，才直接调用真实 Chainlink
    if (networkName !== "hardhat" && networkName !== "localhost") {
      const chainlinkAbi = [
        "function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)"
      ];
      const chainlinkContract = new ethers.Contract(
        priceFeedAddress,
        chainlinkAbi,
        ethers.provider
      );
      try {
        const result = await chainlinkContract.latestRoundData();
        console.log("✅ Direct Chainlink call success, price:", result[1].toString());
      } catch (e) {
        console.log("❌ Direct Chainlink call failed:", e);
      }
    }
  });

  it("should read ETH/USD price from Chainlink", async function () {
    const price = await auction.getEthUsdPrice();
    console.log("Current ETH/USD price (8 decimals):", price.toString());
    expect(price > 0n).to.be.true;
  });

  it("should calculate ETH value to USD value", async function () {
    const oneEth = ethers.parseEther("1");
    const usdValue = await auction.getBidValueInUsd(oneEth);
    console.log("USD value of 1 ETH (8 decimals):", usdValue.toString());
    expect(usdValue > 0n).to.be.true;
  });
});