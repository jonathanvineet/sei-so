import { useState } from "react";
import { ethers } from "ethers";
const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"}],"name":"JobCompleted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobFunded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"poster","type":"address"},{"indexed":false,"internalType":"string","name":"details","type":"string"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobPosted","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"}],"name":"confirmDelivery","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"jobCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"jobs","outputs":[{"internalType":"address","name":"poster","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"string","name":"details","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"funded","type":"bool"},{"internalType":"bool","name":"completed","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"details","type":"string"},{"internalType":"address","name":"recipient","type":"address"}],"name":"postJob","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"}
];
const CONTRACT_ADDRESS = "0xA0Ba4B0E06f545F2A446A1978045C7D2a6d9c3c7";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [details, setDetails] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");

  async function connectWallet() {
    if (window.sei) {
      // Sei Global Wallet detected
      setStatus("Sei Global Wallet detected. Connecting...");
      try {
        // Connect to Sei Global Wallet (EVM)
        const accounts = await window.sei.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setStatus("Wallet connected: " + accounts[0]);
      } catch (err) {
        setStatus("Wallet connection failed");
      }
    } else if (window.ethereum) {
      // Fallback to any EVM wallet
      setStatus("EVM wallet detected. Connecting...");
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setStatus("Wallet connected: " + accounts[0]);
      } catch (err) {
        setStatus("Wallet connection failed");
      }
    } else {
      setStatus("No Sei or EVM wallet found. Please install Compass Wallet for Sei.");
    }
  }

  // ...existing code...

  async function postJob() {
    console.log('Post Job clicked');
    try {
      let provider;
      if (window.sei) {
        provider = new ethers.BrowserProvider(window.sei);
        console.log('Using Sei Global Wallet for EVM');
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        console.log('Using EVM wallet');
      } else {
        setStatus("No Sei or EVM wallet found");
        console.error("No Sei or EVM wallet found");
        return;
      }
      // Validate recipient address
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        setStatus("Invalid recipient address");
        console.error("Invalid recipient address");
        return;
      }
      // Validate amount
      let parsedAmount;
      try {
        parsedAmount = ethers.parseEther(amount);
      } catch (err) {
        setStatus("Invalid amount format");
        console.error("Invalid amount format", err);
        return;
      }
      if (parsedAmount <= 0) {
        setStatus("Amount must be greater than 0");
        console.error("Amount must be greater than 0");
        return;
      }
      console.log('Provider:', provider);
      const signer = await provider.getSigner();
      console.log('Signer:', signer);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      console.log('Contract:', contract);
      console.log('Details:', details, 'Recipient:', recipient, 'Amount:', amount);
      const tx = await contract.postJob(details, recipient, {
        value: parsedAmount,
        gasLimit: 150000,
        gasPrice: ethers.parseUnits('1', 'gwei')
      });
      console.log('Transaction sent:', tx);
      await tx.wait();
      setStatus("Job posted!");
      console.log('Job posted!');
    } catch (err) {
      setStatus("Error: " + (err?.message || err));
      console.error('Error posting job:', err);
    }
  }
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sei Delivery Platform</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <div style={{ marginTop: '1rem' }}>
        <div>Status: {status}</div>
        <div>Wallet: {walletAddress}</div>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          postJob();
        }}
        style={{ marginTop: '2rem' }}
      >
        <input
          type="text"
          placeholder="Job Details"
          value={details}
          onChange={e => setDetails(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          placeholder="Amount (SEI)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <button type="submit">Post Job</button>
      </form>
    </div>
  );
}
