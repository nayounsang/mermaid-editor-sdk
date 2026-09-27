# Releasing packages

The `main` branch release workflow uses Changesets to version and publish the
public workspace packages. For a package change, run `pnpm changeset`, select
the affected packages and semver bump, then commit the generated note with the
change. Changeset notes are not required for repository-only edits.

After changesets reach `main`, GitHub Actions runs lint, typecheck, and tests,
then opens or updates a version pull request. Merge that pull request to publish
the packages and create their git tags and GitHub releases. The release job
builds the workspace before publishing; each publishable package also rebuilds
in its `prepack` lifecycle so `dist/` is present when creating a package tarball.
The packages include `src/` because their `source` export condition is used by
the Vite workspace example and must resolve from published tarballs as well.

Repository setup required for publishing:

- Add an npm automation token as the `NPM_TOKEN` Actions secret.
- In GitHub Actions settings, allow workflows to create and approve pull
  requests so Changesets can open the version pull request.
- Both packages are published publicly; the scoped `@mermaid-editor/headless`
  package declares public npm access in its `publishConfig`.

To inspect package tarballs locally without publishing, use
`pnpm --filter @mermaid-editor/headless exec npm pack --dry-run` and
`pnpm --filter mermaid-visual-editor-sdk exec npm pack --dry-run`.
