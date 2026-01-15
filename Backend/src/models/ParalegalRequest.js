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
        required: [true, 'Phone number is required'],
        validate: {
            validator: v => /^[0-9]{10}$/.test(v),
            message: 'Phone number must be exactly 10 digits'
        }
    },
    areasOfExpertise: {
        type: [String],
        enum: {
            values: ['Aadhaar', 'Pension', 'Land', 'Certificates', 'Fraud', 'Court', 'Welfare'],
            message: '{VALUE} is not a valid area of expertise'
        },
        required: [true, 'At least one area of expertise is required'],
        validate: {
            validator: v => Array.isArray(v) && v.length > 0,
            message: 'At least one area of expertise must be selected'
        }
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
