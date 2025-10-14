import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            // No token was provided at all.
            return res.status(401).json({ success: false, message: "Unauthorized request: No token provided." });
        }
        
        // Verify the token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find the user from the database based on the ID in the token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // The user associated with this token no longer exists.
            return res.status(401).json({ success: false, message: "Invalid Access Token: User not found." });
        }
        
        // Attach the user object to the request for use in subsequent controllers
        req.user = user;
        next(); // Proceed to the next middleware or the controller

    } catch (error) {
        // This block catches errors from jwt.verify, like expired or malformed tokens
        let message = "Invalid Access Token.";
        if (error.name === 'TokenExpiredError') {
            message = "Access token has expired. Please refresh your token or log in again.";
        } else if (error.name === 'JsonWebTokenError') {
            message = "Malformed or invalid access token.";
        }
        
        return res.status(401).json({ success: false, message });
    }
});

export default verifyJWT;