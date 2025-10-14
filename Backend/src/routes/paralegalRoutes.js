import { Router } from 'express';
import Paralegal from '../models/Paralegal.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();

// Get all active paralegals
router.get('/', async (req, res, next) => {
  try {
    const paralegals = await Paralegal.find({ isDeleted: false }).populate('user', 'fullName email role');
    res.json(paralegals);
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