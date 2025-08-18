// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeliveryEscrow {
    struct Job {
        address poster;
        address recipient;
        address feeWallet;
        string details;
        uint256 amount;
        bool funded;
        bool completed;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;

    event JobPosted(uint256 indexed jobId, address indexed poster, string details, address recipient, address feeWallet, uint256 amount);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobCompleted(uint256 indexed jobId, address indexed recipient, address indexed feeWallet, uint256 recipientAmount, uint256 feeAmount);

    address public constant FEE_WALLET = 0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1;

    function postJob(string calldata details, address recipient) external payable returns (uint256) {
        require(msg.value > 0, "Must fund job");
        require(recipient != address(0), "Recipient cannot be zero address");
        require(recipient != msg.sender, "Recipient cannot be sender");
        require(msg.value >= 1000000000000000, "Minimum 0.001 SEI required");
        jobCount++;
        jobs[jobCount] = Job(msg.sender, recipient, FEE_WALLET, details, msg.value, true, false);
        emit JobPosted(jobCount, msg.sender, details, recipient, FEE_WALLET, msg.value);
        emit JobFunded(jobCount, msg.value);
        return jobCount;
    }

    function confirmDelivery(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.funded, "Job not funded");
        require(!job.completed, "Already completed");
        require(msg.sender == job.poster, "Only poster can confirm");
        job.completed = true;
        uint256 recipientAmount = (job.amount * 90) / 100;
        uint256 feeAmount = job.amount - recipientAmount;
    (bool sentRecipient, ) = payable(job.recipient).call{value: recipientAmount}("");
    require(sentRecipient, "Failed to send to recipient");
    (bool sentFee, ) = payable(job.feeWallet).call{value: feeAmount}("");
    require(sentFee, "Failed to send to fee wallet");
        emit JobCompleted(jobId, job.recipient, job.feeWallet, recipientAmount, feeAmount);
    }
}
