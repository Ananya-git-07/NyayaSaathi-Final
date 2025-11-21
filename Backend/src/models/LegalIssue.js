import mongoose from 'mongoose';

// Schema for history events
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
  details: { type: String }, 
  actor: { type: String, default: 'System' } 
});

const legalIssueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueType: {
    type: String,
    enum: ["Aadhaar Issue", "Pension Issue", "Land Dispute", "Court Summon", "Certificate Missing", "Fraud Case", "Other"],
    required: true
  },
  description: String, // General summary
  
  // --- NEW: Flexible field for specific form data ---
  formDetails: {
    type: Map,
    of: String,
    default: {} 
    // Example: { "surveyNumber": "123", "village": "Rampur", "ppoNumber": "XYZ" }
  },

  status: {
    type: String,
    enum: ["Pending", "Submitted", "Escalated", "Resolved"],
    default: "Pending"
  },
  kiosk: { type: mongoose.Schema.Types.ObjectId, ref: 'Kiosk' },
  assignedParalegal: { type: mongoose.Schema.Types.ObjectId, ref: 'Paralegal' },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  
  history: [historyEventSchema],

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('LegalIssue', legalIssueSchema);