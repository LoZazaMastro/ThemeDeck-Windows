"""Real loopback requests against the dependency-free production audio server."""
import asyncio
import builtins
import concurrent.futures
import http.client
import importlib.util
import logging
import pathlib
import socket
import struct
import sys
import tempfile
import time
import types
import unittest
import urllib.parse
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = bytes(range(256)) * 2048


class AudioServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        decky = types.ModuleType('decky')
        decky.DECKY_PLUGIN_SETTINGS_DIR = self.temp.name
        decky.DECKY_PLUGIN_DIR = str(ROOT)
        decky.logger = logging.getLogger('themedeck-audio-tests')
        fake = patch.dict(sys.modules, decky=decky)
        fake.start()
        self.addCleanup(fake.stop)
        self.blocked_imports = []
        real_import = builtins.__import__

        def frozen_import(name, globals=None, locals=None, fromlist=(), level=0):
            if name in {'http.server', 'socketserver'} or name == 'http' and 'server' in fromlist:
                self.blocked_imports.append(name)
                raise ModuleNotFoundError("No module named 'http.server'")
            return real_import(name, globals, locals, fromlist, level)

        spec = importlib.util.spec_from_file_location('themedeck_audio_test', ROOT / 'main.py')
        self.module = importlib.util.module_from_spec(spec)
        with patch('builtins.__import__', side_effect=frozen_import):
            spec.loader.exec_module(self.module)
        self.plugin = self.module.Plugin()
        self.addCleanup(self.plugin._stop_audio_server)
        self.track = pathlib.Path(self.temp.name) / 'Caffè 東京 theme.wav'
        self.track.write_bytes(DATA)
        self.plugin._tracks['42'] = {'path': str(self.track)}
        self.url = self.plugin._get_track_audio_url_sync(str(self.track))['url']

    def request(self, method='GET', headers=None, url=None):
        parts = urllib.parse.urlsplit(url or self.url)
        client = http.client.HTTPConnection(parts.hostname, parts.port, timeout=3)
        try:
            client.request(method, parts.path + '?' + parts.query, headers=headers or {})
            result = client.getresponse()
            return result.status, dict(result.getheaders()), result.read()
        finally:
            client.close()

    def raw_request(self, payload):
        parts = urllib.parse.urlsplit(self.url)
        with socket.create_connection((parts.hostname, parts.port), timeout=3) as client:
            client.sendall(payload)
            result = bytearray()
            while True:
                try:
                    chunk = client.recv(65536)
                except ConnectionResetError:
                    if result:
                        return bytes(result)
                    raise
                if not chunk:
                    return bytes(result)
                result.extend(chunk)

    def test_import_without_http_server_or_socketserver(self):
        self.assertEqual(self.blocked_imports, [])
        self.assertEqual(self.request()[0], 200)

    def test_get_streams_entire_assigned_file_with_cors(self):
        status, headers, data = self.request()
        self.assertEqual((status, data), (200, DATA))
        self.assertEqual(headers['Content-Type'], 'audio/wav')
        self.assertEqual(headers['Content-Length'], str(len(DATA)))
        self.assertEqual(headers['Access-Control-Allow-Origin'], '*')
        self.assertEqual(headers['Connection'], 'close')
        self.assertEqual(self.plugin._audio_server.server_address[0], '127.0.0.1')

    def test_head_has_length_without_body(self):
        status, headers, data = self.request('HEAD')
        self.assertEqual((status, data), (200, b''))
        self.assertEqual(headers['Content-Length'], str(len(DATA)))

    def test_ranges_for_seeking(self):
        ranges = [('bytes=0-0', 0, 0), ('bytes=123-345', 123, 345),
                  ('bytes=523000-', 523000, len(DATA)-1), ('bytes=-128', len(DATA)-128, len(DATA)-1),
                  ('bytes=0-999999999', 0, len(DATA)-1), ('bytes=-999999999', 0, len(DATA)-1)]
        for value, start, end in ranges:
            with self.subTest(range=value):
                status, headers, data = self.request(headers={'rAnGe': value})
                self.assertEqual(status, 206)
                self.assertEqual(data, DATA[start:end+1])
                self.assertEqual(headers['Content-Range'], f'bytes {start}-{end}/{len(DATA)}')
                self.assertEqual(int(headers['Content-Length']), len(data))

    def test_invalid_and_unsatisfiable_ranges(self):
        for value in ('bytes=-', 'bytes=-0', 'bytes=999999999-', 'bytes=10-1',
                      'bytes=0-1,4-6', 'bytes=no', 'items=1-2'):
            with self.subTest(range=value):
                status, headers, body = self.request(headers={'Range': value})
                self.assertEqual(status, 416)
                self.assertEqual(headers['Content-Range'], f'bytes */{len(DATA)}')
                self.assertEqual(headers['Content-Length'], '0')
                self.assertFalse(body)

    def test_head_range(self):
        status, headers, body = self.request('HEAD', {'Range': 'bytes=5-9'})
        self.assertEqual(status, 206)
        self.assertEqual(headers['Content-Length'], '5')
        self.assertFalse(body)

    def test_options_preflight(self):
        status, headers, body = self.request('OPTIONS', {'Access-Control-Request-Private-Network': 'true'})
        self.assertEqual(status, 204)
        self.assertEqual(headers['Access-Control-Allow-Private-Network'], 'true')
        self.assertEqual(headers['Access-Control-Allow-Headers'], 'Range')
        self.assertFalse(body)

    def test_wrong_token_and_unassigned_files_are_denied(self):
        parts = urllib.parse.urlsplit(self.url)
        params = urllib.parse.parse_qs(parts.query)
        original = params['token'][0]
        for token in ('wrong', '', '東京'):
            params['token'] = [token]
            url = urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(params, doseq=True)))
            self.assertEqual(self.request(url=url)[0], 403)
        unassigned = pathlib.Path(self.temp.name) / 'other.wav'
        unassigned.write_bytes(DATA)
        params.update(token=[original], path=[str(unassigned)])
        url = urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(params, doseq=True)))
        self.assertEqual(self.request(url=url)[0], 403)
        with self.assertRaises(PermissionError):
            self.plugin._get_track_audio_url_sync(str(unassigned))

    def test_unassigned_after_url_was_issued_is_denied(self):
        self.plugin._tracks.clear()
        self.assertEqual(self.request()[0], 403)

    def test_non_audio_and_missing_paths_are_denied(self):
        bad = pathlib.Path(self.temp.name) / 'secret.txt'
        bad.write_text('secret')
        self.plugin._tracks['1'] = {'path': str(bad)}
        with self.assertRaises(PermissionError):
            self.plugin._get_track_audio_url_sync(str(bad))
        missing = pathlib.Path(self.temp.name) / 'missing.wav'
        self.assertFalse(self.plugin._can_stream_audio_path(missing))

    def test_unsupported_method_and_endpoint(self):
        self.assertEqual(self.request('POST')[0], 405)
        self.assertEqual(self.request(url=self.url.replace('/audio?', '/other?'))[0], 404)

    def test_header_limits_and_malformed_requests(self):
        self.assertTrue(self.raw_request(b'BROKEN\r\n\r\n').startswith(b'HTTP/1.1 400'))
        self.assertTrue(self.raw_request(b'GET / HTTP/1.1\r\nHost: x\r\nHost: y\r\n\r\n').startswith(b'HTTP/1.1 400'))
        result = self.raw_request(b'GET / HTTP/1.1\r\nLong: ' + b'x' * 17000 + b'\r\n\r\n')
        self.assertTrue(result.startswith(b'HTTP/1.1 431'))

    def test_concurrent_start_and_seek_share_one_server(self):
        self.plugin._stop_audio_server()
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            urls = list(pool.map(lambda _: self.plugin._get_track_audio_url_sync(str(self.track))['url'], range(24)))
        self.assertEqual(len(set(urls)), 1)
        self.url = urls[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.request(headers={'Range': 'bytes=1000-2047'}), range(24)))
        self.assertTrue(all(status == 206 and data == DATA[1000:2048] for status, _, data in results))

    def test_cancelled_connection_does_not_break_next_request(self):
        parts = urllib.parse.urlsplit(self.url)
        client = socket.create_connection((parts.hostname, parts.port), timeout=3)
        client.sendall(f'GET {parts.path}?{parts.query} HTTP/1.1\r\nHost: localhost\r\n\r\n'.encode())
        client.recv(1024)
        client.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
        client.close()
        self.assertEqual(self.request(headers={'Range': 'bytes=0-9'})[2], DATA[:10])

    def test_stop_closes_listener_and_partial_clients_and_can_restart(self):
        parts = urllib.parse.urlsplit(self.url)
        with socket.create_connection((parts.hostname, parts.port), timeout=3) as slow:
            slow.sendall(b'GET /audio HTTP/1.1\r\n')
            time.sleep(0.03)
            thread = self.plugin._audio_server_thread
            server = self.plugin._audio_server
            self.plugin._stop_audio_server()
            self.assertFalse(thread.is_alive())
            self.assertFalse(any(worker.is_alive() for worker in server._workers))
            with self.assertRaises(OSError):
                socket.create_connection((parts.hostname, parts.port), timeout=.3)
        self.url = self.plugin._get_track_audio_url_sync(str(self.track))['url']
        self.assertEqual(self.request('HEAD')[0], 200)

    def test_unload_prevents_accidental_restart_and_preserves_files(self):
        asyncio.run(self.plugin._unload())
        self.assertTrue(self.track.exists())
        with self.assertRaisesRegex(RuntimeError, 'unloading'):
            self.plugin._get_track_audio_url_sync(str(self.track))
        self.assertIsNone(self.plugin._audio_server)
