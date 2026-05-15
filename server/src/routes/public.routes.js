import { Router } from 'express';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validate } from '../middleware/validate.js';
import { submitResponseSchema } from '../validators/poll.schemas.js';
import * as ctrl from '../controllers/public.controller.js';

const router = Router();

router.get('/:slug', ctrl.getPublicPoll);
router.post('/:slug/responses', optionalAuth, validate(submitResponseSchema), ctrl.submitResponse);

export default router;
