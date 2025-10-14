import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  organizationType: {
    type: String,
    enum: ['Kiosk', 'SHG', 'Independent'],
    required: true
  },
  organizationRef: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
    // Note: You would add a `refPath: 'organizationType'` if you need Mongoose to dynamically reference different models
  },
  plan: { type: String, enum: ['Basic', 'Premium', 'Enterprise'], required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  paymentStatus: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);