// --- THIS IS A NEW FILE ---
// FILE: Backend/src/controllers/message.controller.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import LegalIssue from '../models/LegalIssue.js';
import Notification from '../models/Notification.js';
import { eventEmitter } from '../socket.js';

const getMessagesForIssue = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const userId = req.user._id;

    const issue = await LegalIssue.findById(issueId);
    if (!issue) throw new ApiError(404, "Issue not found.");

    // Security check: ensure user is part of this issue
    const participants = [issue.userId, issue.assignedParalegal].filter(Boolean);
    if (!participants.map(String).includes(String(userId))) {
        throw new ApiError(403, "You are not authorized to view this conversation.");
    }

    let conversation = await Conversation.findOne({ issueId });
    if (!conversation) {
        return res.status(200).json(new ApiResponse(200, [], "Start of conversation."));
    }

    const messages = await Message.find({ conversationId: conversation._id })
        .populate('sender', 'fullName profilePictureUrl')
        .sort({ createdAt: 'asc' });

    return res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully."));
});

const sendMessage = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    if (!content || !content.trim()) throw new ApiError(400, "Message content cannot be empty.");

    const issue = await LegalIssue.findById(issueId);
    if (!issue) throw new ApiError(404, "Issue not found.");

    const participants = [issue.userId, issue.assignedParalegal].filter(p => p).map(p => p.toString());
    if (!participants.includes(senderId.toString())) {
        throw new ApiError(403, "You are not part of this issue's conversation.");
    }

    let conversation = await Conversation.findOne({ issueId });
    if (!conversation) {
        conversation = await Conversation.create({ issueId, participants });
    }

    const newMessage = await Message.create({ conversationId: conversation._id, sender: senderId, content });
    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id });

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'fullName profilePictureUrl');

    // Emit event for real-time update
    eventEmitter.emit('send_message', { conversationId: conversation._id.toString(), message: populatedMessage });
    
    // Create and emit notifications for other participants
    participants.forEach(async (participantId) => {
        if (participantId !== senderId.toString()) {
            const notification = await Notification.create({
                recipient: participantId,
                sender: senderId,
                type: 'NEW_MESSAGE',
                message: `You have a new message from ${req.user.fullName} regarding issue: ${issue.issueType}`,
                link: `/issues/${issueId}`
            });
            eventEmitter.emit('send_notification', { recipientId: participantId, notification });
        }
    });

    return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent successfully."));
});

export { getMessagesForIssue, sendMessage };