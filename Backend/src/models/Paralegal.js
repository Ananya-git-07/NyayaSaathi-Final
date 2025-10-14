import mongoose from 'mongoose';

const paralegalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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
        enum: ['Aadhaar', 'Pension', 'Land', 'Certificates', 'Fraud', 'Court', 'Welfare']
    },
    active: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Paralegal', paralegalSchema);