import { Router } from 'express';
import { getMessagesForIssue, sendMessage } from '../controllers/message.controller.js';

const router = Router();

// Get all messages for a specific issue
router.get('/issue/:issueId', getMessagesForIssue);

// Send a new message for an issue
router.post('/issue/:issueId', sendMessage);

export default router;
