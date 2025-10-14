import { Router } from 'express';
import LegalIssue from '../models/LegalIssue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// === CREATE: Create a new legal issue ===
router.post('/', async (req, res, next) => {
  try {
    const { issueType, description, kioskId } = req.body;
    if (!issueType || !description) {
      throw new ApiError(400, "Issue Type and Description are required.");
    }

    const newIssue = await LegalIssue.create({
      userId: req.user._id,
      issueType,
      description,
      kiosk: kioskId,
      status: 'Pending',
      // --- NEW: Add the first event to the timeline ---
      history: [{
        event: 'Issue Created',
        details: `Issue reported by user.`,
        actor: 'User'
      }]
    });

    return res.status(201).json(
      new ApiResponse(201, newIssue, "Legal issue created successfully.")
    );
  } catch (error) {
    return next(error);
  }
});

// === READ: Get all issues (for admin) or user-specific issues ===
router.get('/', async (req, res, next) => {
  try {
    const query = { isDeleted: false };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    const issues = await LegalIssue.find(query)
      .populate('userId', 'fullName email')
      .populate('kiosk', 'location operatorName')
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, issues, "Issues retrieved successfully."));
  } catch (error) {
    return next(error);
  }
});


// === READ: Get a single issue by ID ===
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = { _id: id, isDeleted: false };
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }

        // --- NEW: Populate all necessary fields for the detail page ---
        const issue = await LegalIssue.findOne(query)
            .populate('userId', 'fullName email phoneNumber')
            .populate('kiosk')
            .populate('assignedParalegal')
            .populate('documents');

        if (!issue) {
            throw new ApiError(404, "Legal issue not found or access denied.");
        }

        return res.status(200).json(new ApiResponse(200, issue, "Issue retrieved successfully."));
    } catch(error) {
        return next(error);
    }
});


// === DELETE: Soft delete an issue ===
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = { _id: id, isDeleted: false };
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }

        const issue = await LegalIssue.findOneAndUpdate(query, { isDeleted: true, deletedAt: new Date() }, { new: true });

        if(!issue) {
            throw new ApiError(404, "Issue not found or access denied.");
        }

        return res.status(200).json(new ApiResponse(200, { id: issue._id }, "Issue deleted successfully."));
    } catch(error) {
        return next(error);
    }
});

export default router;