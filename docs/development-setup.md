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
