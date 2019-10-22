const Cards = require('../build/Cards');
const OpenMinter = require('../build/OpenMinter');

const DeployManager = require('../util/deploy-manager.js');

const deploy = async (network, secret, etherscanApiKey) => {

	let privateKey = '';
	let etherscanApiKey = ''

	const manager = new DeployManager(network, privateKey);

	deployer = manager.getDeployer();

	deployer.setVerifierApiKey(etherscanApiKey);

	BLOCK_SIZE = 1251;

	let cards = await deployer.deployAndVerify(Cards, {}, BLOCK_SIZE, "Gods Unchained Cards", "CARD");

	let minter = await deployer.deployAndVerify(OpenMinter, {}, cards.contractAddress);

	await cards.startSeason(0, 377);
	await cards.addPack(minter.contractAddress, 0);

};

module.exports = {
	deploy
};