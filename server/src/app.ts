import express from 'express';
import { adRouter } from './routes/adRoutes';

export const app = express();

app.use(express.json());
app.use('/api/ads', adRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
