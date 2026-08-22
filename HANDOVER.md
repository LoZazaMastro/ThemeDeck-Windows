# ThemeDeck 3.3.1 handover

Updated: 2026-07-27

## Regression reviewed

The 3.3.0 WebAudio upmix added before this review muted game, ambient and Store
tracks. The shared audio element streamed files from a localhost HTTP server
while Steam UI ran on `https://steamloopback.host`. The server already returned
the required CORS response headers, but the audio element did not request CORS.

`createMediaElementSource()` therefore accepted the element without throwing,
then WebAudio replaced its native output with an all-zero cross-origin source.
The file kept advancing and the AudioContext reported `running`, which made the
failure look like a device or mixer problem.

## Fix

- New shared audio elements set `crossOrigin = "anonymous"` before assigning
  `src`.
- WebAudio is not created when 7.1 upmix is disabled.
- With upmix enabled, ThemeDeck verifies that the output supports at least six
  channels and that the AudioContext is running before binding the media element.
- A failed or blocked WebAudio setup leaves the native stereo output untouched.
- A version marker replaces the broken graph/audio element left by an older hot
  reload.
- The QAM upmix event can build or reroute the graph immediately and preserves
  the user's saved setting.
- Packaging no longer creates the duplicate unversioned installer.

## Files changed

- `src/index.tsx`
- `dist/index.js` and source map
- `package-win.ps1`
- `HANDOVER.md`
- Root `HANDOVER_3.3.1.md` and `WHATS_CHANGED_3.3.1.md`

## Real Steam verification

- The installed pre-fix player was inspected in Steam SharedJSContext:
  - audio playing, `readyState = 4`, volume `0.3`
  - AudioContext `running`, 8-channel destination
  - source and matrix signal levels both exactly `0`
  - upmix preference was enabled
- A temporary CORS-enabled media element using the same live track and server
  produced a measurable source level of `4.8125`.
- After installing and selectively reloading only ThemeDeck:
  - `crossOrigin = "anonymous"`
  - graph version `2`
  - AudioContext `running`
  - source level `4.578125`
  - 7.1 matrix level `4.96875`
  - disabling upmix removed the matrix nodes
  - restoring upmix rebuilt all 12 routing nodes
  - the user's original `true` preference was restored
- The user confirmed that playback works in 7.1.

## Build verification

- TypeScript `tsc --noEmit`: passed.
- Rollup production build: passed.
- `node --check dist/index.js`: passed.
- `python -m py_compile main.py`: passed.
- The GitHub folder `ThemeDeck-Windows` was inspected but not modified.

## Now Playing integration regression (2026-07-27)

ThemeDeck still contained a compatibility fallback for the retired Now Playing
endpoint at `127.0.0.1:38947`. The direct plugin snapshot could also inspect
secondary players instead of only the selected source, and it was not a
reliable path when the Now Playing QAM had never been opened.

The corrected integration now:

- listens for the lightweight `playhub:now-playing-activity` event;
- reads the shared signal first, with an expiry guard;
- calls Now Playing's lightweight `get_playback_activity` backend method when
  no fresh frontend signal exists;
- uses the full snapshot only for compatibility with older Now Playing builds;
- treats only the selected source with status `Playing` as active;
- resumes ThemeDeck immediately for `Paused`, `Stopped` and no track;
- avoids the dead fixed-port request while the modern activity path is
  available.

Installed Steam SharedJSContext verification passed:

- `Playing` -> ThemeDeck external media active;
- `Paused` -> inactive;
- `Stopped` -> inactive.

Files changed: `src/index.tsx`, `dist/index.js`, `HANDOVER.md`.

## ThemeDeck 3.3.2 maintenance update (2026-08-22)

- Updated the bundled `yt-dlp.exe` to nightly `2026.08.18.122307`.
- Moved the in-plugin updater from the stable channel to the official yt-dlp nightly releases.
- Removed external `curl` and `wget` update paths.
- Nightly downloads now run outside the main asyncio loop with network and size limits.
- A downloaded executable must pass format and `--version` checks before installation.
- Replacement uses a temporary backup and restores the previous executable if verification fails.
- The QAM displays byte-based progress as a linear bar and confirms the installed version on success.
- Version metadata and frontend introduction markers now report `3.3.2`.
