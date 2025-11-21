import { Router } from 'express';
import { 
    getMessagesForIssue, 
    sendMessage 
} from '../controllers/message.controller.js';
import verifyJWT from '../middleware/authMiddleware.js';

const router = Router();

// --- SECURITY: Apply Auth Middleware ---
// Chat access requires authentication
router.use(verifyJWT);

// GET /api/messages/:issueId - Get conversation history for a specific legal issue
router.get('/:issueId', getMessagesForIssue);

// POST /api/messages/:issueId - Send a new message for a specific legal issue
router.post('/:issueId', sendMessage);

export default router;