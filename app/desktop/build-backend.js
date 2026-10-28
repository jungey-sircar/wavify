const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outputDir = path.join(root, "..", "backend", "bin");
const output = path.join(outputDir, "wavify-server.exe");

fs.mkdirSync(outputDir, { recursive: true });
const result = spawnSync(
  process.platform === "win32" ? "go.exe" : "go",
  ["build", "-trimpath", "-ldflags", "-s -w", "-o", output, "."],
  { cwd: path.join(root, "..", "backend"), stdio: "inherit" }
);

if (result.error) {
  console.error(`Unable to build the Wavify service: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
