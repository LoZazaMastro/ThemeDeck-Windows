import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/index.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map();
for (const statement of parsed.statements) {
  if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, statement.getText(parsed));
  }
}
function harness(extra = {}) {
  let probes = 0;
  let contexts = 0;
  const context = {
    pluginDisposed: false, externalMediaProbeInFlight: false,
    desktopModeActive: false, runningGameAppId: null,
    playbackState: { status: 'stopped' },
    resolveAutoTrackFromContext: () => null,
    detectAudibleSteamMedia: async () => { probes++; return false; },
    readNowPlayingState: async () => ({ active: false, source: 'none' }),
    getSteamMediaState: async () => { probes++; return { active: false }; },
    getExternalMediaState: async () => { probes++; return { active: false }; },
    setExternalMediaActive: () => {},
    lastSteamCdpMediaActive: false, lastSteamCdpMediaProbeAt: 0,
    lastLegacyExternalMediaActive: false, lastLegacyExternalMediaProbeAt: 0,
    STEAM_CDP_MEDIA_POLL_MS: 3000, LEGACY_EXTERNAL_MEDIA_POLL_MS: 1500,
    locationInterval: null, focusedAppId: null,
    getLibraryPath: () => { contexts++; return '/library/details/42'; },
    readAppIdFromLocation: () => 42, markDetailRouteSeen: () => {}, notifyFocus: () => {},
    window: { setInterval: callback => { context.tick = callback; return 1; } },
    console, ...extra,
  };
  vm.createContext(context);
  const names = ['refreshExternalMediaState', 'startLocationWatcher'];
  const code = names.map(name => declarations.get(name)).join('\n');
  vm.runInContext(ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText + '\nObject.assign(globalThis, {' + names.join(',') + '});', context);
  return { context, probes: () => probes, contexts: () => contexts };
}

for (const [name, extra] of [
  ['desktop', { desktopModeActive: true, playbackState: { status: 'playing' } }],
  ['game running', { runningGameAppId: 42, playbackState: { status: 'playing' } }],
  ['page with no assigned music', {}],
]) test(`No external media/CDP probes during ${name}`, async () => {
  const h = harness(extra);
  for (let i = 0; i < 120; i++) await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 0);
});

test('Playing music still checks external media and obeys backend rate limits', async () => {
  const h = harness({ playbackState: { status: 'playing' } });
  await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 3);
  await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 4); // local probe, no repeated CDP or legacy call
});

test('Assigned track paused by external media still checks for resume', async () => {
  const h = harness({ resolveAutoTrackFromContext: () => ({ appId: 42 }) });
  await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 3);
});

test('Leaving desktop triggers fresh CDP media state instead of a stale cache', async () => {
  const h = harness({ desktopModeActive: true, resolveAutoTrackFromContext: () => ({ appId: 42 }),
    lastSteamCdpMediaActive: true, lastSteamCdpMediaProbeAt: Date.now() });
  await h.context.refreshExternalMediaState();
  h.context.desktopModeActive = false;
  await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 3);
});

test('Location watcher sleeps during desktop/game and resumes on next tick', () => {
  const h = harness({ desktopModeActive: true });
  h.context.startLocationWatcher();
  for (let i = 0; i < 10; i++) h.context.tick();
  assert.equal(h.contexts(), 0);
  h.context.desktopModeActive = false;
  h.context.runningGameAppId = 42;
  h.context.tick();
  assert.equal(h.contexts(), 0);
  h.context.runningGameAppId = null;
  h.context.tick();
  assert.equal(h.contexts(), 1);
});

test('Dispose prevents all media calls', async () => {
  const h = harness({ pluginDisposed: true, playbackState: { status: 'playing' } });
  await h.context.refreshExternalMediaState();
  assert.equal(h.probes(), 0);
});
