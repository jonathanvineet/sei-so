"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Sei network configuration
  const SEI_CONFIG = {
    chainId: "sei-devnet-3", // Use "sei-devnet-3" for testnet or "sei-mainnet-1" for mainnet
    chainName: "Sei Devnet",
    rpc: "https://rpc.sei-devnet-3.seinet.io",
    rest: "https://rest.sei-devnet-3.seinet.io",
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: "sei",
      bech32PrefixAccPub: "seipub",
      bech32PrefixValAddr: "seivaloper",
      bech32PrefixValPub: "seivaloperpub",
      bech32PrefixConsAddr: "seivalcons",
      bech32PrefixConsPub: "seivalconspub",
    },
    currencies: [
      {
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6,
      },
    ],
    stakeCurrency: {
      coinDenom: "SEI",
      coinMinimalDenom: "usei",
      coinDecimals: 6,
    },
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.04,
    },
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Check if Keplr is installed
      if (!window.keplr) {
        throw new Error("Keplr wallet is not installed. Please install it from https://keplr.app/");
      }

      // Request connection to Sei network
      await window.keplr.enable(SEI_CONFIG.chainId);
      
      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner(SEI_CONFIG.chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error("No accounts found in Keplr wallet");
      }

      const account = accounts[0];
      setWalletAddress(account.address);
      setWalletConnected(true);

      // Fetch balance
      await fetchBalance(account.address);

    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message);
      setWalletConnected(false);
      setWalletAddress("");
      setWalletBalance("0.00");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async (address) => {
    try {
      // Fetch balance from Sei RPC
      const response = await fetch(`${SEI_CONFIG.rest}/cosmos/bank/v1beta1/balances/${address}`);
      const data = await response.json();
      
      if (data.balances && data.balances.length > 0) {
        const seiBalance = data.balances.find(balance => balance.denom === "usei");
        if (seiBalance) {
          // Convert from usei (micro SEI) to SEI
          const balanceInSei = (parseInt(seiBalance.amount) / 1000000).toFixed(6);
          setWalletBalance(balanceInSei);
        } else {
          setWalletBalance("0.000000");
        }
      } else {
        setWalletBalance("0.000000");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setWalletBalance("0.000000");
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setWalletBalance("0.00");
    setError("");
  };

  const refreshBalance = async () => {
    if (walletConnected && walletAddress) {
      await fetchBalance(walletAddress);
    }
  };

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (walletConnected) {
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [walletConnected]);

  const value = {
    walletConnected,
    walletAddress,
    walletBalance,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    SEI_CONFIG,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
