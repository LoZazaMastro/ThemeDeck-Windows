import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/index.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const definitions = new Map();
for (const statement of parsed.statements) {
  if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name)) definitions.set(declaration.name.text, statement.getText(parsed));
  }
}
function compile(names) {
  const code = [...new Set(names.map(name => {
    assert.ok(definitions.has(name), `Missing production declaration ${name}`);
    return definitions.get(name);
  }))].join('\n');
  return ts.transpileModule(code, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React,
    jsxFactory: 'window.SP_REACT.createElement', jsxFragmentFactory: 'window.SP_REACT.Fragment',
  }}).outputText + '\nObject.assign(globalThis, {' + names.join(',') + '});';
}
function element(type, supplied, ...children) {
  const props = { ...(supplied || {}) };
  const key = props.key ?? null;
  delete props.key;
  if (children.length) props.children = children.length === 1 ? children[0] : Object.freeze(children);
  if (Array.isArray(props.children) && !Object.isFrozen(props.children)) Object.freeze(props.children);
  return Object.freeze({ type, key, props: Object.freeze(props) });
}
const react = {
  Fragment: 'Fragment', createElement: element, isValidElement: node => Boolean(node?.type && node?.props),
  cloneElement: (node, props, ...children) => element(node.type, { ...node.props, key: node.key, ...props }, ...children),
};
function findTree(root, predicate) {
  const seen = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return undefined;
    seen.add(node);
    if (predicate(node)) return node;
    for (const child of Array.isArray(node) ? node : [node.props, node.children]) {
      const found = visit(child); if (found) return found;
    }
  }
  return visit(root);
}
function harness(extra = {}) {
  const timers = new Map(); let id = 0;
  const patched = [];
  const context = {
    console, AbortController, Map, Set, WeakSet,
    window: { SP_REACT: react, location: { pathname: '/library/details/42' },
      setTimeout: fn => { const key = ++id; timers.set(key, fn); return key; },
      clearTimeout: key => timers.delete(key),
      setInterval: fn => { const key = ++id; timers.set(key, fn); return key; },
      clearInterval: key => timers.delete(key),
    },
    findInReactTree: findTree,
    findInTree: findTree,
    afterPatch(object, key, callback) {
      assert.equal(typeof object[key], 'function');
      const original = object[key];
      const replacement = function (...args) {
        const returned = original.apply(this, args);
        const modified = callback.call(this, args, returned);
        return modified === undefined ? returned : modified;
      };
      object[key] = replacement;
      const patch = { unpatch() { if (object[key] === replacement) object[key] = original; } };
      patched.push(patch); return patch;
    },
    ...extra,
  };
  vm.createContext(context);
  return { context, timers, patched,
    load(names, declarations = '') { vm.runInContext(declarations + '\n' + compile(names), context); },
    tick() { const next = timers.entries().next().value; if (next) { timers.delete(next[0]); next[1](); } },
  };
}
const menuNames = ['extractAppId', 'extractAppIdFromTree', 'coerceMenuChildren', 'pruneThemeDeckMenu',
  'insertThemeDeckMenu', 'isGameContextMenu', 'isLibraryAppContextMenu', 'patchLibraryMenuTree',
  'resolveLibraryContextMenu', 'patchContextMenuFocus'];
function menuHarness() {
  const focused = [], paths = [];
  const h = harness({ MenuItem: 'ThemeDeckMenuItem', focusedAppId: 999,
    setContextMenuActiveAppId: id => focused.push(id), readAppIdFromLocation: () => 777,
    dismissActiveContextMenu() {}, navigateToThemeDeckEditor: path => paths.push(path),
    toaster: { toast() { throw new Error('Unexpected toast'); } },
  });
  h.load(menuNames, 'let activeContextMenuCloser = null;');
  class Menu {
    constructor(appid) { this.props = { overview: { appid } }; }
    GetTargetApps() { return [this.props.overview]; }
    componentWillUnmount() { this.unmounted = true; }
    render() {
      return element('Menu', {}, element('Item', { onSelected: () => 'launchSource' }),
        element('Fragment', {}, element('Item', { onSelected: () => 'AppProperties' })));
    }
  }
  function wrapper(props) { return element(Menu, { navigator: {}, instance: {}, ...props }); }
  function marker() { return styles.LibraryContextMenu; }
  h.context.findModuleByExport = predicate => { assert.ok(predicate(marker)); return { wrapper, marker }; };
  h.context.fakeRenderComponent = candidate => candidate({});
  return { ...h, Menu, focused, paths };
}

test('app IDs reject SteamIDs, partial strings, fractions and negative values', () => {
  const h = harness(); h.load(['extractAppId']);
  for (const value of [0, -42, 1.2, Infinity, '42bad', '123.jpg', '76561198000000000']) {
    assert.equal(h.context.extractAppId(value), null);
  }
  assert.equal(h.context.extractAppId({ unAppID: '42' }), 42);
  assert.equal(h.context.extractAppId('4294967295'), 4294967295);
});

test('context menu patches immutable returned children directly, exactly once', () => {
  const h = menuHarness();
  const original = h.Menu.prototype.render;
  const dispose = h.context.patchContextMenuFocus();
  const menu = new h.Menu(42);
  for (let n = 0; n < 5; n++) {
    const result = menu.render();
    assert.ok(Object.isFrozen(result.props));
    assert.equal(result.props.children.filter(child => child.key === 'themedeck-change-music').length, 1);
    assert.equal(result.props.children[1].key, 'themedeck-change-music');
  }
  assert.equal(h.patched.length, 2, 'no per-render inner patches leak');
  assert.equal(h.focused.at(-1), 42);
  dispose(); assert.equal(h.Menu.prototype.render, original);
  assert.equal(new h.Menu(42).render().props.children.length, 2);
});

test('menu target changes between games and is not taken from a stale route', () => {
  const h = menuHarness(); const dispose = h.context.patchContextMenuFocus();
  new h.Menu(42).render();
  const menu = new h.Menu(84);
  const action = menu.render().props.children.find(child => child.key === 'themedeck-change-music');
  action.props.onSelected(); h.tick();
  assert.deepEqual(h.paths, ['/themedeck/84']);
  menu.componentWillUnmount(); assert.equal(h.focused.at(-1), null);
  dispose();
});

test('multi-selection is left unchanged and no menu is patched for an invalid ID', () => {
  const h = menuHarness(); const dispose = h.context.patchContextMenuFocus();
  const multi = new h.Menu(42); multi.GetTargetApps = () => [{ appid: 42 }, { appid: 84 }];
  assert.equal(multi.render().props.children.length, 2);
  assert.equal(new h.Menu(0).render().props.children.length, 2);
  dispose();
});

test('late Steam chunks are retried and pending retry is cancelled on unload', () => {
  const h = menuHarness();
  const lookup = h.context.findModuleByExport; h.context.findModuleByExport = () => undefined;
  const dispose = h.context.patchContextMenuFocus(); assert.equal(h.timers.size, 1);
  h.context.findModuleByExport = lookup; h.tick();
  assert.equal(h.patched.length, 2); dispose(); assert.equal(h.timers.size, 0);
  h.context.findModuleByExport = () => undefined;
  const second = h.context.patchContextMenuFocus(); assert.equal(h.timers.size, 1);
  second(); assert.equal(h.timers.size, 0);
});

test('route bridge is independent of Steam CSS classes and restores nested patch', () => {
  let registration; const removed = [];
  const h = harness({ GameFocusBridge: 'GameFocusBridge', routerHook: {
    addPatch: (route, callback) => { registration = callback; return callback; },
    removePatch: (...args) => removed.push(args),
  }});
  h.load(['injectBridgeIntoRoute']);
  const originalElement = element('NewSteamLayout', {});
  const props = { renderFunc: () => originalElement };
  const original = props.renderFunc;
  const dispose = h.context.injectBridgeIntoRoute('/library/details/:appid');
  registration({ props }); registration({ props });
  const rendered = props.renderFunc();
  assert.equal(h.patched.length, 1);
  assert.equal(rendered.type, 'Fragment');
  assert.equal(rendered.props.children[0], originalElement);
  assert.equal(rendered.props.children[1].key, 'themedeck-bridge');
  dispose(); assert.equal(props.renderFunc, original); assert.equal(removed.length, 1);
});

test('unpatchable read-only route props preserve Steam rendering', () => {
  let registration;
  const h = harness({ console: { warn() {} }, GameFocusBridge: 'GameFocusBridge', routerHook: {
    addPatch: (_route, callback) => { registration = callback; return callback; }, removePatch() {},
  }});
  h.load(['injectBridgeIntoRoute']); const dispose = h.context.injectBridgeIntoRoute('/library/details/:appid');
  const tree = { props: Object.freeze({ renderFunc: () => 7 }) };
  assert.equal(registration(tree), tree); assert.equal(tree.props.renderFunc(), 7); dispose();
});

test('overview callbacks never subscribe to app-specific details without an ID or focus background games', () => {
  let callback, detailsCalls = 0, unsubscribed = 0; const focused = [];
  const h = harness({ scheduleRunningGameRefresh() {}, markDetailRouteSeen() {},
    notifyFocus: id => focused.push(id), readAppIdFromLocation: () => 42,
  });
  h.context.window.SteamClient = { Apps: {
    RegisterForAppDetails() { detailsCalls++; throw new Error('ID required'); },
    RegisterForAppOverviewChanges(fn) { callback = fn; return { unregister() { unsubscribed++; } }; },
  }};
  h.load(['wrapUnsubscribe', 'startSteamAppWatchers', 'stopSteamAppWatchers'], 'let steamAppSubscriptions=[]; let steamAppRetry=null;');
  assert.ok(h.context.startSteamAppWatchers());
  assert.ok(h.context.startSteamAppWatchers()); callback({ appid: 999 });
  assert.deepEqual(focused, [42]); assert.equal(detailsCalls, 0);
  h.context.stopSteamAppWatchers(); assert.equal(unsubscribed, 1);
});

test('running watcher registers both start and end action callbacks with valid signatures', () => {
  const registrations = [];
  const h = harness({ scheduleRunningGameRefresh() {}, RUNNING_APP_POLL_MS: 2000 });
  h.context.window.SteamClient = { Apps: {
    RegisterForGameActionStart(fn) { assert.equal(typeof fn, 'function'); registrations.push('start'); },
    RegisterForGameActionEnd(fn) { assert.equal(typeof fn, 'function'); registrations.push('end'); },
  }};
  h.load(['wrapUnsubscribe', 'startRunningGameWatcher'], 'let runningAppPollInterval=null,runningAppRetry=null; const runningAppSubscriptions=[],steamAppSubscriptions=[];');
  h.context.startRunningGameWatcher(); assert.deepEqual(registrations, ['start', 'end']);
});

test('main gamepad route takes precedence over a focused popup, with local/hash fallback', () => {
  const h = harness({ Router: {} }); h.load(['getLibraryPath']);
  h.context.window.SteamUIStore = {
    WindowStore: { GamepadUIMainWindowInstance: { BrowserWindow: { location: { pathname: '/library/details/84' } } } },
    GetFocusedWindowInstance: () => ({ BrowserWindow: { location: { pathname: '/friends' } } }),
  };
  assert.equal(h.context.getLibraryPath(), '/library/details/84');
  delete h.context.window.SteamUIStore;
  h.context.window.location = { pathname: '/index.html', hash: '#/library/details/123' };
  assert.equal(h.context.getLibraryPath(), '/library/details/123');
});

function audioHarness(cache, fetcher, resolver) {
  const h = harness({ audioCache: cache, fetch: fetcher, getTrackAudioUrl: resolver,
    isPinnedAudioCachePath: () => false, pruneAudioCache() {}, URL: { revokeObjectURL() {} },
  });
  h.load(['verifyStreamAudioUrl', 'revokeCacheEntry', 'resolveAudioUrl']); return h;
}

test('a stale audio port is discarded and refreshed after a backend reload', async () => {
  const cache = new Map([['track.wav', { url: 'http://old/audio' }]]); let calls = 0;
  const h = audioHarness(cache, async url => ({ ok: url.includes('new') }), async () => {
    calls++; return { url: 'http://new/audio', mtime: 5 };
  });
  assert.equal(await h.context.resolveAudioUrl({ path: 'track.wav' }), 'http://new/audio');
  assert.equal(cache.get('track.wav').url, 'http://new/audio'); assert.equal(calls, 1);
  assert.equal(await h.context.resolveAudioUrl({ path: 'track.wav' }), 'http://new/audio'); assert.equal(calls, 1);
});

test('failed stream health checks do not poison the URL cache', async () => {
  const cache = new Map(); const h = audioHarness(cache, async () => ({ ok: false }), async () => ({ url: 'http://failed/audio' }));
  await assert.rejects(h.context.resolveAudioUrl({ path: 'track.wav' }), /health check/);
  assert.equal(cache.size, 0); assert.equal(h.timers.size, 0);
});

test('a hung health check is aborted instead of blocking playback forever', async () => {
  const h = audioHarness(new Map(), (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }), async () => ({}));
  const promise = h.context.verifyStreamAudioUrl('http://stale/audio');
  h.tick(); assert.equal(await promise, false); assert.equal(h.timers.size, 0);
});

test('old nested element-type mutations and incorrect native subscriptions are absent', () => {
  assert.doesNotMatch(source, /afterPatch\(\s*component,\s*["']type["']/);
  assert.doesNotMatch(source, /RegisterForAppDetails\?\.bind/);
  assert.doesNotMatch(source, /appDetailsClasses\.InnerContainer/);
});

test('stopping playback invalidates an audio URL request that completes after unload', async () => {
  let resolveUrl, plays = 0;
  const audio = { src: '', currentTime: 0, pause() {}, play: async () => { plays++; } };
  const h = harness({ sharedAudio: audio, desktopModeActive: false, runningGameAppId: null,
    externalMediaActive: false, refreshDesktopModeState: async () => {},
    detectAudibleSteamMediaLocal: () => false, ensureAudio: () => audio,
    resolveAudioUrl: () => new Promise(resolve => { resolveUrl = resolve; }),
    notifyPlayback() {},
  });
  h.load(['getPlaySignature', 'stopPlayback', 'playTrack'],
    'let pluginDisposed=false,playInvocationCounter=0,playInFlightSignature=null,stopPlaybackToken=0;');
  const pending = h.context.playTrack({ appId: 42, path: 'theme.wav' }, 'auto');
  h.context.stopPlayback(false); resolveUrl('http://127.0.0.1/audio');
  await pending; assert.equal(plays, 0); assert.equal(audio.src, '');
});

test('autoplay scheduling cannot restart after disposal or coordinator stop', () => {
  const h = harness({ AUTO_PLAYBACK_DEBOUNCE_MS: 100, applyAutoPlaybackFromContext() {} });
  h.load(['scheduleAutoPlaybackFromContext'], 'let pluginDisposed=true,autoPlaybackStarted=true,autoPlaybackTick=null;');
  h.context.scheduleAutoPlaybackFromContext(); assert.equal(h.timers.size, 0);
  vm.runInContext('pluginDisposed=false; autoPlaybackStarted=false;', h.context);
  h.context.scheduleAutoPlaybackFromContext(); assert.equal(h.timers.size, 0);
  vm.runInContext('autoPlaybackStarted=true;', h.context);
  h.context.scheduleAutoPlaybackFromContext(); assert.equal(h.timers.size, 1);
});

test('media probe timeout is released when the probe resolves or rejects', async () => {
  const h = harness(); h.load(['withTimeout']);
  assert.equal(await h.context.withTimeout(Promise.resolve('ready'), 1000), 'ready');
  assert.equal(h.timers.size, 0);
  await assert.rejects(h.context.withTimeout(Promise.reject(new Error('probe failed')), 1000), /probe failed/);
  assert.equal(h.timers.size, 0);
  const expired = h.context.withTimeout(new Promise(() => {}), 1000);
  h.tick(); assert.equal(await expired, null); assert.equal(h.timers.size, 0);
});
