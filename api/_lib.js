const GITHUB_API = 'https://api.github.com';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${requiredEnv('GITHUB_TOKEN')}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'fawzy-elkabagy-publish',
  };
}

function repoParts() {
  const full = process.env.GITHUB_REPO || 'abdelghafarhelala/fawzy_elkabagy';
  const [owner, repo] = full.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid GITHUB_REPO (expected owner/name)');
  }
  return { owner, repo };
}

function workflowFile() {
  return process.env.GITHUB_WORKFLOW_FILE || 'publish-data.yml';
}

function workflowRef() {
  return process.env.GITHUB_REF || 'master';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) {
    const error = new Error('Missing Authorization bearer token');
    error.status = 401;
    throw error;
  }

  const supabaseUrl = requiredEnv('SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = match[1];

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: serviceKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(
      response.status === 401 || response.status === 403
        ? 'Invalid or expired session'
        : `Supabase auth check failed (${response.status}): ${body.slice(0, 200)}`,
    );
    err.status =
      response.status === 401 || response.status === 403 ? 401 : 500;
    throw err;
  }

  const user = await response.json();
  if (!user?.id) {
    const err = new Error('Invalid or expired session');
    err.status = 401;
    throw err;
  }

  return { userId: user.id, email: user.email };
}

async function dispatchPublishWorkflow() {
  const { owner, repo } = repoParts();
  const workflow = workflowFile();
  const ref = workflowRef();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        ...githubHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref }),
    },
  );

  if (response.status !== 204) {
    const body = await response.text();
    throw new Error(
      `GitHub workflow_dispatch failed (${response.status}): ${body}`,
    );
  }
}

async function latestPublishRun() {
  const { owner, repo } = repoParts();
  const workflow = workflowFile();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?per_page=1`,
    { headers: githubHeaders() },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub list runs failed (${response.status}): ${body}`,
    );
  }

  const json = await response.json();
  const run = json.workflow_runs?.[0];
  if (!run) {
    return {
      id: null,
      status: null,
      conclusion: null,
      html_url: null,
      created_at: null,
      updated_at: null,
    };
  }

  return {
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    html_url: run.html_url,
    created_at: run.created_at,
    updated_at: run.updated_at,
  };
}

function envDiagnostics() {
  return {
    supabaseUrl: !!process.env.SUPABASE_URL?.trim(),
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    githubToken: !!process.env.GITHUB_TOKEN?.trim(),
    githubRepo:
      process.env.GITHUB_REPO?.trim() || 'abdelghafarhelala/fawzy_elkabagy',
    workflowFile: workflowFile(),
    workflowRef: workflowRef(),
  };
}

function statusFromError(error) {
  if (error && typeof error.status === 'number') {
    return error.status;
  }
  return 500;
}

module.exports = {
  setCors,
  requireAdmin,
  dispatchPublishWorkflow,
  latestPublishRun,
  envDiagnostics,
  statusFromError,
};
