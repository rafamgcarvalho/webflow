import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { signToken } from '../utils/jwt.js';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

const DUMMY_HASH = '$2a$12$IkmIeSpiu8peskkmjIUKNeau5.A7Ac1K.aK5.8F2bCpRUrQhlgBk2';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function publicUser(u: { id: string; email: string; name: string }) {
  return { id: u.id, email: u.email, name: u.name };
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    return;
  }
  const { name, email, password } = parsed.data;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409).json({ error: 'E-mail já cadastrado.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken({ sub: user.id, email: user.email });
  res.status(201).json({
    token,
    user: publicUser({ id: user.id, email: user.email, name: user.name }),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email });
  res.json({
    token,
    user: publicUser({ id: user.id, email: user.email, name: user.name }),
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const user = await User.findById(req.user.sub);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  res.json({ user: publicUser({ id: user.id, email: user.email, name: user.name }) });
}
