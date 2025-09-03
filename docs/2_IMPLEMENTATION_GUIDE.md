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
