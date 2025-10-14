import mongoose from 'mongoose';

const kioskSchema = new mongoose.Schema({
  location: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  operatorName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  organizationType: {
    type: String,
    enum: ['NALSA', 'DLSA', 'SHG', 'CSR', 'NGO', 'Independent'],
    default: 'Independent'
  },
  organizationName: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Kiosk', kioskSchema);