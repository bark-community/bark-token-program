# BARK Token Program

## Overview

The BARK Token Program is a Solana-based token system designed to facilitate the creation, transfer, and management of a digital asset named "BARK" on the Solana blockchain. Leveraging the Solana web3.js library, the program enables seamless interactions with the Solana blockchain.

# Solana BARK Token Interaction

This repository contains a TypeScript script for interacting with the BARK token on the Solana blockchain using the Solana Web3.js library and the SPL Token program.

```markdown
## Table of Contents

- [BARK Token Program](#bark-token-program)
  - [Overview](#overview)
- [Solana BARK Token Interaction](#solana-bark-token-interaction)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [Functions:](#functions)
  - [Contributing](#contributing)
  - [License](#license)

## Introduction

This TypeScript script demonstrates the creation, initialization, and interaction with a custom token (BARK) on the Solana blockchain. It covers various functions, including minting, transferring tokens with fees, fee withdrawal, and more.

## Features

- Minting BARK tokens on the Solana blockchain.
- Transferring BARK tokens with fees.
- Withdrawing fees from BARK accounts.
- Creating a new fee account.
- Harvesting and transferring withheld fees.
- Checking BARK token and Solana account balances.

## Requirements

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Solana devnet cluster access
- Solana wallet with sufficient funds for transaction fees

## Testing

This Program is tested on Solana Playground https://beta.solpg.io/

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/bark-community/bark-token-program.git
   cd bark
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your Solana wallet details in the script.

4. Execute the script:

   ```bash
   npm start
   ```

## Usage

Ensure that you have met the [requirements](#requirements) and have configured the script with your Solana wallet details. Run the script to perform various BARK token interactions on the Solana blockchain.

## Functions:

- **initializeMintAccount():** Initializes the Mint BARK account.
- **initializeSolanaAccounts():** Initializes source and destination Solana token accounts.
- **transferBarkWithFee():** Transfers BARK tokens with fees.
- **withdrawFees():** Withdraws fees from BARK accounts.
- **createFeeAccount():** Creates a new fee account.
- **harvestWithheldTokensToMint():** Harvests withheld fees and transfers to the Mint BARK account.
- **checkBarkBalance():** Checks the BARK token balance of the wallet.
- **checkBalance():** Checks the Solana account balance of the wallet.

## Contributing

Contributions are welcome! If you find a bug or have an enhancement in mind, please open an issue or submit a pull request following the [contribution guidelines](CONTRIBUTING.md).

## License

[MIT License](LICENSE).
