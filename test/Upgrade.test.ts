import {expect} from "chai";
import {network} from "hardhat";

const {ethers, provider} = await network.getOrCreate();
    
// ✅ 辅助函数：强制等待指定秒数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
describe("UUPS Upgrade Test", function(){
    this.timeout(300000); // ✅ 设置 5 分钟超时
    it("should deploy and upgrade contract", async function(){
        const [owner] = await ethers.getSigners();

        let networkName = process.env.HARDHAT_NETWORK ?? "hardhat";
        console.log("Network:", networkName); 

        let mockOracle2 = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
        if(networkName === "hardhat" || networkName === "localhost"){
            // 本地环境：部署Mock预言机
            const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
            const mockOracle = await MockPriceFeed.deploy(300000000000n); // 模拟ETH/USD价格为3000.00

            console.log("Deployed Mock Oracle at:", await mockOracle.getAddress());
            mockOracle2 = await mockOracle.getAddress();
            // 部署V1
            const V1 = await ethers.getContractFactory("AuctionMarketUpgradeable");
            const v1 = await V1.deploy();
            const v1Tx = v1.deploymentTransaction();
            if(v1Tx) await v1Tx.wait(1); // ✅ 先判断再 wait
            await sleep(5000); // ✅ 额外等 5 秒
            console.log("V1 impl:", await v1.getAddress());

            // 构建初始化数据
            const initData = v1.interface.encodeFunctionData("initialize",[mockOracle2]);

            // 部署代理
            const Proxy = await ethers.getContractFactory(
                "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
            );
            const proxy = await Proxy.deploy(await v1.getAddress(), initData);
            const proxyTx = proxy.deploymentTransaction();
            if(proxyTx) await proxyTx.wait(1);
            await sleep(5000);
            console.log("Proxy:", await proxy.getAddress());


            // 绑定代理接口
            const auction = V1.attach(proxy.target);

            // 部署V2
            const V2 = await ethers.getContractFactory("AuctionMarketV2");
            const v2 = await V2.deploy();
            const v2Tx = v2.deploymentTransaction();
            if(v2Tx) await v2Tx.wait(1);
            await sleep(5000);
            console.log("V2 impl:", await v2.getAddress());


            // 手动升级
            // await auction.upgradeTo(v2.target);
            const tx = await auction.upgradeToAndCall(await v2.getAddress(), "0x");
            await tx.wait(1);
            await sleep(5000);
            console.log("Upgraded to V2");

            // 测试V2新功能
            const auctionV2 = V2.attach(proxy.target);
            await auctionV2.setFee(999);
            expect(await auctionV2.fee()).to.equal(999);

        }else{
            // 部署V1
            const V1 = await ethers.getContractFactory("AuctionMarketUpgradeable");
            const v1 = await V1.deploy();
            const v1Tx = v1.deploymentTransaction();
            if(v1Tx) await v1Tx.wait(1); // ✅ 先判断再 wait
            await sleep(5000); // ✅ 额外等 5 秒
            console.log("V1 impl:", await v1.getAddress());
            
            // 构建初始化数据
            const initData = v1.interface.encodeFunctionData("initialize",[mockOracle2]);
            
            // 部署代理
            const Proxy = await ethers.getContractFactory(
                "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
            );
            const proxy = await Proxy.deploy(await v1.getAddress(), initData);
            const proxyTx = proxy.deploymentTransaction();
            if(proxyTx) await proxyTx.wait(1);
            await sleep(5000);
            console.log("Proxy:", await proxy.getAddress());

            
            // 绑定代理接口
            const auction = V1.attach(proxy.target);
            
            // 部署V2
            const V2 = await ethers.getContractFactory("AuctionMarketV2");
            const v2 = await V2.deploy();
            const v2Tx = v2.deploymentTransaction();
            if(v2Tx) await v2Tx.wait(1);
            await sleep(5000);
            console.log("V2 impl:", await v2.getAddress());
            
            // 打印代理合约的 owner，确认是不是当前账户
            const currentOwner = await auction.owner();
            console.log("Proxy owner:", currentOwner);
            console.log("Signer:", await owner.getAddress());

            // 手动升级
            // await auction.upgradeTo(v2.target);
            const tx = await auction.upgradeToAndCall(await v2.getAddress(), "0x");
            await tx.wait(1);
            await sleep(5000);
            console.log("Upgraded to V2");
            
            // 测试V2新功能
            const auctionV2 = V2.attach(proxy.target);
            const txSetFee = await auctionV2.setFee(999);
            await txSetFee.wait(); // 👈 必须加这个！

            // 👇 再读一遍
            const feeValue = await auctionV2.fee();
            console.log("feeValue:", feeValue.toString()); // 打印看看
            expect(await auctionV2.fee()).to.equal(999);
        }
    });
});