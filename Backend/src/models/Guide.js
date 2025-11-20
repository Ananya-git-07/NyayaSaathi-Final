import mongoose from "mongoose";

const guideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['filing-complaint', 'documentation', 'court-process', 'government-schemes', 'legal-aid', 'other'],
      default: 'other',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    steps: [{
      stepNumber: Number,
      title: String,
      description: String,
      tips: [String],
      requiredDocuments: [String],
    }],
    estimatedTime: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    relatedGuides: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

guideSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Guide = mongoose.model("Guide", guideSchema);
export default Guide;
