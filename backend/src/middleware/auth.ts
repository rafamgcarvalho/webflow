import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type AuthPayload } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
