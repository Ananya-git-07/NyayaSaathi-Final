// --- THIS IS A NEW FILE ---
// FILE: Backend/src/models/Notification.js

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['STATUS_UPDATE', 'NEW_MESSAGE', 'DOCUMENT_UPLOADED', 'PARALEGAL_ASSIGNED'],
        required: true
    },
    message: { type: String, required: true },
    link: { type: String }, // e.g., /issues/123
    isRead: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);