const ERC721Mock = artifacts.require("ERC721Mock");
const metaDataIpfsCIDs = [
    "QmWzdJBT6w6ABZ4oxFMxJaB6cpwLaWTGthTmSVWbuEenCK",
    "QmZjh3giC15jYAnCvvFVQhuBSsvPgx5KUkGg94qkbbQbV9",
    "Qmf6QNNxW5LvKmqtwQ7VmhjWnciq7LwBzDLheKWdBKvmzA",
    "QmZ54eSPBHQYCF7szFtf7Hq89jcAhzScjUaTBCWFdLvnj3",
    "QmQwSXhN3RXc4FS4oWPFPTemvwiaiQwLLnbgYuz2TwTR1a",
    "QmTFhTDC8LMuHaFsyNWFgWTXJBjZ4DK9VyxbZDRePBqTB1"];

module.exports = async function (deployer) {
    await deployer.deploy(ERC721Mock);
    const erc721MockInstance = await ERC721Mock.deployed();

    const nftOwner1 = '0xC0F3b367AF79DEd43dBFd8e7026c1b1Db58D7b87';
    const originalNftTokenId1 = 1;
    await erc721MockInstance.mint(nftOwner1, originalNftTokenId1);
    await erc721MockInstance.setTokenURI(originalNftTokenId1, metaDataIpfsCIDs[0]);

    const originalNftTokenId2 = 2;
    await erc721MockInstance.mint(nftOwner1, originalNftTokenId2);
    await erc721MockInstance.setTokenURI(originalNftTokenId2, metaDataIpfsCIDs[1]);

    const originalNftTokenId3 = 3;
    await erc721MockInstance.mint(nftOwner1, originalNftTokenId3);
    await erc721MockInstance.setTokenURI(originalNftTokenId3, metaDataIpfsCIDs[2]);

    const originalNftTokenId4 = 4;
    await erc721MockInstance.mint(nftOwner1, originalNftTokenId4);
    await erc721MockInstance.setTokenURI(originalNftTokenId4, metaDataIpfsCIDs[3]);

    const nftOwner2 = '0xA819c28d5964c4038e96A2C29EAe72A5a9E5b420';
    const originalNftTokenId5 = 5;
    await erc721MockInstance.mint(nftOwner2, originalNftTokenId5);
    await erc721MockInstance.setTokenURI(originalNftTokenId5, metaDataIpfsCIDs[4]);

    const originalNftTokenId6 = 6;
    await erc721MockInstance.mint(nftOwner2, originalNftTokenId6);
    await erc721MockInstance.setTokenURI(originalNftTokenId6, metaDataIpfsCIDs[5]);
};