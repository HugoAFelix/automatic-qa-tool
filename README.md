# Automated QA Tooling with GitHub Actions

![QA automation banner](https://placehold.co/1200x400/1e293b/ffffff?text=QA%20Automation%20Pipeline&font=inter)

This repository provides a Continuous Integration pipeline built on GitHub Actions that runs a set of automated quality checks against any website.

It delivers fast, consistent analysis across four key areas: **Performance, Accessibility, Basic Security, and WordPress-specific Vulnerabilities.**

## ✨ Key Features

* **⚡ Performance Testing (Lighthouse):** Measures core performance, SEO, and best practice metrics.
* **♿ Accessibility Testing (Pa11y + Axe):** Scans for WCAG violations.
* **🛡️ Basic Security Testing (OWASP ZAP):** Detects passive and low-risk security issues.
* **🔎 WordPress Vulnerability Testing (WPScan):** Identifies known issues when a site runs WordPress.

## 🚀 Get Started

For architecture details, setup instructions, and usage information, see the documentation in `/docs`.

* **[Implementation Guide](./docs/2_IMPLEMENTATION_GUIDE.md)** – Set up the tool from scratch.
* **[Usage Guide](./docs/3_USAGE.md)** – Run the checks once configured.
