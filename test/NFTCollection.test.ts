import {expect} from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("NFTCollection", function(){
    // 测试：部署后tokenCounter从1开始
    it("should initialize tokenCounter to 1",async function(){
        const nft = await ethers.deployContract("NFTCollection");
        expect(await nft._tokenCounter()).to.equal(1);
    })

    // 测试mint 指定ID
    it("should mint NFT with specific tokenId", async function(){
        const [user] = await ethers.getSigners();
        const nft = await ethers.deployContract("NFTCollection");

        await nft.mint(user.address, 100n);
        expect(await nft.ownerOf(100n)).to.equal(user.address);
    })

    // 测试mint 自动递增ID
    it("should mint NFT with auto-incremented tokenId", async function(){
        const [user] = await ethers.getSigners();
        const nft = await ethers.deployContract("NFTCollection");

        // 第一次mintNext，tokenId=1
        await nft.mintNext(user.address);
        expect(await nft.ownerOf(1n)).to.equal(user.address);

        //第二次mintNext，tokenId=2
        await nft.mintNext(user.address);
        expect(await nft.ownerOf(2n)).to.equal(user.address);
        expect(await nft._tokenCounter()).to.equal(3);
    })

    // 测试burn，销毁NFT（只有owner可以销毁）
    it("should burn token when called by  owner", async function(){
        const [user] = await ethers.getSigners();
        const nft = await ethers.deployContract("NFTCollection");

        await nft.mintNext(user.address);
        await nft.burn(1n);

        // 验证已销毁
        await expect(nft.ownerOf(1n)).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    });

    // 非持有者不许burn
    it("should reject burn from non-owner", async function(){
        const [user, otherUser] = await ethers.getSigners();
        const nft = await ethers.deployContract("NFTCollection");

        await nft.mintNext(user.address);

        // 尝试非持有者销毁NFT
        await expect(nft.connect(otherUser).burn(1n)).to.be.revertedWith("Only the owner can burn the token");
    });

    // 测试：getCurrentTokenId返回正确值
    it("should return current tokenId correctly", async function(){
        const[user] = await ethers.getSigners();
        const nft = await ethers.deployContract("NFTCollection");

        await nft.mintNext(user.address);
        await nft.mintNext(user.address);

        expect(await nft.getCurrentTokenId()).to.equal(3n);
    })
});


