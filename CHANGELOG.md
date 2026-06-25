# Changelog

## 2.6.0 Windows - 2026-06-25
- Closes the Steam options menu automatically when opening the per-game ThemeDeck YouTube page.
- Reworks per-game YouTube results into a cleaner list with preview and assign actions on each result.
- Replaces the old local browser controls with a native file picker button.
- Removes redundant per-game YouTube action buttons and internal yt-dlp details from the assignment page.
- Adds cleanup for downloaded tracks that are no longer assigned.
- Caps automatic YouTube assignments at 15 minutes per track.

## 2.5.4 Windows - 2026-05-07
- Adds Windows-focused yt-dlp packaging support.
- Adds automatic UI language detection with translations for major languages.
- Adds a per-game master volume control that only affects game tracks.
- Keeps ThemeDeck audio scoped to ThemeDeck playback only.

## 2.4.2 - 2026-02-25
- Prevents global/ambient auto-play while inside ThemeDeck track-assignment screens.
- Stops global ambient playback when entering ThemeDeck assignment routes to avoid overlap during per-game selection.

## 2.4.1 - 2026-02-24
- Prevents ThemeDeck from playing any game/global/store music tracks while Steam is in Desktop Mode.

## 2.4.0 - 2026-02-24
- Adds an optional store-only track that plays only on Steam Store pages.
- Adds store-only track controls for preview, remove, volume, and start-truncation.
- Keeps existing game-page and global/ambient playback behavior while adding dedicated store context routing.

## 1.1.0 - 2025-11-18
- Fixes ThemeDeck context-menu injection so assigning music works again on SteamOS 3.7.17 (Steam Client build date Nov 17 2025).
- Displays build timestamp more clearly in the settings panel and bumps the published Decky version number.
