const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const Dex = artifacts.require('Dex');
const NftFractionsRepository = artifacts.require('NftFractionsRepository');

module.exports = async function (deployer) {
    nftFractionsRepositoryInstance = await NftFractionsRepository.deployed();
    const instance = await deployProxy(Dex, [], { deployer });
    await instance.setNftFractionsRepository(nftFractionsRepositoryInstance.address);
};