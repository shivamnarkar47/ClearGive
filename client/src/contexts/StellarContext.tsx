import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { StellarService, StellarAccount } from '@/services/stellar';
import { UserService } from '@/services/user';

interface StellarContextType {
  stellarAccount: StellarAccount | null;
  stellarService: StellarService;
  balance: string;
  loading: boolean;
  error: string | null;
  createAccount: () => Promise<void>;
  makeDonation: (toPublicKey: string, amount: string, memo?: string) => Promise<string>;
  getTransactionHistory: () => Promise<any[]>;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function useStellar() {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
}

export function StellarProvider({ children }: { children: ReactNode }) {
  const [stellarAccount, setStellarAccount] = useState<StellarAccount | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const stellarService = StellarService.getInstance();
  const userService = UserService.getInstance();

  useEffect(() => {
    if (currentUser) {
      // Load or create Stellar account when user logs in
      const storedAccount = localStorage.getItem(`stellar_account_${currentUser.uid}`);
      if (storedAccount) {
        const account = JSON.parse(storedAccount);
        setStellarAccount(account);
        loadBalance(account.publicKey);
      } else {
        setLoading(false);
      }
    } else {
      setStellarAccount(null);
      setBalance('0');
    }
  }, [currentUser]);

  const loadBalance = async (publicKey: string) => {
    try {
      const balance = await stellarService.getBalance(publicKey);
      setBalance(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser) {
        throw new Error('User must be logged in to create a Stellar account');
      }

      const account = await stellarService.createAccount();
      setStellarAccount(account);
      localStorage.setItem(`stellar_account_${currentUser.uid}`, JSON.stringify(account));
      
      // Update the user's wallet in the backend
      await userService.updateUserWallet(currentUser.uid, account);
      
      await loadBalance(account.publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const makeDonation = async (toPublicKey: string, amount: string, memo: string = '') => {
    setLoading(true);
    setError(null);
    try {
      if (!stellarAccount) {
        throw new Error('Stellar account not found');
      }

      const result = await stellarService.makeDonation(
        stellarAccount.secretKey,
        toPublicKey,
        amount,
        memo
      );
      await loadBalance(stellarAccount.publicKey);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make donation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = async () => {
    if (!stellarAccount) throw new Error('Stellar account not found');
    
    try {
      return await stellarService.getTransactionHistory(stellarAccount.publicKey);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  };

  const value = {
    stellarAccount,
    stellarService,
    balance,
    loading,
    error,
    createAccount,
    makeDonation,
    getTransactionHistory,
  };

  return (
    <StellarContext.Provider value={value}>
      {children}
    </StellarContext.Provider>
  );
} 