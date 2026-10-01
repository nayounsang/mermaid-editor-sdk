# Agent instructions

- For changes that affect published packages, add a changeset.
- Verify user-visible flows with Computer Use, Chrome DevTools MCP, or Playwright after implementing user-visible behavior.
- Keep files grouped by domain within each package; avoid creating one-off category directories.
- Before pushing code changes, use `$strict-review` and resolve actionable findings.
- Before pushing developer documentation changes, use `$dev-docs-review` and resolve supported findings.
- When preparing PR Markdown, use `$write-pr-content`.
