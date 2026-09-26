# Distribution license audit

## Result

**Pass — 2026-09-26.** The built JavaScript source maps identify 48 bundled package/version pairs, and all 48 are present in `THIRD-PARTY-LICENSES` with license or notice text. The generated package tarball contains both top-level license files and no source maps.

## Reproduction

Run from the repository root:

```sh
npm run audit:distribution
```

The audit performs a production build while retaining source maps temporarily, resolves every `node_modules` source-map entry to its package manifest, compares that exact package/version set to the notice inventory, and checks that each package has a license text heading. It then removes the maps, creates an actual npm tarball in a temporary directory, lists its archive entries, checks the package boundary and absence of maps, and compares the archived `LICENSE` and `THIRD-PARTY-LICENSES` byte-for-byte with the worktree files. Temporary tarball and maps are removed on completion.

## Recorded run

- Runtime: Node.js `v24.18.1`, npm `11.16.0`, Vite `6.4.3`.
- Source maps examined: **123**, containing **642** distinct dependency source paths and **34** SDK source paths.
- Dependency inventory: **48 package/version pairs**; notice inventory: **48 pairs**; missing or extra pairs: **0**.
- npm tarball: `mermaid-visual-editor-sdk-0.1.0.tgz`; **164 files**, **3,177,415 bytes** compressed and **12,303,599 bytes** unpacked.
- Tarball SHA-256: `0e45d309698420be50ac47e87850f11e6d3b22cda6ba89b2793dd1fcb85a1856`.
- `LICENSE` and `THIRD-PARTY-LICENSES`: both present and identical to the worktree versions.
- Source maps in tarball: **0**. Top-level contents are limited to `LICENSE`, `THIRD-PARTY-LICENSES`, `dist/`, and `package.json`, matching the package `files` boundary.

## Scope and limits

The check traces bundled modules using the build's source maps and verifies package license texts and the final npm archive. It found no dependency source-map entry without a resolvable package identity. This method depends on upstream source maps accurately representing bundled code; it cannot independently prove the origin of opaque code that an upstream package may have incorporated without source-map attribution.
