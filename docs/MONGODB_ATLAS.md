# MongoDB Atlas Setup — Avishkar AI CRM

This app uses **Prisma + MongoDB Atlas** (not SQLite or PostgreSQL). Vercel serverless functions require a hosted database; the local `file:./dev.db` SQLite URL will not work in production.

## 1. Create a MongoDB Atlas cluster

1. Sign in at [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create** → **Shared (MEV)** → pick a cloud region close to your Vercel region
3. Cluster name: e.g. `Cluster0` → **Create**

## 2. Database user

1. **Database Access** → **Add New Database User**
2. Authentication: **Password**
3. Username: e.g. `workflowhub`
4. Generate a strong password and save it
5. Privileges: **Read and write to any database** (or scoped to `avishkar-crm`)
6. **Add User**

## 3. Network access

1. **Network Access** → **Add IP Address**
2. For Vercel: **Allow Access from Anywhere** (`0.0.0.0/0`)
3. For local dev only: add your current IP

> Atlas free tier requires `0.0.0.0/0` for Vercel because serverless IPs are dynamic.

## 4. Connection string

1. **Database** → **Connect** → **Drivers** → **Node.js**
2. Copy the URI and replace placeholders:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/avishkar-crm?retryWrites=true&w=majority&appName=Cluster0
```

| Part | Example |
|------|---------|
| Username | `workflowhub` |
| Password | URL-encode special chars (`@` → `%40`, `#` → `%23`) |
| Cluster host | `cluster0.xxxxx.mongodb.net` |
| Database name | `avishkar-crm` (after `.net/`) |

**No `DIRECT_URL` is required** for MongoDB with Prisma.

## 5. Local development

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="mongodb+srv://workflowhub:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/avishkar-crm?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="your-local-jwt-secret"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Push schema and seed:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Demo logins (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@workflowhub.com | admin123 | Admin |
| manager@workflowhub.com | demo123 | Manager |

## 6. Vercel deployment

### Environment variables

In **Vercel → Project → Settings → Environment Variables**, set for **Production**, **Preview**, and **Development**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your MongoDB Atlas URI |
| `JWT_SECRET` | Long random string (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `NEXT_PUBLIC_APP_URL` | `https://workflow-hub-beta.vercel.app` (or your domain) |

Do **not** set `DIRECT_URL`.

### Build

`vercel.json` runs `scripts/vercel-build.mjs`, which:

1. `prisma generate`
2. `prisma db push` (creates/updates collections and indexes)
3. `next build`

### Seed production (once per environment)

After the first successful deploy with `DATABASE_URL` set:

```bash
DATABASE_URL="mongodb+srv://..." npm run db:seed:prod
```

Or from your machine with the production URI:

```bash
npm run db:seed:prod
```

### Redeploy

Push to GitHub or run `vercel --prod` after env vars are configured.

## 7. Prisma commands (MongoDB)

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:push` | Sync schema to Atlas (no SQL migrations) |
| `npm run db:seed` | Seed demo users, boards, deals |
| `npm run db:seed:prod` | Push + seed for production |

MongoDB does **not** use `prisma migrate`. The `prisma/migrations` folder was removed.

## 8. Verify after deploy

1. **Login** — `admin@workflowhub.com` / `admin123`
2. **User lookup** — Settings → Users list loads
3. **Create deal** — Sales Pipeline → add card in a stage
4. **Pipeline** — Kanban drag-and-drop between stages
5. **Dashboard** — Charts and recent activity load

## 9. Troubleshooting

| Error | Fix |
|-------|-----|
| `PrismaClientInitializationError` | `DATABASE_URL` missing or wrong on Vercel |
| `bad auth` | Wrong username/password; URL-encode password |
| `IP not whitelisted` | Add `0.0.0.0/0` in Atlas Network Access |
| `URL must start with mongo` | `.env` still has `file:./dev.db` — replace with Atlas URI |
| Empty app after deploy | Run `npm run db:seed:prod` with production `DATABASE_URL` |
