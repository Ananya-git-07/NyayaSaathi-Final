// PASTE THIS ENTIRE FILE INTO Backend/src/models/User.js

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    aadhaarNumber: {
      type: String,
      required: [true, "Aadhaar number is required"],
      unique: true,
      match: [/^\d{12}$/, "Aadhaar number must be 12 digits"],
    },
    role: {
      type: String,
      enum: ["citizen", "paralegal", "employee", "admin"],
      default: "citizen",
    },
    phoneNumber: {
      type: String,
    },
    // --- THIS IS THE FIX: Add fields for profile picture ---
    profilePictureUrl: {
      type: String,
      default: "", // Default to an empty string
    },
    profilePictureCloudinaryId: {
      type: String, // To store the public_id for deletion
    },
    // --- END OF FIX ---
    refreshToken: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error("Password comparison failed")
  }
}

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined in .env file. Cannot sign token.");
  }

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  )
}

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" })
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject()
  delete userObject.password
  delete userObject.refreshToken
  return userObject
}

const User = mongoose.model("User", userSchema)
export default User