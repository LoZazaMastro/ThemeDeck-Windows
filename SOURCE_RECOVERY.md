# Source / distribution provenance — 3.3.5

The source supplied in the 3.3.4 project was compared with the embedded source in
its source map: `src/index.tsx` matched exactly. Active top-level application
logic was also compared against the supplied compiled bundle. Observed differences
were compiler/tree-shaking transformations and unreachable legacy UI branches,
not additional active fixes that needed to be transplanted from the distribution.

All 3.3.5 application changes are in `src/index.tsx` and `main.py`. The delivered
`dist/index.js` and map were regenerated from that source, not patched separately.
The map embeds the exact delivered source.

The normal Rollup build and original pinned dependencies remain available.
Because package-registry access was unavailable in the release environment, the
included `scripts/build-offline.mjs` was used with TypeScript 5.8.3. It combines
freshly transpiled application code with the audited, unchanged dependency-only
prefix of the supplied 3.3.4 distribution. See `vendor/README.md`.

No full semantic TypeScript check or live Windows/Steam session was performed.
See `TEST_REPORT_3.3.5.md` for the tests that were actually run.
