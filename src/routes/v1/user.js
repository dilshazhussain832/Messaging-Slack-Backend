import express from 'express';

import { signIn, signUp } from '../../controllers/userController.js';
import { userSignInSchema, userSignUpSchema } from '../../validators/userSchema.js';
import { validate } from '../../validators/zodValidators.js';

const router = express.Router();

router.post('/signup', validate(userSignUpSchema), signUp);
router.post('/signin', validate(userSignInSchema), signIn);


export default router;