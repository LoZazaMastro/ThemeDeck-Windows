import asyncio
import hashlib
import importlib.util
import io
import json
import logging
import pathlib
import sys
import tempfile
import types
import unittest
from unittest.mock import AsyncMock, patch


ROOT = pathlib.Path(__file__).resolve().parents[1]
VERSION = '2026.09.08.232658'
PAYLOAD = b'MZ' + b'test-executable-not-for-execution' * 10


class UpdateTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        decky = types.ModuleType('decky')
        decky.DECKY_PLUGIN_SETTINGS_DIR = self.temp.name
        decky.DECKY_PLUGIN_DIR = str(ROOT)
        decky.logger = logging.getLogger('themedeck-tests')
        module_patch = patch.dict(sys.modules, decky=decky)
        module_patch.start()
        self.addCleanup(module_patch.stop)
        spec = importlib.util.spec_from_file_location('themedeck_test', ROOT / 'main.py')
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.module.IS_WINDOWS = True
        self.plugin = self.module.Plugin()
        self.plugin._bin_dir.mkdir()
        self.plugin._yt_dlp_path.write_bytes(b'old')
        self.command = patch.object(self.plugin, '_run_command', new=AsyncMock(side_effect=AssertionError('No real processes in tests')))
        self.command.start()
        self.addCleanup(self.command.stop)

    async def fake_download(self, path):
        path.write_bytes(PAYLOAD)
        return VERSION

    async def fake_version(self, invocation):
        return VERSION if pathlib.Path(invocation['command'][0]).read_bytes() == PAYLOAD else 'old'

    def install_mocks(self):
        for name, value in (('_download_yt_dlp_binary', AsyncMock(side_effect=self.fake_download)),
                            ('_get_yt_dlp_version', AsyncMock(side_effect=self.fake_version))):
            p = patch.object(self.plugin, name, value)
            p.start()
            self.addCleanup(p.stop)

    async def test_success_uses_updated_local_executable(self):
        self.install_mocks()
        status = await self.plugin.update_yt_dlp()
        self.assertEqual(status['source'], 'local')
        self.assertEqual(status['version'], VERSION)
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), PAYLOAD)
        progress = await self.plugin.get_yt_dlp_update_progress()
        self.assertEqual(progress['phase'], 'completed')
        self.assertFalse(progress['running'])
        self.assertEqual(progress['result'], status)

    async def test_start_returns_immediately_and_joins_existing_job(self):
        gate = asyncio.Event()
        async def update():
            await gate.wait()
            return {'installed': True, 'version': VERSION}
        with patch.object(self.plugin, '_perform_yt_dlp_update', side_effect=update):
            first = await self.plugin.start_yt_dlp_update()
            second = await self.plugin.start_yt_dlp_update()
            self.assertEqual(first['jobId'], second['jobId'])
            await asyncio.sleep(0)
            self.assertTrue((await self.plugin.get_yt_dlp_update_progress())['running'])
            gate.set()
            await self.plugin._yt_dlp_update_task

    async def test_early_failure_clears_running_and_allows_retry(self):
        with patch.object(self.plugin, '_perform_yt_dlp_update', new=AsyncMock(side_effect=PermissionError('Access denied'))):
            first = await self.plugin.start_yt_dlp_update()
            await self.plugin._yt_dlp_update_task
            progress = await self.plugin.get_yt_dlp_update_progress()
            self.assertFalse(progress['running'])
            self.assertEqual(progress['phase'], 'failed')
            self.assertIn('Access denied', progress['error'])
            second = await self.plugin.start_yt_dlp_update()
            self.assertNotEqual(first['jobId'], second['jobId'])
            await self.plugin._yt_dlp_update_task

    async def test_download_failure_does_not_report_old_binary_as_updated(self):
        self.install_mocks()
        self.plugin._download_yt_dlp_binary.side_effect = TimeoutError('network timeout')
        with self.assertRaisesRegex(RuntimeError, 'network timeout'):
            await self.plugin.update_yt_dlp()
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), b'old')
        self.assertEqual(self.plugin._yt_dlp_update_progress['phase'], 'failed')

    async def test_version_mismatch_does_not_replace_existing_binary(self):
        self.install_mocks()
        self.plugin._get_yt_dlp_version.side_effect = None
        self.plugin._get_yt_dlp_version.return_value = 'wrong'
        with self.assertRaisesRegex(RuntimeError, 'does not match'):
            await self.plugin.update_yt_dlp()
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), b'old')

    async def test_verification_exception_restores_backup(self):
        self.install_mocks()
        self.plugin._get_yt_dlp_version.side_effect = [VERSION, TimeoutError('version probe timeout')]
        with self.assertRaisesRegex(RuntimeError, 'version probe timeout'):
            await self.plugin.update_yt_dlp()
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), b'old')

    async def test_effective_invocation_mismatch_rolls_back(self):
        self.install_mocks()
        with patch.object(self.plugin, 'get_yt_dlp_status', new=AsyncMock(return_value={'installed': True, 'source': 'bundled', 'version': 'old'})):
            with self.assertRaisesRegex(RuntimeError, 'not using'):
                await self.plugin.update_yt_dlp()
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), b'old')

    async def test_locked_destination_preserves_old_binary(self):
        self.install_mocks()
        with patch.object(pathlib.Path, 'replace', side_effect=PermissionError('file in use')):
            with self.assertRaisesRegex(RuntimeError, 'file in use'):
                await self.plugin.update_yt_dlp()
        self.assertEqual(self.plugin._yt_dlp_path.read_bytes(), b'old')

    def release(self, digest=True):
        base = f'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/{VERSION}/'
        asset = {'name': 'yt-dlp.exe', 'size': len(PAYLOAD), 'browser_download_url': base + 'yt-dlp.exe'}
        if digest:
            asset['digest'] = 'sha256:' + hashlib.sha256(PAYLOAD).hexdigest()
        return {'tag_name': VERSION, 'assets': [asset, {'name': 'SHA2-256SUMS', 'browser_download_url': base + 'SHA2-256SUMS'}]}

    def download_responses(self, release, payload=PAYLOAD, checksum=None):
        streams = [io.BytesIO(json.dumps(release).encode())]
        if checksum is not None:
            streams.append(io.BytesIO(checksum))
        streams.append(io.BytesIO(payload))
        return patch.object(self.module.urllib.request, 'urlopen', side_effect=streams)

    def test_metadata_pins_asset_and_verifies_checksum(self):
        release = self.release()
        with self.download_responses(release) as request, patch.object(self.plugin, '_is_valid_yt_dlp_binary', return_value=True):
            version = self.plugin._download_yt_dlp_binary_sync(pathlib.Path(self.temp.name) / 'download.exe')
        self.assertEqual(version, VERSION)
        self.assertEqual(request.call_args_list[1].args[0].full_url, release['assets'][0]['browser_download_url'])

    def test_checksum_file_fallback_uses_same_release(self):
        checksum = (hashlib.sha256(PAYLOAD).hexdigest() + '  yt-dlp.exe\n').encode()
        with self.download_responses(self.release(False), checksum=checksum), patch.object(self.plugin, '_is_valid_yt_dlp_binary', return_value=True):
            self.plugin._download_yt_dlp_binary_sync(pathlib.Path(self.temp.name) / 'download.exe')

    def test_wrong_checksum_or_truncated_download_rejected(self):
        for payload in (b'x' * len(PAYLOAD), PAYLOAD[:-1]):
            with self.download_responses(self.release(), payload):
                with self.assertRaisesRegex(RuntimeError, 'SHA-256 or size'):
                    self.plugin._download_yt_dlp_binary_sync(pathlib.Path(self.temp.name) / 'download.exe')

    def test_untrusted_asset_url_is_rejected(self):
        release = self.release()
        release['assets'][0]['browser_download_url'] = 'https://example.invalid/yt-dlp.exe'
        with self.download_responses(release):
            with self.assertRaisesRegex(RuntimeError, 'Unexpected'):
                self.plugin._download_yt_dlp_binary_sync(pathlib.Path(self.temp.name) / 'download.exe')

    async def test_game_job_uses_shared_progress_and_returns_assignment(self):
        response = {'tracks': {'42': {'filename': 'test.webm'}}, 'filename': 'test.webm'}
        with patch.object(self.plugin, 'download_youtube_audio', new=AsyncMock(return_value=response)) as download:
            initial = await self.plugin.start_game_download(42, 'https://youtu.be/test', True, False)
            await asyncio.sleep(0)
            result = await self.plugin.get_discover_download_progress(initial['jobId'])
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(result['result'], response)
        download.assert_awaited_once_with(42, 'https://youtu.be/test', True, False)

    async def test_game_job_error_is_visible_and_invalid_id_rejected(self):
        with self.assertRaises(ValueError):
            await self.plugin.start_game_download(0, 'url')
        with patch.object(self.plugin, 'download_youtube_audio', new=AsyncMock(side_effect=RuntimeError('download failed'))):
            started = await self.plugin.start_game_download(42, 'url')
            await asyncio.sleep(0)
            result = await self.plugin.get_discover_download_progress(started['jobId'])
        self.assertEqual(result['status'], 'failed')
        self.assertFalse(result['running'])
        self.assertIn('download failed', result['error'])
