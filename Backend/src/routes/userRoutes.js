// PASTE THIS ENTIRE FILE INTO Backend/src/routes/userRoutes.js

import { Router } from 'express';
import User from '../models/User.js';
import { softDeleteById } from '../utils/helpers.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { upload } from '../middleware/multer.middleware.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = Router();

// Get all non-deleted users (admin functionality)
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false }).select('-password');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Update user profile details
router.put('/update-profile', async (req, res, next) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const userId = req.user._id;

    if (!fullName) {
      throw new ApiError(400, "Full name is required.");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { fullName, phoneNumber } },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      throw new ApiError(404, "User not found.");
    }

    return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully."));
  } catch (err) {
    next(err);
  }
});

// Change user password
router.post('/change-password', async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "Old and new passwords are required.");
    }
    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters long.");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid old password.");
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully."));
  } catch (err) {
    next(err);
  }
});

// Update avatar
router.put('/update-avatar', upload.single('avatar'), async (req, res, next) => {
    try {
        const localFilePath = req.file?.path;
        if (!localFilePath) {
            throw new ApiError(400, "Avatar file is missing.");
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        if (user.profilePictureCloudinaryId) {
            await deleteFromCloudinary(user.profilePictureCloudinaryId);
        }

        const avatar = await uploadOnCloudinary(localFilePath);
        if (!avatar.url) {
            throw new ApiError(500, "Error while uploading on Cloudinary.");
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    profilePictureUrl: avatar.secure_url,
                    profilePictureCloudinaryId: avatar.public_id
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully."));
    } catch (error) {
        next(error);
    }
});

// --- THIS IS THE FIX: Add route for avatar deletion ---
router.delete('/remove-avatar', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        // Delete from Cloudinary if an ID exists
        if (user.profilePictureCloudinaryId) {
            await deleteFromCloudinary(user.profilePictureCloudinaryId);
        }

        // Update user document to clear avatar fields
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    profilePictureUrl: "",
                    profilePictureCloudinaryId: ""
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar removed successfully."));
    } catch (error) {
        next(error);
    }
});
// --- END OF FIX ---

// Soft delete a user by ID (admin functionality)
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await softDeleteById(User, req.params.id);
    res.json({ message: 'User soft-deleted successfully', user });
  } catch (err) {
    next(err);
  }
});

export default router;