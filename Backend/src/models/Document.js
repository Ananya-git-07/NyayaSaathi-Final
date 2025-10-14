import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalIssue', required: true },
  documentType: { type: String, required: true },
  fileUrl: { type: String, required: true },
  submissionStatus: {
    type: String,
    enum: ['not_submitted', 'submitted', 'accepted', 'rejected'],
    default: 'not_submitted'
  },
  uploadedBy: { type: String, default: 'System' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);