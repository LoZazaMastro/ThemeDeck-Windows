#!/usr/bin/env python3
"""Package the existing build into Installer/Project ZIPs without user data."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'node_modules', '.git', '.pnpm-store', '__pycache__', 'release',
            'node_modules-broken-copy', 'node_modules-copied-broken'}
RUNTIME = ['plugin.json', 'package.json', 'main.py', 'dist/index.js', 'dist/index.js.map',
           'LICENSE', 'NOTICE', 'README.md', 'CHANGELOG.md', 'TEST_REPORT_3.3.7.md',
           'FFMPEG-LICENSE.txt', 'FFMPEG-README.txt', 'ffmpeg.exe', 'ffprobe.exe', 'yt-dlp.exe',
           'assets/logo.png', 'defaults/defaults.txt', 'py_modules/.keep']


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def write_zip(destination: Path, prefix: str, paths: list[Path]) -> None:
    temporary = destination.with_suffix('.zip.partial')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path in paths:
                relative = path.relative_to(ROOT)
                if path.is_symlink() or not path.is_file():
                    raise ValueError(f'Refusing non-regular file: {relative}')
                archive.write(path, f'{prefix}/{relative.as_posix()}')
        with zipfile.ZipFile(temporary) as archive:
            bad = archive.testzip()
            if bad:
                raise ValueError(f'CRC validation failed: {bad}')
            for name in archive.namelist():
                if '\\' in name or '..' in name.split('/') or not name.startswith(prefix + '/'):
                    raise ValueError(f'Unsafe ZIP entry: {name}')
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'{destination.name}: {destination.stat().st_size:,} bytes; SHA256 {digest(destination)}')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=ROOT.parent)
    args = parser.parse_args()
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    pkg = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'plugin.json').read_text(encoding='utf-8'))
    version = pkg['version']
    if manifest['version'] != version or not all(char.isdigit() or char == '.' for char in version):
        raise ValueError('Invalid or inconsistent manifest version')
    source = (ROOT / 'src/index.tsx').read_text(encoding='utf-8')
    source_map = json.loads((ROOT / 'dist/index.js.map').read_text(encoding='utf-8'))
    if source not in [item.replace('\r\n', '\n') for item in source_map.get('sourcesContent', []) if isinstance(item, str)]:
        raise ValueError('Distribution is stale: rebuild from the current source')
    bundle = (ROOT / 'dist/index.js').read_text(encoding='utf-8')
    if f'"version":"{version}"' not in bundle and f'"version": "{version}"' not in bundle:
        raise ValueError('Distribution manifest version does not match')
    runtime = [ROOT / name for name in RUNTIME]
    project = sorted(path for path in ROOT.rglob('*') if path.is_file() and not path.is_symlink()
                     and not EXCLUDED.intersection(path.relative_to(ROOT).parts)
                     and path.suffix not in {'.zip', '.partial', '.pyc', '.pyo', '.log'})
    installer = output / f'ThemeDeck-Playhub_Installer-{version}.zip'
    project_zip = output / f'ThemeDeck-project-{version}.zip'
    write_zip(installer, 'ThemeDeck', runtime)
    write_zip(project_zip, f'ThemeDeck-project-{version}', project)
    with zipfile.ZipFile(installer) as a, zipfile.ZipFile(project_zip) as b:
        for relative in RUNTIME:
            if a.read('ThemeDeck/' + relative) != b.read(f'ThemeDeck-project-{version}/' + relative):
                raise ValueError(f'Runtime/project mismatch: {relative}')
    print('ZIP integrity, safe paths, source-map parity and shared runtime identity: PASS')


if __name__ == '__main__':
    main()
