import { Router } from 'express';
import Admin from '../models/Admin.js';
import User from '../models/User.js'; // Import other models for stats
import LegalIssue from '../models/LegalIssue.js';
import Kiosk from '../models/Kiosk.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();
router.get('/stats', async (req, res, next) => {
    try {
        // 1. Get simple counts
        const totalUsers = await User.countDocuments({ isDeleted: false });
        const totalIssues = await LegalIssue.countDocuments({ isDeleted: false });
        const totalKiosks = await Kiosk.countDocuments({ isDeleted: false });

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
            keyMetrics: { totalUsers, totalIssues, totalKiosks },
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