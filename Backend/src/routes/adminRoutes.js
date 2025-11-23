import { Router } from 'express';
import Admin from '../models/Admin.js';
import User from '../models/User.js'; // Import other models for stats
import LegalIssue from '../models/LegalIssue.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();
router.get('/stats', async (req, res, next) => {
    try {
        // 1. Get simple counts
        const totalUsers = await User.countDocuments({ isDeleted: false });
        const totalIssues = await LegalIssue.countDocuments({ isDeleted: false });

        // 2. Aggregation for issues created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const issuesLast30Days = await LegalIssue.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { 
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Aggregation for issue type distribution
        const issueTypeDistribution = await LegalIssue.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$issueType", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            keyMetrics: { totalUsers, totalIssues },
            issuesLast30Days,
            issueTypeDistribution
        });

    } catch (err) {
        next(err);
    }
});


// Get all active admins (protected by default middleware)
router.get('/', async (req, res, next) => {
  try {
    const admins = await Admin.find({ isDeleted: false }).populate('user', 'fullName email role');
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

// Get admin dashboard data (merged from employee dashboard)
router.get('/dashboard', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Find admin record for current user
    const admin = await Admin.findOne({ user: req.user._id, isDeleted: false });
    
    // If no admin profile exists, still allow access to view cases
    const adminData = admin ? {
      name: req.user.fullName,
      department: admin.department,
      designation: admin.designation,
      adminRole: admin.adminRole
    } : {
      name: req.user.fullName,
      department: 'Not Set',
      designation: 'Not Set',
      adminRole: 'Not Set'
    };

    // Get all cases (admins can view all for processing)
    const allCases = await LegalIssue.find({ isDeleted: false })
      .populate('userId', 'fullName email')
      .populate('assignedParalegal', 'specialization')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate statistics
    const totalCases = allCases.length;
    const pendingCases = allCases.filter(c => c.status === 'pending').length;
    const inProgressCases = allCases.filter(c => c.status === 'in-progress').length;
    const resolvedCases = allCases.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    
    // Get unassigned cases
    const unassignedCases = allCases.filter(c => !c.assignedParalegal && c.status === 'pending');

    // Recent activity across all cases
    const recentActivity = [];
    allCases.forEach(issue => {
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
    const latestActivity = recentActivity.slice(0, 15);

    res.json({
      admin: adminData,
      message: !admin ? 'Admin profile not found. Contact administrator to create your profile.' : undefined,
      statistics: {
        totalCases,
        pendingCases,
        inProgressCases,
        resolvedCases,
        unassignedCases: unassignedCases.length
      },
      unassignedCases,
      recentCases: allCases.slice(0, 20),
      recentActivity: latestActivity
    });
  } catch (err) {
    next(err);
  }
});

// Soft delete an admin by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const admin = await softDeleteById(Admin, req.params.id);
    res.json({ message: 'Admin soft-deleted successfully', admin });
  } catch (err) {
    next(err);
  }
});

export default router;