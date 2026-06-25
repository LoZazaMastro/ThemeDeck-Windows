import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(root, "package.json");
const pluginPath = path.join(root, "plugin.json");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const plugin = JSON.parse(fs.readFileSync(pluginPath, "utf8"));

plugin.version = pkg.version;

fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);
console.log(`Stamped ThemeDeck ${pkg.version}`);
