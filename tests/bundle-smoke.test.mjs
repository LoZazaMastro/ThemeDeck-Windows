import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const bundle = fs.readFileSync(new URL('dist/index.js', root), 'utf8');

test('compiled distribution initializes and unloads without leaking routes, timers or listeners', async () => {
  const timers = new Map(), listeners = new Map(), routes = new Map(), patches = new Map();
  const subscriptions = new Set(), errors = [];
  let nextTimer = 0;
  const addEventListener = (name, fn) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
  };
  const removeEventListener = (name, fn) => listeners.get(name)?.delete(fn);
  const timer = fn => { timers.set(++nextTimer, fn); return nextTimer; };
  const subscribe = () => {
    const token = {}; subscriptions.add(token);
    return { unregister: () => subscriptions.delete(token) };
  };
  const react = {
    createContext: value => ({ _currentValue: value }),
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: Symbol('Fragment'),
  };
  const document = { documentElement: { lang: 'it' }, querySelectorAll: () => [], querySelector: () => null,
    addEventListener, removeEventListener, hidden: false, hasFocus: () => true };
  const Router = { WindowStore: { GamepadUIMainWindowInstance: { BrowserInfo: { pathname: '/library' } } } };
  const ui = new Proxy({ Router, Navigation: {}, staticClasses: {}, gamepadContextMenuClasses: {},
    findModuleByExport: () => undefined,
  }, { get(target, key) { return key in target ? target[key] : (() => null); } });
  const api = { _version: 2,
    callable: method => async () => {
      if (method === 'get_tracks') return {};
      if (method === 'get_external_media_state') return { active: false };
      return null;
    },
    executeInTab: async () => null,
    routerHook: {
      addRoute: (route, component) => routes.set(route, component),
      removeRoute: route => routes.delete(route),
      addPatch: (route, callback) => { patches.set(route, callback); return callback; },
      removePatch: route => patches.delete(route),
    }, toaster: { toast: () => {} },
  };
  const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const window = { SP_REACT: react, location: { pathname: '/library', hash: '', href: 'https://steamloopback.host/library' },
    document, localStorage, addEventListener, removeEventListener,
    setTimeout: timer, setInterval: timer,
    clearTimeout: key => timers.delete(key), clearInterval: key => timers.delete(key),
    SteamClient: { Apps: { RegisterForAppOverviewChanges: subscribe, RegisterForGameActionStart: subscribe,
      RegisterForGameActionEnd: subscribe }, UI: { GetUIMode: async () => 1, RegisterForUIModeChanged: subscribe } },
    __DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit: {
      connect: (version, name) => { assert.equal(version, 2); assert.equal(name, 'ThemeDeck'); return api; },
    },
  };
  window.window = window;
  const context = { window, self: window, document, localStorage, SP_REACT: react, DFL: ui,
    console: { ...console, error: (...args) => errors.push(args) },
    navigator: { language: 'it-IT' }, AbortController, DOMException, URL, Map, Set, WeakSet,
    setTimeout: timer, clearTimeout: key => timers.delete(key),
    setInterval: timer, clearInterval: key => timers.delete(key),
  };
  vm.createContext(context);
  const executable = bundle.replace('export { index as default };', 'globalThis.pluginFactory = index;');
  assert.notEqual(executable, bundle, 'distribution must export a plugin factory');
  vm.runInContext(executable, context, { timeout: 2000 });
  assert.equal(typeof context.pluginFactory, 'function');
  for (let pass = 0; pass < 2; pass++) {
    const plugin = context.pluginFactory();
    assert.equal(plugin.name, 'ThemeDeck');
    assert.equal(routes.size, 3);
    assert.ok(patches.size >= 1);
    // Teardown before pending RPC promises settle: these must not recreate timers.
    plugin.onDismount();
    for (let n = 0; n < 50; n++) await Promise.resolve();
    assert.equal(routes.size, 0, 'routes removed');
    assert.equal(patches.size, 0, 'route patches removed');
    assert.equal(timers.size, 0, 'timers removed, including late async completions');
    assert.equal(subscriptions.size, 0, 'native subscriptions removed');
    assert.equal([...listeners.values()].reduce((n, set) => n + set.size, 0), 0, 'listeners removed');
    assert.equal(window.__themedeckUpmixListener, undefined);
  }
  assert.deepEqual(errors, []);
});

test('distribution embeds the current source in an aligned source map and versioned manifest', () => {
  const source = fs.readFileSync(new URL('src/index.tsx', root), 'utf8');
  const map = JSON.parse(fs.readFileSync(new URL('dist/index.js.map', root), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(new URL('plugin.json', root), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
  assert.equal(manifest.version, pkg.version);
  assert.ok(bundle.includes(`"version":"${pkg.version}"`));
  assert.ok(map.sourcesContent.includes(source));
  assert.equal(map.file, 'index.js');
  assert.ok(!/\brequire\s*\(/.test(bundle));
});
