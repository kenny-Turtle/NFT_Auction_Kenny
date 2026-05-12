import {expect} from "chai";
import {network} from "hardhat";

import hre from "hardhat";

const {ethers, provider}=await network.getOrCreate();

describe("Chainlink Oracle Price", function(){

    let priceFeedAddress: string;

    let auction: any;
    let networkName: string;
    before(async function(){
        // 识别当前网络

        // 无法获取到网络名称，暂时做不到通过网络名称来使用不同的预言机地址
        networkName = process.env.HARDHAT_NETWORK ?? "hardhat";
        console.log("Network:", networkName); 

        const networkInfo = await ethers.provider.getNetwork();
        const chainId = networkInfo.chainId;
        console.log("Current chainId:", chainId.toString());


        if(networkName === "hardhat" || networkName === "localhost"){
            // 本地环境：部署Mock预言机
            const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
            const mockOracle = await MockPriceFeed.deploy(300000000000n); // 模拟ETH/USD价格为3000.00

            console.log("Deployed Mock Oracle at:", await mockOracle.getAddress());
            priceFeedAddress = await mockOracle.getAddress();
        }else{
            priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia测试网ETH/USD预言机地址
        }
        const Auction = await ethers.getContractFactory("AuctionMarket");
        auction = await Auction.deploy(priceFeedAddress);
        console.log("Deployed AuctionMarket at:", await auction.getAddress());
        // ✅ 等待 2 个区块确认，确保合约完全上链
        await auction.deploymentTransaction()?.wait(2);
        console.log("AuctionMarket deployed at:", await auction.getAddress());

        // ✅ 直接调用 Chainlink 合约，绕过 AuctionMarket
        const chainlinkAbi = ["function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)"];
        const chainlinkContract = new ethers.Contract(
            "0x694AA1769357215DE4FAC081bf1f309aDC325306",
            chainlinkAbi,
            ethers.provider
        );
    try {
        const result = await chainlinkContract.latestRoundData();
        console.log("✅ Direct Chainlink call success, price:", result[1].toString());
    } catch (e) {
        console.log("❌ Direct Chainlink call failed:", e);
    }

    });




    it("should read ETH/USD price from Chainlink", async function(){

        let price;
        if(networkName === "hardhat" || networkName === "localhost"){
            console.log("Using Mock Oracle for testing.");
            price = await auction.getEthUsdPrice();
        }else{
            console.log("Using Chainlink Oracle for testing.");
            price = await auction.getEthUsdPrice();
        }
        console.log("Current ETH/USD price (8 decimals):", price.toString());

        expect(price > 0n).to.be.true;
    });

    it("should calculate ETH value to USD value", async function(){



        const oneEth = ethers.parseEther("1");
        let usdValue;
        if(networkName === "hardhat" || networkName === "localhost"){
            console.log("Using Mock Oracle for testing.");
            usdValue = await auction.getBidValueInUsd(oneEth);
        }else{
            console.log("Using Chainlink Oracle for testing.");
            usdValue = await auction.getBidValueInUsd(oneEth);
        }

        console.log("USD value of 1 ETH (8 decimals):", usdValue.toString());
        
        expect(usdValue > 0n).to.be.true;
    });
});