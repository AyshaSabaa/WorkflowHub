import { rmSync } from "fs";
import { join } from "path";
import { freePort } from "./free-port.mjs";

const root = process.cwd();
const nextDir = join(root, ".next");

freePort(3000);

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
} catch (error) {
  console.warn("Could not remove .next:", error instanceof Error ? error.message : error);
}
