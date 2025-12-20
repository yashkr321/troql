import { Octokit } from 'octokit';

// --- INTERFACES ---
interface WorkflowResult {
  success: boolean;
  mode?: string;
  prUrl?: string;
  branch?: string;
  error?: string;
  reason?: string;
  severity?: string;
  rollback?: { file: string; sha: string };
}

// --- CONSTANTS ---
const SENSITIVE_DIRS = [
  "/config/", "/keys/", "/secrets/", "/auth/", "/deploy/", "/database/", "/terraform/"
];

// --- COMMENT TEMPLATES ---
const COMMENT_TEMPLATES = {
  CI_FAILURE: (url: string) => `### ⛔ Automated Edit Blocked: CI Failure
The Troql Agent attempted to update this PR, but detected failing CI checks on the current HEAD.

**Action Required:**
- Please fix the failing checks linked below.
- Once CI passes, re-trigger the edit.

[View Failing Checks](${url})`,

  REBASE_SUCCESS: (branch: string) => `### 🔄 Stale PR Rebased
The base branch had moved ahead, so Troql automatically rebased this PR onto the latest default branch.

- Temporary branch created
- Diff re-applied successfully
- Force-pushed to \`${branch}\`
- Ready for review`,

  REBASE_CONFLICT: () => `### ⚠️ Automated Rebase Failed
Troql attempted to rebase this PR but merge conflicts occurred.
Manual resolution required.`,

  RETRY_LIMIT: (count: number) => `### 🛑 Retry Limit Exceeded
Automated rebase attempts: ${count}/3 exceeded.
Manual intervention required.`
};

// --- HELPERS ---

function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    let normalized = url.trim().replace(/\/$/, "").replace(/\.git$/, "");

    if (!normalized.startsWith("http") && normalized.includes("/")) {
      const [owner, repo] = normalized.split("/");
      return { owner, repo };
    }

    const urlObj = new URL(
      normalized.startsWith("http") ? normalized : `https://${normalized}`
    );
    const [, owner, repo] = urlObj.pathname.split("/");

    if (!owner || !repo) throw new Error();
    return { owner, repo };
  } catch {
    throw new Error("Invalid repository URL. Expected owner/repo.");
  }
}

function validateSafety(targetFile: string, diff: string) {
  const path = targetFile.startsWith("/") ? targetFile : `/${targetFile}`;

  if (SENSITIVE_DIRS.some(dir => path.includes(dir))) {
    return { safe: false, reason: "File inside protected directory." };
  }

  const lines = diff.split("\n");
  let added = 0, deleted = 0, modifiedFiles = 0;

  const secretRegex = /(api_key|token|password|secret|client_secret)[=:]/i;

  for (const line of lines) {
    if (line.startsWith("+++ ")) modifiedFiles++;
    if (line.startsWith("+")) {
      added++;
      if (secretRegex.test(line)) return { safe: false, reason: "Secrets detected." };
    }
    if (line.startsWith("-")) deleted++;
  }

  if (modifiedFiles > 1) return { safe: false, reason: "Multi-file edits blocked." };
  if (added > 200) return { safe: false, reason: "Patch too large." };
  if (deleted > 50) return { safe: false, reason: "Patch removes too many lines." };

  return { safe: true };
}

function applyUnifiedPatch(original: string, diff: string): string {
  const source = original.split("\n");
  const patch = diff.split("\n");

  let srcIdx = 0;
  const result: string[] = [];

  let i = 0;
  while (i < patch.length && !patch[i].startsWith("@@")) i++;
  if (i >= patch.length) throw new Error("Invalid diff header");

  while (i < patch.length) {
    const header = patch[i++];
    const match = /@@ -(\d+).* \+(\d+)/.exec(header);
    const oldPos = parseInt(match?.[1] || "1") - 1;

    while (srcIdx < oldPos) result.push(source[srcIdx++]);

    while (i < patch.length && !patch[i].startsWith("@@")) {
      const mark = patch[i][0];
      const text = patch[i].slice(1);

      if (mark === " ") result.push(source[srcIdx++]);
      if (mark === "-") srcIdx++;
      if (mark === "+") result.push(text);

      i++;
    }
  }

  result.push(...source.slice(srcIdx));
  return result.join("\n");
}

// safer patch commit object spreading
function optionalSha(obj: any) {
  return obj?.sha ? { sha: obj.sha } : {};
}

// --- MAIN WORKFLOW EXECUTOR ---
export async function executePrWorkflow({
  repoUrl,
  targetFile,
  diff,
  summary,
  token
}: {
  repoUrl: string;
  targetFile: string;
  diff: string;
  summary?: string;
  token?: string;
}): Promise<WorkflowResult> {

  // 1 safety
  const safety = validateSafety(targetFile, diff);
  if (!safety.safe) {
    const err = new Error("unsafe_patch");
    // @ts-ignore
    err.status = 422;
    // @ts-ignore
    err.details = safety.reason;
    throw err;
  }

  const { owner, repo } = parseRepoUrl(repoUrl);
  const octokit = new Octokit({ auth: token });

  // 2 repo metadata
  const { data: repoMeta } = await octokit.request("GET /repos/{owner}/{repo}", {
    owner, repo
  });

  const defaultBranch = repoMeta.default_branch;

  // 3 create new branch
  const latestRef = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    owner, repo, ref: `heads/${defaultBranch}`
  });

  const timestamp = Date.now();
  const safeName = targetFile.replace(/[^a-zA-Z0-9]/g, "-");
  const branch = `troql/edit-${safeName}-${timestamp}`;

  await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
    owner, repo,
    ref: `refs/heads/${branch}`,
    sha: latestRef.data.object.sha
  });

  // 4 fetch target file safely
  let fileData: any = {};
  try {
    const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path: targetFile, ref: branch
    });
    fileData = res.data;
  } catch {
    fileData = { content: "", sha: undefined };
  }

  const original = fileData.content
    ? Buffer.from(fileData.content, "base64").toString("utf8")
    : "";

  const patched = applyUnifiedPatch(original, diff);
  const encoded = Buffer.from(patched).toString("base64");

  // 5 commit safely with spread sha only if exists
  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner, repo,
    path: targetFile,
    message: `feat: Troql automated safe edit\n\n${summary || ""}`,
    content: encoded,
    branch,
    committer: { name: "troql-bot", email: "bot@troql.com" },
    ...optionalSha(fileData)
  });

  // 6 create PR
  const pr = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
    owner, repo,
    title: `Troql Safe Edit: ${targetFile}`,
    body: summary || "",
    head: branch,
    base: defaultBranch
  });

  return {
    success: true,
    mode: "new",
    prUrl: pr.data.html_url,
    branch,
    rollback: fileData.sha
      ? { file: targetFile, sha: fileData.sha }
      : undefined
  };
}
