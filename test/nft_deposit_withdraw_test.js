const ERC721Mock = artifacts.require("ERC721Mock");
const NftFractionsRepository = artifacts.require("NftFractionsRepository");
const truffleAssert = require("truffle-assertions");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

contract("NftFractionsRepository", async function (accounts) {
	let nftFractionsRepositoryInstance;
	let erc721MockInstance;
	let nftOwner = accounts[1];
	let erc721TokenId = 1;
	let fractionsAmount = 100;

	beforeEach(async function () {
		erc721MockInstance = await ERC721Mock.new();
		await erc721MockInstance.mint(nftOwner, erc721TokenId);
		nftFractionsRepositoryInstance = await deployProxy(NftFractionsRepository, ["URI"]);
		await erc721MockInstance.approve(nftFractionsRepositoryInstance.address, erc721TokenId, { from: nftOwner });
	});

	it("should deposit the nft token", async function () {
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner });
		let newNftOwnerInOriginalContract = await erc721MockInstance.ownerOf(erc721TokenId);
		assert(newNftOwnerInOriginalContract === nftFractionsRepositoryInstance.address);
		let tokenDataFromNftFractionsRepositoryInstance = await nftFractionsRepositoryInstance.getTokenData(1);
		assert(tokenDataFromNftFractionsRepositoryInstance.erc721ContractAddress === erc721MockInstance.address);
		assert(tokenDataFromNftFractionsRepositoryInstance.erc721TokenId.toNumber() === erc721TokenId);
		assert(tokenDataFromNftFractionsRepositoryInstance.totalFractionsAmount.toNumber() === fractionsAmount);
	});

	it("should not deposit the nft token if not the onwer sends", async function () {
		let notNftOwner = accounts[2];
		await truffleAssert.reverts(
			nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: notNftOwner }),
			"msg sender has to own the token to deposit");
	});

	it("should not deposit the nft token while the contract is paused", async function () {
		await nftFractionsRepositoryInstance.pause();
		await truffleAssert.reverts(
			nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner }),
			"Not allowed while paused");
	});

	it("should return the token ids after deposit", async function () {
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner });

		let erc721TokenId2 = 2;
		await erc721MockInstance.mint(nftOwner, erc721TokenId2);
		await erc721MockInstance.approve(nftFractionsRepositoryInstance.address, erc721TokenId2, { from: nftOwner });
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId2, fractionsAmount, { from: nftOwner });

		let erc721TokenId3 = 3;
		let nftOwner2 = accounts[2];
		await erc721MockInstance.mint(nftOwner2, erc721TokenId3);
		await erc721MockInstance.approve(nftFractionsRepositoryInstance.address, erc721TokenId3, { from: nftOwner2 });
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId3, fractionsAmount, { from: nftOwner2 });

		let tokenIds = await nftFractionsRepositoryInstance.getTokenIdsByShareOwner(nftOwner);
		let expectedTokenIds = [1, 2];
		tokenIds = tokenIds.map(item => item.toNumber())
		expect(tokenIds).to.have.same.members(expectedTokenIds);

		let allTokenIds = await nftFractionsRepositoryInstance.getTokenIds();
		let expectedAllTokenIds = [1, 2, 3];
		allTokenIds = allTokenIds.map(item => item.toNumber())
		expect(allTokenIds).to.have.same.members(expectedAllTokenIds);
	});

	it("should withdraw the nft token", async function () {
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner });
		let erc721TokenId2 = 2;
		await erc721MockInstance.mint(nftOwner, erc721TokenId2);
		await erc721MockInstance.approve(nftFractionsRepositoryInstance.address, erc721TokenId2, { from: nftOwner });
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId2, fractionsAmount, { from: nftOwner });

		let tokenIds = await nftFractionsRepositoryInstance.getTokenIdsByShareOwner(nftOwner);
		let expectedTokenIds = [1, 2];
		tokenIds = tokenIds.map(item => item.toNumber())
		expect(tokenIds).to.have.same.members(expectedTokenIds);

		let erc1155tokenIdToWithdraw = 1;
		await nftFractionsRepositoryInstance.withdrawNft(erc1155tokenIdToWithdraw, { from: nftOwner });

		let ownerAfterWithdraw = await erc721MockInstance.ownerOf(erc721TokenId);
		assert(ownerAfterWithdraw === nftOwner);

		let erc1155Balance = await nftFractionsRepositoryInstance.balanceOf(nftOwner, erc1155tokenIdToWithdraw);
		assert(erc1155Balance.toNumber() === 0);

		let deletedTokenData = await nftFractionsRepositoryInstance.getTokenData(erc1155tokenIdToWithdraw);
		assert(deletedTokenData.erc721ContractAddress === "0x0000000000000000000000000000000000000000");
		assert(deletedTokenData.erc721TokenId.toNumber() === 0);
		assert(deletedTokenData.totalFractionsAmount.toNumber() === 0);

		let ownersTokens = await nftFractionsRepositoryInstance.getTokenIdsByShareOwner(nftOwner);
		ownersTokens = ownersTokens.map(item => item.toNumber());
		expect(ownersTokens).to.have.same.members([2]);

		let allTokens = await nftFractionsRepositoryInstance.getTokenIds();
		allTokens = allTokens.map(item => item.toNumber());
		expect(allTokens).to.have.same.members([2]);
	});

	it("should not withdraw the nft token while the contract is paused", async function () {
		await nftFractionsRepositoryInstance.pause();
		let erc1155tokenId = 1;
		await truffleAssert.reverts(
			nftFractionsRepositoryInstance.withdrawNft(erc1155tokenId, { from: nftOwner }),
			"Not allowed while paused");
	});

	it("should not withdraw the nft token if the sender does not own all shares", async function () {
		await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner });
		let erc1155tokenId = 1;
		let notNFTowner = accounts[2];
		await truffleAssert.reverts(
			nftFractionsRepositoryInstance.withdrawNft(erc1155tokenId, { from: notNFTowner }),
			"message sender has to own all of the shares");
	});
});

