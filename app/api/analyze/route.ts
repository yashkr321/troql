import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import Groq from 'groq-sdk';

// --- INTERFACES ---
interface CoreModule {
  name: string;
  path: string;
  responsibility: string;
  confidence: "High" | "Medium" | "Low";
}

interface SystemArchitecture {
  summary: string;
  architecture_style: string;
  core_modules: CoreModule[];
}

interface OnboardingTask {
  tier: "SCOUT" | "BUILDER" | "ENGINEER";
  title: string;
  description: string;
  file_path: string;
  action_type: "edit_text" | "create_file" | "insert_log";
  safety_label: string;
}

interface ImportantFile {
  path: string;
  reason: string;
  risk_level: "Critical" | "High";
}

interface FlowStep {
  file: string;
  role: string; 
  note?: string;
}

interface KeyFlow {
  name: string;
  description: string;
  steps: FlowStep[];
  confidence: "High" | "Medium";
}

// Phase 2: Role Dictionary
interface OnboardingTracks {
  GENERAL: OnboardingTask[];
  FRONTEND: OnboardingTask[];
  BACKEND: OnboardingTask[];
  DEVOPS: OnboardingTask[];
}

// Phase 3: Impact Analysis
interface ImpactAnalysis {
  level: "High" | "Medium" | "Low";
  summary: string;
  flows: string[];
}

// --- HELPER 1: TREE SHAKING ---
function getPrioritizedTree(files: string[], limit = 300): { tree: string[], isPartial: boolean } {
    const noisePatterns = [
        'node_modules', 'dist', 'build', '.git', '.ico', '.png', '.jpg', '.svg', 
        'package-lock.json', 'yarn.lock', '.ds_store'
    ];
    
    const cleanFiles = files.filter(f => !noisePatterns.some(n => f.includes(n)));

    const scoreFile = (path: string) => {
        let score = 0;
        const lower = path.toLowerCase();
        
        if (lower === 'package.json' || lower === 'readme.md') score += 100;
        if (lower.includes('next.config') || lower.includes('tsconfig')) score += 80;
        if (lower.startsWith('src/') || lower.startsWith('app/') || lower.startsWith('pages/')) score += 50;
        if (lower.includes('/api/')) score += 40;
        
        const depth = path.split('/').length;
        score -= (depth * 2);

        return score;
    };

    cleanFiles.sort((a, b) => scoreFile(b) - scoreFile(a));
    const finalTree = cleanFiles.slice(0, limit);
    
    return {
        tree: finalTree,
        isPartial: cleanFiles.length > limit
    };
}

// --- HELPER 2: SSO-SAFE FETCH ---
async function fetchRepoData(owner: string, repo: string, token?: string) {
    const authedOctokit = new Octokit({ 
        auth: token,
        userAgent: 'Troql-Scanner/1.0'
    });

    try {
        console.log(`🔐 [Attempt 1] Authenticated fetch for ${owner}/${repo}...`);
        
        const { data: repoData } = await authedOctokit.request('GET /repos/{owner}/{repo}', { 
            owner, repo,
            headers: { 'X-GitHub-Api-Version': '2022-11-28' } 
        });
        
        const defaultBranch = repoData.default_branch;
        const { data: treeData } = await authedOctokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1', {
            owner, repo, tree_sha: defaultBranch
        });

        return { repoData, treeData, octokit: authedOctokit };

    } catch (authError: any) {
        if (authError.status !== 404) throw authError;

        console.warn(`⚠️ [Attempt 1 Failed] 404 detected. Switching to Unauthenticated Client...`);
        
        const publicOctokit = new Octokit({
            auth: undefined, 
            userAgent: 'Troql-Public-Scanner/1.0' 
        });

        try {
            console.log(`🔓 [Attempt 2] Unauthenticated fetch for ${owner}/${repo}...`);
            const { data: repoData } = await publicOctokit.request('GET /repos/{owner}/{repo}', { owner, repo });
            const defaultBranch = repoData.default_branch;
            const { data: treeData } = await publicOctokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1', {
                owner, repo, tree_sha: defaultBranch
            });
            
            console.log("✅ [Attempt 2 Success] Public bypass worked.");
            return { repoData, treeData, octokit: publicOctokit };

        } catch (unauthError: any) {
            console.error("❌ [Attempt 2 Failed] Unauthenticated fetch also failed.");
            throw new Error("Repository not found. Is it private? Try logging in.");
        }
    }
}

// --- HELPER 3: OWNER TYPE DETECTION ---
async function getOwnerType(owner: string, token?: string): Promise<'User' | 'Organization'> {
    const octokit = new Octokit({ auth: token });
    try {
        const { data } = await octokit.request('GET /users/{username}', { username: owner });
        return data.type as 'User' | 'Organization';
    } catch (error) {
        throw new Error(`Could not verify owner "${owner}". Check spelling.`);
    }
}

// --- HELPER 4: DETERMINISTIC IMPACT ANALYSIS ---
function generateImpactMap(
  importantFiles: ImportantFile[], 
  keyFlows: KeyFlow[]
): Record<string, ImpactAnalysis> {
  
  const map: Record<string, ImpactAnalysis> = {};

  // 1. Map Flows to Files
  const fileFlows: Record<string, string[]> = {};
  keyFlows.forEach(flow => {
    flow.steps.forEach(step => {
      if (!fileFlows[step.file]) fileFlows[step.file] = [];
      if (!fileFlows[step.file].includes(flow.name)) {
        fileFlows[step.file].push(flow.name);
      }
    });
  });

  // 2. Assess Impact
  const allKnownFiles = new Set([
    ...importantFiles.map(f => f.path),
    ...Object.keys(fileFlows)
  ]);

  allKnownFiles.forEach(file => {
    const isImportant = importantFiles.find(f => f.path === file);
    const flows = fileFlows[file] || [];
    
    let level: "High" | "Medium" | "Low" = "Low";
    let summary = "Low risk of regression.";

    // Rule 1: Important Files are inherently risky
    if (isImportant) {
      level = isImportant.risk_level === "Critical" ? "High" : "Medium";
      summary = `Load-bearing file: ${isImportant.reason}`;
    }
    
    // Rule 2: Flow participation increases risk
    if (flows.length > 0) {
      if (flows.length >= 2) level = "High"; // Used in multiple critical flows
      else if (level === "Low") level = "Medium"; // Used in at least one flow
      
      summary += ` Involved in ${flows.length} critical flow(s).`;
    }

    map[file] = { level, summary, flows };
  });

  return map;
}

// --- SYSTEM PROMPT (PHASE 3: FULL INTELLIGENCE) ---
const HARDENED_SYSTEM_PROMPT = `
ROLE:
You are a Senior Software Architect.
Analyze the code conservatively. Do not guess.

INPUT DATA:
- File Tree: {{FILE_TREE_JSON}}
- Dependencies: {{PACKAGE_JSON_DEPS}}
- Partial Analysis: {{IS_PARTIAL}}

SECURITY RULES (MUST FOLLOW):
1. FILE EXISTENCE: ONLY reference files that exist in the "File Tree".
2. NO DESTRUCTIVE ACTIONS: No deletions, no .env edits.

TASK:
1. Create a "Mental Model" (System Architecture).
2. Generate "Onboarding Tracks" (General, Frontend, Backend, DevOps).
3. Identify "Important Files" (Load-Bearing Files).
4. Infer "Key Flows" (Data Movement).

ROLE CLASSIFICATION RULES:
- FRONTEND: /views, /components, .tsx, .css (UI/UX)
- BACKEND: /api, /routes, /db, .sql (Logic/DB)
- DEVOPS: Dockerfile, .github, package.json (Config)
- GENERAL: Mix of easy wins.

IMPORTANT FILES HEURISTICS:
Identify 3-5 files that are "Critical" or "High" risk.
- Look for: Global Configs, Database Clients, Auth Providers, Main Entry Points.
- Explain WHY in the "reason" field.

KEY FLOW INFERENCE (Max 3 Flows):
Identify 2-3 critical data flows (e.g., "User Login", "Data Fetch", "Checkout").
- Trace the path from Entry Point -> Logic -> Data.
- RULES:
  1. Every step MUST be a real file from the input.
  2. If you can't trace it, do not invent it.
  3. Typical flow: Route -> Controller -> Service -> Database.
  4. Max 6 steps per flow.

OUTPUT JSON STRUCTURE:
{
  "system_architecture": {
    "summary": "One clear sentence explaining the stack.",
    "architecture_style": "e.g., Monolith / Microservices",
    "core_modules": [
      { "name": "Name", "path": "path/to/folder", "responsibility": "Desc", "confidence": "High" }
    ]
  },
  "important_files": [
    { "path": "src/lib/db.ts", "reason": "Central database connection", "risk_level": "Critical" }
  ],
  "key_flows": [
    {
      "name": "User Authentication",
      "description": "How a login request is processed.",
      "confidence": "High",
      "steps": [
        { "file": "src/app/login/page.tsx", "role": "UI Entry", "note": "Login Form" },
        { "file": "src/api/auth/route.ts", "role": "API Handler" }
      ]
    }
  ],
  "onboarding_tracks": {
    "GENERAL": [ { "tier": "SCOUT", "title": "...", "description": "...", "file_path": "EXACT_PATH", "action_type": "edit_text", "safety_label": "Safe" } ],
    "FRONTEND": [],
    "BACKEND": [],
    "DEVOPS": []
  }
}
`;

// --- VALIDATION LOGIC ---
function validateResponse(aiData: any, realFileList: string[]) {
  
  // 1. Validate Architecture
  const cleanModules = Array.isArray(aiData.system_architecture?.core_modules) 
    ? aiData.system_architecture.core_modules 
    : [];

  // 2. Validate Important Files
  const cleanImportantFiles: ImportantFile[] = [];
  if (Array.isArray(aiData.important_files)) {
    for (const file of aiData.important_files) {
        if (realFileList.includes(file.path)) {
            cleanImportantFiles.push(file);
        } else {
            console.warn(`⚠️ Hallucination detected (Important File): ${file.path}`);
        }
    }
  }

  // 3. Validate Key Flows
  const cleanFlows: KeyFlow[] = [];
  if (Array.isArray(aiData.key_flows)) {
    for (const flow of aiData.key_flows) {
        const validSteps = (flow.steps || []).filter((step: FlowStep) => {
            return realFileList.includes(step.file);
        });

        if (validSteps.length >= 2) {
            cleanFlows.push({ ...flow, steps: validSteps.slice(0, 6) });
        }
    }
  }

  // 4. Validate Tracks
  const rawTracks = aiData.onboarding_tracks || {};
  const validatedTracks: any = { GENERAL: [], FRONTEND: [], BACKEND: [], DEVOPS: [] };
  const roles = ["GENERAL", "FRONTEND", "BACKEND", "DEVOPS"];

  roles.forEach(role => {
    if (Array.isArray(rawTracks[role])) {
        const cleanList = rawTracks[role].filter((task: OnboardingTask) => {
            const fileExists = realFileList.includes(task.file_path);
            const isCreate = task.action_type === 'create_file';
            return fileExists || isCreate;
        });
        validatedTracks[role] = cleanList.slice(0, 3);
    }
  });

  return {
    ...aiData,
    system_architecture: {
      ...aiData.system_architecture,
      core_modules: cleanModules
    },
    important_files: cleanImportantFiles,
    key_flows: cleanFlows,
    onboarding_tracks: validatedTracks
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is missing in .env file");
    const groq = new Groq({ apiKey });

    const { repoUrl } = await request.json();
    console.log("🚀 Receiving Request for:", repoUrl);

    // 1. URL Parsing
    let owner: string, repo: string;
    try {
        const urlObj = new URL(repoUrl.startsWith('http') ? repoUrl : `https://${repoUrl}`);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length < 2) throw new Error("URL too short");
        owner = pathSegments[0];
        repo = pathSegments[1];
        if (repo.endsWith(".git")) repo = repo.slice(0, -4);
    } catch (e) {
        throw new Error("Invalid GitHub URL.");
    }
    
    // 2. Auth & Policy
    const authHeader = request.headers.get("authorization");
    const userToken = authHeader?.replace("Bearer ", "");
    const serverToken = process.env.GITHUB_TOKEN;
    const isLoggedIn = !!userToken;
    const checkToken = userToken || serverToken; 

    const ownerType = await getOwnerType(owner, checkToken);
    if (ownerType === 'Organization' && !isLoggedIn) {
        return NextResponse.json({ success: false, error: "This organization requires GitHub login." }, { status: 403 });
    }

    const scanToken = isLoggedIn ? userToken : serverToken;

    // 3. Fetch Tree
    const result = await fetchRepoData(owner, repo, scanToken);
    const { treeData, octokit: successfulOctokit } = result;

    // @ts-ignore
    const allFilesRaw = treeData.tree.filter((f: any) => f.type === 'blob').map((f: any) => f.path);

    // 4. Tree Shaking
    const { tree: prioritizedTree, isPartial } = getPrioritizedTree(allFilesRaw, 300);

    // 5. Package.json
    let packageJsonDeps = "Unknown";
    if (allFilesRaw.includes("package.json")) {
        try {
            const { data: pkgData } = await successfulOctokit.request('GET /repos/{owner}/{repo}/contents/package.json', { owner, repo });
            // @ts-ignore
            if (pkgData.content) {
                packageJsonDeps = JSON.stringify(JSON.parse(atob(pkgData.content)).dependencies || {});
            }
        } catch (e) {}
    }

    // 6. AI Analysis
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: HARDENED_SYSTEM_PROMPT
            .replace("{{FILE_TREE_JSON}}", JSON.stringify(prioritizedTree))
            .replace("{{PACKAGE_JSON_DEPS}}", packageJsonDeps)
            .replace("{{IS_PARTIAL}}", isPartial ? "TRUE" : "FALSE")
        },
        { role: "user", content: `Analyze this repository: ${repoUrl}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let rawData;
    try {
        rawData = JSON.parse(content);
    } catch (e) {
        return NextResponse.json({ success: false, error: "AI Response invalid JSON." }, { status: 500 });
    }

    // 7. Validation & Impact Analysis
    const validatedData = validateResponse(rawData, allFilesRaw);
    
    // NEW: Generate Impact Map based on validated data
    const impactMap = generateImpactMap(validatedData.important_files, validatedData.key_flows);

    return NextResponse.json({ 
        success: true, 
        system_architecture: validatedData.system_architecture,
        onboarding_tracks: validatedData.onboarding_tracks, 
        important_files: validatedData.important_files,
        key_flows: validatedData.key_flows,
        impact_map: impactMap, // NEW OUTPUT
        is_partial_analysis: isPartial
    });

  } catch (error: any) {
    console.error("❌ Scan Error:", error.message);
    let userMessage = error.message;
    if (error.status === 404) userMessage = "Repo not found. Check URL or Login.";
    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}