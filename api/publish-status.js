const {
  latestPublishRun,
  requireAdmin,
  setCors,
  statusFromError,
} = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
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
    console.error('[api/publish-status]', message);
    res.status(status).json({ ok: false, error: message });
  }
};
