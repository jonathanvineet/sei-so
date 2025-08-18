// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeliveryEscrow {
    struct Job {
        address poster;
        address recipient;
        string details;
        uint256 amount;
        bool funded;
        bool completed;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;

    event JobPosted(uint256 indexed jobId, address indexed poster, string details, address recipient, uint256 amount);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobCompleted(uint256 indexed jobId, address indexed recipient);

    function postJob(string calldata details, address recipient) external payable returns (uint256) {
        require(msg.value > 0, "Must fund job");
        jobCount++;
        jobs[jobCount] = Job(msg.sender, recipient, details, msg.value, true, false);
        emit JobPosted(jobCount, msg.sender, details, recipient, msg.value);
        emit JobFunded(jobCount, msg.value);
        return jobCount;
    }

    function confirmDelivery(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.funded, "Job not funded");
        require(!job.completed, "Already completed");
        require(msg.sender == job.poster, "Only poster can confirm");
        job.completed = true;
        payable(job.recipient).transfer(job.amount);
        emit JobCompleted(jobId, job.recipient);
    }
}
