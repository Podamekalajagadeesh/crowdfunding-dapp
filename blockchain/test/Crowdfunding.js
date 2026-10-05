import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

async function expectRevert(txPromise, expectedMessage) {
  try {
    await txPromise;
    throw new Error(
      `Expected transaction to revert with "${expectedMessage}", but it succeeded`
    );
  } catch (error) {
    const message = error?.message || String(error);

    if (!message.includes(expectedMessage)) {
      throw new Error(
        `Expected revert "${expectedMessage}", but got:\n${message}`
      );
    }
  }
}

describe("Crowdfunding", function () {
  let crowdfunding;
  let creator;
  let contributor;
  let anotherContributor;

  beforeEach(async function () {
    [, creator, contributor, anotherContributor] =
      await ethers.getSigners();

    const Crowdfunding =
      await ethers.getContractFactory("Crowdfunding");

    crowdfunding = await Crowdfunding.deploy();

    await crowdfunding.waitForDeployment();
  });

  describe("Campaign Creation", function () {
    it("should create a campaign", async function () {
      await crowdfunding
        .connect(creator)
        .createCampaign(
          "Build a Web3 App",
          "Help fund my decentralized application",
          ethers.parseEther("10"),
          30
        );

      const campaign = await crowdfunding.getCampaign(0);

      expect(campaign.id).to.equal(0n);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.title).to.equal("Build a Web3 App");
      expect(campaign.description).to.equal(
        "Help fund my decentralized application"
      );
      expect(campaign.goal).to.equal(
        ethers.parseEther("10")
      );
      expect(campaign.amountRaised).to.equal(0n);
      expect(campaign.withdrawn).to.equal(false);
    });

    it("should reject an empty title", async function () {
      await expectRevert(
        crowdfunding
          .connect(creator)
          .createCampaign(
            "",
            "Description",
            ethers.parseEther("1"),
            30
          ),
        "Title required"
      );
    });

    it("should reject a zero goal", async function () {
      await expectRevert(
        crowdfunding
          .connect(creator)
          .createCampaign(
            "Campaign",
            "Description",
            0,
            30
          ),
        "Goal must be greater than zero"
      );
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      await crowdfunding
        .connect(creator)
        .createCampaign(
          "Build a Web3 App",
          "Help fund my decentralized application",
          ethers.parseEther("10"),
          30
        );
    });

    it("should accept ETH contributions", async function () {
      await crowdfunding
        .connect(contributor)
        .contribute(0, {
          value: ethers.parseEther("2"),
        });

      const campaign = await crowdfunding.getCampaign(0);

      expect(campaign.amountRaised).to.equal(
        ethers.parseEther("2")
      );

      const contribution =
        await crowdfunding.getContribution(
          0,
          contributor.address
        );

      expect(contribution).to.equal(
        ethers.parseEther("2")
      );
    });

    it("should track multiple contributors", async function () {
      await crowdfunding
        .connect(contributor)
        .contribute(0, {
          value: ethers.parseEther("2"),
        });

      await crowdfunding
        .connect(anotherContributor)
        .contribute(0, {
          value: ethers.parseEther("3"),
        });

      const campaign = await crowdfunding.getCampaign(0);

      expect(campaign.amountRaised).to.equal(
        ethers.parseEther("5")
      );
    });

    it("should reject zero contributions", async function () {
      await expectRevert(
        crowdfunding
          .connect(contributor)
          .contribute(0, {
            value: 0,
          }),
        "Contribution must be greater than zero"
      );
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await crowdfunding
        .connect(creator)
        .createCampaign(
          "Build a Web3 App",
          "Help fund my decentralized application",
          ethers.parseEther("5"),
          1
        );

      await crowdfunding
        .connect(contributor)
        .contribute(0, {
          value: ethers.parseEther("5"),
        });
    });

    it("should not allow withdrawal before deadline", async function () {
      await expectRevert(
        crowdfunding.connect(creator).withdraw(0),
        "Campaign is still active"
      );
    });

    it("should allow creator to withdraw after deadline", async function () {
      await ethers.provider.send(
        "evm_increaseTime",
        [24 * 60 * 60 + 1]
      );

      await ethers.provider.send("evm_mine");

      const balanceBefore =
        await ethers.provider.getBalance(
          creator.address
        );

      const tx = await crowdfunding
        .connect(creator)
        .withdraw(0);

      await tx.wait();

      const balanceAfter =
        await ethers.provider.getBalance(
          creator.address
        );

      expect(balanceAfter).to.be.gt(balanceBefore);

      const campaign =
        await crowdfunding.getCampaign(0);

      expect(campaign.withdrawn).to.equal(true);
    });

    it("should not allow another user to withdraw", async function () {
      await ethers.provider.send(
        "evm_increaseTime",
        [24 * 60 * 60 + 1]
      );

      await ethers.provider.send("evm_mine");

      await expectRevert(
        crowdfunding
          .connect(contributor)
          .withdraw(0),
        "Only campaign creator can withdraw"
      );
    });

    it("should not allow double withdrawal", async function () {
      await ethers.provider.send(
        "evm_increaseTime",
        [24 * 60 * 60 + 1]
      );

      await ethers.provider.send("evm_mine");

      await crowdfunding
        .connect(creator)
        .withdraw(0);

      await expectRevert(
        crowdfunding
          .connect(creator)
          .withdraw(0),
        "Funds already withdrawn"
      );
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      await crowdfunding
        .connect(creator)
        .createCampaign(
          "Small Campaign",
          "Campaign that may fail",
          ethers.parseEther("10"),
          1
        );

      await crowdfunding
        .connect(contributor)
        .contribute(0, {
          value: ethers.parseEther("2"),
        });
    });

    it("should allow contributors to claim refunds", async function () {
      await ethers.provider.send(
        "evm_increaseTime",
        [24 * 60 * 60 + 1]
      );

      await ethers.provider.send("evm_mine");

      const contributionBefore =
        await crowdfunding.getContribution(
          0,
          contributor.address
        );

      expect(contributionBefore).to.equal(
        ethers.parseEther("2")
      );

      await crowdfunding
        .connect(contributor)
        .claimRefund(0);

      const contributionAfter =
        await crowdfunding.getContribution(
          0,
          contributor.address
        );

      expect(contributionAfter).to.equal(0n);
    });

    it("should not allow refunds when goal was reached", async function () {
      await crowdfunding
        .connect(anotherContributor)
        .contribute(0, {
          value: ethers.parseEther("8"),
        });

      await ethers.provider.send(
        "evm_increaseTime",
        [24 * 60 * 60 + 1]
      );

      await ethers.provider.send("evm_mine");

      await expectRevert(
        crowdfunding
          .connect(contributor)
          .claimRefund(0),
        "Goal was reached; refunds unavailable"
      );
    });
  });
});
