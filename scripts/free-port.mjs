import { execSync } from "child_process";

export function freePort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf8" });
    const pids = new Set(
      out
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid) && pid !== String(process.pid))
    );
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} using port ${port}`);
      } catch {
        // Process may have already exited.
      }
    }
  } catch {
    // Port is free.
  }
}

freePort(Number(process.argv[2]) || 3000);
