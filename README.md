# 📄 AI Document Assistant

**RAG-powered document Q&A system** — Upload PDF, DOCX, or TXT files, then ask questions in natural language. Get AI-generated answers with inline citations to your source documents.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![Tech Stack](https://img.shields.io/badge/FastAPI-0.110-teal?logo=fastapi) ![Tech Stack](https://img.shields.io/badge/ChromaDB-vector--db-orange) ![Tech Stack](https://img.shields.io/badge/DeepSeek-LLM-blue)

## ✨ Features

- **📤 Multi-format Upload** — PDF, DOCX, TXT with drag-and-drop support
- **🔍 Smart Retrieval** — Two-stage search: ChromaDB embedding similarity + LLM reranking
- **💬 Streaming Chat** — Real-time SSE streaming responses with markdown rendering
- **📎 Source Citations** — Inline `[1]` `[2]` citation badges that expand to show source text
- **📚 Multi-Document Queries** — Ask questions across multiple documents simultaneously
- **💾 Conversation History** — All chats saved with automatic title generation
- **🌙 Dark Mode** — Toggle light/dark theme (persisted)
- **📱 Responsive** — Three-panel layout with mobile drawers
- **🎯 Scoped Search** — Select specific documents or search all

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Next.js 14 │────▶│   FastAPI    │────▶│  DeepSeek  │
│  (Vercel)   │◀────│  (Railway)   │◀────│    API     │
└─────────────┘     └──────┬───────┘     └────────────┘
                           │
                    ┌──────┴───────┐
                    │   ChromaDB   │
                    │  (embedded)  │
                    └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- DeepSeek API key (or OpenAI API key)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # or place .env in repo root
# Edit .env with your DEEPSEEK_API_KEY
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your backend URL
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/v1/documents/upload` | Upload a document |
| `GET` | `/api/v1/documents` | List all documents |
| `GET` | `/api/v1/documents/{id}` | Get document details |
| `DELETE` | `/api/v1/documents/{id}` | Delete document + chunks |
| `POST` | `/api/v1/chat/send` | Send query (streaming SSE) |
| `POST` | `/api/v1/conversations` | Create conversation |
| `GET` | `/api/v1/conversations` | List conversations |
| `GET` | `/api/v1/conversations/{id}` | Get conversation + messages |

## 🗂️ Project Structure

```
ai-doc-assistant/
├── backend/                # FastAPI + ChromaDB
│   ├── main.py            # App entry point
│   ├── config.py          # Environment config
│   └── app/
│       ├── api/           # REST endpoints
│       ├── core/          # Parser, chunker, embedder, retriever, generator
│       ├── db/            # ChromaDB + SQLite stores
│       ├── models/        # Pydantic schemas
│       └── utils/         # File validation, error handlers
├── frontend/              # Next.js 14 + Tailwind
│   └── src/
│       ├── app/           # App Router pages
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # API client, types, utils
│       └── stores/        # Zustand state stores
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)

```bash
DEEPSEEK_API_KEY=sk-...      # Required
OPENAI_API_KEY=sk-...        # Optional fallback
CHROMA_PERSIST_DIR=./data    # Vector DB storage
MAX_FILE_SIZE_MB=50          # Upload size limit
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚢 Deployment

### Backend → Railway
1. Push to GitHub
2. Connect Railway to repo → select `backend/` directory
3. Add environment variables in Railway dashboard
4. Attach a volume at `/app/data` for persistence
5. Deploy!

### Frontend → Vercel
1. Push to GitHub
2. Connect Vercel to repo → select `frontend/` directory
3. Set `NEXT_PUBLIC_API_URL` to your Railway URL
4. Deploy!

## 📄 License

MIT

---

Built with ❤️ using [Claude Code](https://claude.ai/code), [DeepSeek](https://deepseek.com), and [Next.js](https://nextjs.org)
