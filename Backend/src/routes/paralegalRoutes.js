import { Router } from 'express';
import Paralegal from '../models/Paralegal.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();

// Get all active paralegals
// ... imports

// Get all active paralegals (with filtering)
router.get('/', async (req, res, next) => {
  try {
    const { expertise, search } = req.query;
    
    let query = { isDeleted: false, active: true };

    if (expertise && expertise !== 'All') {
        query.areasOfExpertise = expertise;
    }

    // Note: 'search' requires looking into the populated 'user' field, 
    // which is complex in a simple find(). We'll handle name search on frontend for now 
    // to keep this query fast, or just filter by expertise here.

    const paralegals = await Paralegal.find(query).populate('user', 'fullName email role profilePictureUrl');
    res.json(paralegals);
  } catch (err) {
    next(err);
  }
});

// ... rest of routes

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