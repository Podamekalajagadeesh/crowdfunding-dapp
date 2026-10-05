# Web3 Crowdfunding dApp

A decentralized crowdfunding platform built with Solidity, Ethereum, React, Ethers.js, Hardhat, and MetaMask.

## Features

- Create crowdfunding campaigns
- Set funding goals and deadlines
- Contribute ETH through MetaMask
- Track contributor balances
- Real-time funding progress
- Creator-only withdrawals
- Refunds for unsuccessful campaigns
- Ethereum network validation
- Ethereum Sepolia deployment
- Sourcify-verified smart contract
- 12 passing smart-contract tests

## Tech Stack

### Blockchain
- Solidity 0.8.28
- Ethereum Sepolia
- Hardhat 3
- OpenZeppelin

### Frontend
- React
- Vite
- Ethers.js
- MetaMask

### Testing
- Hardhat
- Mocha
- Chai

## Project Structure

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

## Smart Contract

The Crowdfunding contract manages campaign creation, ETH contributions, funding goals, deadlines, withdrawals, and refunds.

Main functions:

- createCampaign()
- contribute()
- withdraw()
- claimRefund()
- getCampaign()
- getCampaignCount()
- getContribution()

## Testing

The project has 12 passing smart-contract tests covering campaign creation, validation, contributions, deadlines, withdrawals, and refunds.

Run:

    cd blockchain
    npm test

## Sepolia Deployment

Network: Ethereum Sepolia

Chain ID: 11155111

Contract:

    0xe39b32a4998B929E3874A4460cA628e14BE62041

The contract source code has been successfully verified on Sourcify.

## Example Test

A live Sepolia campaign was successfully tested:

- Campaign: Sepolia Web3 Campaign
- Goal: 0.01 ETH
- Contribution: 0.001 ETH
- Funding progress: 10%
- Network: Ethereum Sepolia

## Local Development

Install blockchain dependencies:

    cd blockchain
    npm install

Start Hardhat:

    npx hardhat node

Deploy locally:

    npx hardhat run scripts/deploy.js --network localhost

Install frontend dependencies:

    cd ../frontend
    npm install

Start frontend:

    npm run dev

## Security

- Private keys are kept outside source code.
- Environment files are excluded from Git.
- Network validation prevents accidental wrong-network usage.
- Creator authorization protects withdrawals.
- Refunds are available only for failed campaigns.
- Withdrawals are available only after deadlines.
- Contract source code is verified.

Never commit private keys, seed phrases, or API secrets.

## Future Improvements

- Campaign images
- Categories and search
- User dashboard
- Transaction history
- IPFS metadata
- Event indexing
- Multi-chain support
- Production frontend hosting
- DAO-based governance

## License

MIT
