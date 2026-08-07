const {
  dispatchPublishWorkflow,
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

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
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
    console.error('[api/publish]', message);
    res.status(status).json({ ok: false, error: message });
  }
};
