<<<<<<< HEAD
# Startup Enterprise

B2B startup validation marketplace (PKR). Structured pitches → company Interest/Pass → staged payments → messaging → full contact at Stage 4.

## Quick start

```bash
npm install
cp .env.example .env   # fill from SECRETS.txt (local only, not in repo)
npm run dev            # http://localhost:8080
```

## Lab / GitHub setup

See **[LAB-SETUP.txt](./LAB-SETUP.txt)** for cloning from GitHub and configuring a new machine.

Secrets template: **[SECRETS.example.txt](./SECRETS.example.txt)** — copy to `SECRETS.txt` locally (gitignored).

## Stack

React 18 · Vite · TypeScript · Tailwind · shadcn · TanStack Query · Supabase

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 8080) |
| `npm run build` | Production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |

## Supabase

Project ref: `fhflugezbzazoydzjeue` (see your `.env`)

```bash
supabase link --project-ref fhflugezbzazoydzjeue
supabase db push
```
=======
# Welcome to your Lovable project

TODO: Document your project here
>>>>>>> 5e99968392e79ca4817bb7a35153320c280a7ceb
