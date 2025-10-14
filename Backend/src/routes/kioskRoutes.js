import { Router } from 'express';
import Kiosk from '../models/Kiosk.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();

// Create a new Kiosk
router.post('/', async (req, res, next) => {
  try {
    const kiosk = await Kiosk.create({ ...req.body, isDeleted: false });
    res.status(201).json(kiosk);
  } catch (err) {
    next(err);
  }
});

// --- MODIFIED ROUTE ---
// Get all kiosks that are ACTIVE and NOT DELETED.
// This is more efficient and ensures the frontend gets exactly the data it needs.
router.get('/', async (req, res, next) => {
  try {
    const kiosks = await Kiosk.find({ isActive: true, isDeleted: false });
    // This log will confirm if the backend is being hit and finding data.
    console.log(`[SUCCESS] /api/kiosks endpoint hit, found ${kiosks.length} active kiosks.`);
    res.json(kiosks);
  } catch (err) {
    // This log will show any database-related errors.
    console.error('[ERROR] Failed to fetch kiosks from database:', err);
    next(err);
  }
});

// Update a kiosk by ID
router.put('/:id', async (req, res, next) => {
    try {
        const updatedKiosk = await Kiosk.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!updatedKiosk) {
            return res.status(404).json({ message: 'Kiosk not found' });
        }
        res.json({ message: 'Kiosk updated successfully', kiosk: updatedKiosk });
    } catch (err) {
        next(err);
    }
});

// Soft delete a kiosk
router.delete('/:id', async (req, res, next) => {
  try {
    const kiosk = await softDeleteById(Kiosk, req.params.id);
    res.json({ message: 'Kiosk soft-deleted successfully', kiosk });
  } catch (err) {
    next(err);
  }
});

export default router;