import { Router } from 'express';
import Paralegal from '../models/Paralegal.js';
import LegalIssue from '../models/LegalIssue.js';
import { softDeleteById } from '../utils/helpers.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Get all active paralegals
router.get('/', async (req, res, next) => {
  try {
    const paralegals = await Paralegal.find({ isDeleted: false })
      .populate('user', 'fullName email role')
      .sort({ rating: -1, createdAt: -1 }); // Sort by rating, then newest first
    
    return res.json(new ApiResponse(200, paralegals, 'Paralegals fetched successfully'));
  } catch (err) {
    next(err);
  }
});

// Get paralegal dashboard data
router.get('/dashboard', async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, null, 'Authentication required'));
    }

    // Check if user has paralegal role
    if (req.user.role !== 'paralegal') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied. Paralegal role required.'));
    }

    // Find paralegal record for current user
    const paralegal = await Paralegal.findOne({ user: req.user._id, isDeleted: false });
    
    // If no paralegal profile exists, return empty dashboard with message
    if (!paralegal) {
      return res.json(new ApiResponse(200, {
        paralegal: {
          name: req.user.fullName || 'User',
          areasOfExpertise: [],
          phoneNumber: req.user.phoneNumber || 'Not Set'
        },
        statistics: {
          totalCases: 0,
          pendingCases: 0,
          inProgressCases: 0,
          resolvedCases: 0
        },
        urgentCases: [],
        assignedCases: [],
        recentActivity: [],
        message: 'Paralegal profile not found. Please contact administrator to create your profile.'
      }, 'Dashboard data retrieved'));
    }

    // Get assigned cases
    const assignedCases = await LegalIssue.find({
      assignedParalegal: paralegal._id,
      isDeleted: false
    })
      .populate('userId', 'fullName email')
      .populate('assignedParalegal', 'specialization')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalCases = assignedCases.length;
    const pendingCases = assignedCases.filter(c => c.status === 'pending').length;
    const inProgressCases = assignedCases.filter(c => c.status === 'in-progress').length;
    const resolvedCases = assignedCases.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    
    // Get urgent cases (pending for more than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const urgentCases = assignedCases.filter(
      c => c.status === 'pending' && new Date(c.createdAt) < sevenDaysAgo
    );

    // Recent activity (last 10 history events across all assigned cases)
    const recentActivity = [];
    assignedCases.forEach(issue => {
      issue.history.forEach(h => {
        recentActivity.push({
          issueId: issue._id,
          issueTitle: issue.title,
          event: h.event,
          details: h.details,
          actor: h.actor,
          timestamp: h.timestamp
        });
      });
    });
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestActivity = recentActivity.slice(0, 10);

    res.json(new ApiResponse(200, {
      paralegal: {
        name: req.user.fullName || paralegal.user?.fullName || 'User',
        areasOfExpertise: paralegal.areasOfExpertise || [],
        phoneNumber: paralegal.phoneNumber,
        rating: paralegal.rating || 0
      },
      statistics: {
        totalCases,
        pendingCases,
        inProgressCases,
        resolvedCases
      },
      urgentCases,
      assignedCases: assignedCases.slice(0, 20), // Latest 20 cases
      recentActivity: latestActivity
    }, 'Dashboard data retrieved successfully'));
  } catch (err) {
    next(err);
  }
});

// Soft delete a paralegal by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const paralegal = await softDeleteById(Paralegal, req.params.id);
    res.json({ message: 'Paralegal soft-deleted successfully', paralegal });
  } catch (err) {
    next(err);
  }
});

export default router;