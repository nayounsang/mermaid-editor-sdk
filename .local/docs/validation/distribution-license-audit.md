# Distribution license audit

## Result

**Pass — 2026-09-28.** The built JavaScript source maps identify 53 bundled package/version pairs, and all 53 are present in `THIRD-PARTY-LICENSES` with license or notice text. The generated package tarball contains all declared export targets, the rewritten headless workspace dependency, both top-level license files, and no source maps.

## Reproduction

Run from the repository root:

```sh
npm run audit:distribution
```

The audit performs a production build while retaining source maps temporarily, resolves every `node_modules` source-map entry to its package manifest, compares that exact package/version set to the notice inventory, and checks that each package has a license text heading. It then removes the maps, creates an actual npm tarball in a temporary directory, lists its archive entries, checks the package boundary, verifies all `exports` targets and the rewritten internal workspace dependency, checks for source maps, and compares the archived `LICENSE` and `THIRD-PARTY-LICENSES` byte-for-byte with the worktree files. Temporary tarball and maps are removed on completion.

## Recorded run

- Runtime: Node.js `v24.18.1`, npm `11.16.0`, Vite `6.4.3`.
- Source maps examined: **145**, containing **685** distinct dependency source paths and **37** SDK source paths.
- Dependency inventory: **53 package/version pairs**; notice inventory: **53 pairs**; missing or extra pairs: **0**.
- npm tarball: `mermaid-visual-editor-sdk-0.1.0.tgz`; **251 files**, **3,502,790 bytes** compressed.
- Tarball SHA-256: `0782cd49a92704e7917b84e11af970207feb5b101a405392b1cfc93760480daf`.
- `LICENSE` and `THIRD-PARTY-LICENSES`: both present and identical to the worktree versions.
- Source maps in tarball: **0**; every declared export target is present and `@mermaid-editor/headless` is rewritten to its published version. Top-level contents include `LICENSE`, `THIRD-PARTY-LICENSES`, `dist/`, `src/`, and `package.json`, matching the package `files` boundary.

## Scope and limits

The check traces bundled modules using the build's source maps and verifies package license texts, every `source` conditional export target, and the final npm archive. It found no dependency source-map entry without a resolvable package identity. This method depends on upstream source maps accurately representing bundled code; it cannot independently prove the origin of opaque code that an upstream package may have incorporated without source-map attribution.
