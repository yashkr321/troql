# Troql 🗺️

**Visualize your Next.js App Router architecture instantly.**

Troql parses your GitHub repository and generates an interactive node-map of your folder structure. It is designed to help developers navigate deeply nested App Router projects (layouts inside layouts) without getting lost.

🔗 **Live Demo:** [https://troql.com/demo]

## ⚡ Features
- **Instant Visualization:** Turns file trees into interactive React Flow graphs.
- **AST Parsing:** Analyze imports and component relationships.
- **App Router Support:** Specifically designed for Next.js 13/14+ folder structures (`page.tsx`, `layout.tsx`, `loading.tsx`).
- **Open Source:** MIT License.

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Visualization:** React Flow
- **Styling:** Tailwind CSS & shadcn/ui
- **Parsing:** AST (Abstract Syntax Tree) analysis
- **Data Source:** GitHub API

## 🚀 Getting Started

First, clone the repository:

```bash
git clone https://github.com/yashkr321/troql.git
cd troql

Install dependencies:

Bash

npm install
# or
yarn install
Run the development server:

Bash

npm run dev
Open http://localhost:3000 with your browser to see the result.

🤝 Contributing
This is a student project built over a weekend! I am actively looking for feedback on:

Handling dynamic imports in AST parsing.

Improving the graph layout for massive repos.

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

📄 License
MIT
