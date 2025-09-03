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
