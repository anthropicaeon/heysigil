import { spawn } from "node:child_process";

const tests = ["test:core", "test:sdk", "test:mcp"];

function runScript(name) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? "cmd.exe" : "npm";
    const args = isWindows ? ["/d", "/s", "/c", "npm.cmd", "run", name] : ["run", name];
    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: false,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed: ${name} (exit ${code})`));
      }
    });
  });
}

for (const test of tests) {
  await runScript(test);
}

console.log("PASS all smoke tests");
