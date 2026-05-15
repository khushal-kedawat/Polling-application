import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createPollSchema, updatePollSchema } from '../validators/poll.schemas.js';
import * as ctrl from '../controllers/polls.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listMyPolls);
router.post('/', validate(createPollSchema), ctrl.createPoll);
router.get('/:id', ctrl.getMyPoll);
router.patch('/:id', validate(updatePollSchema), ctrl.updatePoll);
router.delete('/:id', ctrl.deletePoll);
router.post('/:id/publish', ctrl.publishPoll);
router.get('/:id/analytics', ctrl.getAnalytics);

export default router;
