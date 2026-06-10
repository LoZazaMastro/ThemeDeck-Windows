# ThemeDeck Windows

ThemeDeck Windows is a Windows-friendly fork of [ThemeDeck](https://github.com/BrenticusMaximus/ThemeDeck) for Decky Loader.

It lets you add music to Steam game pages in Gaming Mode, with optional ambient music for the main interface and a separate Store track. This fork keeps the Decky plugin name as **ThemeDeck**, while adding Windows-focused fixes and quality-of-life features.

## What It Does

- Plays a custom music track when you open a game's details page.
- Lets you pick local audio files or search YouTube with `yt-dlp`.
- Downloads and assigns tracks from YouTube results.
- Supports preview playback before assigning a track.
- Supports per-game volume, start skip, and loop settings.
- Adds a general volume control only for per-game tracks.
- Supports a global/ambient track for non-game pages.
- Supports a separate Store-only track.
- Stops ThemeDeck music when a game is launched or running.
- Can auto-assign missing game tracks using YouTube search.
- Detects the Decky/Steam language and translates the UI automatically.

## Languages

The UI can automatically switch between:

- English
- Italian
- French
- Spanish
- Portuguese
- Brazilian Portuguese
- German
- Dutch
- Ukrainian
- Chinese
- Japanese

If the Steam/Decky language is not supported, ThemeDeck falls back to English.

## Windows Notes

This fork is aimed at Decky Loader running on Windows.

The Windows release includes `yt-dlp.exe` so YouTube search/download can work without relying on Linux-only command paths. The plugin only controls its own audio playback. It does not mute or change the Windows system volume.

## Installation

1. Download the latest release ZIP.
2. Open Decky Loader.
3. Enable developer mode if needed.
4. Install the ZIP through Decky's developer/plugin install flow.
5. Restart Steam if Decky asks for it.

After installation, open a game's details page, use the gear menu, and choose the ThemeDeck music option.

## FAQ

### Does this rename the plugin inside Decky?

No. The repository is called **ThemeDeck Windows**, but the plugin still appears as **ThemeDeck** in Decky.

### Does it change my PC volume?

No. ThemeDeck only changes the volume of audio played by ThemeDeck itself.

### Does YouTube search cost anything?

No. It uses `yt-dlp`. Availability depends on YouTube and `yt-dlp`, so updating `yt-dlp` from inside the plugin can help if search/download stops working.

### Can I still use local files?

Yes. Local files are still supported, and they are usually the most stable option.

## Credits

ThemeDeck was originally created by [BrenticusMaximus](https://github.com/BrenticusMaximus).

This Windows fork is maintained by [ZazaMastro](https://github.com/ZazaMastro).

## License

ThemeDeck Windows keeps the original BSD 3-Clause license.
