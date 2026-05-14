import { network } from "hardhat";
import fs from "fs";
const {ethers}=await network.connect();

async function main() {
  console.log("🚀 部署 NFT 拍卖系统（Sepolia 测试网）");
  const [owner] = await ethers.getSigners();
  console.log("部署者地址:", owner.address);

  const SEPOLIA_ORACLE = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

  // 1. 部署 V1
  const AuctionV1 = await ethers.getContractFactory("AuctionMarketUpgradeable");
  const v1 = await AuctionV1.deploy();
  await v1.waitForDeployment();
  const v1Addr = await v1.getAddress();
  console.log("✅ 拍卖合约 V1 实现:", v1Addr);

  // 2. 初始化数据
  const initData = v1.interface.encodeFunctionData("initialize", [SEPOLIA_ORACLE]);

  // 3. 部署代理
  const Proxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );
  const proxy = await Proxy.deploy(v1Addr, initData);
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  console.log("✅ 代理地址（业务入口）:", proxyAddr);

  // 保存
  const networkName = process.env.HARDHAT_NETWORK ?? "hardhat";
  const deployed = {
    network: networkName,
    proxy: proxyAddr,
    implementationV1: v1Addr,
    priceFeed: SEPOLIA_ORACLE,
    deployer: owner.address,
  };

  fs.writeFileSync("deployed-sepolia.json", JSON.stringify(deployed, null, 2));
  console.log("✅ 地址已保存到 deployed-sepolia.json");
  console.log("\n🎉 Sepolia 部署完成！");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});