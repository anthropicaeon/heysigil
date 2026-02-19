import { spawn } from "node:child_process";

const baseTests = ["test:core", "test:sdk", "test:mcp"];
const remoteTests = ["test:mcp:remote", "test:mcp:authz", "test:agent:flow"];
const runRemote = process.env.RUN_REMOTE_MCP_TESTS === "1";
const tests = runRemote ? [...baseTests, ...remoteTests] : baseTests;

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

if (!runRemote) {
  console.log("PASS local smoke tests (set RUN_REMOTE_MCP_TESTS=1 to include remote MCP tests)");
} else {
  console.log("PASS all smoke tests");
}
