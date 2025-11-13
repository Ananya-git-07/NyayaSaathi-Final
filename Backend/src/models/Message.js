// --- THIS IS A NEW FILE ---
// FILE: Backend/src/models/Message.js

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);