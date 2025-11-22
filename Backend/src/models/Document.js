// PASTE THIS ENTIRE FILE INTO Backend/src/models/Document.js

import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // CHANGED: issueId is now optional because generated docs might not belong to a case yet
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalIssue' }, 
  documentType: { type: String, required: true },
  fileUrl: { type: String, required: true },
  submissionStatus: {
    type: String,
    enum: ['not_submitted', 'submitted', 'accepted', 'rejected', 'generated'], // Added 'generated'
    default: 'generated'
  },
  uploadedBy: { type: String, default: 'System' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);