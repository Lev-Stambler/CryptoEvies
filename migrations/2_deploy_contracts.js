var EvieCoin = artifacts.require("./EvieCoin.sol");

module.exports = function(deployer) {
  // lets start with a thousand coins
  deployer.deploy(EvieCoin);
};
