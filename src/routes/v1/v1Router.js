import express from 'express';

import channelRouter from './channel.js';
import userRouter from './user.js';
import workspaceRouter from './workspaces.js';
import memberRouter from './member.js';

const router = express.Router();

router.use('/users', userRouter);

router.use('/workspaces', workspaceRouter);

router.use('/channels', channelRouter);

router.use('/members', memberRouter);

export default router;