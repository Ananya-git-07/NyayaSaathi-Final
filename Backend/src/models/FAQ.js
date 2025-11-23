import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['general', 'legal-process', 'documentation', 'rights', 'other'],
      default: 'general',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
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

faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
