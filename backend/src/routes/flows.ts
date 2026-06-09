import { Router } from 'express';
import {
  createFlow,
  deleteFlow,
  getFlow,
  listFlows,
  updateFlow,
} from '../controllers/flowController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listFlows);
router.post('/', createFlow);
router.get('/:id', getFlow);
router.put('/:id', updateFlow);
router.delete('/:id', deleteFlow);

export default router;
