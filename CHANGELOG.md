# Changelog

## 3.3.7

Fix unused-download cleanup retaining music assigned to uninstalled Steam games or removed non-Steam shortcuts. Shared, Ambient, Store and external audio remain available; unavailable Steam libraries are treated conservatively.
Avoid external-media scans in desktop mode, during games and on pages without music. Keep media detection active while music plays or waits to resume.
Remove periodic idle wakeups from the local audio server.
