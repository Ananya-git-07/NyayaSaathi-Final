import { Router } from 'express';
import Employee from '../models/Employee.js';
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