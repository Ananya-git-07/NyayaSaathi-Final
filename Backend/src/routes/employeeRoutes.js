import { Router } from 'express';
import Employee from '../models/Employee.js';
import LegalIssue from '../models/LegalIssue.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();

// Get all active employees
router.get('/', async (req, res, next) => {
  try {
    const employees = await Employee.find({ isDeleted: false }).populate('user', 'fullName email role');
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// Get employee dashboard data
router.get('/dashboard', async (req, res, next) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied. Employee role required.' });
    }

    // Find employee record for current user
    const employee = await Employee.findOne({ user: req.user._id, isDeleted: false });
    
    // If no employee profile exists, still allow access to view cases
    const employeeData = employee ? {
      name: req.user.fullName,
      department: employee.department,
      position: employee.position
    } : {
      name: req.user.fullName,
      department: 'Not Set',
      position: 'Not Set'
    };

    // Get all cases (employees can view all for processing)
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
      employee: employeeData,
      message: !employee ? 'Employee profile not found. Contact administrator to create your profile.' : undefined,
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

// Soft delete an employee by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const employee = await softDeleteById(Employee, req.params.id);
    res.json({ message: 'Employee soft-deleted successfully', employee });
  } catch (err) {
    next(err);
  }
});

export default router;