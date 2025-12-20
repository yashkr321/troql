import { NextResponse } from 'next/server'
import { Octokit } from 'octokit'
import Groq from 'groq-sdk'
import { getRepoInstallationToken } from '@/lib/auth/githubApp'

// --- INTERFACES ---
interface ImpactAnalysis {
  level: "High" | "Medium" | "Low";
  summary: string;
  flows: string[];
}

interface KeyFlow {
  name: string;
  steps: { file: string; role: string }[];
}

interface ProposeEditRequest {
  repoUrl: string;
  instruction: string;
  targetFile: string;
  impactContext: {
    impactMap: Record<string, ImpactAnalysis>;
    keyFlows: KeyFlow[];
  };
}

interface EditProposal {
  file_path: string;
  type: "UPDATE" | "CREATE";
  diff: string;
  risk_analysis: {
    level: "High" | "Medium" | "Low";
    reason: string;
    affected_flows: string[];
  };
  summary: string;
  rollback_plan: string;
}

// --- HELPER: PARSE OWNER/REPO ---
function parseRepoUrl(url: string): { owner: string; repo: string } {
  let raw = url.trim().replace(/\/$/, "").replace(/\.git$/, "")
  let owner: string, repo: string

  if (!raw.startsWith("http") && !raw.includes("github.com") && raw.split("/").length === 2) {
    ;[owner, repo] = raw.split("/")
  } else {
    if (!raw.startsWith("http")) raw = `https://${raw}`
    const parsed = new URL(raw)
    const segs = parsed.pathname.split("/").filter(Boolean)
    owner = segs[0]
    repo = segs[1]
  }

  if (!owner || !repo) throw new Error("Invalid repository format")

  return { owner, repo }
}

// --- HELPER: FETCH FILE CONTENT (READS VIA GITHUB APP TOKEN) ---
async function fetchRepoContext(owner: string, repo: string, filePath: string, token: string) {
  const octokit = new Octokit({ auth: token })

  // validate repo exists + get default branch
  const { data: repoData } = await octokit.request(
    'GET /repos/{owner}/{repo}',
    { owner, repo }
  )

  const defaultBranch = repoData.default_branch

  // fetch tree
  const { data: treeData } = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1',
    {
      owner,
      repo,
      sha: defaultBranch
    }
  )

  // @ts-ignore
  const files = treeData.tree.filter((f: any) => f.type === "blob").map((f: any) => f.path)

  // file doesn't exist? flag
  if (!files.includes(filePath)) {
    return {
      exists: false,
      content: null,
      allFiles: files
    }
  }

  // fetch file content
  const { data: fileData } = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    { owner, repo, path: filePath }
  )

  // @ts-ignore
  const content = Buffer.from(fileData.content, 'base64').toString('utf8')

  return {
    exists: true,
    content,
    allFiles: files
  }
}

// --- SYSTEM PROMPT (UNCHANGED) ---
const EDIT_AGENT_PROMPT = `
ROLE:
You are a Senior Surgical Code Editor Agent.
Your task is to propose a safe, minimal code edit based on a user instruction.

INPUT CONTEXT:
- Target File: {{TARGET_FILE}}
- Impact Level: {{IMPACT_LEVEL}}
- Affected Flows: {{AFFECTED_FLOWS}}
- User Instruction: "{{INSTRUCTION}}"

CURRENT FILE CONTENT:
\`\`\`
{{FILE_CONTENT}}
\`\`\`

RULES:
1. UNIFIED DIFF ONLY
2. SCOPE: edit only the target file
3. REFUSE unsafe or vague edits
4. Fill the risk_analysis fields strictly

OUTPUT FORMAT:
{
 "file_path": "{{TARGET_FILE}}",
 "type": "UPDATE",
 "diff": "--- {{TARGET_FILE}}\\n+++ {{TARGET_FILE}}\\n@@ ...",
 "risk_analysis": {
     "level": "High | Medium | Low",
     "reason": "...",
     "affected_flows": []
 },
 "summary": "...",
 "rollback_plan": "..."
}
`

export async function POST(request: Request) {
  try {
    // 1. parse + validate
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    const body: ProposeEditRequest = await request.json()
    const { repoUrl, instruction, targetFile, impactContext } = body

    if (!repoUrl || !instruction || !targetFile) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // 2. normalize repo + owner
    const { owner, repo } = parseRepoUrl(repoUrl)

    // 3. obtain app token FIRST (Phase 8 requirement)
    const appToken = await getRepoInstallationToken(owner, repo)

    // 4. fetch file context
    const { exists, content } = await fetchRepoContext(owner, repo, targetFile, appToken)

    if (!exists) {
      return NextResponse.json({
        success: false,
        error: `Target file '${targetFile}' does not exist in repo`
      }, { status: 404 })
    }

    // 5. prep prompt context
    const impactData = impactContext?.impactMap?.[targetFile] || { level: "Low", flows: [] }
    const level = impactData.level
    const flows = impactData.flows?.join(", ") || "None"

    const prompt = EDIT_AGENT_PROMPT
      .replace("{{TARGET_FILE}}", targetFile)
      .replace("{{IMPACT_LEVEL}}", level)
      .replace("{{AFFECTED_FLOWS}}", flows)
      .replace("{{INSTRUCTION}}", instruction)
      .replace("{{FILE_CONTENT}}", content || "")

    // 6. LLM call
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Propose edit for: ${targetFile}` }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      model: "llama-3.3-70b-versatile"
    })

    const raw = completion.choices[0]?.message?.content || "{}"

    let proposal: EditProposal
    try {
      proposal = JSON.parse(raw)
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: "AI produced invalid JSON"
      }, { status: 500 })
    }

    if (proposal.file_path !== targetFile) {
      return NextResponse.json({
        success: false,
        error: "Agent attempted to modify a different file (blocked)"
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      proposal
    })

  } catch (err: any) {
    console.error("❌ Propose Edit Error:", err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
