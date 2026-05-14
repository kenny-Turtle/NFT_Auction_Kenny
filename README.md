
# NFT去中心化拍卖系统
**Solidity 0.8.28 + Hardhat TypeScript + UUPS 可升级代理**

完整支持 ETH / ERC20 双币种出价、Chainlink 价格预言机、安全可升级架构，本地 + Sepolia 双环境运行。


## 目录结构
```
NFT_Auction_Kenny/
├── contracts/
│   ├── NFTCollection.sol // NFT合约
│   ├── AuctionMarket.sol // 普通版拍卖合约
│   ├── AuctionMarketUpgradeable.sol // 可升级版拍卖合约
│   ├── MockERC20.sol // ERC-20测试代币合约
│   ├── MockPriceFeed.sol // 本地预言机
│   ├── interfaces/ // 接口文件
│   │   ├── IPriceFeed.sol // 预言机接口
│   ├── libraries/ // 工具库
│   │   └── PriceConverter.sol // 价格转换库
│   └── upgradeable/  // 升级合约相关状态布局
│       └── AuctionMarketStorage.sol
├── scripts/
│   ├── deploy-local.ts // 合约本地部署
│   ├── upgrade-local.ts // 升级合约本地部署
│   ├── deploy-sepolia.ts // 合约sepolia部署
│   ├── upgrade-sepolia.ts // 升级合约sepolia部署
├── test/
│   ├── NFTCollection.test.ts // NFT功能测试
│   ├── AuctionMarket.test.ts // 拍卖逻辑测试
│   ├── Oracle.test.ts // 语言机测试
│   └── Upgrade.test.ts // 升级测试
├── deployed-local.json // 本地部署的合约地址信息
├── deployed-sepolia.json // sepolia部署的合约地址信息
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```

## 开发阶段
### 第 1 阶段：基础准备
安装 Hardhat
```
mkdir NFT_Auction_Kenny
cd NFT_Auction_Kenny
npm init -y
npm install --save-dev hardhat@3.1.0
npx hardhat --init
npm install
```
安装 OpenZeppelin
```
npm install --save-dev "@openzeppelin/contracts"
```
安装 chainlink
```
npm install --save-dev "@chainlink/contracts"
```
执行viem
```
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set PRIVATE_KEY
```


### 第 2 阶段：NFT 合约
写 ERC721
写 mint/burn
写基本测试
### 第 3 阶段：拍卖基础版
写结构体
写 createAuction
写 bidEth
写 endAuction
### 第 4 阶段：ERC20 支付
接入 ERC20
加入 approve / transferFrom
### 第 5 阶段：Chainlink
接价格 feed
写价格换算库
### 第 6 阶段：升级
改成 UUPS，写存储数据合约，逻辑合约，逻辑合约V2
编写升级测试
```
kenny@zhangfengjiedeMacBook-Pro NFT_Auction_Kenny % npx hardhat test test/Upgrade.test.ts --network sepolia
No contracts to compile
Running Mocha tests


  UUPS Upgrade Test
Network: sepolia
V1 impl: 0xE78A864BbF47dE733034DCa065D0A78D92DBB35C
Proxy: 0xa5d10fF99bdd2C5fC0904336197866C605D5272B
V2 impl: 0x6Aa22331EE93bC9de33776ECbd4B02aE30C49a56
Proxy owner: 0xc7F340b38178cfF13a32d33570Da4dA771F4ED13
Signer: 0xc7F340b38178cfF13a32d33570Da4dA771F4ED13
Upgraded to V2
feeValue: 999
    ✔ should deploy and upgrade contract (82174ms)


  1 passing (1m)


1 passing (1 mocha)
```
### 第 7 阶段：部署与文档

#### 本地部署和升级
```
kenny@192 NFT_Auction_Kenny % npx hardhat run scripts/deploy-local.ts --network localhost

🚀 部署 NFT 拍卖系统（本地环境）
部署者地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
✅ Mock 预言机: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ 拍卖合约 V1 实现: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ 代理地址（业务入口）: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ 地址已保存到 deployed-local.json

🎉 本地部署完成！
WARNING: hre.network.connect() is deprecated and will be removed in a future version. Use hre.network.create() or hre.network.getOrCreate() instead.
kenny@192 NFT_Auction_Kenny % npx hardhat run scripts/upgrade-local.ts --network localhost

🔁 本地合约升级 V1 → V2
✅ V2 实现地址: 0x8464135c8F25Da09e49BC8782676a84730C318bC
✅ 升级成功！
✅ V2 新功能 getFee() 返回: 999
✅ 设置手续费 fee = 999
🎉 本地升级完成！
```
#### sepolia部署与升级
```
kenny@192 NFT_Auction_Kenny % npx hardhat run scripts/deploy-sepolia.ts --network sepolia  

🚀 部署 NFT 拍卖系统（Sepolia 测试网）
WARNING: hre.network.connect() is deprecated and will be removed in a future version. Use hre.network.create() or hre.network.getOrCreate() instead.
部署者地址: 0xc7F340b38178cfF13a32d33570Da4dA771F4ED13
✅ 拍卖合约 V1 实现: 0x63366485998B147d59BD727a563CBB7B0DE85086
✅ 代理地址（业务入口）: 0x62229D9C437420c5FEa8310775B9f7C2f2E7113a
✅ 地址已保存到 deployed-sepolia.json

🎉 Sepolia 部署完成！

kenny@192 NFT_Auction_Kenny % npx hardhat run scripts/upgrade-sepolia.ts --network sepolia

🔁 Sepolia 合约升级 V1 → V2
WARNING: hre.network.connect() is deprecated and will be removed in a future version. Use hre.network.create() or hre.network.getOrCreate() instead.
✅ V2 实现地址: 0x96bEb1F0E46D9B9cF574eCAc1A6a008977b191F4
✅ 升级成功！
✅ 手续费 = 999
🎉 Sepolia 升级完成！
```
整理 README 和测试报告
#### 测试和覆盖率
```
kenny@192 NFT_Auction_Kenny % npx hardhat test --coverage
No contracts to compile

Running Solidity tests


Running Mocha tests


  AuctionMarket(V1)
    ✔ should create auction successfully
    ✔ should accept ETH bid
    ✔ should refund previous bidder when ETH bid is overbid
    ✔ should revert if bid ETH after auction ended
    ✔ should bid ERC20
    ✔ should refund previous bidder when ERC20 bid is overbid
    ✔ should revert if bid ERC20 after auction ended
    ✔ should end auction with ETH
    ✔ should end auction with ERC20
    ✔ should return NFT when no bids
    ✔ should trigger onERC721Received via safeTransferFrom
    ✔ should get ETH USD price
    ✔ should calculate USD value

  NFTCollection
    ✔ should initialize tokenCounter to 1
    ✔ should mint NFT with specific tokenId
    ✔ should mint NFT with auto-incremented tokenId
    ✔ should burn token when called by  owner
    ✔ should reject burn from non-owner
    ✔ should return current tokenId correctly

  Chainlink Oracle Price
Network: hardhat
Current chainId: 31337
Deployed Mock Oracle at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployed AuctionMarket at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Current ETH/USD price (8 decimals): 300000000000
    ✔ should read ETH/USD price from Chainlink
USD value of 1 ETH (8 decimals): 300000000000
    ✔ should calculate ETH value to USD value

  UUPS Upgrade Test
Network: hardhat
Deployed Mock Oracle at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
V1 impl: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Proxy: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
V2 impl: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Upgraded to V2
    ✔ should deploy and upgrade contract (20054ms)


  22 passing (20s)


22 passing (22 mocha)

Saved html report to /Users/kenny/ideaProjects/web3/MetaNode/solidity_lesson-kenny/hardhat3_folder/NFT_Auction_Kenny/coverage/html
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                 Coverage Report                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ File Coverage                                                                                                                                    ║
╟────────────────────────────────────────┬────────┬─────────────┬──────────────────────────────────────────────────────────────────────────────────╢
║ File Path                              │ Line % │ Statement % │ Uncovered Lines                                                                  ║
╟────────────────────────────────────────┼────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────╢
║ contracts/MockPriceFeed.sol            │ 33.33  │ 33.33       │ 14, 18, 22, 42                                                                   ║
║ contracts/libraries/PriceConverter.sol │ 100.00 │ 100.00      │ -                                                                                ║
║ contracts/MockERC20.sol                │ 100.00 │ 100.00      │ -                                                                                ║
║ contracts/AuctionMarket.sol            │ 100.00 │ 100.00      │ -                                                                                ║
║ contracts/NFTCollection.sol            │ 100.00 │ 100.00      │ -                                                                                ║
║ contracts/AuctionMarketUpgradeable.sol │ 15.91  │ 5.36        │ 53-56, 67, 70, 73, 76-94, 99, 102-104, 107-108, 112-113, 115, 120-121, 123-126,… ║
║ contracts/AuctionMarketV2.sol          │ 100.00 │ 100.00      │ -                                                                                ║
╟────────────────────────────────────────┼────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────╢
║ Total                                  │ 57.61  │ 55.12       │                                                                                  ║
╚════════════════════════════════════════╧════════╧═════════════╧══════════════════════════════════════════════════════════════════════════════════╝


WARNING: hre.network.connect() is deprecated and will be removed in a future version. Use hre.network.create() or hre.network.getOrCreate() instead.
kenny@192 NFT_Auction_Kenny % 
```