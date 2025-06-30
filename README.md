# 🌐 Typhoon Translate UI

A real-time Markdown-aware translation web app for Thai/English powered by Ollama and local LLMs.

---

## 🚀 Features

- 🔁 Auto-detect language: TH → EN / EN → TH
- ✨ Preserve Markdown formatting (headings, lists, bold, etc.)
- 🌗 Toggle dark/light theme
- ⚙️ Configurable model and system prompt
- 💬 Copy translated result with one click
- 🔒 Fully local (no API keys or internet needed)

---

## 📦 Installation

### 1. Install [Ollama](https://ollama.com)

```bash
brew install ollama       # on macOS
winget install Ollama.Ollama  # on Windows
```

### 2. Pull the model

```bash
ollama pull scb10x/typhoon-translate-4b
```

### 3. Clone and Run

```bash
git clone https://github.com/Suphanat1722/typhoon-translate-ui.git
cd typhoon-translate-ui
open index.html   # or double-click index.html
```

---

## 🛠️ Tech Stack

- ✅ HTML, CSS, JavaScript (Vanilla)
- ✅ Font Awesome (icons)
- ✅ Marked.js (Markdown parsing)
- ✅ Ollama (local LLM backend)

No frameworks, no build tools. Just open and run.

---

## 📄 License

MIT - see [LICENSE](./LICENSE) for details.

---

## 🙌 Credits

- [Ollama](https://ollama.com)
- [Marked.js](https://github.com/markedjs/marked)
- Model by [SCB 10X](https://huggingface.co/scb10x/typhoon-translate-4b)

---

## 💡 Future Ideas

- [ ] Export to PDF
- [ ] Add language switch selector
- [ ] Store translation history
- [ ] Text-to-speech output

> Pull requests welcome 🙏
