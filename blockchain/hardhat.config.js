import "dotenv/config";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatMocha,
    hardhatVerify,
  ],

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    localhost: {
      type: "http",
      url: "http" + "://" + "127.0.0.1:8545",
      chainType: "l1",
    },

    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainType: "l1",
    },
  },

  test: {
    mocha: {
      timeout: 40000,
    },
  },
});
