import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

const router = Router();

router.post('/register', credentialsLimiter, register);
router.post('/login', credentialsLimiter, login);
router.get('/me', requireAuth, me);

export default router;
