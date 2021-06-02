const ERC721Mock = artifacts.require("ERC721Mock");
const NftFractionsRepository = artifacts.require("NftFractionsRepository");
const Dex = artifacts.require("Dex");
const truffleAssert = require("truffle-assertions");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

contract("Dex orders", async function (accounts) {
    let nftFractionsRepositoryInstance;
    let erc721MockInstance;
    let dexInstance;
    let nftOwner = accounts[1];
    let erc721TokenId = 1;
    let fractionsAmount = 100;
    let erc1155TokenId = 1;

    beforeEach(async function () {
        erc721MockInstance = await ERC721Mock.new();
        await erc721MockInstance.mint(nftOwner, erc721TokenId);
        nftFractionsRepositoryInstance = await deployProxy(NftFractionsRepository, ["URI"]);
        await erc721MockInstance.approve(nftFractionsRepositoryInstance.address, erc721TokenId, { from: nftOwner });
        await nftFractionsRepositoryInstance.depositNft(erc721MockInstance.address, erc721TokenId, fractionsAmount, { from: nftOwner });
        dexInstance = await deployProxy(Dex, []);
        dexInstance.setNftFractionsRepository(nftFractionsRepositoryInstance.address);
        await nftFractionsRepositoryInstance.setApprovalForAll(dexInstance.address, true, { from: nftOwner });
    });

    it("should create sell limit order", async function () {
        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders[0].id == 1);
        assert(orders[0].amount == amount);
        assert(orders[0].price == price);
        assert(orders[0].side == sellSide);
        assert(orders[0].trader == nftOwner);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == 0);

        let sharesReserved = await dexInstance.getSharesReserveBalance(nftOwner, erc1155TokenId, { from: nftOwner });
        assert(sharesReserved.toNumber() === amount);
    });

    it("should not create sell limit order with more amount than the sender's balance", async function () {
        let amount = 150;
        let price = 2;
        let sellSide = 1;
        await truffleAssert.reverts(
            dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner }),
            "message sender's token balance is too low");
    });

    it("should not create sell limit order for non existing token", async function () {
        let amount = 150;
        let price = 2;
        let sellSide = 1;
        let nonExistingTokenId = 10;
        await truffleAssert.reverts(
            dexInstance.createLimitOrder(nonExistingTokenId, amount, price, sellSide, { from: nftOwner }),
            "this token does not exist");
    });

    it("should create buy limit order", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let buySide = 0;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, buySide, { from: buyer });
        let orders = await dexInstance.getOrders(erc1155TokenId, buySide);
        assert(orders[0].id == 1);
        assert(orders[0].amount == amount);
        assert(orders[0].price == price);
        assert(orders[0].side == buySide);
        assert(orders[0].trader == buyer);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == 0);

        let reservedBalance = await dexInstance.getEthReserveBalance(buyer);
        assert(reservedBalance.toNumber() == amount * price);
        let ethBalance = await dexInstance.getEthBalance(buyer);
        assert(ethBalance.toNumber() == ethDeposit);
    });

    it("should not create buy limit order for non existing token", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let buySide = 0;
        let nonExistingTokenId = 10;
        await truffleAssert.reverts(
            dexInstance.createLimitOrder(nonExistingTokenId, amount, price, buySide, { from: buyer }),
            "this token does not exist");
    });

    it("should not create buy limit order without sufficient eth balance", async function () {
        let buyer = accounts[2];
        let ethDeposit = 50;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let buySide = 0;
        await truffleAssert.reverts(
            dexInstance.createLimitOrder(erc1155TokenId, amount, price, buySide, { from: buyer }),
            "eth balance too low");
    });

    it("should not create buy limit order for bigger amount than the total fractions", async function () {
        let buyer = accounts[2];
        let ethDeposit = 50;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = fractionsAmount + 50;
        let price = 2;
        let buySide = 0;
        await truffleAssert.reverts(
            dexInstance.createLimitOrder(erc1155TokenId, amount, price, buySide, { from: buyer }),
            "total amount of fractions is lower than the given amount");
    });

    it("should create sell market order and match to one buy limit order", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let ownersBefore = await nftFractionsRepositoryInstance.getOwnersBYtokenId(erc1155TokenId);
        assert(ownersBefore.length == 1);
        assert(ownersBefore[0] == nftOwner);

        let amount = 50;
        let price = 2;
        let buySide = 0;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, buySide, { from: buyer });
        let sellSide = 1;
        let sellAmount = 40;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, sellAmount, sellSide, { from: nftOwner });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === buyer
                && e.trader2 === nftOwner
                && e.amount.toNumber() === sellAmount
                && e.price.toNumber() === price;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, buySide);
        assert(orders.length == 1);
        assert(orders[0].id == 1);
        assert(orders[0].amount == amount);
        assert(orders[0].price == price);
        assert(orders[0].side == buySide);
        assert(orders[0].trader == buyer);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == sellAmount);

        let ownersAfter = await nftFractionsRepositoryInstance.getOwnersBYtokenId(erc1155TokenId);
        assert(ownersAfter.length == 2);
        assert(ownersAfter[0] == nftOwner);
        assert(ownersAfter[1] == buyer);
        let originalOwnerBalance = await nftFractionsRepositoryInstance.balanceOf(nftOwner, erc1155TokenId);
        assert(originalOwnerBalance.toNumber() === 60);
        let buyerBalance = await nftFractionsRepositoryInstance.balanceOf(buyer, erc1155TokenId);
        assert(buyerBalance.toNumber() === 40);
    });

    it("should create sell market order and match to two buy limit orders", async function () {
        let buyer = accounts[2];
        let ethDeposit = 2000;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount1 = 50;
        let price1 = 3;
        let buySide = 0;
        await dexInstance.createLimitOrder(erc1155TokenId, amount1, price1, buySide, { from: buyer });
        let amount2 = 40;
        let price2 = 2;
        await dexInstance.createLimitOrder(erc1155TokenId, amount2, price2, buySide, { from: buyer });
        let sellSide = 1;
        let sellAmount = 80;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, sellAmount, sellSide, { from: nftOwner });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === buyer
                && e.trader2 === nftOwner
                && e.amount.toNumber() === amount1
                && e.price.toNumber() === price1;
        }, 'event params incorrect');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 2
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === buyer
                && e.trader2 === nftOwner
                && e.amount.toNumber() === 30
                && e.price.toNumber() === price2;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, buySide);
        assert(orders.length == 1);
        assert(orders[0].id == 2);
        assert(orders[0].amount == amount2);
        assert(orders[0].price == price2);
        assert(orders[0].side == buySide);
        assert(orders[0].trader == buyer);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == 30);
    });

    it("should create buy market order and match to one sell limit order", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let buySide = 0;
        let buyAmount = 40;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, buyAmount, buySide, { from: buyer });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === nftOwner
                && e.trader2 === buyer
                && e.amount.toNumber() === buyAmount
                && e.price.toNumber() === price;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders.length == 1);
        assert(orders[0].id == 1);
        assert(orders[0].amount == amount);
        assert(orders[0].price == price);
        assert(orders[0].side == sellSide);
        assert(orders[0].trader == nftOwner);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == buyAmount);
    });

    it("should create buy market order and match fully to one sell limit order", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let buySide = 0;
        let buyAmount = 60;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, buyAmount, buySide, { from: buyer });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === nftOwner
                && e.trader2 === buyer
                && e.amount.toNumber() === amount
                && e.price.toNumber() === price;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders.length == 0);
        orders = await dexInstance.getOrders(erc1155TokenId, buySide);
        assert(orders.length == 0);
    });

    it("should create buy market order and match to two sell limit order", async function () {
        let buyer = accounts[2];
        let ethDeposit = 2000;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let amount2 = 60;
        let price2 = 3;
        await dexInstance.createLimitOrder(erc1155TokenId, amount2, price2, sellSide, { from: nftOwner });
        let buySide = 0;
        let buyAmount = 90;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, buyAmount, buySide, { from: buyer });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === nftOwner
                && e.trader2 === buyer
                && e.amount.toNumber() === amount
                && e.price.toNumber() === price;
        }, 'event params incorrect');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 2
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === nftOwner
                && e.trader2 === buyer
                && e.amount.toNumber() === 40
                && e.price.toNumber() === price2;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders.length == 1);
        assert(orders[0].id == 2);
        assert(orders[0].amount == amount2);
        assert(orders[0].price == price2);
        assert(orders[0].side == sellSide);
        assert(orders[0].trader == nftOwner);
        assert(orders[0].tokenId == erc1155TokenId);
        assert(orders[0].filled == 40);
    });

    it("should create buy market order and match fully to one sell limit order which transfers the whole ownership", async function () {
        let buyer = accounts[2];
        let ethDeposit = 200;
        await dexInstance.depositEth({ from: buyer, value: ethDeposit });

        let ownersBefore = await nftFractionsRepositoryInstance.getOwnersBYtokenId(erc1155TokenId);
        assert(ownersBefore.length == 1);
        assert(ownersBefore[0] == nftOwner);

        let amount = 100;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let buySide = 0;
        let buyAmount = 100;
        let result = await dexInstance.createMarketOrder(erc1155TokenId, buyAmount, buySide, { from: buyer });

        truffleAssert.eventEmitted(result, 'NewTrade');
        truffleAssert.eventEmitted(result, 'NewTrade', (e) => {
            return e.orderId.toNumber() === 1
                && e.tokenId.toNumber() === erc1155TokenId
                && e.trader1 === nftOwner
                && e.trader2 === buyer
                && e.amount.toNumber() === amount
                && e.price.toNumber() === price;
        }, 'event params incorrect');

        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders.length == 0);
        orders = await dexInstance.getOrders(erc1155TokenId, buySide);
        assert(orders.length == 0);

        let ownersAfter = await nftFractionsRepositoryInstance.getOwnersBYtokenId(erc1155TokenId);
        assert(ownersAfter.length == 1);
        assert(ownersAfter[0] == buyer);
        let originalOwnerBalance = await nftFractionsRepositoryInstance.balanceOf(nftOwner, erc1155TokenId);
        assert(originalOwnerBalance.toNumber() === 0);
        let buyerBalance = await nftFractionsRepositoryInstance.balanceOf(buyer, erc1155TokenId);
        assert(buyerBalance.toNumber() === 100);
    });

    it("should delete limit order", async function () {
        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let amount2 = 60;
        let price2 = 3;
        await dexInstance.createLimitOrder(erc1155TokenId, amount2, price2, sellSide, { from: nftOwner });

        let orderIdToDelete = 1;
        await dexInstance.deleteOrder(erc1155TokenId, sellSide, orderIdToDelete, { from: nftOwner });

        let orders = await dexInstance.getOrders(erc1155TokenId, sellSide);
        assert(orders.length == 1);
        assert(orders[0].id == 2);
        assert(orders[0].amount == amount2);
        assert(orders[0].price == price2);
        assert(orders[0].side == sellSide);
        assert(orders[0].trader == nftOwner);
        assert(orders[0].tokenId == erc1155TokenId);
    });

    it("should not delete limit order if the sender is not the trader who registered the order", async function () {
        let amount = 50;
        let price = 2;
        let sellSide = 1;
        await dexInstance.createLimitOrder(erc1155TokenId, amount, price, sellSide, { from: nftOwner });
        let amount2 = 60;
        let price2 = 3;
        await dexInstance.createLimitOrder(erc1155TokenId, amount2, price2, sellSide, { from: nftOwner });

        let orderIdToDelete = 1;
        await truffleAssert.reverts(
            dexInstance.deleteOrder(erc1155TokenId, sellSide, orderIdToDelete, { from: accounts[2] }),
            "Only the trader can delete his order");
    });
});

