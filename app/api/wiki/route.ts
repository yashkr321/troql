import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { question, stack, repoName, architecture } = await request.json();

    // 1. Construct the Intelligence Block (Context Injection)
    let contextBlock = "";
    
    if (architecture) {
        contextBlock = `
ANALYZED REPOSITORY CONTEXT (Ground truth for answers):
- Architecture Style: ${architecture.architecture_style || "Unknown"}
- System Summary: ${architecture.summary || "Not available"}
- Core Modules:
${(architecture.core_modules || []).map((m: any) => `  * ${m.name} (${m.path}): ${m.responsibility}`).join("\n")}
        `;
    }

    // 2. Enhanced System Prompt (Phase 2.5 polish)
    const systemPrompt = `
You are a Senior Developer and Codebase Expert for the repository: ${repoName} (${stack}).

${contextBlock}

YOUR GOAL:
Answer the user's question clearly and concisely using the analyzed context above.
- If the user asks "Where is auth?", use the Core Modules list to infer the most likely location.
- If the user asks about the stack or architecture, rely on the System Summary.
- If you reference specific files, wrap them in backticks (e.g. \`package.json\`).
- If the answer is not explicitly present in the analyzed context, state that clearly first, then provide a best-practice explanation based on ${stack}.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't find an answer.";

    return NextResponse.json({ answer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
