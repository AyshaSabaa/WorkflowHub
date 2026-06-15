# WorkflowHub

Enterprise workflow management platform with Kanban boards, task management, analytics, and automation.

## Setup (SQLite — no Docker or PostgreSQL required)

```bash
cd workflow-hub
npm install
cp .env.example .env

npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000

The database file is created at `prisma/dev.db`.

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@workflowhub.com | admin123 | Admin |
| manager@workflowhub.com | demo123 | Manager |
| employee@workflowhub.com | demo123 | Employee |

## Stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · SQLite · Prisma · JWT

## Optional: PostgreSQL via Docker

A `docker-compose.yml` is included if you prefer PostgreSQL in production-like environments. Switch `prisma/schema.prisma` provider back to `postgresql` and update `DATABASE_URL` accordingly.
