import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  latestPublishRun,
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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdmin(req);
    const run = await latestPublishRun();
    res.status(200).json({ ok: true, run });
  } catch (error) {
    const status = statusFromError(error);
    const message =
      error instanceof Error ? error.message : 'Status check failed';
    res.status(status).json({ ok: false, error: message });
  }
}
