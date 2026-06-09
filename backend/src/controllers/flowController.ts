import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Flow } from '../models/Flow.js';

const statementSchema: z.ZodType<unknown> = z.lazy(() => z.object({
  id: z.string(),
  kind: z.enum(['declare', 'assign', 'input', 'output', 'if', 'while']),
}).passthrough());

const flowPayloadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  statements: z.array(statementSchema).max(5000),
});

function publicFlow(f: {
  id: string;
  name: string;
  statements: unknown[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: f.id,
    name: f.name,
    statements: f.statements,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function listFlows(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const flows = await Flow.find({ ownerId: req.user.sub })
    .sort({ updatedAt: -1 })
    .select('-statements')
    .lean();

  res.json({
    flows: flows.map((f) => ({
      id: String(f._id),
      name: f.name,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  });
}

export async function getFlow(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const flow = await Flow.findOne({ _id: id, ownerId: req.user.sub });
  if (!flow) {
    res.status(404).json({ error: 'Fluxo não encontrado.' });
    return;
  }
  res.json({ flow: publicFlow({
    id: flow.id,
    name: flow.name,
    statements: flow.statements,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
  })});
}

export async function createFlow(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const parsed = flowPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    return;
  }
  const flow = await Flow.create({
    ownerId: req.user.sub,
    name: parsed.data.name,
    statements: parsed.data.statements,
  });
  res.status(201).json({ flow: publicFlow({
    id: flow.id,
    name: flow.name,
    statements: flow.statements,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
  })});
}

export async function updateFlow(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const parsed = flowPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
  }
  const flow = await Flow.findOneAndUpdate(
    { _id: id, ownerId: req.user.sub },
    { $set: { name: parsed.data.name, statements: parsed.data.statements } },
    { new: true },
  );
  if (!flow) {
    res.status(404).json({ error: 'Fluxo não encontrado.' });
    return;
  }
  res.json({ flow: publicFlow({
    id: flow.id,
    name: flow.name,
    statements: flow.statements,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
  })});
}

export async function deleteFlow(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const result = await Flow.deleteOne({ _id: id, ownerId: req.user.sub });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: 'Fluxo não encontrado.' });
    return;
  }
  res.status(204).end();
}
