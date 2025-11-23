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
    const userRole = req.user.role;

    const issue = await LegalIssue.findById(issueId).populate('assignedParalegal');
    if (!issue) throw new ApiError(404, "Issue not found.");

    // Security check: ensure user is part of this issue
    let isAuthorized = false;

    // Check if user is the issue creator
    if (issue.userId.toString() === userId.toString()) {
        isAuthorized = true;
    }

    // Check if user is the assigned paralegal
    if (userRole === 'paralegal' && issue.assignedParalegal) {
        const Paralegal = (await import('../models/Paralegal.js')).default;
        const paralegal = await Paralegal.findOne({ user: userId, isDeleted: false });
        if (paralegal && issue.assignedParalegal._id.toString() === paralegal._id.toString()) {
            isAuthorized = true;
        }
    }

    // Admins can view all conversations
    if (userRole === 'admin') {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        throw new ApiError(403, "You are not authorized to view this conversation.");
    }

    let conversation = await Conversation.findOne({ issueId });
    if (!conversation) {
        return res.status(200).json(new ApiResponse(200, [], "Start of conversation."));
    }

    const messages = await Message.find({ conversationId: conversation._id })
        .populate('sender', 'fullName profilePictureUrl role')
        .sort({ createdAt: 'asc' });

    return res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully."));
});

const sendMessage = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;
    const userRole = req.user.role;

    if (!content || !content.trim()) throw new ApiError(400, "Message content cannot be empty.");

    const issue = await LegalIssue.findById(issueId).populate('assignedParalegal');
    if (!issue) throw new ApiError(404, "Issue not found.");

    // Security check: ensure user is part of this issue
    let isAuthorized = false;
    const participantIds = [issue.userId.toString()];

    // Check if user is the issue creator
    if (issue.userId.toString() === senderId.toString()) {
        isAuthorized = true;
    }

    // Check if user is the assigned paralegal
    if (userRole === 'paralegal' && issue.assignedParalegal) {
        const Paralegal = (await import('../models/Paralegal.js')).default;
        const paralegal = await Paralegal.findOne({ user: senderId, isDeleted: false });
        if (paralegal && issue.assignedParalegal._id.toString() === paralegal._id.toString()) {
            isAuthorized = true;
            // Add paralegal's user ID to participants for notifications
            if (issue.assignedParalegal.user) {
                participantIds.push(issue.assignedParalegal.user.toString());
            }
        }
    }

    // Admins can send messages
    if (userRole === 'admin') {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        throw new ApiError(403, "You are not part of this issue's conversation.");
    }

    let conversation = await Conversation.findOne({ issueId });
    if (!conversation) {
        conversation = await Conversation.create({ issueId, participants: participantIds });
    }

    const newMessage = await Message.create({ conversationId: conversation._id, sender: senderId, content });
    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id });

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'fullName profilePictureUrl role');

    // Emit event for real-time update
    eventEmitter.emit('send_message', { conversationId: conversation._id.toString(), message: populatedMessage });
    
    // Create and emit notifications for other participants
    participantIds.forEach(async (participantId) => {
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