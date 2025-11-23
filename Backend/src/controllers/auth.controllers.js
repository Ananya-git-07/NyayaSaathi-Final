import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Helper: Generate Access & Refresh Tokens ---
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        user.refreshToken = hashedRefreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation failed:", error);
        throw new ApiError(500, "Error generating tokens");
    }
};

// --- Cookie Options ---
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ==================== CONTROLLERS ====================

// 1. Register User
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, aadhaarNumber, role, phoneNumber, department, designation, roleLevel, areasOfExpertise, adminRole } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password?.trim() || !aadhaarNumber?.trim() || !role?.trim()) {
        throw new ApiError(400, "All required fields must be filled");
    }

    const existedUser = await User.findOne({ $or: [{ email }, { aadhaarNumber }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or Aadhaar already exists");
    }

    const user = await User.create({ fullName, email, password, aadhaarNumber, role, phoneNumber });

    // ---- Role Specific Models ----
    if (role === "admin") {
        if (!department || !designation)
            throw new ApiError(400, "Department and designation required for admin");

        const Admin = (await import("../models/Admin.js")).default;
        await Admin.create({
            user: user._id, 
            department, 
            designation, 
            roleLevel: roleLevel || 'staff',
            adminRole: adminRole || 'DistrictAdmin',
            isDeleted: false
        });
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


// 2. Login User
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) throw new ApiError(400, "Email and password required");

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful"));
});


// 3. Logout User
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logout successful"));
});


// 4. Refresh Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "No refresh token provided");

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Refresh token expired or malformed");
    }

    const user = await User.findById(decoded?._id);
    if (!user || !user.refreshToken) throw new ApiError(401, "User not found");

    const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
    if (!isValid) throw new ApiError(401, "Invalid refresh token");

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token refreshed"));
});


// 5. Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched")
    );
});
