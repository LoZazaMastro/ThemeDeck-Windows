/** Offline fallback using the dependency code already shipped in 3.3.4.
 * Requires only TypeScript (pnpm's pinned version, or another installed TS 5.x).
 * No application code is copied from dist: all ThemeDeck code is emitted from src.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'src/index.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
if (pkg.version !== manifest.version) throw new Error('package.json/plugin.json version mismatch');
let prefix = fs.readFileSync(path.join(root, 'vendor/runtime-prefix.js'), 'utf8');
const expected = fs.readFileSync(path.join(root, 'vendor/runtime-prefix.sha256'), 'utf8').trim();
if (crypto.createHash('sha256').update(prefix).digest('hex') !== expected) throw new Error('Vendored runtime integrity mismatch');
prefix = prefix.replace('__THEMEDECK_MANIFEST__', JSON.stringify(manifest));
const sf = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
if (sf.parseDiagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(sf.parseDiagnostics, {
  getCanonicalFileName: x => x, getCurrentDirectory: () => root, getNewLine: () => '\n',
}));
const importedRuntime = new Map();
for (const statement of sf.statements) {
  if (!ts.isImportDeclaration(statement)) continue;
  const specifier = statement.moduleSpecifier.text;
  if (['@decky/api', 'react-icons/fa'].includes(specifier)) {
    const names = statement.importClause?.namedBindings;
    if (!names || !ts.isNamedImports(names)) throw new Error('Only named runtime imports are supported');
    const symbols = names.elements.map(n => n.propertyName?.text ?? n.name.text);
    for (const symbol of symbols) {
      if (!new RegExp(`\\b(?:const|let|var|function)\\s+${symbol}\\b`).test(prefix)) {
        throw new Error(`Runtime symbol ${symbol} is not present in the audited vendor prefix; use the normal Rollup build`);
      }
    }
    importedRuntime.set(specifier, symbols);
  }
}
const output = ts.transpileModule(source, {
  fileName: 'index.tsx', reportDiagnostics: true,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React,
    jsxFactory: 'window.SP_REACT.createElement', jsxFragmentFactory: 'window.SP_REACT.Fragment',
    sourceMap: true, inlineSources: true, esModuleInterop: true, useDefineForClassFields: true,
  },
  transformers: { after: [context => {
    const factory = context.factory;
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' &&
          node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        const name = node.arguments[0].text;
        if (name === '@decky/ui') return factory.createIdentifier('DFL');
        if (name === 'react') return factory.createPropertyAccessExpression(factory.createIdentifier('window'), 'SP_REACT');
        if (importedRuntime.has(name)) return factory.createObjectLiteralExpression(
          importedRuntime.get(name).map(symbol => factory.createShorthandPropertyAssignment(symbol)));
        throw new Error(`Unsupported import ${name}; use the normal Rollup build`);
      }
      return ts.visitEachChild(node, visit, context);
    }
    return node => ts.visitNode(node, visit);
  }] },
});
const errors = (output.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
if (errors.length) throw new Error(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
const opening = `${prefix}\n// Application code compiled from src/index.tsx by TypeScript ${ts.version}.\nconst index = (() => {\nconst exports = {};\n`;
const body = output.outputText.replace(/\/\/# sourceMappingURL=.*\r?\n?$/, '');
if (/\brequire\s*\(/.test(body)) throw new Error('An unresolved require remains in the output');
const bundle = `${opening}${body}\nreturn exports.default;\n})();\nexport { index as default };\n//# sourceMappingURL=index.js.map\n`;
const map = JSON.parse(output.sourceMapText);
map.file = 'index.js'; map.sources = ['../src/index.tsx']; map.sourcesContent = [source];
map.mappings = ';'.repeat(opening.split('\n').length - 1) + map.mappings;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.js'), bundle);
fs.writeFileSync(path.join(root, 'dist/index.js.map'), JSON.stringify(map));
console.log(`Built ThemeDeck ${pkg.version} from source with TypeScript ${ts.version} (${Buffer.byteLength(bundle)} bytes)`);
