const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const NftFractionsRepository = artifacts.require('NftFractionsRepository');

module.exports = async function (deployer) {
    const instance = await deployProxy(NftFractionsRepository, ["URI"], { deployer });
};