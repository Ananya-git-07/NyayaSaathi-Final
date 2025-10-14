import '../db.js';
import LegalIssue from '../models/LegalIssue.js';
import User from '../models/User.js';

const users = await User.find(); // get all users

if (users.length === 0) {
  console.log("❌ No users found! Run seedUsers.js first.");
  process.exit();
}
const issues = [
  { issueType: "Land Dispute", description: "Boundary confusion" },
  { issueType: "Pension Issue", description: "Pension not received" },
  { issueType: "Aadhaar Issue", description: "DOB mismatch" },
  { issueType: "Court Summon", description: "Notice not delivered" },
  { issueType: "Certificate Missing", description: "Birth certificate lost" },
  { issueType: "Fraud Case", description: "ATM card fraud" },
  { issueType: "Land Dispute", description: "Land ownership claim" },
  { issueType: "Court Summon", description: "Summon for witness" },
  { issueType: "Pension Issue", description: "Old age pension pending" },
  { issueType: "Aadhaar Issue", description: "Biometric mismatch" },
];

// Assign issues sequentially to users, loop users if needed
for (let i = 0; i < issues.length; i++) {
  const assignedUser = users[i % users.length];  // Loop users if fewer users than issues

  const issue = new LegalIssue({
    userId: assignedUser._id,
    issueType: issues[i].issueType,
    description: issues[i].description,
    status: "Pending"
  });

  await issue.save();
  console.log(`✅ Issue ${i + 1} saved for ${assignedUser.fullName}`);
}

process.exit();
