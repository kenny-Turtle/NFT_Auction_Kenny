import {expect} from "chai";
import {network} from "hardhat";
import {ethers, upgrades} from "hardhat";

const {provide} = await network.getOrCreate();

describe("UUPS Upgrade Test", function(){
    it("should deploy and upgrade contract", async function(){
        const [owner] = await ethers.getSigners();
        const SEPOLIA_ETH_USD = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    });
});