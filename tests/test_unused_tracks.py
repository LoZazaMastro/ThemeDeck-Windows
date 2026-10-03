import importlib.util
import json
import logging
import pathlib
import struct
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]


def shortcuts(*ids):
    result = bytearray(b'\x00shortcuts\0')
    for index, app_id in enumerate(ids):
        result += b'\x00' + str(index).encode() + b'\0\x02appid\0'
        result += struct.pack('<I', app_id & 0xffffffff) + b'\x08'
    return bytes(result) + b'\x08\x08'


class UnusedTrackTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = pathlib.Path(temporary.name)
        decky = types.ModuleType('decky')
        decky.DECKY_PLUGIN_SETTINGS_DIR = str(self.root / 'settings')
        decky.DECKY_PLUGIN_DIR = str(ROOT)
        decky.logger = logging.getLogger('themedeck-cleanup-tests')
        modules = patch.dict(sys.modules, decky=decky)
        modules.start()
        self.addCleanup(modules.stop)
        spec = importlib.util.spec_from_file_location('themedeck_cleanup_test', ROOT / 'main.py')
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.plugin = self.module.Plugin()
        self.plugin._downloads_dir.mkdir(parents=True)
        self.steam = self.root / 'Steam'
        (self.steam / 'steamapps').mkdir(parents=True)
        (self.steam / 'steamapps/libraryfolders.vdf').write_text('"libraryfolders" { }')
        self.account = self.steam / 'userdata/100/config'
        self.account.mkdir(parents=True)
        roots = patch.object(self.plugin, '_steam_userdata_roots', return_value=[self.steam / 'userdata'])
        roots.start()
        self.addCleanup(roots.stop)

    def audio(self, name):
        path = self.plugin._downloads_dir / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b'audio')
        return path

    def assign(self, app_id, path):
        self.plugin._tracks[str(app_id)] = {'path': str(path), 'filename': path.name}

    def manifest(self, app_id):
        (self.steam / f'steamapps/appmanifest_{app_id}.acf').write_text(
            f'"AppState" {{ "appid" "{app_id}" }}')

    def test_uninstalled_steam_game_is_removed_but_installed_track_is_kept(self):
        installed, orphan = self.audio('10/keep.m4a'), self.audio('20/remove.mp3')
        self.assign(10, installed)
        self.assign(20, orphan)
        self.manifest(10)
        self.plugin._save_tracks()
        result = self.plugin._delete_unused_tracks_sync()
        self.assertEqual((result['removed_files'], result['removed_tracks']), (1, 1))
        self.assertTrue(installed.exists())
        self.assertFalse(orphan.exists())
        self.assertEqual(set(json.loads(self.plugin._tracks_file.read_text())), {'10'})
        self.assertTrue(self.plugin._tracks_file.with_suffix('.cleanup.bak').exists())

    def test_all_accounts_and_unsigned_shortcuts_are_protected(self):
        second = self.steam / 'userdata/200/config'
        second.mkdir(parents=True)
        second.joinpath('shortcuts.vdf').write_bytes(shortcuts(0x80000005))
        self.account.joinpath('shortcuts.vdf').write_bytes(shortcuts(0x80000006))
        for app_id in (0x80000005, 0x80000006, 0x80000007):
            self.assign(app_id, self.audio(f'{app_id}/track.m4a'))
        plan = self.plugin._unused_tracks_plan()
        self.assertEqual(set(plan['orphan_tracks']), {str(0x80000007)})
        self.assertEqual(len(plan['files']), 1)

    def test_signed_shortcut_id_is_normalized(self):
        self.account.joinpath('shortcuts.vdf').write_bytes(shortcuts(0x80000005))
        self.assign(0x80000005 - 0x100000000, self.audio('keep.mp3'))
        self.assertEqual(self.plugin._unused_tracks_plan()['files'], [])

    def test_unknown_shortcuts_inventory_preserves_assignments(self):
        self.account.joinpath('shortcuts.vdf').write_bytes(shortcuts(0x80000005)[:-1])
        audio = self.audio('keep.mp3')
        self.assign(0x80000006, audio)
        plan = self.plugin._unused_tracks_plan()
        self.assertFalse(plan['inventory_complete']['shortcuts'])
        self.assertEqual(plan['files'], [])

    def test_missing_external_drive_protects_steam_tracks(self):
        offline = str(self.root / 'offline').replace('\\', '\\\\')
        (self.steam / 'steamapps/libraryfolders.vdf').write_text(
            f'"libraryfolders" {{ "1" {{ "path" "{offline}" }} }}')
        self.assign(10, self.audio('keep.mp3'))
        plan = self.plugin._unused_tracks_plan()
        self.assertFalse(plan['inventory_complete']['steam'])
        self.assertEqual(plan['files'], [])

    def test_missing_library_list_and_invalid_manifest_are_conservative(self):
        self.assign(10, self.audio('keep.mp3'))
        (self.steam / 'steamapps/libraryfolders.vdf').unlink()
        self.assertEqual(self.plugin._unused_tracks_plan()['files'], [])
        (self.steam / 'steamapps/libraryfolders.vdf').write_text('"libraryfolders" { }')
        (self.steam / 'steamapps/appmanifest_20.acf').write_text('"AppState" {')
        self.assertEqual(self.plugin._unused_tracks_plan()['files'], [])

    def test_shared_ambient_store_and_external_manual_files_are_kept(self):
        shared = self.audio('shared.mp3')
        store = self.audio('store.mp3')
        manual = self.root / 'my-song.mp3'
        manual.write_bytes(b'manual')
        self.assign(10, shared)
        self.assign('__global__', shared)
        self.assign('__store__', store)
        self.assign(20, manual)
        result = self.plugin._delete_unused_tracks_sync()
        self.assertEqual(result['removed_files'], 0)
        self.assertTrue(all(path.exists() for path in (shared, store, manual)))
        self.assertEqual(set(self.plugin._tracks), {'__global__', '__store__', '20'})

    def test_plan_is_read_only_and_incomplete_downloads_are_kept(self):
        audio = self.audio('20/track.mp3')
        partial = self.audio('20/track.mp3.part')
        metadata = self.audio('20/info.json')
        self.assign(20, audio)
        before = dict(self.plugin._tracks)
        plan = self.plugin._unused_tracks_plan()
        self.assertEqual(plan['files'], [str(audio.resolve())])
        self.assertEqual(before, self.plugin._tracks)
        self.assertTrue(all(path.exists() for path in (audio, partial, metadata)))

    def test_active_download_blocks_cleanup(self):
        audio = self.audio('20/track.mp3')
        self.assign(20, audio)
        self.plugin._active_audio_downloads = 1
        result = self.plugin._delete_unused_tracks_sync()
        self.assertFalse(result['ok'])
        self.assertEqual(result['reason'], 'download_in_progress')
        self.assertTrue(audio.exists())
        self.assertIn('20', self.plugin._tracks)

    def test_persistence_failure_keeps_audio_and_assignments(self):
        audio = self.audio('20/track.mp3')
        self.assign(20, audio)
        with patch.object(self.module.os, 'replace', side_effect=PermissionError('locked')):
            with self.assertRaises(PermissionError):
                self.plugin._delete_unused_tracks_sync()
        self.assertTrue(audio.exists())
        self.assertIn('20', self.plugin._tracks)

    def test_new_assignment_during_plan_is_rechecked_before_delete(self):
        audio = self.audio('20/track.mp3')
        original = self.plugin._unused_tracks_plan
        def plan_then_edit():
            plan = original()
            self.assign('__global__', audio)
            return plan
        with patch.object(self.plugin, '_unused_tracks_plan', side_effect=plan_then_edit):
            result = self.plugin._delete_unused_tracks_sync()
        self.assertEqual(result['removed_files'], 0)
        self.assertTrue(audio.exists())

    def test_invalid_shortcut_root_is_not_an_empty_inventory(self):
        with self.assertRaises(ValueError):
            self.plugin._cleanup_shortcut_ids(b'\x00other\0\x08\x08')

    def test_batch_cleanup_resolves_retained_assignments_once(self):
        retained = self.audio('keep.mp3')
        self.assign('__global__', retained)
        for index in range(50):
            self.audio(f'unused/{index}.mp3')
        with patch.object(self.plugin, '_known_audio_paths', wraps=self.plugin._known_audio_paths) as reads:
            result = self.plugin._delete_unused_tracks_sync()
        self.assertEqual(result['removed_files'], 50)
        self.assertEqual(reads.call_count, 1)
        self.assertTrue(retained.exists())

    def test_new_assignment_during_file_deletion_is_preserved(self):
        first = self.audio('a.mp3')
        second = self.audio('b.mp3')
        original = pathlib.Path.unlink
        def unlink(path, *args, **kwargs):
            if path == first:
                self.assign('__global__', second)
                self.plugin._save_tracks()
            return original(path, *args, **kwargs)
        with patch.object(pathlib.Path, 'unlink', new=unlink):
            result = self.plugin._delete_unused_tracks_sync()
        self.assertEqual(result['removed_files'], 1)
        self.assertFalse(first.exists())
        self.assertTrue(second.exists())

    def test_localappdata_cache_is_not_a_second_steam_installation(self):
        cache = self.root / 'SteamCache/userdata/100'
        cache.mkdir(parents=True)
        self.assign(20, self.audio('unused.mp3'))
        with patch.object(self.plugin, '_steam_userdata_roots', return_value=[self.steam/'userdata', cache.parent]):
            plan = self.plugin._unused_tracks_plan()
        self.assertTrue(all(plan['inventory_complete'].values()))
        self.assertEqual(len(plan['orphan_tracks']), 1)


if __name__ == '__main__':
    unittest.main()
