// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IPriceFeed.sol";

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // 1 ETH = ？ 美元 （返回8位小数， 例如 3000_00000000 = 3000美元）
    function getEthUsdPrice(address priceFeed) internal view returns (uint256) {
        // 读取ETH/USD价格
        (, int256 price, , , ) = IPriceFeed(priceFeed).latestRoundData();
        return uint256(price);
    }

    // 计算： ETH金额 = ？美元
    function getEthValueInUsd(
        uint256 ethAmount,
        address priceFeed
    ) internal view returns (uint256) {
        uint256 price = getEthUsdPrice(priceFeed);
        // ethAmount(18位小数) * price(8位小数) / 1e18 = 美元金额（8位小数）
        return (ethAmount * price) / 1e18;
    }

    // 1 ETH = ？ 美元 （返回8位小数， 例如 3000_00000000 = 3000美元）
    function getEthUsdPriceV2(
        address priceFeed
    ) internal view returns (uint256) {
        // 读取ETH/USD价格
        (, int256 price, , , ) = AggregatorV3Interface(priceFeed)
            .latestRoundData();
        return uint256(price);
    }

    // 计算： ETH金额 = ？美元
    function getEthValueInUsdV2(
        uint256 ethAmount,
        address priceFeed
    ) internal view returns (uint256) {
        uint256 price = getEthUsdPriceV2(priceFeed);
        // ethAmount(18位小数) * price(8位小数) / 1e18 = 美元金额（8位小数）
        return (ethAmount * price) / 1e18;
    }
}
