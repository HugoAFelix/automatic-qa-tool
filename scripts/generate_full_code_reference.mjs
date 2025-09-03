import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Directories/files to include
const includeDirs = ["src", "server", "tests", "lib", "scripts"];
const includeFiles = ["uno.config.js", "vite.config.js", "package.json"];
const binaryExts = [
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".pdf", ".zip", ".ico",
  ".ttf", ".otf", ".woff", ".woff2", ".map", ".jar", ".exe", ".dylib"
];

function isExcludedDir(rel) {
  const segs = rel.split(path.sep);
  return ["node_modules", ".vercel", "dist", "build", ".temp", ".cache", ".git"]
    .some((e) => segs.includes(e));
}

function isBinary(file) {
  return binaryExts.includes(path.extname(file).toLowerCase());
}

async function collect(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (isExcludedDir(rel)) continue;
    if (entry.isDirectory()) {
      files.push(...(await collect(full)));
    } else if (!isBinary(entry.name) && !entry.name.endsWith(".lock")) {
      const inDir = includeDirs.some((d) => rel.startsWith(d + path.sep));
      const isFile =
        includeFiles.includes(rel) ||
        (rel.startsWith("tsconfig") && rel.endsWith(".json"));
      if (inDir || isFile) files.push(rel);
    }
  }
  return files;
}

function fenceFor(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const map = { mjs: "js", cjs: "js", yml: "yaml" };
  return map[ext] ?? (ext || "text");
}

async function main() {
  const outFile = path.join(root, "docs/full_code_reference.md");
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const files = (await collect(root)).sort();

  // Load existing sections to minimize diffs
  let existingSections = new Map();
  try {
    const existing = await fs.readFile(outFile, "utf8");
    const regex = /^### (.+?)\n\n```[\s\S]*?\n```\n\n/gm;
    let match;
    while ((match = regex.exec(existing)) !== null) {
      existingSections.set(match[1], match[0]);
    }
  } catch {}

  let out = `# Full Code Reference\n\n`;
  out += `Includes source files from src, server, tests, lib, and scripts plus key config files. Excludes node_modules and build outputs.\n\n`;
  out += `Regenerate with \`npm run docs:code:regen\`.\n\n`;
  out += `## File Index\n\n`;
  for (const f of files) out += `- ${f}\n`;
  out += "\n";

  for (const f of files) {
    const content = (await fs.readFile(path.join(root, f), "utf8")).trimEnd();
    const fence = fenceFor(f);
    const block = `### ${f}\n\n\`\`\`${fence}\n${content}\n\`\`\`\n\n`;
    const existing = existingSections.get(f);
    out += existing && existing.trim() === block.trim() ? existing : block;
  }
  await fs.writeFile(outFile, out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
