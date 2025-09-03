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
