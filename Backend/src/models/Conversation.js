// --- THIS IS A NEW FILE ---
// FILE: Backend/src/models/Conversation.js

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalIssue', unique: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);