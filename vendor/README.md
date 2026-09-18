# Offline build runtime

`runtime-prefix.js` preserves the dependency-only prefix shipped in the supplied
ThemeDeck 3.3.4 bundle: Decky's API bootstrap and the already-used react-icons
Font Awesome icon implementations. It does not contain ThemeDeck application
logic. Its manifest is replaced from `plugin.json` at build time.

`runtime-prefix.sha256` protects the audited prefix. `scripts/build-offline.mjs`
verifies the hash, supported imports and manifest versions, then transpiles the
entire current `src/index.tsx`, regenerating the JavaScript and source map.
React and Decky's UI are still supplied by the host, exactly as in the original
bundle. This is not an upgrade to a newer Decky API/UI or icon package.

The original project and bundled-binary license/notice files are retained.
The embedded dependency implementations and icon attributions remain those of
the supplied upstream distribution; the fallback does not claim authorship of
them. Use the normal Rollup build to add dependency imports or update upstream
packages instead of manually editing this prefix.

Usage, with TypeScript installed in the project's Node resolution path:

```sh
node scripts/build-offline.mjs
node --check dist/index.js
npm run test:runtime
```

The release used TypeScript 5.8.3. The regular project lockfile still pins the
original TypeScript 5.6.2 toolchain. The offline build reports syntax/transpile
errors; it is not a substitute for `tsc --noEmit` with all real dependencies.
