import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

function isExcluded(rel) {
  return (
    rel.startsWith("exampleproject") ||
    rel === "full_code_reference.md" ||
    rel === "full_docs_reference.md"
  );
}

async function collect(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(docsDir, full);
    if (entry.isDirectory()) {
      if (!isExcluded(rel)) files.push(...(await collect(full)));
    } else if (entry.isFile() && path.extname(entry.name) === ".md" && !isExcluded(rel)) {
      files.push(rel);
    }
  }
  return files;
}

async function main() {
  await fs.mkdir(docsDir, { recursive: true });
  const files = (await collect(docsDir)).sort();
  let out = "# Full Docs Reference\n\n";
  out += "Aggregated markdown documentation for this repository.\n";
  out += "Regenerate with `npm run docs:docs:regen`.\n";
  for (const f of files) {
    const content = await fs.readFile(path.join(docsDir, f), "utf8");
    out += `\n---\n# File: ${f}\n\n${content}\n`;
  }
  await fs.writeFile(path.join(docsDir, "full_docs_reference.md"), out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
