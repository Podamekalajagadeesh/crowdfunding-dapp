// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Crowdfunding {
    struct Campaign {
        uint256 id;
        address payable creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool withdrawn;
    }

    uint256 private nextCampaignId;

    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(address => uint256)) private contributions;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    modifier campaignExists(uint256 campaignId) {
        require(campaignId < nextCampaignId, "Campaign does not exist");
        _;
    }

    modifier beforeDeadline(uint256 campaignId) {
        require(
            block.timestamp < campaigns[campaignId].deadline,
            "Campaign deadline has passed"
        );
        _;
    }

    modifier afterDeadline(uint256 campaignId) {
        require(
            block.timestamp >= campaigns[campaignId].deadline,
            "Campaign is still active"
        );
        _;
    }

    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 goal,
        uint256 durationInDays
    ) external returns (uint256 campaignId) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        require(goal > 0, "Goal must be greater than zero");
        require(durationInDays > 0, "Duration must be greater than zero");

        campaignId = nextCampaignId;

        uint256 deadline = block.timestamp + (durationInDays * 1 days);

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: payable(msg.sender),
            title: title,
            description: description,
            goal: goal,
            deadline: deadline,
            amountRaised: 0,
            withdrawn: false
        });

        nextCampaignId++;

        emit CampaignCreated(
            campaignId,
            msg.sender,
            title,
            goal,
            deadline
        );
    }

    function contribute(
        uint256 campaignId
    )
        external
        payable
        campaignExists(campaignId)
        beforeDeadline(campaignId)
    {
        require(msg.value > 0, "Contribution must be greater than zero");

        Campaign storage campaign = campaigns[campaignId];

        require(
            campaign.amountRaised < campaign.goal,
            "Campaign goal already reached"
        );

        contributions[campaignId][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        emit ContributionMade(
            campaignId,
            msg.sender,
            msg.value
        );
    }

    function withdraw(
        uint256 campaignId
    ) external campaignExists(campaignId) afterDeadline(campaignId) {
        Campaign storage campaign = campaigns[campaignId];

        require(
            msg.sender == campaign.creator,
            "Only campaign creator can withdraw"
        );

        require(
            campaign.amountRaised >= campaign.goal,
            "Funding goal was not reached"
        );

        require(!campaign.withdrawn, "Funds already withdrawn");

        uint256 amount = campaign.amountRaised;

        campaign.withdrawn = true;

        (bool success, ) = campaign.creator.call{value: amount}("");

        require(success, "Withdrawal failed");

        emit FundsWithdrawn(
            campaignId,
            campaign.creator,
            amount
        );
    }

    function claimRefund(
        uint256 campaignId
    ) external campaignExists(campaignId) afterDeadline(campaignId) {
        Campaign storage campaign = campaigns[campaignId];

        require(
            campaign.amountRaised < campaign.goal,
            "Goal was reached; refunds unavailable"
        );

        uint256 contributedAmount = contributions[campaignId][msg.sender];

        require(
            contributedAmount > 0,
            "No contribution to refund"
        );

        contributions[campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{
            value: contributedAmount
        }("");

        require(success, "Refund failed");

        emit RefundClaimed(
            campaignId,
            msg.sender,
            contributedAmount
        );
    }

    function getCampaign(
        uint256 campaignId
    )
        external
        view
        campaignExists(campaignId)
        returns (Campaign memory)
    {
        return campaigns[campaignId];
    }

    function getCampaignCount() external view returns (uint256) {
        return nextCampaignId;
    }

    function getContribution(
        uint256 campaignId,
        address contributor
    )
        external
        view
        campaignExists(campaignId)
        returns (uint256)
    {
        return contributions[campaignId][contributor];
    }
}
