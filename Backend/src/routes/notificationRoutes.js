import { Router } from 'express';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead 
} from '../controllers/notification.controller.js';
import verifyJWT from '../middleware/authMiddleware.js';

const router = Router();

// --- SECURITY: Apply Auth Middleware ---
// Notifications are private to the user, so we must enforce login
router.use(verifyJWT);

// GET /api/notifications - Fetch all notifications for the logged-in user
router.get('/', getNotifications);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:notificationId/read - Mark a specific notification as read
router.patch('/:notificationId/read', markAsRead);

export default router;