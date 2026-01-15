import express from 'express';
import apiRouter from './routes';

const app = express();

//ESSENTIALLY SERVER CONFIGURATION SETUP

app.use(express.json());
app.use('/api', apiRouter);

export default app;