import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRouter from './routes/auth.js';
import flowsRouter from './routes/flows.js';

export function createServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/flows', flowsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  };
  app.use(errorHandler);

  return app;
}
