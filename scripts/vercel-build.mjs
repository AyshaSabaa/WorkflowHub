import { execSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.error(
    "\n❌ DATABASE_URL is missing.\n\n" +
      "Add MongoDB Atlas connection string to Vercel → Settings → Environment Variables:\n" +
      '  DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/avishkar-crm?retryWrites=true&w=majority"\n\n' +
      "Then redeploy.\n"
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith("mongodb")) {
  console.error(
    "\n❌ DATABASE_URL must be a MongoDB URI (mongodb+srv://...).\n" +
      `   Got: ${process.env.DATABASE_URL.split(":")[0]}:\n`
  );
  process.exit(1);
}

console.log("→ prisma generate");
execSync("npx prisma generate", { stdio: "inherit" });

// Schema is pushed once via `npm run db:push` or `npm run db:seed:prod` from a trusted network.
// Do not run db push on every Vercel build — Atlas IP rules may block build machines.
console.log("→ next build");
execSync("npx next build", { stdio: "inherit" });
