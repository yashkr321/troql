# Troql 🗺️

**Visualize your Next.js App Router architecture instantly.**

Troql parses your GitHub repository and generates an interactive node-map of your folder structure. Designed to help developers navigate deeply nested App Router projects without getting lost in layouts within layouts.

🔗 **Live Demo:** [https://troql.com/demo](https://troql.com/demo)

---

## ⚡ Features

- 🎯 **Instant Visualization** – Transforms file trees into interactive React Flow graphs
- 🔍 **AST Parsing** – Analyzes imports and component relationships automatically
- 📁 **App Router Native** – Built specifically for Next.js 13/14+ structure (`page.tsx`, `layout.tsx`, `loading.tsx`)
- 🎨 **Interactive Navigation** – Pan, zoom, and explore your architecture visually
- 🚀 **Zero Configuration** – Just paste your GitHub URL and go
- 💾 **Open Source** – MIT License, fork and customize freely

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Visualization** | React Flow |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Parsing** | AST (Abstract Syntax Tree) |
| **Data Source** | GitHub API |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashkr321/troql.git
   cd troql
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see Troql in action.

---

## 📖 Usage

1. Visit [troql.com](https://troql.com) or your local instance
2. Paste a GitHub repository URL (must be public and use Next.js App Router)
3. Click "Visualize" to generate the interactive graph
4. Explore your project structure:
   - **Pan** by clicking and dragging
   - **Zoom** with mouse wheel or pinch gestures
   - **Click nodes** to see file details and relationships

### Supported File Types

Troql recognizes and visualizes:
- `page.tsx` / `page.js` – Route pages
- `layout.tsx` / `layout.js` – Layout wrappers
- `loading.tsx` / `loading.js` – Loading states
- `error.tsx` / `error.js` – Error boundaries
- `route.ts` / `route.js` – API routes

---

## 🏗️ Project Structure

```
troql/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── flow/           # React Flow custom nodes
├── lib/                # Utility functions
│   ├── github.ts       # GitHub API integration
│   └── parser.ts       # AST parsing logic
├── public/             # Static assets
└── styles/             # Global styles
```

---

## 🤝 Contributing

This project started as a weekend hackathon but is actively maintained! Contributions are welcome and encouraged.

### Areas for Improvement

1. **Dynamic Imports** – Better handling of `dynamic()` and lazy-loaded components
2. **Layout Optimization** – Improved graph algorithms for massive repositories (500+ files)
3. **Performance** – Caching strategies for repeated visualizations
4. **Export Options** – SVG/PNG export of generated graphs

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss your ideas.

---

## 🐛 Known Issues

- Large repositories (1000+ files) may experience slow initial parsing
- Private repositories require GitHub authentication (coming soon)
- Some edge cases with barrel exports need refinement

---

## 📝 Roadmap

- [ ] Authentication for private repositories
- [ ] Export visualizations as images
- [ ] Component dependency depth analysis
- [ ] Dark mode toggle
- [ ] VS Code extension
- [ ] Support for Pages Router projects

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Yash Kumar**

- GitHub: [@yashkr321](https://github.com/yashkr321)
- Project Link: [https://github.com/yashkr321/troql](https://github.com/yashkr321/troql)

---

## 🙏 Acknowledgments

- Inspired by the complexity of modern Next.js applications
- Built with [React Flow](https://reactflow.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

## ⭐ Star History

If you find Troql helpful, consider giving it a star! It helps others discover the project.

---

**Made with ☕ during a weekend hackathon**
