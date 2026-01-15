import { Router } from 'express';

import sqlRouter from './routes.sql';
import openaiRouter from './routes.openai';

const apiRouter = Router();

// Register individual routers with their base paths
// All routes defined in userRoutes.ts will be prefixed with /users
apiRouter.use('/sql', sqlRouter);
apiRouter.use('/openai', openaiRouter)

// Simple status check route to the root of the API
apiRouter.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

export default apiRouter;