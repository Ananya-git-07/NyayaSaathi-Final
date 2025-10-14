

import { Router } from "express"
import LegalIssue from "../models/LegalIssue.js"
import Document from "../models/Document.js"
import User from "../models/User.js"

const router = Router()

// Get all Legal Issues for the logged-in Citizen
router.get('/issues', async (req, res, next) => {
  try {
    console.log("Fetching issues for user:", req.user._id)

    const issues = await LegalIssue.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .populate("kiosk", "location operatorName")
      .populate("assignedParalegal", "user")
      .sort({ createdAt: -1 })

    console.log("Found issues:", issues.length)

    res.json({
      success: true,
      issues: issues,
      count: issues.length,
    })
  } catch (err) {
    console.error("Error fetching issues:", err)
    next(err)
  }
})

// Get all Documents for the logged-in Citizen
router.get('/documents', async (req, res, next) => {
  try {
    console.log("Fetching documents for user:", req.user._id)

    const documents = await Document.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .populate("issueId", "issueType description")
      .sort({ createdAt: -1 })

    console.log("Found documents:", documents.length)

    res.json({
      success: true,
      documents: documents,
      count: documents.length,
    })
  } catch (err) {
    console.error("Error fetching documents:", err)
    next(err)
  }
})

// Get user profile with related data
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    const issuesCount = await LegalIssue.countDocuments({ userId: req.user._id, isDeleted: false })
    const documentsCount = await Document.countDocuments({ userId: req.user._id, isDeleted: false })

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalIssues: issuesCount,
          totalDocuments: documentsCount,
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
