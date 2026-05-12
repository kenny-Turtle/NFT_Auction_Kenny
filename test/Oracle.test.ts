import {expect} from "chai";
import {network} from "hardhat";

import hre from "hardhat";

const {ethers, provider}=await network.getOrCreate();

describe("Chainlink Oracle Price", function(){

    let priceFeedAddress: string;

    beforeEach(async function(){
        // 识别当前网络

        // 无法获取到网络名称，暂时做不到通过网络名称来使用不同的预言机地址
        console.log("Current network name:", hre.network);

        // const currentNetwork = await ethers.provider;
        // console.log("Current network name:", currentNetwork.name);
        // console.log("Current chainId:", currentNetwork.chainId.toString());

        // if(currentNetwork.name === "hardhat" || currentNetwork.name === "localhost"){
            // 本地环境：部署Mock预言机
            const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
            const mockOracle = await MockPriceFeed.deploy(300000000000n); // 模拟ETH/USD价格为3000.00

            console.log("Deployed Mock Oracle at:", await mockOracle.getAddress());
            priceFeedAddress = await mockOracle.getAddress();
        // }else{
        //     priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia测试网ETH/USD预言机地址
        // }
    });

    it("should read ETH/USD price from Chainlink", async function(){

        const Auction = await ethers.getContractFactory("AuctionMarket");
        console.log("Deploying AuctionMarket with price feed address:", priceFeedAddress);
        const auction = await Auction.deploy(priceFeedAddress);

        console.log("Deployed AuctionMarket at:", await auction.getAddress());

        const price = await auction.getEthUsdPrice();
        console.log("Current ETH/USD price (8 decimals):", price.toString());

        expect(price > 0n).to.be.true;
    });

    it("should calculate ETH value to USD value", async function(){

        const Auction = await ethers.getContractFactory("AuctionMarket");
        const auction = await Auction.deploy(priceFeedAddress);

        const oneEth = ethers.parseEther("1");
        const usdValue = await auction.getBidValueInUsd(oneEth);

        console.log("USD value of 1 ETH (8 decimals):", usdValue.toString());
        
        expect(usdValue > 0n).to.be.true;
    });
});