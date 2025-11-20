import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';

const router = Router();

router.get('/', getNotifications);
router.patch('/:notificationId/mark-read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);

export default router;
