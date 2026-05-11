
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
#### 项目总揽
一个 NFT 合约
一个拍卖市场合约
一个支持升级的拍卖版本
一个价格预言机工具库
单元测试与集成测试
本地部署脚本
Sepolia 部署脚本

目录结构
```
NFT_Auction_Kenny/
├── contracts/
│   ├── NFTCollection.sol // NFT合约
│   ├── AuctionMarket.sol // 普通版拍卖合约
│   ├── AuctionMarketUpgradeable.sol // 可升级版拍卖合约
│   ├── interfaces/ // 接口文件
│   │   ├── IPriceFeed.sol
│   │   └── IERC20Metadata.sol
│   ├── libraries/ // 工具库
│   │   └── PriceConverter.sol
│   └── upgradeable/  // 升级合约相关状态布局
│       └── AuctionMarketStorage.sol
├── test/
│   ├── NFTCollection.test.ts // NFT功能测试
│   ├── AuctionMarket.test.ts // 拍卖逻辑测试
│   ├── Oracle.test.ts // 语言机测试
│   └── Upgrade.test.ts // 升级测试
├── scripts/
│   ├── deploy.ts // 普通合约部署
│   ├── deploy-upgradeable.ts // 可升级合约部署
│   └── verify.ts // 验证合约源码
├── ignition/
│   └── modules/
│       ├── NFTModule.ts
│       └── AuctionModule.ts
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── testing.md
│   └── development-guide.md
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```





第 2 阶段：NFT 合约
写 ERC721
写 mint
写基本测试
第 3 阶段：拍卖基础版
写结构体
写 createAuction
写 bidEth
写 endAuction
第 4 阶段：ERC20 支付
接入 ERC20
加入 approve / transferFrom
第 5 阶段：Chainlink
接价格 feed
写价格换算库
第 6 阶段：升级
改成 UUPS 或透明代理
编写升级测试
第 7 阶段：部署与文档
部署到 Sepolia
输出地址
整理 README 和测试报告
