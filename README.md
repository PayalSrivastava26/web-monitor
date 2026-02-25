# WebWatch — Web Monitor

Track website changes and get AI-powered summaries instantly.

## How to Run

1. Clone the repo: `git clone https://github.com/PayalSrivastava26/web-monitor.git`
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your keys
4. `npm run dev` → open http://localhost:3000

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Supabase Tables Required
```sql
create table links (id uuid default gen_random_uuid() primary key, url text not null, created_at timestamp default now(), summary text, tag text);
create table snapshots (id uuid default gen_random_uuid() primary key, link_id uuid references links(id) on delete cascade, content text, created_at timestamp default now());
create table checks (id uuid default gen_random_uuid() primary key, link_id uuid references links(id) on delete cascade, changed boolean, summary text, diff text, created_at timestamp default now());
```

## What's Done
- Add 1–8 URLs with optional tags
- Fetch & diff page content against last snapshot
- AI summary of changes (OpenAI GPT)
- History: last 5 snapshots kept per link
- Status page: backend / DB / LLM health
- Links page grouped by tag
- Input validation and error handling

## What's Not Done
- Auth / per-user links
- Email/Slack alerts
- Scheduled auto-checks (cron)
## What I Used AI For
- Generating Next.js API route boilerplate
- Writing the diff logic and snapshot pruning
- Drafting the AI summary prompt
- Tailwind UI layout and dark theme structure
- Debugging PostCSS/Tailwind v4 config issues

## What I Checked & Did Myself
- Supabase schema design (links, snapshots, checks tables)
- Verified all API routes return consistent response shapes
- Tested edge cases: duplicate URLs, empty input, unreachable sites
- Fixed OpenAI vs Anthropic key mismatch
- Debugged and fixed urls vs url naming mismatch between frontend and API
- Confirmed snapshot history limit works correctly
