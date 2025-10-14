import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  submittedTo: { type: String, required: true },
  submissionStatus: {
    type: String,
    enum: ['not_submitted', 'submitted', 'under_review', 'accepted', 'rejected'],
    default: 'not_submitted'
  },
  submissionDate: { type: Date },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);