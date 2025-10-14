import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    kioskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kiosk', required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    roleLevel: { type: String, enum: ['staff', 'manager'], default: 'staff' },
    permissions: {
        formProcessing: Boolean,
        caseEscalation: Boolean
    },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);