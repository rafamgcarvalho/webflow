import type { Request, Response, NextFunction } from 'express';
import { signToken, verifyToken, type AuthPayload } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

const RENEW_THRESHOLD_SECONDS = 15 * 60;

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = verifyToken(token);
    req.user = { sub: decoded.sub, email: decoded.email };

    // Sliding session: renova o token quando restar pouco tempo de validade,
    // pra usuário ativo nunca cair no meio da sessão por expiração curta.
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < RENEW_THRESHOLD_SECONDS) {
      const renewed = signToken({ sub: decoded.sub, email: decoded.email });
      res.setHeader('X-Renewed-Token', renewed);
    }

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
