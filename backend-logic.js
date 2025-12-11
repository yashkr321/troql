import { Octokit } from "octokit";
import * as dotenv from "dotenv";
dotenv.config();

// Setup the connection to GitHub
const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN 
});

async function analyzeRepo(repoUrl) {
  console.log(`\n🔍 Scanning Repository: ${repoUrl}...`);
  
  try {
    // 1. Clean the URL to get owner/repo
    const cleanUrl = repoUrl.replace("https://github.com/", "");
    const [owner, repo] = cleanUrl.split("/");

    // 2. Fetch file list from root
    const { data: files } = await octokit.request('GET /repos/{owner}/{repo}/contents', {
      owner,
      repo,
    });

    console.log(`📂 Found ${files.length} files in root.`);

    // 3. Detect Stack
    const fileNames = files.map(f => f.name);
    let stack = "Unknown";
    
    if (fileNames.includes("package.json")) stack = "Node.js";
    else if (fileNames.includes("requirements.txt")) stack = "Python";
    else if (fileNames.includes("go.mod")) stack = "Go";

    console.log(`✅ Detected Stack: ${stack}`);

    // 4. Generate Config if Node.js
    if (stack === "Node.js") {
      const devContainerConfig = {
        name: "Onboard AI - Node.js",
        image: "mcr.microsoft.com/devcontainers/javascript-node:18",
        customizations: {
          vscode: {
            extensions: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
          }
        }
      };
      
      console.log("\n🚀 Generated devcontainer.json preview:");
      console.log(JSON.stringify(devContainerConfig, null, 2));
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Test Run: Let's scan a real repo!
analyzeRepo("https://github.com/stripe/stripe-node");