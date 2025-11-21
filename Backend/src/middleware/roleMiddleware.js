// FILE: Backend/src/middleware/roleMiddleware.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const verifyRole = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized: User not authenticated.");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, "Forbidden: You do not have permission to perform this action.");
        }
        next();
    });
};