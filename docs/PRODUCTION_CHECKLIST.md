# Production Checklist

This checklist separates what is already implemented from what still needs real credentials or paid infrastructure.

## Done

- Frontend deployed on Vercel.
- Backend deployed on Railway.
- Docker Compose local startup.
- Backend health endpoint.
- File type and size validation.
- Async document ingestion.
- Citation-backed chat response contract.
- Optional authentication and per-user data isolation.
- Document rename, delete, bulk delete, search, reindex, and chunk/source viewing.
- Backend pytest coverage for file validation, parsing, chunking, and chat API mocks.
- RAG evaluation scaffold with sample documents.
- GitHub Actions CI for backend tests and frontend lint/typecheck/build.

## Required Before Demo

- Set `DEEPSEEK_API_KEY` on Railway.
- Confirm health check returns `"llm_configured": true`.
- Run one full demo flow: upload, processing, ask question, inspect sources.
- Add a screenshot or GIF to README after recording.

## Strong Next Steps

- Add a custom domain.
- Connect Vercel and Railway directly to GitHub for automatic deployments.
- Add a Railway volume or external storage for:
  - `CHROMA_PERSIST_DIR`
  - `METADATA_DB_PATH`
  - `UPLOAD_DIR`
- Move metadata from SQLite to PostgreSQL for production.
- Move uploaded files to S3, Cloudflare R2, or Supabase Storage.
- Add rate limiting for upload and chat endpoints.
- Add Sentry or another error monitoring service.
- Add CI deployment status badges to README after GitHub Actions runs.
