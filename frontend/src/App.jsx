import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./contracts/Crowdfunding";

function App() {
  const [account, setAccount] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contributionAmounts, setContributionAmounts] = useState({});
  const [contributingId, setContributingId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");

  async function connectWallet() {
    try {
      setError("");
      setSuccess("");

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask first."
        );
      }

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const expectedChainId =
        "0x" + Number(import.meta.env.VITE_CHAIN_ID).toString(16);

      if (chainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        throw new Error(
          "Wrong network. Please switch MetaMask to Chain ID " +
            import.meta.env.VITE_CHAIN_ID +
            "."
        );
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0] || "");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet.");
    }
  }

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const provider = new ethers.JsonRpcProvider(
        "https" + "://" + "ethereum-sepolia-rpc.publicnode.com"
      );

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const count = await contract.getCampaignCount();

      const loadedCampaigns = [];

      for (let i = 0n; i < count; i++) {
        const campaign = await contract.getCampaign(i);

        loadedCampaigns.push({
          id: campaign.id.toString(),
          creator: campaign.creator,
          title: campaign.title,
          description: campaign.description,
          goal: ethers.formatEther(campaign.goal),
          amountRaised: ethers.formatEther(campaign.amountRaised),
          deadline: new Date(
            Number(campaign.deadline) * 1000
          ).toLocaleString(),
          withdrawn: campaign.withdrawn,
          userContribution: account
            ? ethers.formatEther(
                await contract.getContribution(
                  i,
                  account
                )
              )
            : "0.0",
          isCreator: account
            ? campaign.creator.toLowerCase() ===
              account.toLowerCase()
            : false,
          isExpired:
            Number(campaign.deadline) * 1000 <=
            Date.now(),
          goalReached:
            campaign.amountRaised >= campaign.goal,
          progressPercent:
            campaign.goal > 0n
              ? Math.min(
                  100,
                  Number(
                    (campaign.amountRaised * 100n) /
                      campaign.goal
                  )
                )
              : 0,
          status:
            campaign.withdrawn
              ? "Funds Withdrawn"
              : campaign.amountRaised >= campaign.goal &&
                Number(campaign.deadline) * 1000 <=
                  Date.now()
              ? "Goal Reached"
              : Number(campaign.deadline) * 1000 <=
                  Date.now()
              ? "Funding Failed"
              : "Active",
        });
      }

      setCampaigns(loadedCampaigns);
    } catch (err) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }

  async function claimCampaignRefund(campaignId) {
    try {
      setRefundingId(campaignId);
      setError("");
      setSuccess("");

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const browserProvider = new ethers.BrowserProvider(
        window.ethereum
      );

      const signer = await browserProvider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const transaction = await contract.claimRefund(campaignId);

      setSuccess(
        "Refund submitted. Waiting for blockchain confirmation..."
      );

      await transaction.wait();

      setSuccess("Refund claimed successfully!");

      await loadCampaigns();
    } catch (err) {
      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(
          err?.shortMessage ||
            err?.reason ||
            err?.message ||
            "Failed to claim refund."
        );
      }
    } finally {
      setRefundingId(null);
    }
  }

  async function withdrawFromCampaign(campaignId) {
    try {
      setWithdrawingId(campaignId);
      setError("");
      setSuccess("");

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const browserProvider = new ethers.BrowserProvider(
        window.ethereum
      );

      const signer = await browserProvider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const transaction = await contract.withdraw(campaignId);

      setSuccess(
        "Withdrawal submitted. Waiting for blockchain confirmation..."
      );

      await transaction.wait();

      setSuccess("Funds withdrawn successfully!");

      await loadCampaigns();
    } catch (err) {
      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(
          err?.shortMessage ||
            err?.reason ||
            err?.message ||
            "Failed to withdraw campaign funds."
        );
      }
    } finally {
      setWithdrawingId(null);
    }
  }

  async function contributeToCampaign(campaignId) {
    try {
      setContributingId(campaignId);
      setError("");
      setSuccess("");

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const amount = contributionAmounts[campaignId];

      if (!amount || Number(amount) <= 0) {
        throw new Error("Contribution amount must be greater than zero.");
      }

      const browserProvider = new ethers.BrowserProvider(
        window.ethereum
      );

      const signer = await browserProvider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const transaction = await contract.contribute(
        campaignId,
        {
          value: ethers.parseEther(amount),
        }
      );

      setSuccess(
        "Contribution submitted. Waiting for blockchain confirmation..."
      );

      await transaction.wait();

      setContributionAmounts((previous) => ({
        ...previous,
        [campaignId]: "",
      }));

      setSuccess("Contribution successful!");

      await loadCampaigns();
    } catch (err) {
      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(
          err?.shortMessage ||
            err?.reason ||
            err?.message ||
            "Failed to contribute to campaign."
        );
      }
    } finally {
      setContributingId(null);
    }
  }

  async function createCampaign(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      if (!title.trim()) {
        throw new Error("Campaign title is required.");
      }

      if (!description.trim()) {
        throw new Error("Campaign description is required.");
      }

      if (!goal || Number(goal) <= 0) {
        throw new Error("Goal must be greater than zero.");
      }

      if (!duration || Number(duration) <= 0) {
        throw new Error("Duration must be greater than zero.");
      }

      const browserProvider = new ethers.BrowserProvider(
        window.ethereum
      );

      const signer = await browserProvider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const transaction = await contract.createCampaign(
        title.trim(),
        description.trim(),
        ethers.parseEther(goal),
        duration
      );

      setSuccess(
        "Transaction submitted. Waiting for blockchain confirmation..."
      );

      await transaction.wait();

      setTitle("");
      setDescription("");
      setGoal("");
      setDuration("");

      setSuccess("Campaign created successfully!");

      await loadCampaigns();
    } catch (err) {
      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(
          err?.shortMessage ||
            err?.reason ||
            err?.message ||
            "Failed to create campaign."
        );
      }
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadCampaigns();

    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || "");
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        color: "#ffffff",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            gap: "20px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "36px",
              }}
            >
              Web3 Crowdfunding
            </h1>

            <p
              style={{
                color: "#9ca3af",
                marginTop: "10px",
              }}
            >
              Decentralized crowdfunding powered by Ethereum
            </p>
          </div>

          <button
            onClick={connectWallet}
            style={{
              background: "#6366f1",
              color: "#ffffff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </header>

        {error && (
          <div
            style={{
              background: "#3f1d1d",
              border: "1px solid #ef4444",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              color: "#fca5a5",
              wordBreak: "break-word",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#12351f",
              border: "1px solid #22c55e",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              color: "#86efac",
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "14px",
            padding: "25px",
            marginBottom: "35px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Create Campaign
          </h2>

          <form onSubmit={createCampaign}>
            <input
              type="text"
              placeholder="Campaign title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Campaign description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows="4"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
              }}
            >
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Funding goal (ETH)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                style={inputStyle}
              />

              <input
                type="number"
                min="1"
                placeholder="Duration (days)"
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                marginTop: "15px",
                background: creating
                  ? "#4b5563"
                  : "#6366f1",
                color: "#ffffff",
                border: "none",
                padding: "13px 22px",
                borderRadius: "10px",
                cursor: creating
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "bold",
              }}
            >
              {creating
                ? "Creating..."
                : "Create Campaign"}
            </button>
          </form>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2>Campaigns</h2>

            <button
              onClick={loadCampaigns}
              style={{
                background: "#1f2937",
                color: "#ffffff",
                border: "1px solid #374151",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <div
              style={{
                background: "#111827",
                padding: "40px",
                borderRadius: "14px",
                textAlign: "center",
              }}
            >
              <h3>No campaigns yet</h3>

              <p style={{ color: "#9ca3af" }}>
                Create the first campaign on the blockchain.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  style={{
                    background: "#111827",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {campaign.title}
                    </h3>

                    <span
                      style={{
                        background:
                          campaign.status === "Active"
                            ? "#12351f"
                            : campaign.status === "Goal Reached"
                            ? "#332b12"
                            : campaign.status ===
                              "Funds Withdrawn"
                            ? "#172554"
                            : "#3f1d1d",
                        color:
                          campaign.status === "Active"
                            ? "#86efac"
                            : campaign.status ===
                              "Goal Reached"
                            ? "#fcd34d"
                            : campaign.status ===
                              "Funds Withdrawn"
                            ? "#93c5fd"
                            : "#fca5a5",
                        padding: "5px 9px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#9ca3af",
                      minHeight: "48px",
                    }}
                  >
                    {campaign.description}
                  </p>

                  <div
                    style={{
                      marginTop: "20px",
                      lineHeight: "1.8",
                    }}
                  >
                    <div>
                      <strong>Raised:</strong>{" "}
                      {campaign.amountRaised} ETH
                    </div>

                    <div>
                      <strong>Goal:</strong>{" "}
                      {campaign.goal} ETH

                      <div>
                        <strong>Your Contribution:</strong>{" "}
                        {campaign.userContribution} ETH
                      </div>

                      <div
                        style={{
                          marginTop: "18px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "7px",
                            fontSize: "13px",
                            color: "#9ca3af",
                          }}
                        >
                          <span>Funding Progress</span>
                          <strong style={{ color: "#ffffff" }}>
                            {campaign.progressPercent}%
                          </strong>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            height: "10px",
                            background: "#1f2937",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${campaign.progressPercent}%`,
                              height: "100%",
                              background: "#6366f1",
                              borderRadius: "999px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <strong>Deadline:</strong>{" "}
                      {campaign.deadline}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "#6b7280",
                        wordBreak: "break-all",
                      }}
                    >
                      Creator: {campaign.creator}
                    </div>

                    {campaign.isExpired &&
                      campaign.isCreator &&
                      campaign.goalReached &&
                      !campaign.withdrawn && (
                        <button
                          onClick={() =>
                            withdrawFromCampaign(campaign.id)
                          }
                          disabled={
                            withdrawingId === campaign.id
                          }
                          style={{
                            width: "100%",
                            marginTop: "15px",
                            background:
                              withdrawingId === campaign.id
                                ? "#4b5563"
                                : "#f59e0b",
                            color: "#111827",
                            border: "none",
                            padding: "12px",
                            borderRadius: "8px",
                            cursor:
                              withdrawingId === campaign.id
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          {withdrawingId === campaign.id
                            ? "Withdrawing..."
                            : "Withdraw Funds"}
                        </button>
                      )}

                    {campaign.isExpired &&
                      !campaign.goalReached &&
                      Number(campaign.userContribution) > 0 && (
                        <button
                          onClick={() =>
                            claimCampaignRefund(campaign.id)
                          }
                          disabled={
                            refundingId === campaign.id
                          }
                          style={{
                            width: "100%",
                            marginTop: "15px",
                            background:
                              refundingId === campaign.id
                                ? "#4b5563"
                                : "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            padding: "12px",
                            borderRadius: "8px",
                            cursor:
                              refundingId === campaign.id
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          {refundingId === campaign.id
                            ? "Claiming Refund..."
                            : "Claim Refund"}
                        </button>
                      )}

                    {campaign.withdrawn && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "10px",
                          background: "#12351f",
                          color: "#86efac",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        Funds withdrawn
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "20px",
                        borderTop: "1px solid #1f2937",
                      }}
                    >
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="ETH amount"
                        value={contributionAmounts[campaign.id] || ""}
                        onChange={(e) =>
                          setContributionAmounts((previous) => ({
                            ...previous,
                            [campaign.id]: e.target.value,
                          }))
                        }
                        style={{
                          ...inputStyle,
                          marginBottom: "10px",
                        }}
                      />

                      <button
                        onClick={() =>
                          contributeToCampaign(campaign.id)
                        }
                        disabled={contributingId === campaign.id}
                        style={{
                          width: "100%",
                          background:
                            contributingId === campaign.id
                              ? "#4b5563"
                              : "#22c55e",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          borderRadius: "8px",
                          cursor:
                            contributingId === campaign.id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {contributingId === campaign.id
                          ? "Contributing..."
                          : "Contribute ETH"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#0b1020",
  color: "#ffffff",
  border: "1px solid #374151",
  padding: "13px",
  borderRadius: "8px",
  marginBottom: "15px",
  outline: "none",
};

export default App;
