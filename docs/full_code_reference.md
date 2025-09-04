# Full Code Reference

Includes source files from src, server, tests, lib, scripts, and .github/workflows plus key config files. Excludes node_modules and build outputs.

Regenerate with `npm run docs:code:regen`.

## File Index

- .github/workflows/main-test-workflow.yml
- .github/workflows/qa-test-general.yml
- package.json
- scripts/generate_full_code_reference.mjs
- scripts/generate_full_docs_reference.mjs

### .github/workflows/main-test-workflow.yml

```yaml
# This is the name of the workflow, which will be displayed in the GitHub Actions tab.
name: QA Test General

# Principle of least privilege for GITHUB_TOKEN
permissions:
  contents: read

# Manual trigger only (no cron) to avoid costs and automatic runs
on:
  workflow_dispatch:

# Ensure only one run at a time
concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  # --- Lighthouse: performance/SEO/best practices ---
  lighthouse:
    name: "Test de Performance (Lighthouse)"
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined in Settings > Secrets and variables > Actions."
            exit 1
          fi
          if echo "${{ vars.BASE_URL }}" | grep -qi 'google\.com'; then
            echo "Error: Do not use google.com as BASE_URL. Please define a real URL to test."
            exit 1
          fi
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @lhci/cli
      - name: "Run Lighthouse CI (1 run to optimize)"
        env:
          LHCI_BUILD_CONTEXT__CURRENT_HASH: ${{ github.sha }}
        run: |
          lhci autorun             --collect.url="${{ vars.BASE_URL }}"             --collect.numberOfRuns=1             --upload.target=temporary-public-storage

  # --- Pa11y (Axe): accesibilidad ---
  a11y:
    name: "Test de Accesibilidad (Pa11y)"
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined."
            exit 1
          fi
          if echo "${{ vars.BASE_URL }}" | grep -qi 'google\.com'; then
            echo "Error: Do not use google.com as BASE_URL."
            exit 1
          fi
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g pa11y-ci
      - name: "Run Pa11y with Axe"
        run: |
          BASE="${{ vars.BASE_URL }}"; BASE="${BASE%/}"
          cat > pa11yci.json <<EOF
          {
            "defaults": {
              "timeout": 30000,
              "runners": ["axe"],
              "chromeLaunchConfig": { "args": ["--no-sandbox","--disable-setuid-sandbox"] }
            },
            "urls": [
              "$BASE/",
              "$BASE/contacto/",
              "$BASE/blog/"
            ]
          }
          EOF
          pa11y-ci --config pa11yci.json

  # --- ZAP Baseline: seguridad pasiva ---
  zap_baseline:
    name: "Test de Seguridad Basico (ZAP)"
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined."
            exit 1
          fi
          if echo "${{ vars.BASE_URL }}" | grep -qi 'google\.com'; then
            echo "Error: Do not use google.com as BASE_URL."
            exit 1
          fi
      - uses: zaproxy/action-baseline@v0.14.0
        with:
          target: "${{ vars.BASE_URL }}"
          fail_action: false
          allow_issue_writing: false
          # omitimos artifact_name para evitar conflictos de nombres

  # --- WPScan (oficial vía Docker) ---
  wpscan:
    name: "Test de WordPress (WPScan)"
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined."
            exit 1
          fi
          if echo "${{ vars.BASE_URL }}" | grep -qi 'google\.com'; then
            echo "Error: Do not use google.com as BASE_URL."
            exit 1
          fi
      - name: "Check if target is WordPress (and accessible)"
        id: check_wp
        run: |
          BASE="${{ vars.BASE_URL }}"; BASE="${BASE%/}"
          CODE=$(curl -sL -A "Mozilla/5.0" --retry 2 --retry-all-errors -o /tmp/index.html -w "%{http_code}" --connect-timeout 7 --max-time 30 "$BASE/" || echo "000")
          # Si curl falló o no dejó archivo, asumimos que NO procede WPScan
          if [ ! -s /tmp/index.html ]; then
            echo "is_wordpress=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          if [ "$CODE" = "401" ] || [ "$CODE" = "403" ] || ! grep -qiE 'wp-content|wp-includes' /tmp/index.html; then
            echo "is_wordpress=false" >> $GITHUB_OUTPUT
          else
            echo "is_wordpress=true" >> $GITHUB_OUTPUT
          fi
      - name: "Run WPScan (official Docker image)"
        if: steps.check_wp.outputs.is_wordpress == 'true'
        run: |
          docker run --rm --pull always \
            -e WPSCAN_API_TOKEN="${{ secrets.WPSCAN_API_TOKEN }}" \
            wpscanteam/wpscan \
              --url "${{ vars.BASE_URL }}" \
              --stealthy \
              --ignore-main-redirect \
              --format cli
```

### .github/workflows/qa-test-general.yml

```yaml
# This is the name of the workflow, which will be displayed in the GitHub Actions tab.
name: QA Test General — Crawler + Matrix

# Principle of least privilege for GITHUB_TOKEN
permissions:
  contents: read

# Manual trigger only (no cron) to avoid costs and automatic runs
on:
  workflow_dispatch:
    inputs:
      url_offset:
        description: 'Número de URLs a saltar (ej: 30 para analizar el siguiente lote)'
        required: false
        default: '0'
      url_limit:
        description: 'Límite de URLs a analizar en esta corrida (opcional; sobreescribe MAX_URLS)'
        required: false
        default: ''
      analyze_all:
        description: 'Analizar TODAS las URLs encontradas (ignora límites). Puede tardar bastante.'
        type: boolean
        required: false
        default: false

# Ensure only one run at a time
concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  # Job 1: Discover all internal URLs using a robust crawler.
  discover-urls:
    name: "Paso 1: Descubrir URLs (Crawler)"
    runs-on: ubuntu-latest
    outputs:
      # The output is a JSON string array of URLs for consumption by matrix strategies.
      url_matrix: ${{ steps.make_matrix.outputs.urls }}
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: BASE_URL no está definida."
            exit 1
          fi
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: "Install and run Linkinator crawler"
        run: npm install -g linkinator@4
      - name: Ensure jq
        run: sudo apt-get update && sudo apt-get install -y jq
      - name: "Crawl site, filter, and limit URLs"
        id: crawl
        env:
          # Define MAX_URLS in Repo Settings > Secrets and Variables > Actions to control scope.
          BASE: ${{ vars.BASE_URL }}
          LIMIT: ${{ vars.MAX_URLS || 30 }}
        run: |
          set -e
          # Entradas de ejecución
          OFFSET=${{ github.event.inputs.url_offset || 0 }}
          REQ_LIMIT='${{ github.event.inputs.url_limit }}'
          ANALYZE_ALL='${{ github.event.inputs.analyze_all }}'

          BASE_URL_NO_SLASH="${BASE%/}"

          # Rastreo (no falla si hay links rotos)
          linkinator "$BASE_URL_NO_SLASH" --recurse --silent --timeout 10000 --format JSON > crawl.json || true
          # Si no hay JSON, coloca uno vacío para que jq no falle
          test -s crawl.json || echo '{"links":[]}' > crawl.json

          # Límite efectivo: prioridad al input; si vacío, usa MAX_URLS
          if [ -n "$REQ_LIMIT" ]; then
            EFFECTIVE_LIMIT="$REQ_LIMIT"
          else
            EFFECTIVE_LIMIT="$LIMIT"
          fi

          # Construye lista base (internas, status<400, no-binarias)
          jq -r '.links[] | select(.status < 400) | .url' crawl.json \
            | awk -v b="$BASE_URL_NO_SLASH" 'index($0,b)==1' \
            | grep -Eiv '\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|zip|rar|7z|gz|css|js|json|xml)$' \
            | sed 's/#.*$//' \
            | sort -u > urls.all.txt

          if [ "$ANALYZE_ALL" = "true" ]; then
            echo "⚠️  Modo ANALYZE_ALL activado: se analizarán TODAS las URLs encontradas. Puede tardar."
            sed -n '1,$p' urls.all.txt > urls.txt
          else
            START_LINE=$((OFFSET + 1))
            END_LINE=$((OFFSET + EFFECTIVE_LIMIT))
            sed -n "${START_LINE},${END_LINE}p" urls.all.txt > urls.txt
            echo "Lote: OFFSET=$OFFSET  LIMIT=$EFFECTIVE_LIMIT  (líneas ${START_LINE}..${END_LINE})"
          fi

          echo "Total URLs descubiertas: $(wc -l < urls.all.txt)"
          echo "URLs en este lote: $(wc -l < urls.txt)"

          # Pasa a JSON para la matriz
          jq -Rs 'split("\n") | map(select(length>0))' urls.txt > urls.json
      - name: "Prepare matrix for subsequent jobs"
        id: make_matrix
        run: echo "urls=$(cat urls.json)" >> "$GITHUB_OUTPUT"
      - name: "Upload discovered URLs as artifact"
        uses: actions/upload-artifact@v4
        with:
          name: discovered-urls
          path: urls.txt

  # Lighthouse job, now powered by the matrix
  lighthouse:
    needs: discover-urls
    if: needs.discover-urls.outputs.url_matrix != '[]' && needs.discover-urls.outputs.url_matrix != ''
    name: "Test de Performance (Lighthouse)"
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      matrix:
        url: ${{ fromJson(needs.discover-urls.outputs.url_matrix || '[]') }}
      fail-fast: false
      max-parallel: 3 # Control concurrency
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @lhci/cli
      - name: "Run Lighthouse CI on ${{ matrix.url }}"
        env:
          LHCI_BUILD_CONTEXT__CURRENT_HASH: ${{ github.sha }}
        run: |
          lhci autorun \
            --collect.url="${{ matrix.url }}" \
            --collect.numberOfRuns=1 \
            --upload.target=temporary-public-storage
      - name: "Upload Lighthouse artifact"
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-${{ strategy.job-index }}
          path: .lighthouseci/
          if-no-files-found: ignore

  # Pa11y job, now powered by the matrix
  a11y:
    needs: discover-urls
    if: needs.discover-urls.outputs.url_matrix != '[]' && needs.discover-urls.outputs.url_matrix != ''
    name: "Test de Accesibilidad (Pa11y)"
    runs-on: ubuntu-latest
    timeout-minutes: 12
    strategy:
      matrix:
        url: ${{ fromJson(needs.discover-urls.outputs.url_matrix || '[]') }}
      fail-fast: false
      max-parallel: 3 # Control concurrency
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g pa11y-ci
      - name: "Run Pa11y on ${{ matrix.url }}"
        run: |
          URL="${{ matrix.url }}"
          cat > pa11yci.json <<'EOF'
          {
            "defaults": {
              "timeout": 30000,
              "runners": ["axe"],
              "chromeLaunchConfig": { "args": ["--no-sandbox","--disable-setuid-sandbox"] }
            },
            "urls": ["__URL__"]
          }
          EOF
          sed -i "s|__URL__|${URL}|g" pa11yci.json
          set -o pipefail
          pa11y-ci --config pa11yci.json | tee pa11y-report.txt
      - name: "Upload Pa11y report artifact"
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pa11y-${{ strategy.job-index }}
          path: pa11y-report.txt
          if-no-files-found: ignore

  # ZAP Baseline scan (unchanged)
  zap_baseline:
    name: "Test de Seguridad Basico (ZAP)"
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined."
            exit 1
          fi
      - uses: zaproxy/action-baseline@v0.14.0
        with:
          target: "${{ vars.BASE_URL }}"
          fail_action: false
          allow_issue_writing: false

  # WPScan using official Docker image
  wpscan:
    name: "Test de WordPress (WPScan)"
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: "Sanity check BASE_URL"
        run: |
          if [ -z "${{ vars.BASE_URL }}" ]; then
            echo "Error: The BASE_URL variable is not defined."
            exit 1
          fi

      # 🔀 Toggle WPScan desde variable de repo
      - name: "WPScan toggle (repo var)"
        run: |
          if [ "${{ vars.WPSCAN_ENABLED || 'true' }}" != "true" ]; then
            echo "WPScan desactivado via WPSCAN_ENABLED!=true. Saliendo del job sin ejecutar el escaneo."
            exit 0
          fi

      - name: "Check if target is WordPress (and accessible)"
        if: ${{ vars.WPSCAN_ENABLED == 'true' }}
        id: check_wp
        run: |
          BASE="${{ vars.BASE_URL }}"; BASE="${BASE%/}"
          CODE=$(curl -sL -A "Mozilla/5.0" --retry 2 -o /tmp/index.html -w "%{http_code}" --max-time 15 "$BASE/" || echo "000")
          if [ ! -s /tmp/index.html ]; then
            echo "is_wordpress=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          if [ "$CODE" = "401" ] || [ "$CODE" = "403" ] || ! grep -qi 'wp-content' /tmp/index.html; then
            echo "is_wordpress=false" >> $GITHUB_OUTPUT
          else
            echo "is_wordpress=true" >> $GITHUB_OUTPUT
          fi

      - name: "Run WPScan (official Docker image)"
        if: ${{ vars.WPSCAN_ENABLED == 'true' && steps.check_wp.outputs.is_wordpress == 'true' && secrets.WPSCAN_API_TOKEN != '' }}
        run: |
          set -o pipefail
          docker run --rm wpscanteam/wpscan \
            --url "${{ vars.BASE_URL }}" \
            --stealthy \
            --ignore-main-redirect \
            --format cli \
            --api-token "${{ secrets.WPSCAN_API_TOKEN }}" | tee wpscan-report.txt

      - name: "Upload WPScan report artifact"
        if: ${{ vars.WPSCAN_ENABLED == 'true' && steps.check_wp.outputs.is_wordpress == 'true' }}
        uses: actions/upload-artifact@v4
        with:
          name: wpscan-report
          path: wpscan-report.txt
          if-no-files-found: ignore

  generate-report:
    name: "Paso Final: Generar Reporte Unificado"
    needs: [discover-urls, lighthouse, a11y, zap_baseline, wpscan]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: "Download all artifacts"
        uses: actions/download-artifact@v4
        with:
          path: reports

      - name: "Build full-report.md"
        run: |
          echo "# Reporte de Auditoría QA Completo" > full-report.md
          echo "Fecha: $(date)" >> full-report.md
          echo "" >> full-report.md

          if [ -f reports/discovered-urls/urls.txt ]; then
            echo "## URLs Analizadas" >> full-report.md
            nl -ba reports/discovered-urls/urls.txt >> full-report.md
            echo "" >> full-report.md
          fi

          echo "---" >> full-report.md
          echo "## Lighthouse" >> full-report.md
          if ls reports/lighthouse-*/.lighthouseci/*.html >/dev/null 2>&1; then
            for f in reports/lighthouse-*/.lighthouseci/*.html; do
              echo "### Archivo: $f" >> full-report.md
              echo "_(HTML embebido no se muestra en Markdown; abre el artefacto para verlo)_" >> full-report.md
              echo "" >> full-report.md
            done
          else
            echo "Sin artefactos de Lighthouse." >> full-report.md
          fi

          echo "---" >> full-report.md
          echo "## Accesibilidad (Pa11y)" >> full-report.md
          if ls reports/pa11y-*/pa11y-report.txt >/dev/null 2>&1; then
            for f in reports/pa11y-*/pa11y-report.txt; do
              echo "### Archivo: $f" >> full-report.md
              echo '```' >> full-report.md
              cat "$f" >> full-report.md
              echo '```' >> full-report.md
              echo "" >> full-report.md
            done
          else
            echo "Sin artefactos de Pa11y." >> full-report.md
          fi

          echo "---" >> full-report.md
          echo "## Seguridad (ZAP)" >> full-report.md
          if [ -f reports/zap_scan/report_md.md ]; then
            cat reports/zap_scan/report_md.md >> full-report.md
          else
            echo "Sin artefacto de ZAP." >> full-report.md
          fi
          echo ""

          echo "---" >> full-report.md
          echo "## WordPress (WPScan)" >> full-report.md
          if [ -f reports/wpscan-report/wpscan-report.txt ]; then
            echo '```' >> full-report.md
            cat reports/wpscan-report/wpscan-report.txt >> full-report.md
            echo '```' >> full-report.md
          else
            echo "El análisis de WPScan no se ejecutó o no generó artefacto." >> full-report.md
          fi
      - name: "Upload consolidated report"
        uses: actions/upload-artifact@v4
        with:
          name: full-qa-report
          path: full-report.md
```

### package.json

```json
{
  "name": "workspace",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "docs:code:regen": "node scripts/generate_full_code_reference.mjs",
    "docs:docs:regen": "node scripts/generate_full_docs_reference.mjs"
  }
}
```

### scripts/generate_full_code_reference.mjs

```js
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Directories/files to include
const includeDirs = [
  "src",
  "server",
  "tests",
  "lib",
  "scripts",
  ".github/workflows",
];
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
  out += `Includes source files from src, server, tests, lib, scripts, and .github/workflows plus key config files. Excludes node_modules and build outputs.\n\n`;
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
```

### scripts/generate_full_docs_reference.mjs

```js
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
```

