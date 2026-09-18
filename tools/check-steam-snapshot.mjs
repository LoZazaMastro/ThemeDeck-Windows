/** Audit an externally supplied Steam chunk. No Valve code is distributed. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const input = process.argv[2];
if (!input) throw new Error('Usage: node tools/check-steam-snapshot.mjs /path/to/steamui/chunk.js');
const text = fs.readFileSync(input, 'utf8');
// Capture webpack registrations only; never execute the registered modules.
const context = { self: {} };
vm.runInNewContext(text, context, { timeout: 5000 });
const modules = Object.values(context.self).flatMap(chunks => Array.isArray(chunks)
  ? chunks.flatMap(chunk => chunk?.[1] && typeof chunk[1] === 'object' ? Object.entries(chunk[1]) : []) : []);
const menu = modules.find(([, fn]) => typeof fn === 'function' && /\.LibraryContextMenu\b/.test(fn.toString())
  && fn.toString().includes('GetTargetApps') && fn.toString().includes('BuildManageSubmenu'));
const checks = {
  libraryMenuModule: Boolean(menu),
  wrapperPassesNavigator: Boolean(menu && /navigator\s*:/.test(menu[1].toString())),
  classRendersMenuChildren: Boolean(menu && /render\(\)[\s\S]*?children:/.test(menu[1].toString())),
  classUsesOverviewAppId: Boolean(menu && menu[1].toString().includes('this.props.overview')),
  propertiesAction: Boolean(menu && menu[1].toString().includes('.AppProperties(')),
  appDetailsTakesIdAndCallback: /SteamClient\.Apps\.RegisterForAppDetails\([^,()]+,[^()]+\)/.test(text),
  overviewChangesGlobalCallback: /SteamClient\.Apps\.RegisterForAppOverviewChanges\(/.test(text),
  gameActionStartAndEnd: text.includes('SteamClient.Apps.RegisterForGameActionStart(') &&
    text.includes('SteamClient.Apps.RegisterForGameActionEnd('),
  mainGamepadWindow: text.includes('GamepadUIMainWindowInstance'),
  libraryDetailsRoute: text.includes('/library/details/'),
};
const result = { input: path.basename(input), sha256: crypto.createHash('sha256').update(text).digest('hex'),
  registeredModules: modules.length, observedMenuModule: menu?.[0], checks,
  note: 'Static contract audit of the supplied snapshot, not a live Steam/CEF test. Runtime resolver does not hardcode module IDs.' };
console.log(JSON.stringify(result, null, 2));
for (const [name, ok] of Object.entries(checks)) assert.ok(ok, `Snapshot contract not found: ${name}`);
