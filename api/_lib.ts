import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API = 'https://api.github.com';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function githubHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${requiredEnv('GITHUB_TOKEN')}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'fawzy-elkabagy-publish',
  };
}

function repoParts(): { owner: string; repo: string } {
  const full = process.env['GITHUB_REPO'] || 'abdelghafarhelala/fawzy_elkabagy';
  const [owner, repo] = full.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid GITHUB_REPO (expected owner/name)');
  }
  return { owner, repo };
}

function workflowFile(): string {
  return process.env['GITHUB_WORKFLOW_FILE'] || 'publish-data.yml';
}

function workflowRef(): string {
  return process.env['GITHUB_REF'] || 'master';
}

export function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export async function requireAdmin(
  req: VercelRequest,
): Promise<{ userId: string; email: string | undefined }> {
  const auth = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) {
    const error = new Error('Missing Authorization bearer token');
    (error as Error & { status: number }).status = 401;
    throw error;
  }

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user) {
    const err = new Error('Invalid or expired session');
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  return { userId: data.user.id, email: data.user.email };
}

export async function dispatchPublishWorkflow(): Promise<void> {
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

export async function latestPublishRun(): Promise<{
  id: number | null;
  status: string | null;
  conclusion: string | null;
  html_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}> {
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

  const json = (await response.json()) as {
    workflow_runs?: Array<{
      id: number;
      status: string;
      conclusion: string | null;
      html_url: string;
      created_at: string;
      updated_at: string;
    }>;
  };

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

export function statusFromError(error: unknown): number {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }
  return 500;
}
