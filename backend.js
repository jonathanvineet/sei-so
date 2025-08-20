require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const DroneManagementSystem = require('./elizaos/DroneManagementSystem');

const CONTRACT_ABI = require('./artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");

// The wallet used for general operations
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// The wallet that is used as the job poster - must be the same account that posts jobs
const posterWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// Connect contract with poster wallet
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, posterWallet);

// Initialize ElizaOS Drone Management System
const droneSystem = new DroneManagementSystem();


const jobStatus = {}; // jobId: 'pending' | 'confirmed'
const jobDroneWallets = {}; // jobId: droneWalletAddress

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
  
  // Get the job info to verify the poster
  try {
    // Use a try-catch block specifically for jobs call
    let job;
    try {
      job = await contract.jobs(jobId);
      console.log(`Job poster: ${job.poster}`);
      console.log(`Current wallet address: ${posterWallet.address}`);
    } catch (jobError) {
      console.log(`[WARNING] Error decoding job data from contract. Using event data instead.`);
      // If we can't decode the job, we'll continue with minimal information
      job = {
        poster: posterWallet.address, // Assume the current wallet is the poster
        recipient: null,
        amount: 0,
        details: "Unknown"
      };
    }
    
    // First, use ElizaOS to process the delivery with drone management
    console.log(`[ELIZA] Activating ElizaOS for job ${jobId}...`);
    
    try {
      // We'll use the job object we already have instead of querying again
      const jobDetails = job;
      
      // Process with ElizaOS drone management to select optimal drone
      const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, {
        sender: jobDetails.poster || posterWallet.address,
        recipient: jobDetails.recipient || "0xa50050dbdbe672a5f0261e403909bcb8590b9130", // Default recipient
        amount: jobDetails.amount ? ethers.formatEther(jobDetails.amount) : "0.1", // Default amount
        details: jobDetails.details || "Default delivery details"
      });
      
      console.log(`[ELIZA] Drone assignment complete for job ${jobId}:`);
      console.log(`[ELIZA] Selected drone: ${droneAssignment.droneId}`);
      console.log(`[ELIZA] Drone wallet: ${droneAssignment.walletAddress}`);
      console.log(`[ELIZA] Estimated delivery time: ${droneAssignment.estimatedDeliveryTime} minutes`);
      console.log(`[ELIZA] Hive intelligence score: ${droneAssignment.hiveScore.toFixed(3)}`);
     try{ 
      // Store the selected drone wallet for this job
      jobDroneWallets[jobId] = droneAssignment.walletAddress;
      console.log(`[SUCCESS] Drone wallet ${droneAssignment.walletAddress} stored for job ${jobId}`);
      
      // After selecting the drone, confirm the delivery
      setTimeout(async () => {
        try {
          console.log(`[ACTION] Confirming delivery for job ${jobId} after 10 seconds...`);

          // Detect whether the contract supports direct drone assignment
          const contractSupportsAssignDrone = CONTRACT_ABI.some(item => 
            item.name === 'assignDrone' && 
            item.type === 'function'
          );

          // Track whether we successfully assigned on-chain
          let assignedOnChain = false;

          // Try to assign the drone wallet first if the contract supports it
          if (contractSupportsAssignDrone) {
            try {
              console.log(`[ACTION] Assigning drone wallet ${droneAssignment.walletAddress} to job ${jobId} on-chain...`);
              const assignTx = await contract.assignDrone(jobId, droneAssignment.walletAddress);
              await assignTx.wait();
              assignedOnChain = true;
              console.log(`[SUCCESS] Drone wallet assigned on-chain for job ${jobId}`);
            } catch (assignErr) {
              console.error(`[WARNING] Could not assign drone on-chain:`, assignErr.message || assignErr);
              console.log(`[INFO] Will continue with local assignment only`);
            }
          } else {
            console.log(`[INFO] Contract does not support direct drone assignment, using local tracking only`);
          }

          // Confirm delivery on-chain (this performs distribution according to contract logic)
          const tx = await contract.confirmDelivery(jobId);
          await tx.wait();
          jobStatus[jobId] = 'confirmed';
          console.log(`[SUCCESS] Delivery confirmed for job ${jobId}`);

          // Now verify whether the drone received the droneAmount on-chain.
          // If we couldn't assign on-chain or the on-chain job shows no drone wallet,
          // perform a manual payout of the drone fee (10%) from posterWallet to the drone wallet.
          let onChainDroneWallet = null;
          try {
            const onChainJob = await contract.jobs(jobId);
            onChainDroneWallet = onChainJob.droneWallet;
          } catch (readErr) {
            console.log(`[WARNING] Could not read job ${jobId} after confirmDelivery — will assume drone not paid on-chain.`);
          }

          // Only do manual payout if we have a drone wallet stored locally and either
          // - we did not assign on-chain, or
          // - on-chain job shows zero address for droneWallet
          const localDrone = jobDroneWallets[jobId];
          const zeroAddress = '0x0000000000000000000000000000000000000000';

          const needsManualPayout = localDrone && (!assignedOnChain || !onChainDroneWallet || onChainDroneWallet === zeroAddress);

          if (needsManualPayout) {
            console.log(`[INFO] Performing manual drone payout to ${localDrone} for job ${jobId}`);

            // Determine job amount in wei (robust handling)
            let jobAmountWei;
            try {
              // Prefer local job.amount when available and non-zero
              const localAmountAvailable = job && job.amount !== undefined && job.amount !== null && !(typeof job.amount === 'number' && job.amount === 0);

              if (localAmountAvailable) {
                // Parse local job.amount
                if (typeof job.amount === 'object' && typeof job.amount.toString === 'function') {
                  jobAmountWei = BigInt(job.amount.toString());
                } else if (typeof job.amount === 'bigint') {
                  jobAmountWei = job.amount;
                } else if (typeof job.amount === 'string') {
                  if (job.amount.includes('.')) {
                    jobAmountWei = BigInt(ethers.parseEther(job.amount).toString());
                  } else {
                    jobAmountWei = BigInt(job.amount);
                  }
                } else if (typeof job.amount === 'number') {
                  jobAmountWei = BigInt(ethers.parseEther(String(job.amount)).toString());
                } else {
                  jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
                }
              } else if (onChainJob && onChainJob.amount !== undefined && onChainJob.amount !== null) {
                // Use on-chain job amount if available
                jobAmountWei = BigInt(onChainJob.amount.toString());
                console.log(`[INFO] Using on-chain job amount for job ${jobId}: ${jobAmountWei.toString()} wei`);
              } else {
                // Fallback to default
                jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
              }
            } catch (amtErr) {
              console.error(`[WARNING] Error determining job amount for job ${jobId}:`, amtErr);
              jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
            }

            // 10% drone fee
            const droneAmountWei = (BigInt(jobAmountWei) * 10n) / 100n;

            if (droneAmountWei > 0n) {
              try {
                const payoutTx = await posterWallet.sendTransaction({ to: localDrone, value: droneAmountWei });
                await payoutTx.wait();
                console.log(`[SUCCESS] Manual drone payout sent for job ${jobId}: ${payoutTx.hash}`);
              } catch (payoutErr) {
                console.error(`[ERROR] Manual drone payout failed for job ${jobId}:`, payoutErr);
              }
            } else {
              console.log(`[INFO] Computed drone payout is zero for job ${jobId}, skipping manual payout.`);
            }
          } else {
            console.log(`[INFO] No manual payout needed for job ${jobId} (either paid on-chain or no local drone recorded).`);
          }

          console.log(`[INFO] Drone fee handling complete for job ${jobId}`);
        } catch (err) {
          console.error(`[ERROR] Confirming delivery for job ${jobId}:`, err);
          console.log(`Wallet address used: ${posterWallet.address}`);
        }
      }, 10000);
    } catch (elizaErr) {
      console.error(`[ELIZA] Error processing job with ElizaOS:`, elizaErr);
    }
    } catch (elizaErr) {
      console.error(`[ELIZA] Error processing job with ElizaOS:`, elizaErr);
    }
  } catch (err) {
    console.error(`[ERROR] Getting job info for ${jobId}:`, err);
  }
  
  res.json({ status: 'Job received', jobId });
});

app.get('/job/:jobId/status', (req, res) => {
  const jobId = req.params.jobId;
  const status = jobStatus[jobId] || 'pending';
  res.json({ status });
});

// API endpoints for drone management
app.get('/api/drones', (req, res) => {
  res.json({
    drones: droneSystem.droneFleet,
    activeJobs: Array.from(droneSystem.activeJobs.values())
  });
});

// Hive intelligence analytics
app.get('/api/hive-analytics', (req, res) => {
  const analytics = droneSystem.generateHiveAnalytics();
  res.json(analytics);
});

// Manual drone assignment for testing
app.post('/api/assign-drone', async (req, res) => {
  try {
    const { jobId, pickup, delivery, weight } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Missing jobId' });
    }
    
    const job = {
      id: jobId,
      pickup: pickup || { lat: 15.2993, lng:74.1240}, // Default to Delhi
      delivery: delivery || { lat: 28.4089, lng: 77.3178 }, // Default to Gurgaon
      weight: weight || 2.5, // Default weight in kg
      weatherConditions: 'clear'
    };
    
    // Select optimal drone using ElizaOS
    const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, job);
    
    // Store the drone wallet for this job
    jobDroneWallets[jobId] = droneAssignment.walletAddress;
    console.log(`[API] Drone wallet ${droneAssignment.walletAddress} stored for job ${jobId}`);
    
    // Check contract version to see if direct assignment is supported
    let contractSupportsAssignDrone = false;
    try {
      // Check if the contract has the assignDrone function by checking the ABI
      contractSupportsAssignDrone = CONTRACT_ABI.some(item => 
        item.name === 'assignDrone' && 
        item.type === 'function'
      );
      
      if (contractSupportsAssignDrone) {
        console.log(`[API] Contract supports direct drone assignment, will try to assign on-chain`);
      } else {
        console.log(`[API] Contract does not support direct drone assignment, storing in memory only`);
      }
    } catch (err) {
      console.log(`[API] Error checking contract capabilities:`, err.message);
    }
    
    res.json({
      success: true,
      jobId,
      assignment: droneAssignment,
      droneWalletStored: true,
      contractSupportsAssignDrone
    });
  } catch (error) {
    console.error('[API] Error assigning drone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
  console.log('🔗 SEI blockchain integration active');
  console.log('🧠 ElizaOS hive intelligence enabled');
  console.log('🚁 Drone management system initialized');
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
