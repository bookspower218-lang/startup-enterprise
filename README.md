# ValidatePK

Pakistan's startup validation platform. Structured pitches → enterprise review → staged messaging → contact unlock.

## Quick start

```bash
npm install
cp .env.example .env   # fill Supabase URL + publishable key
npm run dev            # http://localhost:8080
```

## Stack

React 18 · Vite · TypeScript · Tailwind · shadcn · TanStack Query · Supabase

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Vitest |

## Supabase

Project ref: `fhflugezbzazoydzjeue`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` (and in your host's env vars when deploying).

After deploying, add your site URL to **Supabase → Authentication → URL configuration** (Site URL + redirect URLs including `/auth/complete`).
