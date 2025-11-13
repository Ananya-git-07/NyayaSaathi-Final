// Replace this function in Backend/src/middleware/authMiddleware.js

import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    // --- HARDENED CHECK ---
    if (!process.env.ACCESS_TOKEN_SECRET) {
        console.error("FATAL: ACCESS_TOKEN_SECRET is not defined in .env file. Authentication is disabled.");
        return res.status(500).json({ success: false, message: "Internal Server Error: Auth secret not configured." });
    }

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized request: No token provided." });
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Access Token: User not found." });
        }
        
        req.user = user;
        next();

    } catch (error) {
        let message = "Invalid Access Token.";
        if (error.name === 'TokenExpiredError') {
            message = "Access token has expired. Please refresh your token or log in again.";
        } else if (error.name === 'JsonWebTokenError') {
            message = "Malformed or invalid access token. Please log out and log in again.";
        }
        
        return res.status(401).json({ success: false, message });
    }
});

export default verifyJWT;