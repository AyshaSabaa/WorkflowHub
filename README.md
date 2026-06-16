# WorkflowHub

Enterprise workflow management platform with Kanban boards, task management, analytics, and automation.

## Setup (MongoDB Atlas)

See **[docs/MONGODB_ATLAS.md](docs/MONGODB_ATLAS.md)** for Atlas cluster setup and Vercel deployment.

```bash
cd workflow-hub
npm install
cp .env.example .env
# Set DATABASE_URL to your MongoDB Atlas URI in .env

npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| aysha@avishkarai.com | hello123 | Admin |
| shivang@avishkarai.com | hello123 | Manager |
| arpit@avishkarai.com | hello123 | Manager |

## Stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · MongoDB Atlas · Prisma · JWT

## Production (Vercel)

Set `DATABASE_URL` (MongoDB Atlas), `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` in Vercel. The build runs `prisma db push` automatically. Seed production once with `npm run db:seed:prod`.
