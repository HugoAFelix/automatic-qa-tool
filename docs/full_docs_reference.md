# Full Docs Reference

Aggregated markdown documentation for this repository.
Regenerate with `npm run docs:docs:regen`.

---
# File: 1_ARCHITECTURE.md

# 1. System Architecture

The solution has two main parts that can work together or independently to provide a complete QA system.

### The Architect (Custom GPT)
A conversational assistant used for **planning and strategy**. Responsibilities:

* Generate detailed test plans.
* Draft use cases and acceptance criteria.
* Prototype and write initial code for CI workflows such as the one used here.

### The Executor (GitHub Actions Workflow)
A set of automated "robots" that live in the repository and handle the **repetitive work and technical execution**. Responsibilities:

* Accept a URL as input.
* Run the four technical analyses in parallel (Lighthouse, Pa11y, ZAP, WPScan).
* Report results directly in the GitHub Actions run logs.


---
# File: 2_IMPLEMENTATION_GUIDE.md

# 2. Implementation Guide (Step by Step)

Follow these steps to implement the tool.

### Prerequisites
You only need two things:

1. A free **GitHub account**.
2. A free **WPScan API token**, available at [wpscan.com/api](https://wpscan.com/api).

### Setup Steps

**1. Create the repository:**
* Create a new repository on GitHub.
* **Make it Public** to take advantage of free runner minutes.
* Initialize it with a `README.md` file.

**2. Create the workflow file:**
* In the repository, create this folder and file structure: `.github/workflows/main-test-workflow.yml`.
* Paste the workflow content into that file.

**3. Configure secrets and variables:**
* Go to `Settings` > `Secrets and variables` > `Actions`.
* Under **Secrets**, create a new secret:
    * **Name:** `WPSCAN_API_TOKEN`
    * **Value:** paste your WPScan API token.
* Under **Variables**, create a new variable:
    * **Name:** `BASE_URL`
    * **Value:** the website URL to test (e.g., `https://your-site.com`).


---
# File: 3_USAGE.md

# 3. Usage Guide

Once configured, the tool is straightforward to use.

### Run the Checks
1. Go to the **Actions** tab of your repository.
2. Select the **QA Test General** workflow in the sidebar.
3. Click **Run workflow**.

The logs and results for each of the four checks appear in the run summary.

### Test a Different Website
To test another site:
1. Navigate to `Settings` > `Secrets and variables` > `Actions` > `Variables`.
2. **Update the `BASE_URL` value** with the new address.
3. Return to the Actions tab and run the workflow again.


---
# File: 4_EXPANSION.md

# 4. Expansion & Considerations

### Tool Expansion
The tool is built to be extensible. Because it relies on GitHub Actions, the possibilities are almost unlimited. Potential enhancements include:

* **Add new types of checks:**
    * A broken link checker (`lychee-link-checker`).
    * Visual regression tests to catch unexpected UI changes.
    * HTML/CSS validation tests.
* **Improve notifications:**
    * Set up a bot to post summaries to **Slack** or **Discord**.
    * Send an email report after the checks finish.
* **Integrate with GPT (Phase 3):**
    * Create GPT "Actions" that can trigger this workflow and read results via the GitHub API, enabling full control from a conversational interface.
* **Advanced multipage testing:**
    * Modify the workflow to accept a list of URLs and run the checks across all of them, not just predefined ones.

### Cost & Security Considerations
* **Cost:** The tool is **100% free** as long as the repository is public.
* **Security:**
    * `WPSCAN_API_TOKEN` is stored securely using GitHub Secrets.
    * The workflow uses read-only permissions (`contents: read`) to follow the principle of least privilege.
    * The WPScan free tier allows 25 requests per day; the API automatically blocks requests beyond that limit, preventing any charges.


---
# File: development-setup.md

# Local Development Environment & Tooling

This guide outlines the minimal tooling required to generate the aggregated documentation artifacts used by this repository:

- **Full Code Reference** → `npm run docs:code:regen`
- **Full Docs Reference** → `npm run docs:docs:regen`

> **Note:** Database export artifacts (e.g., `full_database_reference.md`) are **not part of this repository’s workflow**. They are only applicable in other projects. See **Optional database prerequisites** below.

## Requirements

- **Node.js v18 or newer** available on your PATH.
- A working shell (bash/zsh/PowerShell) with permission to install developer tools.

## Install Node.js (choose one path)

### macOS (Homebrew)
```bash
brew install node@18
echo 'export PATH="$(brew --prefix)/opt/node@18/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
node -v
```

### Linux (nvm)
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18
node -v
```

### Windows (winget)
```powershell
winget install OpenJS.NodeJS.LTS
node -v
```

## After cloning the repository

Once the scripts are present in `package.json`:

```bash
npm run docs:code:regen
npm run docs:docs:regen
```

These commands (re)generate:
- `docs/full_code_reference.md`
- `docs/full_docs_reference.md`

## Optional database prerequisites (only if applicable in another project)

If you later enable a **database reference** workflow (not part of this repository), you will typically need:

- Node package:
```bash
npm i dotenv
```

- PostgreSQL client tools (for `pg_dump`):
  - **macOS (Homebrew)**
    ```bash
    brew install libpq
    echo 'export PATH="$(brew --prefix)/opt/libpq/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
    ```
  - **Ubuntu/Debian**
    ```bash
    sudo apt-get update && sudo apt-get install -y postgresql-client
    ```
  - **Windows**
    - Install PostgreSQL or the standalone client tools and add the `bin` directory (containing `pg_dump`) to your **PATH**.

> In that scenario, the script would read `DATABASE_URL` from `.env` via `dotenv`. **Do not implement or document that script here.**

## Troubleshooting

- `node: command not found` → Ensure Node.js is installed and present on your PATH.
- Permission errors on macOS/Linux → Re-run the install commands, then `source` your shell profile (e.g., `~/.zshrc`).
- Windows PATH issues → Close and reopen the terminal after installing Node.js or PostgreSQL tools.

