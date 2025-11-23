import mongoose from 'mongoose';

const paralegalRequestSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true // One request per user
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: v => /^[0-9]{10}$/.test(v),
            message: 'Phone number must be 10 digits.'
        }
    },
    areasOfExpertise: {
        type: [String],
        enum: ['Aadhaar', 'Pension', 'Land', 'Certificates', 'Fraud', 'Court', 'Welfare'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestMessage: {
        type: String,
        trim: true
    },
    adminResponse: {
        type: String,
        trim: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

export default mongoose.model('ParalegalRequest', paralegalRequestSchema);
