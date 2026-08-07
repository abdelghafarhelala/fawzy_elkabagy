import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  dispatchPublishWorkflow,
  requireAdmin,
  setCors,
  statusFromError,
} from './_lib';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const admin = await requireAdmin(req);
    await dispatchPublishWorkflow();
    res.status(202).json({
      ok: true,
      message: 'Publish started. Live site updates in about 3–5 minutes.',
      triggeredBy: admin.email ?? admin.userId,
    });
  } catch (error) {
    const status = statusFromError(error);
    const message =
      error instanceof Error ? error.message : 'Publish failed';
    res.status(status).json({ ok: false, error: message });
  }
}
