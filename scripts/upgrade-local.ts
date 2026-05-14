import { network } from "hardhat";
import fs from "fs";
// const {ethers}=await network.connect();
const { ethers } = await network.getOrCreate(); // ✅ 改这里

async function main() {
  console.log("🔁 本地合约升级 V1 → V2");

  const raw = fs.readFileSync("deployed-local.json", "utf8");
  const config = JSON.parse(raw);
  const proxyAddress = config.proxy;

  const [owner, acc1] = await ethers.getSigners();

  // 1. 部署 V2
  const AuctionV2 = await ethers.getContractFactory("AuctionMarketV2");
  const v2 = await AuctionV2.connect(acc1).deploy(); 
//   const v2 = await AuctionV2.deploy();
  await v2.waitForDeployment();
  const v2Addr = await v2.getAddress();
  console.log("✅ V2 实现地址:", v2Addr);

  // 2. 连接代理
  const proxy = await ethers.getContractAt(
    "AuctionMarketUpgradeable",
    proxyAddress
  );

  // 3. 执行升级
  const tx = await proxy.upgradeToAndCall(v2Addr, "0x");
  await tx.wait();
  console.log("✅ 升级成功！");

  // 4. 测试新功能
  const auctionV2 = await ethers.getContractAt("AuctionMarketV2", proxyAddress);
  const value = await auctionV2.getFee();
    console.log("✅ V2 新功能 getFee() 返回:", value.toString());

  const fee = await auctionV2.getFee();
  console.log("✅ 设置手续费 fee =", fee.toString());
  console.log("🎉 本地升级完成！");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});