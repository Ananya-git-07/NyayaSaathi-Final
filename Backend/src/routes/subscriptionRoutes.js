import { Router } from 'express';
import Subscription from '../models/Subscription.js';
import { softDeleteById } from '../utils/helpers.js';

const router = Router();

// Create a new subscription
router.post('/', async (req, res, next) => {
  try {
    const subscription = await Subscription.create({ ...req.body, isDeleted: false });
    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
});

// Get all active subscriptions
router.get('/', async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ isDeleted: false }).populate('organizationRef');
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

// Soft delete a subscription
router.delete('/:id', async (req, res, next) => {
  try {
    const subscription = await softDeleteById(Subscription, req.params.id);
    res.json({ message: 'Subscription soft-deleted successfully', subscription });
  } catch (err) {
    next(err);
  }
});

export default router;