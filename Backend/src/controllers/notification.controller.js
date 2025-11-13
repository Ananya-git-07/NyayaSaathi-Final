// --- THIS IS A NEW FILE ---
// FILE: Backend/src/controllers/notification.controller.js

import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false, isDeleted: false });

    return res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched successfully."));
});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );
    if (!notification) throw new ApiError(404, "Notification not found or access denied.");
    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read."));
});

export { getNotifications, markAsRead, markAllAsRead };