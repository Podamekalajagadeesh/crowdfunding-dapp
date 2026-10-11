# Web3 Crowdfunding dApp

A decentralized crowdfunding platform built with **Solidity, Ethereum, React, Ethers.js, Hardhat, and MetaMask**. Users can create campaigns, contribute ETH, track funding progress, and withdraw funds or claim refunds according to campaign outcomes.

## 🔗 Links

- **Live Demo:** https://crowdfunding-dapp-lilac.vercel.app/
- **GitHub Repository:** https://github.com/Podamekalajagadeesh/crowdfunding-dapp
- **Verified Smart Contract:** https://sourcify.dev/server/repo-ui/11155111/0xe39b32a4998B929E3874A4460cA628e14BE62041

**Network:** Ethereum Sepolia  
**Chain ID:** `11155111`

## ✨ Features

- Create crowdfunding campaigns with funding goals and deadlines
- Contribute ETH using MetaMask
- Track contributor balances and funding progress
- Allow campaign creators to withdraw funds when eligible
- Support refunds for unsuccessful campaigns
- Validate the connected Ethereum network
- Deploy smart contracts to Ethereum Sepolia
- Verify smart-contract source code on Sourcify
- Include 12 passing smart-contract tests

## 🛠️ Tech Stack

**Blockchain**
- Solidity 0.8.28
- Ethereum Sepolia
- Hardhat 3
- OpenZeppelin

**Frontend**
- React
- Vite
- Ethers.js
- MetaMask

**Testing**
- Hardhat
- Mocha
- Chai

## 📁 Project Structure

```text
crowdfunding-dapp/
├── blockchain/
│   ├── contracts/Crowdfunding.sol
│   ├── scripts/deploy.js
│   ├── test/Crowdfunding.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.local
└── README.md
```

## 📜 Smart Contract

The `Crowdfunding` contract handles campaign creation, contributions, funding goals, deadlines, withdrawals, and refunds.

Main functions:

- `createCampaign()`
- `contribute()`
- `withdraw()`
- `claimRefund()`
- `getCampaign()`
- `getCampaignCount()`
- `getContribution()`

## 🧪 Testing

The project includes **12 passing smart-contract tests** covering campaign creation, validation, contributions, deadlines, withdrawals, and refunds.

Run the tests:

```bash
cd blockchain
npm install
npm test
```

## 🚀 Local Development

### 1. Install blockchain dependencies

```bash
cd blockchain
npm install
```

### 2. Start a local Hardhat node

In one terminal:

```bash
npx hardhat node
```

### 3. Deploy the contract locally

In another terminal, from the `blockchain` directory:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Install frontend dependencies

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 5. Configure environment variables

Create the required local environment file using the variable names expected by the frontend code. Do not commit private keys, seed phrases, or API secrets.

### 6. Start the frontend

```bash
npm run dev
```

## 🌐 Sepolia Deployment

- **Network:** Ethereum Sepolia
- **Chain ID:** `11155111`
- **Contract Address:** `0xe39b32a4998B929E3874A4460cA628e14BE62041`
- **Source Verification:** Sourcify

The contract source code is verified on Sourcify. Source verification does not replace an independent security audit.

## ✅ Example Sepolia Test

A live Sepolia campaign was tested with the following values:

- **Campaign:** Sepolia Web3 Campaign
- **Goal:** 0.01 ETH
- **Contribution:** 0.001 ETH
- **Funding Progress:** 10%
- **Network:** Ethereum Sepolia

## 🔐 Security Considerations

- Keep private keys and secrets outside source control.
- Exclude environment files containing secrets from Git.
- Validate the connected network.
- Restrict withdrawals to authorized campaign creators.
- Enforce campaign eligibility rules for refunds and withdrawals.
- Never commit private keys, seed phrases, or API secrets.

## 🔮 Future Improvements

- Campaign images
- Categories and search
- User dashboard
- Transaction history
- IPFS metadata
- Event indexing
- Multi-chain support
- DAO-based governance

## 📄 License

MIT
