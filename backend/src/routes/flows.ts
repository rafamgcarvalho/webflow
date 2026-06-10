import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createFlow,
  deleteFlow,
  getFlow,
  listFlows,
  updateFlow,
} from '../controllers/flowController.js';
import { requireAuth } from '../middleware/auth.js';

const flowsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde um instante e tente novamente.' },
});

const router = Router();

router.use(requireAuth);
router.use(flowsLimiter);
router.get('/', listFlows);
router.post('/', createFlow);
router.get('/:id', getFlow);
router.put('/:id', updateFlow);
router.delete('/:id', deleteFlow);

export default router;
