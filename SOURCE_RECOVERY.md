# Source Recovery

The original TypeScript project was lost, so `src/index.tsx` was recovered from
`dist/index.js.map`.

The current publishable plugin is still the checked-in `dist/index.js`, because
it contains later manual hotfixes applied directly to the compiled bundle.

Before using `pnpm build` for a release, compare the generated bundle against
the current `dist/index.js` and port any manual hotfixes that are still needed.
