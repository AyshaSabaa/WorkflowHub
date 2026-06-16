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
  console.warn("⚠ DATABASE_URL does not look like a MongoDB URI. Expected mongodb+srv://...");
}

console.log("→ prisma generate");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("→ prisma db push");
execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

console.log("→ next build");
execSync("npx next build", { stdio: "inherit" });
