require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ABI = require('./artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);


const jobStatus = {}; // jobId: 'pending' | 'confirmed'

const app = express();
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post('/job', async (req, res) => {
  const { jobId } = req.body;
  console.log(`[LOCAL] Job posted: jobId=${jobId}`);
  jobStatus[jobId] = 'pending';
  setTimeout(async () => {
    try {
      console.log(`[ACTION] Confirming delivery for job ${jobId} after 10 seconds...`);
      const tx = await contract.confirmDelivery(jobId);
      await tx.wait();
      jobStatus[jobId] = 'confirmed';
      console.log(`[SUCCESS] Delivery confirmed for job ${jobId}`);
    } catch (err) {
      console.error(`[ERROR] Confirming delivery for job ${jobId}:`, err);
    }
  }, 10000);
  res.json({ status: 'Job received', jobId });
});

app.get('/job/:jobId/status', (req, res) => {
  const jobId = req.params.jobId;
  const status = jobStatus[jobId] || 'pending';
  res.json({ status });
});

app.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});

// Post a new job
async function postJob(details, recipient, amountEth) {
  const tx = await contract.postJob(details, recipient, { value: ethers.parseEther(amountEth) });
  await tx.wait();
  console.log("Job posted!");
}

// Confirm completion
async function confirmDelivery(jobId) {
  const tx = await contract.confirmDelivery(jobId);
  await tx.wait();
  console.log("Delivery confirmed!");
}

// Example usage
// postJob("Deliver package to Alice", "0xRecipientAddress", "0.1");
// confirmDelivery(1);
