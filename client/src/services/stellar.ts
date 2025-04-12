import { Keypair, Networks, TransactionBuilder, Operation, Asset, Memo, StrKey } from '@stellar/stellar-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

// Initialize the Stellar server (using testnet for development)
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export interface StellarAccount {
  publicKey: string;
  secretKey: string;
}

export class StellarService {
  private static instance: StellarService;
  
  private constructor() {}

  static getInstance(): StellarService {
    if (!StellarService.instance) {
      StellarService.instance = new StellarService();
    }
    return StellarService.instance;
  }

  // Get explorer URL for an account
  getAccountExplorerUrl(publicKey: string): string {
    return `https://stellar.expert/explorer/testnet/account/${publicKey}`;
  }

  // Get explorer URL for a transaction
  getTransactionExplorerUrl(transactionHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${transactionHash}`;
  }

  // Open account in explorer
  openAccountInExplorer(publicKey: string): void {
    window.open(this.getAccountExplorerUrl(publicKey), '_blank');
  }

  // Open transaction in explorer
  openTransactionInExplorer(transactionHash: string): void {
    window.open(this.getTransactionExplorerUrl(transactionHash), '_blank');
  }

  // Validate Stellar public key
  private isValidPublicKey(publicKey: string): boolean {
    if (!publicKey) return false;
    try {
      return StrKey.isValidEd25519PublicKey(publicKey);
    } catch {
      return false;
    }
  }

  // Check if account exists on the network
  private async accountExists(publicKey: string): Promise<boolean> {
    if (!this.isValidPublicKey(publicKey)) {
      throw new Error(`Invalid public key format: ${publicKey}`);
    }
    try {
      await server.loadAccount(publicKey);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Make a donation transaction
  async makeDonation(
    fromSecretKey: string,
    toPublicKey: string,
    amount: string,
    memo: string
  ): Promise<string> {
    try {
      // Validate inputs
      if (!fromSecretKey) {
        throw new Error('Source secret key is required');
      }
      if (!toPublicKey) {
        throw new Error('Destination public key is required');
      }
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }

      // Validate destination address
      if (!this.isValidPublicKey(toPublicKey)) {
        throw new Error(`Invalid destination address format: ${toPublicKey}`);
      }

      // Check if destination account exists
      const destinationExists = await this.accountExists(toPublicKey);
      if (!destinationExists) {
        throw new Error(`Destination account does not exist: ${toPublicKey}`);
      }

      // Validate source account
      let sourceKeypair: Keypair;
      try {
        sourceKeypair = Keypair.fromSecret(fromSecretKey);
      } catch {
        throw new Error('Invalid source account secret key');
      }

      const sourcePublicKey = sourceKeypair.publicKey();

      // Load the source account
      const sourceAccount = await server.loadAccount(sourcePublicKey);

      // Check source account balance
      const currentBalance = await this.getBalance(sourcePublicKey);
      if (parseFloat(currentBalance) < parseFloat(amount)) {
        throw new Error(`Insufficient funds: ${currentBalance} XLM available`);
      }

      // Build the transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (await server.fetchBaseFee()).toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: toPublicKey,
            asset: Asset.native(), // Using XLM
            amount: amount.toString(),
          })
        )
        .addMemo(Memo.text(memo || 'Donation'))
        .setTimeout(30)
        .build();

      // Sign the transaction
      transaction.sign(sourceKeypair);

      // Submit the transaction
      const result = await server.submitTransaction(transaction);
      return result.hash;
    } catch (error: any) {
      console.error('Error making donation:', error);
      if (error.response?.data?.extras?.result_codes?.operations) {
        throw new Error(`Transaction failed: ${error.response.data.extras.result_codes.operations.join(', ')}`);
      }
      throw new Error(error.message || 'Failed to process donation');
    }
  }

  // Create a new Stellar account
  async createAccount(): Promise<StellarAccount> {
    const keypair = Keypair.random();
    
    try {
      // Fund the account using Friendbot (testnet only)
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fund new account');
      }

      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
    } catch (error) {
      console.error('Error creating Stellar account:', error);
      throw new Error('Failed to create Stellar account');
    }
  }

  // Get account balance
  async getBalance(publicKey: string): Promise<string> {
    try {
      if (!this.isValidPublicKey(publicKey)) {
        throw new Error('Invalid public key format');
      }

      const account = await server.loadAccount(publicKey);
      const balance = account.balances.find(
        (b: any) => b.asset_type === 'native'
      );
      return balance ? balance.balance : '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get account balance');
    }
  }

  // Get transaction history
  async getTransactionHistory(publicKey: string): Promise<any[]> {
    try {
      if (!this.isValidPublicKey(publicKey)) {
        throw new Error('Invalid public key format');
      }

      const transactions = await server
        .transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(10)
        .call();

      return transactions.records;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }
}