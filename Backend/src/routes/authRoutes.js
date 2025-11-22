// Backend/src/routes/authRoutes.js

import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    getCurrentUser,
    registerCitizenByKiosk // <--- IMPORT THIS
} from '../controllers/auth.controllers.js';
import verifyJWT from '../middleware/authMiddleware.js';
import { verifyRole } from '../middleware/roleMiddleware.js'; // <--- IMPORT THIS

const router = Router();

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// --- PROTECTED ROUTES ---
router.post('/logout', verifyJWT, logoutUser);
router.get('/current-user', verifyJWT, getCurrentUser);

// --- KIOSK ONLY ROUTE ---
router.post('/kiosk-register-citizen', verifyJWT, verifyRole('employee', 'admin'), registerCitizenByKiosk);

export default router;