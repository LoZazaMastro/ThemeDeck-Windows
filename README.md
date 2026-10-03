# ThemeDeck for Windows

### Every game has its own musical theme.

Music for your Steam game pages, interface, and Store, with search, download, and control features designed for Gaming Mode.

[![Release](https://img.shields.io/github/v/release/LoZazaMastro/ThemeDeck-Windows?style=for-the-badge&label=Release&labelColor=111111&color=ffffff)](https://github.com/LoZazaMastro/ThemeDeck-Windows/releases/latest)

[![Licenza BSD-3-Clause](https://img.shields.io/badge/Licenza-BSD--3--Clause-ffffff?style=for-the-badge&labelColor=111111)](LICENSE)

## The soundtrack of your library

ThemeDeck for Windows is a fork of [ThemeDeck](https://github.com/BrenticusMaximus/ThemeDeck) adapted for Decky Loader on Windows. The plugin continues to be named **ThemeDeck** inside Decky.

- automatic playback of a theme on the game page;

- choice of local files or YouTube search via `yt-dlp`;

- preview, download, and assignment of results;

- separate volume, start point, and loop settings per game;

- dedicated master volume for game themes;

- ambient track for the interface and a separate track for the Store;

- automatic assignment of missing themes with per-game exclusions;

- maximum duration of 15 minutes for automatic assignments from YouTube;

- cleanup of all managed downloads or only those no longer assigned;

- automatic playback stop when a game is launched.

ThemeDeck pauses its music while Now Playing reproduces integrated or local audio and when Steam plays an audible video from Startup, Community, News, or the Store. Silent playback from TrailerHero is ignored.

## Local files and downloads

When you replace an ambient or Store theme downloaded by the plugin, the old file is only deleted if it was managed by ThemeDeck. Files selected from your personal folders are never deleted.

**Delete all downloads** removes the managed folder and its corresponding assignments. **Delete unused downloads** only affects files that are not assigned to a game, the interface, or the Store.

## Languages

The language automatically follows Steam. Translations are included for English, Italian, French, Spanish, Portuguese, Brazilian Portuguese, German, Dutch, Ukrainian, Chinese, and Japanese.

## Installation

You can install and update ThemeDeck from the [Playhub](https://github.com/LoZazaMastro/Playhub) Plugin Store, or manually:

1. download the ZIP from the [latest release](https://github.com/LoZazaMastro/ThemeDeck-Windows/releases/latest);

2. enable Decky's developer mode;

3. choose **Decky → Settings → Developer → Install plugin from ZIP**;

4. open any game's options and choose ThemeDeck to assign a track to it.

The Windows release includes `yt-dlp.exe`, `ffmpeg.exe`, and `ffprobe.exe`; if YouTube changes its behavior, updating `yt-dlp` from the settings can restore search and download functionality.

## Version 3.3.7

See [CHANGELOG.md](CHANGELOG.md) for fixes and
[TEST_REPORT_3.3.7.md](TEST_REPORT_3.3.7.md) for validation and limitations.
Update with the Installer ZIP, not the project ZIP. Existing settings and
assignments use the same storage. Fully restart Steam/Decky after updating.

The project additionally includes an offline fallback build that reuses the
original dependency-only runtime, without copying old application code:

```sh
node scripts/build-offline.mjs
npm run test:runtime
python tools/package-release.py --output-dir ../release
```

TypeScript must be installed for the offline build and source tests. For the
usual development toolchain use `pnpm install`, `pnpm build`, and `pnpm test`.
The offline release build is not a full semantic typecheck. See
[SOURCE_RECOVERY.md](SOURCE_RECOVERY.md) and [vendor/README.md](vendor/README.md).
On Windows, `./package-win.ps1 -Offline` selects the fallback build.

## Development

```powershell

pnpm install

pnpm run build

python -m py_compile main.py

.\package-win.ps1

```

## License and credits

ThemeDeck was originally created by [BrenticusMaximus](https://github.com/BrenticusMaximus). This Windows fork is maintained by [LoZazaMastro](https://github.com/LoZazaMastro) and retains the original [BSD 3-Clause](LICENSE) license. Dependencies and included binaries are documented in [NOTICE](NOTICE) and [FFMPEG-README.txt](FFMPEG-README.txt).

<div align="center">

Windows fork created and maintained by **[LoZazaMastro](https://github.com/LoZazaMastro)**.

</div>

