// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract UUPSProxy {
    bytes32 private constant _IMPLEMENTATION_SLOT =
        hex"360894ce00000000000000000000000000000000000000000000000000000000";
    bytes32 private constant _ADMIN_SLOT =
        hex"b531276800000000000000000000000000000000000000000000000000000000";

    constructor(address implementation_, bytes memory data_) {
        assembly {
            sstore(_IMPLEMENTATION_SLOT, implementation_)
            sstore(_ADMIN_SLOT, caller())
        }
        (bool success, ) = implementation_.delegatecall(data_);
        require(success, "init failed");
    }

    fallback() external payable {
        assembly {
            let impl := sload(_IMPLEMENTATION_SLOT)
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            if eq(result, 0) {
                revert(0, returndatasize())
            }
            return(0, returndatasize())
        }
    }

    receive() external payable {}
}
