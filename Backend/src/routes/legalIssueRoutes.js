import { Router } from 'express';
import LegalIssue from '../models/LegalIssue.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// === CREATE: Create a new legal issue ===
router.post('/', async (req, res, next) => {
  try {
    const { issueType, description } = req.body;
    if (!issueType || !description) {
      throw new ApiError(400, "Issue Type and Description are required.");
    }

    const newIssue = await LegalIssue.create({
      userId: req.user._id,
      issueType,
      description,
      status: 'pending',
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
      .populate({
        path: 'assignedParalegal',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
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
        
        // --- NEW: Populate all necessary fields for the detail page ---
        const issue = await LegalIssue.findOne(query)
            .populate('userId', 'fullName email phoneNumber')
            .populate({
                path: 'assignedParalegal',
                populate: {
                    path: 'user',
                    select: 'fullName email'
                }
            })
            .populate('documents');

        if (!issue) {
            throw new ApiError(404, "Legal issue not found or access denied.");
        }

        // Check access permissions
        if (req.user.role === 'admin') {
            // Admin can access all issues
            return res.status(200).json(new ApiResponse(200, issue, "Issue retrieved successfully."));
        } else if (req.user.role === 'paralegal') {
            // Paralegals can only access issues assigned to them
            const Paralegal = (await import('../models/Paralegal.js')).default;
            const paralegal = await Paralegal.findOne({ user: req.user._id, isDeleted: false });
            
            if (paralegal && issue.assignedParalegal && issue.assignedParalegal._id.toString() === paralegal._id.toString()) {
                return res.status(200).json(new ApiResponse(200, issue, "Issue retrieved successfully."));
            }
            throw new ApiError(403, "Legal issue not found or access denied.");
        } else {
            // Citizens can only access their own issues
            if (issue.userId._id.toString() === req.user._id.toString()) {
                return res.status(200).json(new ApiResponse(200, issue, "Issue retrieved successfully."));
            }
            throw new ApiError(403, "Legal issue not found or access denied.");
        }
    } catch(error) {
        return next(error);
    }
});


// === PUT: Update issue details (title, description) ===
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description, issueType } = req.body;

        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false });
        if (!issue) {
            throw new ApiError(404, "Issue not found.");
        }

        // Check permissions - only admin or issue creator can edit
        if (req.user.role !== 'admin' && issue.userId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Only the issue creator or admin can edit this issue.");
        }

        // Update fields if provided
        if (description !== undefined) issue.description = description;
        if (issueType) issue.issueType = issueType;

        // Add to history
        issue.history.push({
            event: 'Issue Updated',
            details: `Issue details were updated by ${req.user.fullName}`,
            actor: `${req.user.fullName} (${req.user.role})`
        });

        await issue.save();

        const updatedIssue = await LegalIssue.findById(id)
            .populate('userId', 'fullName email')
            .populate({
                path: 'assignedParalegal',
                populate: {
                    path: 'user',
                    select: 'fullName email'
                }
            });

        return res.status(200).json(new ApiResponse(200, updatedIssue, "Issue updated successfully."));
    } catch(error) {
        return next(error);
    }
});

// === PUT: Update issue status and add to history ===
router.put('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
        if (!status || !validStatuses.includes(status)) {
            throw new ApiError(400, "Invalid status. Must be one of: pending, in-progress, resolved, closed");
        }

        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false })
            .populate('assignedParalegal', 'user');
        if (!issue) {
            throw new ApiError(404, "Issue not found.");
        }

        // Check permissions
        if (req.user.role !== 'admin' && req.user.role !== 'paralegal') {
            throw new ApiError(403, "Only admin or paralegal can update status.");
        }

        const oldStatus = issue.status;
        issue.status = status;

        // Add status change to history
        issue.history.push({
            event: 'Status Changed',
            details: `Status changed from ${oldStatus} to ${status}${note ? ': ' + note : ''}`,
            actor: `${req.user.fullName} (${req.user.role})`
        });

        await issue.save();

        // Create notifications for citizen and paralegal
        const notificationPromises = [];
        
        // Notify the citizen who created the issue (userId is ObjectId at this point)
        if (issue.userId) {
            const citizenId = issue.userId._id || issue.userId; // Handle both populated and non-populated
            notificationPromises.push(
                Notification.create({
                    recipient: citizenId,
                    message: `Your issue "${issue.issueType}" status has been updated to "${status}" by ${req.user.fullName}`,
                    link: `/issues/${issue._id}`,
                    type: 'status_change'
                })
            );
        }
        
        // Notify the assigned paralegal (if any and if paralegal didn't make the change)
        if (issue.assignedParalegal && req.user.role !== 'paralegal') {
            const paralegalUserId = issue.assignedParalegal.user || issue.assignedParalegal; // Get the user ID from paralegal
            notificationPromises.push(
                Notification.create({
                    recipient: paralegalUserId,
                    message: `Issue "${issue.issueType}" status has been updated to "${status}" by ${req.user.fullName}`,
                    link: `/issues/${issue._id}`,
                    type: 'status_change'
                })
            );
        }
        
        await Promise.all(notificationPromises);

        // Populate before returning
        const updatedIssue = await LegalIssue.findById(id)
            .populate('userId', 'fullName email')
            .populate({
                path: 'assignedParalegal',
                populate: {
                    path: 'user',
                    select: 'fullName email'
                }
            });

        return res.status(200).json(new ApiResponse(200, updatedIssue, "Issue status updated successfully."));
    } catch(error) {
        return next(error);
    }
});

// === PUT: Add note to issue history ===
router.put('/:id/note', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note || note.trim().length === 0) {
            throw new ApiError(400, "Note cannot be empty");
        }

        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false });
        if (!issue) {
            throw new ApiError(404, "Issue not found.");
        }

        // Check permissions
        if (req.user.role !== 'admin' && req.user.role !== 'paralegal') {
            throw new ApiError(403, "Only admin or paralegal can add notes.");
        }

        issue.history.push({
            event: 'Note Added',
            details: note,
            actor: `${req.user.fullName} (${req.user.role})`
        });

        await issue.save();

        return res.status(200).json(new ApiResponse(200, issue, "Note added successfully."));
    } catch(error) {
        return next(error);
    }
});

// === PUT: Assign paralegal to issue ===
router.put('/:id/assign', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paralegalId } = req.body;

        if (!paralegalId) {
            throw new ApiError(400, "Paralegal ID is required");
        }

        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false });
        if (!issue) {
            throw new ApiError(404, "Issue not found.");
        }

        // Check permissions - only admin can assign paralegals
        if (req.user.role !== 'admin') {
            throw new ApiError(403, "Only admin can assign paralegals.");
        }

        // Verify paralegal exists
        const Paralegal = (await import('../models/Paralegal.js')).default;
        const paralegal = await Paralegal.findOne({ _id: paralegalId, isDeleted: false }).populate('user');
        if (!paralegal) {
            throw new ApiError(404, "Paralegal not found.");
        }

        // Update assignment
        const previousParalegal = issue.assignedParalegal;
        issue.assignedParalegal = paralegalId;

        // Add to history
        issue.history.push({
            event: 'Assigned to Paralegal',
            details: `Assigned to ${paralegal.user.fullName} (${paralegal.areasOfExpertise.join(', ')})`,
            actor: `${req.user.fullName} (${req.user.role})`
        });

        await issue.save();

        // Populate the response
        const updatedIssue = await LegalIssue.findById(id)
            .populate('userId', 'fullName email')
            .populate({
                path: 'assignedParalegal',
                populate: {
                    path: 'user',
                    select: 'fullName email'
                }
            });

        return res.status(200).json(new ApiResponse(200, updatedIssue, "Paralegal assigned successfully."));
    } catch(error) {
        return next(error);
    }
});

// === DELETE: Soft delete an issue ===
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false });
        if (!issue) {
            throw new ApiError(404, "Issue not found.");
        }

        // Check permissions - admin or issue creator can delete
        if (req.user.role !== 'admin' && issue.userId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Only the issue creator or admin can delete this issue.");
        }

        issue.isDeleted = true;
        issue.deletedAt = new Date();
        await issue.save();

        return res.status(200).json(new ApiResponse(200, { id: issue._id }, "Issue deleted successfully."));
    } catch(error) {
        return next(error);
    }
});

export default router;