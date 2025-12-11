import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  let stack = "Unknown";
  let fileList = "";

  try {
    const { repoUrl } = await request.json();
    console.log("🧠 Analyzing:", repoUrl);

    // 1. GET USER TOKEN
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || process.env.GITHUB_TOKEN;
    
    // 2. FETCH FILES
    const octokit = new Octokit({ auth: token || undefined });
    const cleanUrl = repoUrl.replace("https://github.com/", "").replace(".git", "");
    const [owner, repo] = cleanUrl.split("/");

    const { data: files } = await octokit.request('GET /repos/{owner}/{repo}/contents', {
      owner, repo,
    });

    // @ts-ignore
    const filePaths = files.map(f => f.path);
    fileList = filePaths.join(", ");
    
    // Detect Stack
    if (fileList.includes("package.json")) stack = "Node.js";
    else if (fileList.includes("requirements.txt")) stack = "Python";
    else if (fileList.includes("go.mod")) stack = "Go";
    else if (fileList.includes("Cargo.toml")) stack = "Rust";
    else if (fileList.includes("composer.json")) stack = "PHP";

    // 3. CALL AI (Updated Prompt for Longer Summary)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a senior DevOps engineer. Return strictly valid JSON (no markdown)."
        },
        {
          role: "user",
          content: `Analyze this ${stack} codebase files: ${fileList}.
          
          1. Generate 3 specific onboarding tasks.
          2. Generate a "Video Script" (3 bullet points).
          
          3. Generate a "Project Summary" (A detailed technical overview, approx 4-5 sentences. Explain the core business logic, the architecture pattern used, and the primary problem this tool solves. Make it insightful for a developer).
          
          4. Extract 3 "Key Features" (short tags like 'Auth', 'API', 'Database').

          Output strictly this JSON structure:
          {
            "tasks": [{ "title": "...", "difficulty": "Easy", "time": "...", "desc": "..." }],
            "script": ["...", "...", "..."],
            "summary": "This project is...",
            "features": ["Feature 1", "Feature 2", "Feature 3"]
          }`
        }
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ 
        success: true, 
        stack, 
        tasks: data.tasks || [], 
        script: data.script || [],
        summary: data.summary || "No summary available.",
        features: data.features || []
    });

  } catch (error: any) {
    console.error("❌ Scan Error:", error.message);
    const isPrivateError = error.message.includes("Not Found") || error.status === 404;
    return NextResponse.json({ 
        success: false, 
        error: isPrivateError ? "Repo not found. If it's private, sign in." : error.message 
    }, { status: 500 });
  }
}