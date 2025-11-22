// PASTE THIS ENTIRE FILE INTO Backend/src/middleware/subscriptionMiddleware.js

import Subscription from "../models/Subscription.js";
import Employee from "../models/Employee.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifySubscription = asyncHandler(async (req, res, next) => {
    const user = req.user;

    // 1. Admins bypass all checks
    if (user.role === 'admin') {
        return next();
    }

    let targetId = user._id;
    let targetType = 'User'; // Default for Citizen/Paralegal

    // 2. If User is an Employee, we check their KIOSK's subscription
    if (user.role === 'employee') {
        const employeeRecord = await Employee.findOne({ user: user._id });
        if (!employeeRecord || !employeeRecord.kioskId) {
            throw new ApiError(403, "Employee is not linked to a valid Kiosk.");
        }
        targetId = employeeRecord.kioskId;
        targetType = 'Kiosk';
    }

    // 3. Check for Active Subscription
    const activeSubscription = await Subscription.findOne({
        organizationRef: targetId,
        organizationType: targetType, // Matches the enum ['Kiosk', 'User']
        paymentStatus: 'Active',
        expiryDate: { $gte: new Date() } // Expiry must be in the future
    });

    if (!activeSubscription) {
        throw new ApiError(402, "Premium Feature: Active subscription required. Please upgrade your plan.");
    }

    // Attach subscription info to request for use in controller if needed
    req.subscription = activeSubscription;
    next();
});