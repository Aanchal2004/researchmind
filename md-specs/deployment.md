# Deployment Notes

## Recommended MVP Stack
- Frontend: Vercel
- Backend: Railway or Render
- Database: Supabase
- Cache: Upstash Redis
- Storage: S3 or Cloudflare R2

## Environment Variables
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- REDIS_URL
- OPENAI_API_KEY or ANTHROPIC_API_KEY
- ARXIV / SEMANTIC_SCHOLAR / PUBMED / CROSSREF credentials if needed

## Principle
Use managed services first, then move to AWS or Bedrock selectively later.
