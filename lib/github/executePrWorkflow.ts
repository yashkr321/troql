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

**Status:**
- Temporary branch created
- Diff re-applied successfully
- Force-pushed to \`${branch}\`
- Ready for review`,

    REBASE_CONFLICT: () => `### ⚠️ Automated Rebase Failed
Troql attempted to rebase this PR to apply new changes, but encountered merge conflicts.

**Action Required:**
- Manual resolution is required.
- Please pull the branch locally and resolve conflicts with the default branch.`,

    RETRY_LIMIT: (count: number) => `### 🛑 Retry Limit Exceeded
Troql has attempted to rebase and update this PR ${count} times without success.

**Action Required:**
- Automated attempts are now paused to prevent loops.
- Please manually review the state of this branch.`
};

// --- HELPERS ---

function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    let rawInput = url.trim().replace(/\/$/, "").replace(/\.git$/, "");
    let owner: string, repo: string;

    if (!rawInput.startsWith("http") && !rawInput.includes("github.com") && rawInput.split("/").length === 2) {
      [owner, repo] = rawInput.split("/");
    } else {
      if (!rawInput.startsWith("http")) rawInput = `https://${rawInput}`;
      const urlObj = new URL(rawInput);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length < 2) throw new Error("Invalid path");
      owner = segments[0];
      repo = segments[1];
    }
    if (!owner || !repo) throw new Error("Owner/Repo extraction failed");
    return { owner, repo };
  } catch (e) {
    throw new Error("Invalid repository URL format. Expected 'owner/repo' or GitHub URL.");
  }
}

function validateSafety(targetFile: string, diff: string): { safe: boolean; reason?: string } {
  const normalizedPath = targetFile.startsWith('/') ? targetFile : `/${targetFile}`;
  const hitSensitive = SENSITIVE_DIRS.find(dir => normalizedPath.includes(dir));
  if (hitSensitive) {
    return { safe: false, reason: `Modification blocked: Target file is in a sensitive directory (${hitSensitive}).` };
  }

  const lines = diff.split(/\r\n|\r|\n/);
  let addedLines = 0;
  let deletedLines = 0;
  let filesTouched = 0;
  
  const secretRegex = /(api_key|access_token|secret_key|password|auth_token|client_secret)[\s]*[:=][\s]*['"][A-Za-z0-9_\-]{16,}['"]/i;

  for (const line of lines) {
    if (line.startsWith('+++ ')) filesTouched++;
    if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines++;
        if (secretRegex.test(line)) {
            return { safe: false, reason: "Unsafe content: Potential hardcoded credentials detected in patch." };
        }
    }
    if (line.startsWith('-') && !line.startsWith('---')) deletedLines++;
  }

  if (filesTouched > 1) return { safe: false, reason: "Complexity limit: Multi-file edits are not allowed in this safety tier." };
  if (addedLines > 200) return { safe: false, reason: `Risk limit: Edit adds too many lines (${addedLines} > 200).` };
  if (deletedLines > 50) return { safe: false, reason: `Risk limit: Edit deletes too many lines (${deletedLines} > 50).` };

  return { safe: true };
}

function applyUnifiedPatch(original: string, diff: string): string {
  const lines = original.split(/\r\n|\r|\n/);
  const diffLines = diff.split(/\r\n|\r|\n/);
  let diffIndex = 0;
  while (diffIndex < diffLines.length && !diffLines[diffIndex].startsWith('@@')) { diffIndex++; }
  if (diffIndex >= diffLines.length) throw new Error("Invalid Diff: No chunk header (@@) found.");

  const resultLines: string[] = [];
  let originalIndex = 0;

  while (diffIndex < diffLines.length) {
    const chunkHeader = diffLines[diffIndex];
    if (!chunkHeader.startsWith('@@')) break;
    const match = /@@ \-(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(chunkHeader);
    if (!match) throw new Error(`Invalid chunk header: ${chunkHeader}`);
    const oldStart = parseInt(match[1], 10) - 1;

    while (originalIndex < oldStart) {
      if (originalIndex >= lines.length) break;
      resultLines.push(lines[originalIndex]);
      originalIndex++;
    }
    diffIndex++;

    while (diffIndex < diffLines.length) {
      const line = diffLines[diffIndex];
      if (line.startsWith('@@')) break;
      const marker = line[0];
      const content = line.slice(1);
      if (marker === ' ') { resultLines.push(lines[originalIndex]); originalIndex++; }
      else if (marker === '-') { originalIndex++; }
      else if (marker === '+') { resultLines.push(content); }
      diffIndex++;
    }
  }
  while (originalIndex < lines.length) { resultLines.push(lines[originalIndex]); originalIndex++; }
  return resultLines.join('\n');
}

async function postPrComment(octokit: Octokit, owner: string, repo: string, issueNumber: number, body: string) {
    try {
        await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner, repo, issue_number: issueNumber, body
        });
    } catch (e) {
        console.warn(`[Troql] Failed to post comment to PR #${issueNumber}`, e);
    }
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
  token?: string; // Expects GitHub App Installation Token
}): Promise<WorkflowResult> {
  
  // 1. Safety Check (Pre-Flight)
  const safetyResult = validateSafety(targetFile, diff);
  if (!safetyResult.safe) {
      const err = new Error("unsafe_edit_blocked");
      // @ts-ignore
      err.status = 422;
      // @ts-ignore
      err.details = { reason: safetyResult.reason, severity: "critical" };
      throw err;
  }

  const { owner, repo } = parseRepoUrl(repoUrl);
  
  // Use injected token (App Auth) exclusively. No PAT fallback.
  const octokit = new Octokit({ auth: token });

  // 2. Fetch Repo Metadata
  let repoData;
  try {
      const { data } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
      repoData = data;
  } catch (e: any) {
      const status = e.status || 500;
      const err = new Error(status === 404 ? "Repository not found." : "GitHub API Error");
      // @ts-ignore
      err.status = status;
      throw err;
  }

  if (!repoData.permissions?.push) {
      const err = new Error(`No write access to ${owner}/${repo}.`);
      // @ts-ignore
      err.status = 403;
      throw err;
  }

  const defaultBranch = repoData.default_branch;

  // 3. CHECK FOR EXISTING PR & STALENESS
  let existingPR = null;
  let targetBranchName = "";
  let isReuseMode = false;

  try {
      const { data: openPRs } = await octokit.request('GET /repos/{owner}/{repo}/pulls?state=open', {
          owner, repo
      });

      existingPR = openPRs.find((pr: any) => 
          pr.title === `Troql Safe Edit: ${targetFile}`
      );

      if (existingPR) {
          const { data: baseRef } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
              owner, repo, ref: `heads/${defaultBranch}`
          });
          const latestBaseSha = baseRef.object.sha;
          
          // --- REBASE PIPELINE (Stale Detection) ---
          if (existingPR.base.sha !== latestBaseSha) {
              console.log(`[Troql] PR #${existingPR.number} is stale. Initiating rebase...`);

              // A. Check Retry Limit
              const bodyMatches = existingPR.body?.match(/Rebase-Retry: (\d+)\/3/);
              const currentRetry = bodyMatches ? parseInt(bodyMatches[1], 10) : 0;
              
              if (currentRetry >= 3) {
                   await postPrComment(octokit, owner, repo, existingPR.number, COMMENT_TEMPLATES.RETRY_LIMIT(currentRetry));
                   
                   const err = new Error("retry_limit_reached");
                   // @ts-ignore
                   err.status = 422;
                   // @ts-ignore
                   err.details = { reason: "Max automated rebase attempts (3) exceeded.", prUrl: existingPR.html_url };
                   throw err;
              }

              // B. Create Temp Rebase Branch
              const tempBranchName = `troql/rebase-${Date.now()}`;
              await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
                  owner, repo,
                  ref: `refs/heads/${tempBranchName}`,
                  sha: latestBaseSha 
              });

              // C. Fetch Fresh Content & Apply Diff
              let freshContentStr = "";
              let freshFileSha = "";
              
              try {
                  const { data: freshFile } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                      owner, repo, path: targetFile, ref: tempBranchName
                  });
                  // @ts-ignore
                  freshContentStr = Buffer.from(freshFile.content, 'base64').toString('utf-8');
                  // @ts-ignore
                  freshFileSha = freshFile.sha;
              } catch (e: any) {
                   if (e.status === 404) { freshContentStr = ""; } 
                   else throw e;
              }

              let rebasedContent = "";
              try {
                  rebasedContent = applyUnifiedPatch(freshContentStr, diff);
              } catch (e) {
                   await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', { owner, repo, ref: `heads/${tempBranchName}` });
                   await postPrComment(octokit, owner, repo, existingPR.number, COMMENT_TEMPLATES.REBASE_CONFLICT());
                   
                   const err = new Error("rebase_conflict");
                   // @ts-ignore
                   err.status = 409;
                   // @ts-ignore
                   err.details = { reason: "Conflicts detected during automated rebase.", prUrl: existingPR.html_url };
                   throw err;
              }

              // D. Commit to Temp Branch
              const newRetryCount = currentRetry + 1;
              const commitTrailers = [
                `AI-Agent: Troql Safe Edit Agent`,
                `Safety-Gate: Passed`,
                `Patch-Type: Rebase/Surgical`,
                `Rebase-Retry: ${newRetryCount}/3`,
                `Timestamp: ${new Date().toISOString()}`,
                `Signed-off-by: Troql AI <bot@troql.com>`
              ].join('\n');

              await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                  owner, repo,
                  path: targetFile,
                  message: `fix: Rebase safe edit on latest ${defaultBranch}\n\n${commitTrailers}`,
                  content: Buffer.from(rebasedContent).toString('base64'),
                  sha: freshFileSha, 
                  branch: tempBranchName,
                  committer: { name: "troql-bot[bot]", email: "12345+troql-bot[bot]@users.noreply.github.com" }
              });

              // E. Force Push
              const { data: tempRef } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
                  owner, repo, ref: `heads/${tempBranchName}`
              });
              const newCommitSha = tempRef.object.sha;

              await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
                  owner, repo,
                  ref: `heads/${existingPR.head.ref}`,
                  sha: newCommitSha,
                  force: true 
              });

              // F. Update Body & Comment
              const updatedBody = existingPR.body?.replace(/Rebase-Retry: \d+\/3/g, `Rebase-Retry: ${newRetryCount}/3`) 
                  || `${existingPR.body}\n\n> **Note:** Rebase-Retry: ${newRetryCount}/3`;

              await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
                  owner, repo, pull_number: existingPR.number, body: updatedBody
              });

              await postPrComment(octokit, owner, repo, existingPR.number, COMMENT_TEMPLATES.REBASE_SUCCESS(existingPR.head.ref));
              
              await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
                  owner, repo, ref: `heads/${tempBranchName}`
              });

              return {
                  success: true,
                  mode: "rebase",
                  prUrl: existingPR.html_url,
                  reason: "PR successfully rebased onto latest default branch."
              };
          }
          // --- END REBASE PIPELINE ---

          // Reuse Mode: Check CI Gates
          const { data: fullPR } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
              owner, repo, pull_number: existingPR.number
          });

          const rejectStates = ["dirty", "blocked", "draft", "unknown"];
          if (fullPR.draft || (fullPR.mergeable_state && rejectStates.includes(fullPR.mergeable_state))) {
               const err = new Error("blocked-by-ci");
               // @ts-ignore
               err.status = 422;
               // @ts-ignore
               err.details = { reason: `PR #${existingPR.number} is ${fullPR.mergeable_state || 'blocked'}.`, prUrl: existingPR.html_url };
               throw err;
          }

          const { data: checkRuns } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
              owner, repo, ref: existingPR.head.sha
          });

          const failedChecks = checkRuns.check_runs.filter((run: any) => 
              ['failure', 'cancelled', 'timed_out'].includes(run.conclusion || '')
          );

          if (failedChecks.length > 0) {
               await postPrComment(octokit, owner, repo, existingPR.number, COMMENT_TEMPLATES.CI_FAILURE(`${existingPR.html_url}/checks`));
               
               const err = new Error("blocked-by-ci");
               // @ts-ignore
               err.status = 422;
               // @ts-ignore
               err.details = { reason: `PR #${existingPR.number} has failing CI checks.`, prUrl: existingPR.html_url };
               throw err;
          }

          isReuseMode = true;
          targetBranchName = existingPR.head.ref;
      }

  } catch (e: any) {
      if (e.message?.includes("blocked-by-ci") || e.message?.includes("retry_limit") || e.message?.includes("rebase_conflict")) throw e;
      console.warn("Existing PR check failed, proceeding to new branch.", e);
  }

  // 4. Branch Setup (New Branch)
  if (!isReuseMode) {
      const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
          owner, repo, ref: `heads/${defaultBranch}`
      });
      const baseSha = refData.object.sha;

      const timestamp = Date.now();
      const safeFileName = targetFile.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '-') || 'file';
      targetBranchName = `troql/edit-${safeFileName}-${timestamp}`;

      // Verify Branch Protection
      try {
          const { data: branchInfo } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
              owner, repo, branch: defaultBranch
          });
          if (branchInfo.protected) {
             // Log warning or handle strictly if desired. 
             // Phase 7 allows PR creation even if main is protected.
          }
      } catch(e) {}

      await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
          owner, repo,
          ref: `refs/heads/${targetBranchName}`,
          sha: baseSha
      });
  }

  // 5. Fetch Content
  const fetchRef = isReuseMode ? targetBranchName : defaultBranch;
  let currentFile;
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: targetFile, ref: fetchRef 
    });
    currentFile = data;
  } catch (e: any) {
    if (e.status === 404) { currentFile = { content: "", sha: undefined }; } 
    else throw new Error(`Failed to fetch file from ${fetchRef}: ${e.message}`);
  }

  // @ts-ignore
  const originalContent = currentFile.content ? Buffer.from(currentFile.content, 'base64').toString('utf-8') : "";

  // 6. Apply Patch
  let newContent: string;
  try {
    newContent = applyUnifiedPatch(originalContent, diff);
  } catch (patchError: any) {
    const err = new Error(`Patch Failed: ${patchError.message}`);
    // @ts-ignore
    err.status = 409;
    throw err;
  }

  if (newContent === originalContent) {
    const err = new Error("Patch resulted in no changes.");
    // @ts-ignore
    err.status = 400;
    throw err;
  }

  // 7. Commit
  const commitTrailers = [
    `AI-Agent: Troql Safe Edit Agent`,
    `Safety-Gate: Passed`,
    `Patch-Type: ${isReuseMode ? "Cumulative" : "Surgical"}`,
    `Rebase-Retry: 0/3`,
    `Timestamp: ${new Date().toISOString()}`,
    `Signed-off-by: Troql AI <bot@troql.com>`
  ].join('\n');

  const commitMsg = `feat: Update ${targetFile.split('/').pop()} via Troql Safe Edit\n\n${commitTrailers}`;
  
  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner, repo,
    path: targetFile,
    message: commitMsg,
    content: Buffer.from(newContent).toString('base64'),
    sha: currentFile.sha, 
    branch: targetBranchName, 
    committer: { name: "troql-bot[bot]", email: "12345+troql-bot[bot]@users.noreply.github.com" }
  });

  // 8. PR Handling
  let prData = existingPR;
  
  if (!isReuseMode) {
      const prBody = `### 🛡️ Troql Safe Edit Proposal

**File:** \`${targetFile}\`
**Summary:** ${summary || "Automated safe edit applied via Troql."}

---

### ✅ Safety Attestation
This edit was generated by the Troql Safe Agent. It has passed the following pre-flight checks:
- [x] **Path Safety:** No sensitive directories modified.
- [x] **Diff Limit:** Changes are within safe bounds (<200 lines added).
- [x] **Secret Scan:** No credential patterns detected.
- [x] **Single File:** Edit is scoped to one file.

### 📝 Provenance Metadata
| Field | Value |
|---|---|
| **Agent** | Troql Safe Edit Agent v1.0 |
| **Strategy** | Surgical Unified Diff |
| **Rebase-Retry** | 0/3 |
| **Timestamp** | ${new Date().toISOString()} |

---

> **CI Policy Reminder:** This PR must pass all CI checks before merging. Do not merge if tests fail.`;

      const { data } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
          owner, repo,
          title: `Troql Safe Edit: ${targetFile}`,
          body: prBody,
          head: targetBranchName,
          base: defaultBranch
      });
      prData = data;

      try {
          await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
              owner, repo,
              issue_number: prData.number,
              labels: ["troql-auto-edit", "ci-safe", "requires-review", "low-risk"]
          });
      } catch (labelError) {
          console.warn("Labeling failed:", labelError);
      }
  }

  return {
    success: true,
    mode: isReuseMode ? "reuse" : "new",
    prUrl: prData?.html_url,
    branch: targetBranchName,
    // @ts-ignore
    rollback: currentFile.sha ? { file: targetFile, sha: currentFile.sha } : undefined
  };
}