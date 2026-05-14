import { network } from "hardhat";
import fs from "fs";
const {ethers}=await network.connect();

async function main() {
  console.log("🔁 Sepolia 合约升级 V1 → V2");

  // 读取你生成的 JSON
  const raw = fs.readFileSync("deployed-sepolia.json", "utf8");
  const config = JSON.parse(raw);
  
  // 直接取 proxy ✅ 匹配你的结构
  const proxyAddress = config.proxy;

  const [owner] = await ethers.getSigners();

  // 部署 V2
  const AuctionV2 = await ethers.getContractFactory("AuctionMarketV2");
  const v2 = await AuctionV2.deploy();
  await v2.waitForDeployment();
  const v2Addr = await v2.getAddress();
  console.log("✅ V2 实现地址:", v2Addr);

  // 连接代理
  const proxy = await ethers.getContractAt(
    "AuctionMarketUpgradeable",
    proxyAddress
  );

  // 执行升级
  const tx = await proxy.upgradeToAndCall(v2Addr, "0x");
  await tx.wait();
  console.log("✅ 升级成功！");

  // 测试
  const auctionV2 = await ethers.getContractAt("AuctionMarketV2", proxyAddress);

  const fee = await auctionV2.getFee();
  console.log("✅ 手续费 =", fee.toString());
  console.log("🎉 Sepolia 升级完成！");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});