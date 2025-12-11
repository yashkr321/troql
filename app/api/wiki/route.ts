import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { question, stack, repoName } = await request.json();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a senior developer explaining the ${repoName} (${stack}) codebase. 
          Answer the user's question clearly and concisely. 
          If you reference specific files (like package.json, routes.ts), wrap them in backticks.`
        },
        {
          role: "user",
          content: question
        }
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't find an answer.";

    return NextResponse.json({ answer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}