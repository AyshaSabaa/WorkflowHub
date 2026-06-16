#!/usr/bin/env node
/**
 * Push schema + seed MongoDB Atlas (production).
 *
 * Usage:
 *   DATABASE_URL="mongodb+srv://..." npm run db:seed:prod
 */
import { execSync } from "child_process";

if (!process.env.DATABASE_URL?.startsWith("mongodb")) {
  console.error("DATABASE_URL must be a MongoDB Atlas connection string (mongodb+srv://...).");
  process.exit(1);
}

console.log("Pushing schema to MongoDB...");
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });

console.log("Seeding demo users and CRM data...");
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });

console.log("\n✓ MongoDB ready.");
console.log("  aysha@avishkarai.com");
console.log("  shivang@avishkarai.com");
console.log("  arpit@avishkarai.com");
