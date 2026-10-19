# Agent instructions

- For changes that affect published packages, add a changeset.
- Verify user-visible flows with Computer Use, Chrome DevTools MCP, or Playwright after implementing user-visible behavior.
- Keep files grouped by domain within each package; avoid creating one-off category directories.
- Before pushing code changes, use `$strict-review`. **Do not resolve result yourself**. Just report result to human. After that, if the user gives the instruction to push, then perform the push.
- Before pushing documentation(including jsDoc) changes, use `$dev-docs-review`. **Do not resolve result yourself**. Just report result to human. After that, if the user gives the instruction to push, then perform the push.
- When preparing PR Markdown, use `$write-pr-content`.
- We target 100% test coverage at `headless` and a logic layer within the `ui` that is separate from the UI itself.
