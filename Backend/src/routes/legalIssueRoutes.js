// PASTE THIS ENTIRE FILE INTO Backend/src/routes/legalIssueRoutes.js

import { Router } from 'express';
import LegalIssue from '../models/LegalIssue.js';
import Paralegal from '../models/Paralegal.js'; // Import Paralegal
import Notification from '../models/Notification.js'; // Import Notification
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import verifyJWT from '../middleware/authMiddleware.js';
import { verifyRole } from '../middleware/roleMiddleware.js'; // Import Role Check
import Employee from '../models/Employee.js';

const router = Router();

// --- SECURITY: Apply Auth Middleware ---
router.use(verifyJWT);

// === CREATE: Create a new legal issue ===
router.post('/', async (req, res, next) => {
  try {
    const { issueType, description, kioskId, priority } = req.body; // Added priority
    if (!issueType || !description) {
      throw new ApiError(400, "Issue Type and Description are required.");
    }

    // Smart default for details based on simple description
    const formDetails = new Map();
    formDetails.set("initial_summary", description);

    const newIssue = await LegalIssue.create({
      userId: req.user._id,
      issueType,
      description,
      // If it's a kiosk employee creating it, link the kiosk
      kiosk: kioskId || (req.user.role === 'employee' ? req.user._id : undefined), 
      status: 'Pending',
      formDetails,
      history: [{
        event: 'Issue Created',
        details: `Issue reported by ${req.user.role}.`,
        actor: req.user.fullName
      }]
    });

    return res.status(201).json(
      new ApiResponse(201, newIssue, "Legal issue created successfully.")
    );
  } catch (error) {
    return next(error);
  }
});

// === READ: Get all issues ===
router.get('/', async (req, res, next) => {
  try {
    const query = { isDeleted: false };
    
    if (req.user.role === 'citizen') {
      // Citizens see only their own
      query.userId = req.user._id;
    } 
    else if (req.user.role === 'paralegal') {
        // Paralegals see assigned cases
        const paralegalProfile = await Paralegal.findOne({ user: req.user._id });
        if (paralegalProfile) {
            query.assignedParalegal = paralegalProfile._id;
        } else {
            return res.status(200).json(new ApiResponse(200, [], "No paralegal profile found."));
        }
    }
    else if (req.user.role === 'employee') {
        // Kiosk Employees see ALL issues linked to their Kiosk
        const employeeProfile = await Employee.findOne({ user: req.user._id });
        if (employeeProfile && employeeProfile.kioskId) {
            query.kiosk = employeeProfile.kioskId;
        } else {
            return res.status(200).json(new ApiResponse(200, [], "No kiosk assigned to this employee."));
        }
    }
    // Admins see everything (query remains empty)

    const issues = await LegalIssue.find(query)
      .populate('userId', 'fullName email aadhaarNumber') // Added Aadhaar for Kiosk verification
      .populate('kiosk', 'location operatorName')
      .populate({
          path: 'assignedParalegal',
          populate: { path: 'user', select: 'fullName email' }
      })
      .sort({ createdAt: -1 });
      
    return res.status(200).json(new ApiResponse(200, issues, "Issues retrieved successfully."));
  } catch (error) {
    return next(error);
  }
});

// === READ: Get single issue ===
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const issue = await LegalIssue.findOne({ _id: id, isDeleted: false })
            .populate('userId', 'fullName email phoneNumber')
            .populate('kiosk')
            .populate({
                path: 'assignedParalegal',
                populate: { path: 'user', select: 'fullName phoneNumber' } // Nested populate
            })
            .populate('documents');

        if (!issue) throw new ApiError(404, "Issue not found.");

        // Access Control
        if (req.user.role === 'citizen' && issue.userId._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied.");
        }

        return res.status(200).json(new ApiResponse(200, issue, "Issue retrieved successfully."));
    } catch(error) {
        return next(error);
    }
});

// === NEW ROUTE: Assign Paralegal (Admin/Employee Only) ===
router.patch('/:id/assign', verifyRole('admin', 'employee'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paralegalId } = req.body;

        if (!paralegalId) throw new ApiError(400, "Paralegal ID is required.");

        const paralegal = await Paralegal.findById(paralegalId).populate('user');
        if (!paralegal) throw new ApiError(404, "Paralegal not found.");

        const issue = await LegalIssue.findByIdAndUpdate(
            id,
            {
                assignedParalegal: paralegalId,
                status: 'Escalated', // Auto-escalate on assignment
                $push: {
                    history: {
                        event: 'Assigned to Paralegal',
                        details: `Assigned to ${paralegal.user.fullName}`,
                        actor: req.user.fullName
                    }
                }
            },
            { new: true }
        ).populate('assignedParalegal');

        if (!issue) throw new ApiError(404, "Issue not found.");

        // --- NOTIFICATION: Notify the Paralegal ---
        await Notification.create({
            recipient: paralegal.user._id,
            sender: req.user._id,
            type: 'PARALEGAL_ASSIGNED',
            message: `New Case Assigned: ${issue.issueType} - ${issue.description.substring(0, 30)}...`,
            link: `/issues/${issue._id}`
        });

        return res.status(200).json(new ApiResponse(200, issue, "Paralegal assigned successfully."));

    } catch (error) {
        return next(error);
    }
});

// === DELETE: Soft delete ===
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = { _id: id };
        
        // Only Admins can delete any issue. Users can only delete their own.
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }

        const issue = await LegalIssue.findOneAndUpdate(query, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if(!issue) throw new ApiError(404, "Issue not found or access denied.");

        return res.status(200).json(new ApiResponse(200, { id: issue._id }, "Issue deleted successfully."));
    } catch(error) {
        return next(error);
    }
});

export default router;