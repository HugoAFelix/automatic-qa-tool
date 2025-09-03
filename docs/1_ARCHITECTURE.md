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
