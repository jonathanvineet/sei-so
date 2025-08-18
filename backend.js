require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ABI = require('./artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x4476C2B38bc7B953FaF99Cacf9466c5E91F2Db7a";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

const app = express();
app.use(express.json());

app.post('/job', async (req, res) => {
  const { jobId } = req.body;
  console.log(`[LOCAL] Job posted: jobId=${jobId}`);
  setTimeout(async () => {
    try {
      console.log(`[ACTION] Confirming delivery for job ${jobId} after 10 seconds...`);
      const tx = await contract.confirmDelivery(jobId);
      await tx.wait();
      console.log(`[SUCCESS] Delivery confirmed for job ${jobId}`);
    } catch (err) {
      console.error(`[ERROR] Confirming delivery for job ${jobId}:`, err);
    }
  }, 10000);
  res.json({ status: 'Job received', jobId });
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
