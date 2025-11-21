import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  organizationType: {
    type: String,
    // CRITICAL FIX: These values MUST match your Mongoose Model names exactly for refPath to work
    // 'User' covers Independent/SHG since they are stored in the User collection
    enum: ['Kiosk', 'User'], 
    required: true
  },
  organizationRef: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'organizationType' // CRITICAL FIX: Tells Mongoose to look at 'organizationType' to decide which collection to query
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