<div align="center">

<img src="./public/favicon.svg" alt="MermaidFlow logo" width="96" height="96" />

# MermaidFlow

### **Mermaid diagrams, brought to life.**

A fast, beautiful, 100% client-side Mermaid editor — with live preview, interactive presentation mode, on-the-fly styling, and one-click export to PNG / SVG / PDF.

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Built with Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Mermaid](https://img.shields.io/badge/Mermaid-11-FF3670?logo=mermaid&logoColor=white)](https://mermaid.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-00D4AA)](#license)

[**🚀 Live Demo**](https://pkulal.github.io/mermaid-canvas/) · [**📚 Mermaid Docs**](https://mermaid.js.org/intro/) · [**🐛 Report a Bug**](https://github.com/PKulal/mermaid-canvas/issues)

<br />

<img src="./docs/screenshots/hero.png" alt="MermaidFlow editor screenshot" width="900" />

</div>

---

## ✨ Why MermaidFlow?

> Most Mermaid editors stop at *"write code → see picture."* MermaidFlow goes further.
> Style your diagrams without touching code. Walk an audience through them node by node. Export print-ready files in one click. Share with a link — no account, no backend.

<br />

## 🎯 Features

<table>
  <tr>
    <td width="50%" valign="top">

### ⚡ **Live Editor**
Monaco-powered code editor with **Mermaid syntax highlighting**, instant live preview, and smart auto-detection of diagram types — flowchart, sequence, ER, class, gantt, state, mindmap, pie, gitGraph.

  </td>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/editor.png" alt="Live editor" />
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/style-panel.png" alt="Style panel" />
    </td>
    <td width="50%" valign="top">

### 🎨 **Style Panel**
Re-theme your diagram **without writing any code**. Choose a preset (Default · Base · Dark · Forest · Neutral), pick custom node fill / text / border / line / background colors, swap fonts — all from a single popover. Persisted to your browser.

  </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🎬 **Present Mode**
Turn any flowchart into an interactive walkthrough. Click **Present** and step through your diagram **node by node**, with breadcrumbs of the path you've taken. Great for design reviews, demos, and onboarding.

  </td>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/present-mode.png" alt="Present mode" />
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/export-dialog.png" alt="Export dialog" />
    </td>
    <td width="50%" valign="top">

### 📤 **Export Anywhere**
One unified **Export** dialog with **live preview** for every format:
- **PNG** — 2× retina raster, perfect for slides and docs
- **SVG** — crisp vector, scales infinitely
- **PDF** — A4 page-ready, centered with margins

  </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🔗 **Shareable Links**
Every diagram is encoded into the URL — share a link, your collaborator opens **exactly your diagram**, no sign-in, no upload. 100% client-side.

  </td>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/share.png" alt="Share link" />
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/history.png" alt="History sidebar" />
    </td>
    <td width="50%" valign="top">

### 🕘 **History & Templates**
Auto-saved versions of every valid diagram you create, plus a curated gallery of **ready-to-use templates** for the most common diagram types. Click and go.

  </td>
  </tr>
</table>

<br />

## 🪄 Highlights

- 🌗 **Light & Dark themes** — UI and diagram themes that follow your system
- 🔍 **Pan & zoom canvas** — drag to pan, scroll to zoom, fit-to-view in one click
- ⌨️ **Keyboard shortcuts** — `Cmd/Ctrl + Enter` to force re-render
- 💾 **Auto-save** — every keystroke persisted to `localStorage`
- 🔒 **Zero backend** — runs entirely in your browser; your diagrams never leave your machine
- 📦 **Tiny deploy footprint** — static files, host anywhere (GitHub Pages, Netlify, Vercel, S3)
- 🎯 **Production-grade UI** — accessible Radix primitives, polished shadcn/ui components

<br />

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite + TypeScript |
| **Diagram Engine** | [Mermaid 11](https://mermaid.js.org) |
| **Editor** | [Monaco](https://microsoft.github.io/monaco-editor/) (the editor powering VS Code) |
| **State** | [Zustand](https://zustand.docs.pmnd.rs) |
| **UI** | Tailwind CSS · [shadcn/ui](https://ui.shadcn.com) · Radix UI primitives |
| **Icons** | [Lucide](https://lucide.dev) |
| **Export** | `jsPDF` · `html2canvas` · native SVG serialization |

<br />

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/PKulal/mermaid-canvas.git
cd mermaid-canvas

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# → open http://localhost:8080
```

### Build for production

```bash
npm run build       # output: dist/
npm run preview     # serve the production build locally
```

<br />

## 📁 Project Structure

```
src/
├── pages/              # Landing & Editor page components
├── components/
│   ├── editor/         # Style panel, Export dialog, Present mode, History, Templates
│   ├── ui/             # shadcn/ui primitives (Button, Dialog, Popover, …)
│   └── MermaidDiagram  # The actual renderer
├── lib/                # Pure logic: exporters, mermaid-utils, parser, init helpers
├── store/              # Zustand store
└── hooks/              # usePanZoom, …
```

<br />

## 🤝 Contributing

Contributions are warmly welcome! Whether it's a bug fix, a new feature, or a doc tweak —

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-cool-thing`
3. Commit your changes: `git commit -m "feat: add my cool thing"`
4. Push to the branch: `git push origin feat/my-cool-thing`
5. Open a **Pull Request**

<br />

## 📜 License

Released under the [MIT License](LICENSE). Free to use, modify, and distribute.

<br />

<div align="center">

**Built with 💚 and a lot of arrows pointing at things.**

If MermaidFlow saves you time, [give it a ⭐ on GitHub](https://github.com/PKulal/mermaid-canvas)!

</div>
