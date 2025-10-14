import mongoose from 'mongoose';

// --- NEW: Schema for history events ---
const historyEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'Issue Created', 
      'Document Uploaded', 
      'Status Changed', 
      'Assigned to Paralegal', 
      'Note Added'
    ]
  },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }, // e.g., "Status changed to Resolved" or Document type
  actor: { type: String, default: 'System' } // Who performed the action (e.g., 'User', 'Admin')
});

const legalIssueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueType: {
    type: String,
    enum: ["Aadhaar Issue", "Pension Issue", "Land Dispute", "Court Summon", "Certificate Missing", "Fraud Case", "Other"],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ["Pending", "Submitted", "Escalated", "Resolved"],
    default: "Pending"
  },
  kiosk: { type: mongoose.Schema.Types.ObjectId, ref: 'Kiosk' },
  assignedParalegal: { type: mongoose.Schema.Types.ObjectId, ref: 'Paralegal' },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  
  // --- NEW: Add the history array to the main schema ---
  history: [historyEventSchema],

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('LegalIssue', legalIssueSchema);