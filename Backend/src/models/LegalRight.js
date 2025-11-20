import mongoose from "mongoose";

const legalRightSchema = new mongoose.Schema(
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
      enum: ['fundamental-rights', 'consumer-rights', 'labor-rights', 'women-rights', 'child-rights', 'property-rights', 'other'],
      default: 'other',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    content: {
      type: String,
      required: true,
    },
    relatedLaws: [{
      type: String,
    }],
    resources: [{
      title: String,
      url: String,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
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

legalRightSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });

const LegalRight = mongoose.model("LegalRight", legalRightSchema);
export default LegalRight;
