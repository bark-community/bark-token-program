import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";

import {
  ExtensionType,
  createAccount,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  getTransferFeeAmount,
  mintTo,
  transferCheckedWithFee,
  unpackAccount,
  withdrawWithheldTokensFromAccounts,
  withdrawWithheldTokensFromMint,
} from "@solana/spl-token";

import { 
  TokenMetadata,
} from "@solana/spl-token-metadata";

// Constants
const FEE_BASIS_POINTS = 300;
const MAX_FEE = BigInt(800);
const MINT_AMOUNT = 20_000_000_000_000n;
const TRANSFER_AMOUNT = BigInt(100000);
const COMMITMENT_LEVEL = "confirmed";
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const DECIMALS = 3;

// Configuration
const clusterUrl = clusterApiUrl("devnet");

// Connection to devnet cluster
const connection = new Connection(clusterUrl, COMMITMENT_LEVEL);

// BARK wallet
const payerWallet = pg.wallet.keypair;

// Generate a new keypair for the Mint Bark Account
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

// Mint Authority and Transfer Fee Config Authority
const mintAuthority = pg.wallet.publicKey;
const transferFeeConfigAuthority = pg.wallet.keypair;
const withdrawWithheldAuthority = pg.wallet.keypair;

// Calculate minimum balance for rent exemption
const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// BARK details
const tokenMetadata = {
  name: "Bark",
  symbol: "BARK",
  website: "https://barkprotocol.net",
  logoUrl: "https://raw.githubusercontent.com/bark-community/bark-token/bob/main/bark/assets/bark.png",
  socialMedia: {
    twitter: "https://x.com/bark_protocol",
    discord: "https://discord.gg/bark-protocol-en",
    telegram: "https://telegram.com/t.me/bark",
  },
  metadata: {
    description: "BARK, a digital asset on the Solana blockchain, token extension, and is driven by community contributions.",
  },
};

// Function to create a Solana account with signature
async function createSolanaAccountWithSignature(instruction, signers = []) {
  try {
    const signature = await sendAndConfirmTransaction(connection, instruction, signers);
    console.log(`\nTransaction Signature: https://solana.fm/tx/${signature}?cluster=devnet`);
    return signature;
  } catch (error) {
    console.error("Error creating Solana account:", error.message);
    throw error;
  }
}

// Helper function to log transaction details
function logTransactionDetails(message, signature) {
  console.log(`\n${message}: https://solana.fm/tx/${signature}?cluster=devnet`);
}

/// Function to initialize the Mint Bark Account
async function initializeMintAccount() {
  const transaction = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: payerWallet.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferFeeConfigInstruction(
        mint,
        transferFeeConfigAuthority.publicKey,
        withdrawWithheldAuthority.publicKey,
        FEE_BASIS_POINTS,
        MAX_FEE,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(
        mint,
        DECIMALS,
        mintAuthority,
        null,
        TOKEN_2022_PROGRAM_ID,
      ),
    );

  const transactionSignature = await createSolanaAccountWithSignature(transaction, [payerWallet, mintKeypair]);
  logTransactionDetails("Create Solana Account", transactionSignature);
}

// Function to initialize the BARK token accounts
async function initializeBarkTokenAccounts() {
  const sourceTokenAccount = await createAccount(
    connection,
    payerWallet,
    mint,
    payerWallet.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  const destinationOwnerKeypair = Keypair.generate();
  const destinationTokenAccount = await createAccount(
    connection,
    payerWallet,
    mint,
    destinationOwnerKeypair.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  return { sourceTokenAccount, destinationTokenAccount };
}

// Function to perform a token transfer with fee
async function transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, mintAmount) {
  const mintToSignature = await mintTo(
    connection,
    payerWallet,
    mint,
    sourceTokenAccount,
    mintAuthority,
    mintAmount,  // Pass mintAmount as an argument
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  logTransactionDetails("Mint BARK", mintToSignature);

  const fee = (TRANSFER_AMOUNT * BigInt(FEE_BASIS_POINTS)) / BigInt(10_000);
  const feeCharged = fee > MAX_FEE ? MAX_FEE : fee;

  const transferSignature = await transferCheckedWithFee(
    connection,
    payerWallet,
    sourceTokenAccount,
    mint,
    destinationTokenAccount,
    payerWallet.publicKey,
    TRANSFER_AMOUNT,
    3,
    feeCharged,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  logTransactionDetails("Transfer BARK", transferSignature);
}

// Function to handle fee withdrawal from BARK accounts
async function withdrawFeesFromAccounts(destinationTokenAccount) {
  const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
    commitment: COMMITMENT_LEVEL,
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: mint.toString(),
        },
      },
    ],
  });

  const accountsToWithdrawFrom = allAccounts
    .map(accountInfo => {
      const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
      const transferFeeAmount = getTransferFeeAmount(account);
      return transferFeeAmount !== null && transferFeeAmount.withheldAmount > 0 ? accountInfo.pubkey : null;
    })
    .filter(Boolean);

  const withdrawSignature = await withdrawWithheldTokensFromAccounts(
    connection,
    payerWallet,
    mint,
    destinationTokenAccount,
    withdrawWithheldAuthority,
    undefined,
    accountsToWithdrawFrom,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  logTransactionDetails("Withdraw Fee From BARK Accounts", withdrawSignature);
}

// Function to handle fee withdrawal from Mint BARK Account
async function withdrawFeesFromMint(destinationTokenAccount) {
  const withdrawMintSignature = await withdrawWithheldTokensFromMint(
    connection,
    payerWallet,
    mint,
    destinationTokenAccount,
    withdrawWithheldAuthority,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  logTransactionDetails("Withdraw Fee from Mint Bark Account", withdrawMintSignature);
}

// Function to harvest withheld fees from a specific fee account
async function harvestWithheldFees(destinationTokenAccount, feeAccount) {
  try {
    const feeAccountInfo = await connection.getAccountInfo(new PublicKey(feeAccount), COMMITMENT_LEVEL);
    if (!feeAccountInfo) {
      console.log(`Fee account ${feeAccount} not found.`);
      return;
    }

    const feeAccountData = unpackAccount(new PublicKey(feeAccount), feeAccountInfo.data, TOKEN_2022_PROGRAM_ID);
    const withheldAmount = getTransferFeeAmount(feeAccountData)?.withheldAmount || 0;

    if (withheldAmount > 0) {
      const transferSignature = await transferCheckedWithFee(
        connection,
        payerWallet,
        new PublicKey(feeAccount),
        mint,
        destinationTokenAccount,
        payerWallet.publicKey,
        withheldAmount,
        3,
        0, // No additional fee charged for harvesting
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      logTransactionDetails(`Harvested ${withheldAmount} fees`, transferSignature);
    } else {
      console.log("No withheld fees to harvest.");
    }
  } catch (error) {
    console.error("Error harvesting withheld fees:", error.message);
    throw error;
  }
}

// Function to check the BARK account balance of the wallet
async function checkBarkBalance() {
  try {
    const ownerPublicKey = payerWallet.publicKey;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
      commitment: COMMITMENT_LEVEL,
    });

    const barkAccounts = tokenAccounts.value.filter(account => account.account.data.parsed.info.mint.equals(mint));

    if (barkAccounts.length > 0) {
      barkAccounts.forEach(account => {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmountString;
        console.log(`BARK account balance: ${balance} BARK`);
      });
    } else {
      console.log("No BARK accounts found for the wallet.");
    }
  } catch (error) {
    console.error("Error checking BARK token balance:", error.message);
  }
}

// Function to check the balance of the wallet
async function checkBalance() {
  const balance = await connection.getBalance(payerWallet.publicKey);
  console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
}

// Main function to orchestrate the entire process.
async function main() {
  try {
    // Check wallet balance
    await checkBalance();

    // Initialize Mint and Token Accounts
    await initializeMintAccount();
    const { sourceTokenAccount, destinationTokenAccount } = await initializeBarkTokenAccounts();

    // Transfer BARK with Fee
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);

    // Withdraw Fees from BARK accounts
    await withdrawFeesFromAccounts(destinationTokenAccount);

    // Transfer BARK with Fee again (for testing)
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);

    // Try to find the existing fee account
    const existingFeeAccount = "feehVvkc5QiSu269NzHvf2TgyvhEwC5t4UxNZeMfzFS";
    const existingFeeAccountInfo = await connection.getAccountInfo(new PublicKey(existingFeeAccount), COMMITMENT_LEVEL);

    if (!existingFeeAccountInfo) {
      console.log(`Fee account ${existingFeeAccount} not found. Creating a new fee account...`);

      // Generate a new keypair for the fee account
      const newFeeAccountKeypair = Keypair.generate();
      const newFeeAccount = newFeeAccountKeypair.publicKey;

      // Create the new fee account
      const createFeeAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payerWallet.publicKey,
        newAccountPubkey: newFeeAccount,
        space: 165, // Adjust the space based on your requirements
        lamports: await connection.getMinimumBalanceForRentExemption(165),
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Add the create fee account instruction to a transaction
      const createFeeAccountTransaction = new Transaction().add(createFeeAccountInstruction);

      // Send and confirm the transaction
      await sendAndConfirmTransaction(connection, createFeeAccountTransaction, [payerWallet, newFeeAccountKeypair]);

      console.log(`New fee account created: ${newFeeAccount.toBase58()}`);
    } else {
      console.log(`Using existing fee account: ${existingFeeAccount}`);
    }

    // Now you can use either the existing fee account or the newly created one in the subsequent transactions.

    // Harvest withheld fees from the existing fee account
    await harvestWithheldFees(destinationTokenAccount, existingFeeAccount);

    // Withdraw Fees from Mint BARK Account
    await withdrawFeesFromMint(destinationTokenAccount);
  } catch (error) {
    console.error("Main process error:", error.message);
  }
}

// Execute the main function
main();
