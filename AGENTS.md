# Agent instructions

- For changes that affect published packages, add a changeset.
- Verify user-visible flows with Computer Use, Chrome DevTools MCP, or Playwright after implementing user-visible behavior.
- Keep files grouped by domain within each package; avoid creating one-off category directories.
- Before pushing code changes, use `$strict-review` and report result.
- Before pushing documentation(including jsDoc) changes, use `$dev-docs-review` and report result.
- When preparing PR Markdown, use `$write-pr-content`.
