"""Run the public cleanup API against disposable physical Windows files."""
import asyncio
import json
import unittest
import wave

import test_unused_tracks as cleanup_fixtures


class PhysicalCleanupWorkflowTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.fixture = cleanup_fixtures.UnusedTrackTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.plugin = self.fixture.plugin

    def audio(self, name, managed=True):
        base = self.plugin._downloads_dir if managed else self.fixture.root / 'manual'
        path = base / name
        path.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(path), 'wb') as stream:
            stream.setnchannels(1)
            stream.setsampwidth(2)
            stream.setframerate(8000)
            stream.writeframes(b'\0\0' * 160)
        return path

    async def test_public_api_deletes_only_orphans_and_keeps_protected_physical_audio(self):
        installed = self.audio('10/installed.wav')
        shortcut = self.audio('shortcut/retained.wav')
        orphan = self.audio('20/uninstalled.wav')
        removed_shortcut = self.audio('removed-shortcut/orphan.wav')
        shared = self.audio('shared/ambient.wav')
        store = self.audio('store/store.wav')
        manual = self.audio('manual.wav', managed=False)
        loose = self.audio('unused/loose.wav')
        partial = self.plugin._downloads_dir / 'pending.wav.part'
        partial.write_bytes(b'incomplete download')
        self.fixture.manifest(10)
        self.fixture.account.joinpath('shortcuts.vdf').write_bytes(cleanup_fixtures.shortcuts(0x80000005))
        for key, path in [(10, installed), (0x80000005, shortcut), (20, orphan),
                          (0x80000006, removed_shortcut), (30, shared),
                          ('__global__', shared), ('__store__', store), (40, manual)]:
            self.fixture.assign(key, path)
        self.plugin._save_tracks()
        before = self.plugin._tracks_file.read_bytes()
        preserved = {path: path.read_bytes() for path in (installed, shortcut, shared, store, manual, partial)}
        plan = await self.plugin.get_unused_tracks_plan()
        self.assertEqual(set(plan['files']), {str(path.resolve()) for path in (orphan, removed_shortcut, loose)})
        self.assertEqual(self.plugin._tracks_file.read_bytes(), before)
        self.assertTrue(all(path.exists() for path in preserved) and orphan.exists())
        task = asyncio.create_task(self.plugin.delete_unused_tracks())
        heartbeats = 0
        while not task.done():
            await asyncio.sleep(0)
            heartbeats += 1
        result = await task
        self.assertTrue(result['ok'])
        self.assertEqual((result['removed_files'], result['removed_tracks']), (3, 3))
        self.assertGreater(heartbeats, 0)
        self.assertTrue(all(not path.exists() for path in (orphan, removed_shortcut, loose)))
        self.assertEqual({path: path.read_bytes() for path in preserved}, preserved)
        self.assertEqual(self.plugin._tracks_file.with_suffix('.cleanup.bak').read_bytes(), before)
        persisted = json.loads(self.plugin._tracks_file.read_text(encoding='utf-8'))
        self.assertEqual(set(persisted), {'10', str(0x80000005), '__global__', '__store__', '40'})
        second = await self.plugin.delete_unused_tracks()
        self.assertEqual((second['removed_files'], second['removed_tracks']), (0, 0))

    async def test_public_api_keeps_audio_when_a_steam_library_drive_is_offline(self):
        path = self.audio('20/offline-library.wav')
        self.fixture.assign(20, path)
        self.plugin._save_tracks()
        before = self.plugin._tracks_file.read_bytes()
        offline = str(self.fixture.root / 'offline-drive').replace('\\', '\\\\')
        self.fixture.steam.joinpath('steamapps/libraryfolders.vdf').write_text(
            f'"libraryfolders" {{ "1" {{ "path" "{offline}" }} }}')
        result = await self.plugin.delete_unused_tracks()
        self.assertFalse(result['inventory_complete']['steam'])
        self.assertEqual((result['removed_files'], result['removed_tracks']), (0, 0))
        self.assertTrue(path.exists())
        self.assertEqual(self.plugin._tracks_file.read_bytes(), before)

    async def test_public_api_refuses_cleanup_during_an_active_download(self):
        path = self.audio('20/downloading.wav')
        self.fixture.assign(20, path)
        self.plugin._save_tracks()
        before = self.plugin._tracks_file.read_bytes()
        self.plugin._active_audio_downloads = 1
        result = await self.plugin.delete_unused_tracks()
        self.assertFalse(result['ok'])
        self.assertEqual(result['reason'], 'download_in_progress')
        self.assertEqual((result['removed_files'], result['removed_tracks']), (0, 0))
        self.assertTrue(path.exists())
        self.assertEqual(self.plugin._tracks_file.read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
