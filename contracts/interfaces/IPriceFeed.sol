// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 喂价
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IPriceFeed is AggregatorV3Interface {

}

// interface IPriceFeed {
//     function latestRoundData()
//         external
//         view
//         returns (
//             uint80 roundId,
//             int256 answer,
//             uint256 startedAt,
//             uint256 updatedAt,
//             uint80 answeredInRound
//         );

//     function decimals() external view returns (uint8);
// }
