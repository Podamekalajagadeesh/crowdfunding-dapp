import hre from "hardhat";

const { ethers } = await hre.network.create();

console.log("Deploying Crowdfunding contract...");

const Crowdfunding =
  await ethers.getContractFactory("Crowdfunding");

const crowdfunding =
  await Crowdfunding.deploy();

await crowdfunding.waitForDeployment();

const address =
  await crowdfunding.getAddress();

console.log("Crowdfunding deployed to:", address);
