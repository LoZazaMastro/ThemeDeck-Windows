import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/index.tsx', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('const DownloadProgressBar ='), source.indexOf('let ytDlpDialog:'));
const code = ts.transpileModule(block, { compilerOptions: {
  target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, jsxFactory: 'window.SP_REACT.createElement',
  jsxFragmentFactory: 'window.SP_REACT.Fragment',
}}).outputText + '\nglobalThis.Modal = YtDlpUpdateModal; globalThis.Bar = DownloadProgressBar; globalThis.copy = YTDLP_CHECK_COPY;';
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function harness({ start, poll }) {
  let slots = [], cursor = 0, initialized = false, effect, cleanup;
  const timers = [];
  const context = {
    window: { SP_REACT: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), Fragment: 'fragment' },
      setTimeout: callback => { timers.push(callback); return timers.length; } },
    useRef: value => { const i = cursor++; return slots[i] ??= { current: value }; },
    useState: value => { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
      return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect: callback => { if (!initialized) effect = callback; },
    t: (key, values = {}) => key + JSON.stringify(values), ACTIVE_LOCALE: 'it',
    getErrorMessage: error => error.message,
    getYtDlpUpdateProgress: poll, startYtDlpUpdate: start,
    ModalRoot: 'ModalRoot', Focusable: 'Focusable', FocusableButton: 'Button',
  };
  vm.createContext(context); vm.runInContext(code, context);
  return {
    context,
    render(props) { cursor = 0; const tree = context.Modal(props); if (!initialized) {initialized = true; cleanup = effect();} return tree; },
    async tick() {timers.shift()?.(); await flush();},
    unmount() {cleanup?.();},
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...(tree.children || []).flat(Infinity).flatMap(nodes)];
}
const updateButton = tree => nodes(tree).find(node => node.type === 'Button' && node.children[0].startsWith('updateYtdlp'));

test('all updater entrypoints use the shared native dialog and short job RPC', () => {
  assert.equal((source.match(/await openYtDlpUpdate\(\)/g) || []).length, 3);
  assert.doesNotMatch(source, /await updateYtDlp\(/);
  const handler = source.slice(source.indexOf('const handleUpdateYtDlp ='), source.indexOf('const handleDeleteDownloadsFinished ='));
  assert.doesNotMatch(handler, /window\.confirm/);
  assert.match(source, /"start_yt_dlp_update"/);
});

test('game, ambient and Store render the identical progress component', () => {
  assert.equal((source.match(/<DownloadProgressBar progress=\{gameDownloadProgress\}/g) || []).length, 2);
  assert.match(source, /<DownloadProgressBar progress=\{downloadProgress\}/);
  assert.match(source, /await startGameDownload\(/);
});

test('modal exposes installation progress, completion and explicit close', async () => {
  let reads = 0, started = 0, updated, closed = 0;
  const h = harness({
    start: async () => {started++; return {jobId: 'a', running: true, phase: 'downloading', progress: 25};},
    poll: async () => ++reads === 1 ? {running: false, phase: 'idle'} :
      {jobId: 'a', running: false, phase: 'completed', progress: 100, version: 'nightly', result: {version: 'nightly'}},
  });
  const props = {onUpdated: value => updated = value, closeModal: () => closed++};
  h.render(props); await flush();
  updateButton(h.render(props)).props.onClick(); await flush();
  assert.equal(started, 1);
  assert.equal(nodes(h.render(props)).find(n => n.type === h.context.Bar).props.progress, 25);
  assert.equal(closed, 0);
  await h.tick();
  assert.equal(updated.version, 'nightly');
  assert.equal(updateButton(h.render(props)), undefined);
  assert.equal(closed, 0);
  h.unmount();
});

test('failed update displays error and permits retry', async () => {
  let started = 0;
  const h = harness({poll: async () => ({running: false, phase: 'idle'}), start: async () => {
    started++; return {jobId: 'a', running: false, phase: 'failed', progress: 2, error: 'Access denied'};
  }});
  const props = {onUpdated: () => assert.fail('must not announce success')};
  h.render(props); await flush();
  updateButton(h.render(props)).props.onClick(); await flush();
  assert.match(nodes(h.render(props)).find(n => n.props.role === 'alert').children[0], /Access denied/);
  updateButton(h.render(props)).props.onClick(); await flush();
  assert.equal(started, 2);
  h.unmount();
});

test('reopening attaches to running backend job without starting a second update', async () => {
  const h = harness({start: async () => assert.fail('must resume'), poll: async () => ({jobId: 'a', running: true, phase: 'verifying', progress: 90})});
  const props = {onUpdated() {}};
  h.render(props); await flush();
  assert.equal(nodes(h.render(props)).find(n => n.type === h.context.Bar).props.progress, 90);
  h.unmount(); await h.tick();
});

test('checking and verification phases cover every existing locale', () => {
  const h = harness({start() {}, poll() {}});
  for (const locale of ['en', 'it', 'fr', 'es', 'pt', 'pt-br', 'de', 'nl', 'uk', 'zh', 'ja']) {
    assert.equal(h.context.copy[locale].length, 2);
    assert.ok(h.context.copy[locale].every(text => text.length > 0));
  }
});
