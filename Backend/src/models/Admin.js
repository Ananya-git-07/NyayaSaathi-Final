import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assignedDistricts: [String],
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    adminRole: {
        type: String,
        enum: ['SuperAdmin', 'DistrictAdmin', 'DataEntryOperator'],
        default: 'DistrictAdmin'
    },
    // Employee-related fields (merged from Employee model)
    department: { type: String },
    designation: { type: String },
    roleLevel: { type: String, enum: ['staff', 'manager'], default: 'staff' },
    permissions: {
        formProcessing: Boolean,
        caseEscalation: Boolean
    },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);