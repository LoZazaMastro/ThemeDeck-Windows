# ThemeDeck 3.3.7 validation

Validated on Windows on 2026-10-03.

- TypeScript type checking and production Rollup build pass.
- 54 Python tests pass, including 18 cleanup cases and 16 real loopback audio HTTP tests (full stream, seeking, concurrent clients, disconnects and shutdown).
- 33 JavaScript tests pass, including media arbitration while playing or waiting to resume, idle probe suppression and complete frontend timer/listener disposal.
- Existing menu fixtures now load the production shared helper and inspect nested menu sections instead of assuming a flat list.

## Cleanup

The installed user's collection was inspected read-only: 1,731 assignments, 1,553 eligible orphan assignments/files, 17,117,237,654 bytes. Steam installation and shortcut inventories were complete. Planning took 0.68 seconds wall time and 672 ms of CPU time. No live audio files or preferences were changed.

Cleanup uses installed app manifests across Steam libraries and current shortcuts across user accounts. Missing libraries, unreadable manifests or invalid shortcut files preserve the affected category. Shared audio, Ambient and Store assignments remain protected. User-selected audio outside the managed download directory is retained. Active downloads block cleanup. Assignments are backed up and persisted before orphan audio is removed. A retained non-Steam shortcut is kept even when its launcher hides whether the underlying game is installed.

Additional public-API validation calls `get_unused_tracks_plan` and `delete_unused_tracks` asynchronously against disposable physical WAV files and Steam inventory files. The plan leaves files and saved assignments unchanged. Cleanup removes three orphan files while retaining installed-game, retained-shortcut, shared Ambient, Store, manual and partial-download files byte for byte. The assignment backup matches its original bytes, persisted assignments match the retained inventory, a second cleanup is empty, and the event loop remains responsive while filesystem work runs. Separate physical fixtures verify that an offline library and an active download preserve their assigned audio and saved settings. These checks never point cleanup at the installed user's download directory.

## Resource measurements

The installed, unchanged ThemeDeck backend was identified through its logged audio port and measured read-only: 62.5 ms CPU over 30.04 seconds (0.208% of one logical CPU core), 32.6 MiB working set and six threads. This is a baseline, not a post-install comparison or a claim about Steam Deck performance.

An isolated production audio listener was measured for ten seconds before and after the change. The old listener woke 38 times on socket timeouts; the new listener had zero timeout wakeups. Both consumed less than the CPU timer's measurable resolution during the sample and shut down in under 0.4 ms. The new listener blocks in the OS until a connection or shutdown occurs.

Three read-only probes against the real Steam renderer took 62–110 ms each. Previously these probes ran periodically even when ThemeDeck had no track to play. Frontend tests now establish zero media/CDP probes in desktop mode, while a game runs, and on pages without assigned music. Playing music and music paused by external media still check for resume. Library inventory scanning only runs when cleanup is requested, not on an idle timer.

## Remaining live checks

The installed plugin was not replaced or restarted in this validation run. Verify automatic music pause/resume during real Steam navigation after installation and compare the installed process over the same workload. No physical first-generation Steam Deck with Windows was available; absolute CPU time and wakeups are reported instead of aggregate CPU percentages on this workstation. A user-initiated yt-dlp update retains its existing finish-before-unload behavior.
