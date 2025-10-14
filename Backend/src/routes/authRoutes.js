import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    getCurrentUser
} from '../controllers/auth.controllers.js'; // <-- CORRECT FILENAME HERE
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// --- PUBLIC ROUTES (No token needed) ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// --- PROTECTED ROUTES (Requires a valid JWT) ---
router.post('/logout', authMiddleware, logoutUser);
router.get('/current-user', authMiddleware, getCurrentUser);

export default router;  