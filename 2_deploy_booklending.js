const BookLending = artifacts.require("BookLending");

module.exports = function(deployer) {
  deployer.deploy(BookLending);
};
