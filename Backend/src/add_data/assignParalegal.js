import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB } from '../config/db.js';
import LegalIssue from '../models/LegalIssue.js';
import Paralegal from '../models/Paralegal.js';
import User from '../models/User.js';

const assignParalegalToIssue = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get all paralegals
    const paralegals = await Paralegal.find({ isDeleted: false }).populate('user');
    if (paralegals.length === 0) {
      console.error('❌ No paralegals found in database');
      process.exit(1);
    }

    console.log('\n📋 Available Paralegals:');
    paralegals.forEach((p, index) => {
      console.log(`${index + 1}. ${p.user.fullName} (${p.user.email}) - Areas: ${p.areasOfExpertise.join(', ')}`);
      console.log(`   ID: ${p._id}`);
    });

    // Get all unassigned issues
    const issues = await LegalIssue.find({ 
      isDeleted: false,
      assignedParalegal: null 
    }).populate('userId', 'fullName email');

    if (issues.length === 0) {
      console.log('\n⚠️  No unassigned issues found');
      process.exit(0);
    }

    console.log('\n📋 Unassigned Issues:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issueType} - ${issue.title || 'No title'}`);
      console.log(`   Submitted by: ${issue.userId.fullName} (${issue.userId.email})`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   ID: ${issue._id}`);
    });

    console.log('\n💡 To assign a paralegal to an issue, use the API:');
    console.log('PUT /api/issues/{issueId}/assign');
    console.log('Body: { "paralegalId": "PARALEGAL_ID" }');
    console.log('\nExample with curl:');
    console.log(`curl -X PUT http://localhost:5001/api/issues/${issues[0]._id}/assign \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`  -d '{"paralegalId": "${paralegals[0]._id}"}'`);

    // Auto-assign first paralegal to first issue for quick testing
    if (paralegals.length > 0 && issues.length > 0) {
      console.log('\n🔄 Auto-assigning first paralegal to first issue...');
      const issue = issues[0];
      const paralegal = paralegals[0];
      
      issue.assignedParalegal = paralegal._id;
      issue.history.push({
        event: 'Assigned to Paralegal',
        details: `Assigned to ${paralegal.user.fullName} (${paralegal.areasOfExpertise.join(', ')})`,
        actor: 'System (Auto-assign script)'
      });
      
      await issue.save();
      console.log(`✅ Assigned ${paralegal.user.fullName} to issue: ${issue.issueType}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

assignParalegalToIssue();
