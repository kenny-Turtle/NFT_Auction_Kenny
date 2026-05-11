// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTCollection is ERC721 {
    // 计数
    uint256 public _tokenCounter = 1;

    // 构造函数，设置NFT的名称和符号
    constructor() ERC721("Kenny NFT", "KNFT") {}

    // 直接铸造指定tokenId的NFT
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    // 铸造下一个tokenId的NFT，自动递增tokenId
    function mintNext(address to) external returns (uint256) {
        _mint(to, _tokenCounter);
        uint256 tokenId = _tokenCounter;
        _tokenCounter++;
        return tokenId;
    }

    // 销毁指定tokenId的NFT，只有拥有者可以销毁
    function burn(uint256 tokenId) external {
        require(
            msg.sender == ownerOf(tokenId),
            "Only the owner can burn the token"
        );
        _burn(tokenId);
    }

    // 查询当前最大TokenId
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenCounter;
    }
}
