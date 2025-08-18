require('dotenv').config();
require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: "0.8.20",
  networks: {
    sei: {
      url: "https://rpc.wallet.atlantic-2.sei.io",
      chainId: 713715,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
