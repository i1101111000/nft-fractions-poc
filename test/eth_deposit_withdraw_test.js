const NftFractionsRepository = artifacts.require("NftFractionsRepository");
const Dex = artifacts.require("Dex");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const truffleAssert = require("truffle-assertions");

contract("Dex eth deposits and withdrawals", async function (accounts) {
    let nftFractionsRepositoryInstance;
    let dexInstance;
    let ethOwner = accounts[8];

    beforeEach(async function () {
        nftFractionsRepositoryInstance = await deployProxy(NftFractionsRepository, ["URI"]);
        dexInstance = await deployProxy(Dex, []);
        dexInstance.setNftFractionsRepository(nftFractionsRepositoryInstance.address);
    });

    it("should deposit eth", async function () {
        let amount = 100;
        await dexInstance.depositEth({ from: ethOwner, value: amount });
        let ownerBalance = await dexInstance.getEthBalance(ethOwner);
        assert(ownerBalance.toNumber() === amount);
    });

    it("should withdraw eth", async function () {
        let amount = 100;
        await dexInstance.depositEth({ from: ethOwner, value: amount });
        let ownerBalance = await dexInstance.getEthBalance(ethOwner);
        assert(ownerBalance.toNumber() === amount);
        await dexInstance.withdrawEth(amount, { from: ethOwner });
        ownerBalance = await dexInstance.getEthBalance(ethOwner);
        assert(ownerBalance.toNumber() === 0);
    });

    it("should not withdraw eth more than the owners balance", async function () {
        let amount = 100;
        await dexInstance.depositEth({ from: ethOwner, value: amount });
        let ownerBalance = await dexInstance.getEthBalance(ethOwner);
        assert(ownerBalance.toNumber() === amount);
        await truffleAssert.reverts(
            dexInstance.withdrawEth(amount + 1, { from: ethOwner }),
            "ETH balance is not enough");
    });
});

