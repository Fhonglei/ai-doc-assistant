# Demo Script

Use this script to record a 60-90 second demo GIF/video for your resume and README.

## Demo URLs

- Frontend: https://frontend-fhongleis-projects.vercel.app
- Backend health: https://mindful-determination-production-e41c.up.railway.app/api/health

## Before Recording

1. Configure `DEEPSEEK_API_KEY` on Railway.
2. Confirm `/api/health` returns `"llm_configured": true`.
3. Prepare a short PDF, DOCX, or TXT file that you are allowed to share.
4. Keep the file small for the demo, ideally under 1 MB.

## Suggested Demo File

Create a small TXT file called `internship_notes.txt`:

```text
Honglei is applying for AI engineering internships.
Portfolio projects should include a deployed demo, clear README, tests, Docker setup, and a short explanation of technical tradeoffs.
AI document assistants should cite sources, isolate user data, validate files, and handle failed uploads gracefully.
```

## Recording Flow

1. Open the frontend.
2. Upload `internship_notes.txt`.
3. Wait for the document status to become ready.
4. Ask: `What should I highlight when applying for AI internships?`
5. Show that the answer includes citations.
6. Open the source/chunk viewer to show retrieved evidence.
7. Rename the document.
8. Use search in the documents panel.
9. Show the backend health URL in a browser tab.

## What To Say In An Interview

This is a RAG document Q&A system. The backend validates uploaded files, parses PDF/DOCX/TXT, chunks text, stores embeddings in ChromaDB, retrieves relevant chunks, and generates citation-backed answers. The frontend handles upload state, streaming chat, document management, and source inspection.

## Known Production Gaps

- Configure a real LLM key before showing the full chat flow.
- Add persistent storage for Railway so uploaded files and indexes survive redeploys.
- Add a custom domain for a more professional resume link.
