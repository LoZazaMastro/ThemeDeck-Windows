"""Only expected connection closes from Decky's local RPC receive loop are handled."""
import asyncio
import importlib.util
import logging
import pathlib
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch

ROOT = pathlib.Path(__file__).resolve().parents[1]


def error_with_trace(error, filename=r'C:\decky_loader\localplatform\localsocket.py', function='_listen_for_method_call'):
    namespace = {'error': error}
    exec(compile(f'def {function}():\n    raise error\n', filename, 'exec'), namespace)
    try:
        namespace[function]()
    except Exception as caught:
        return caught


class RpcDisconnectTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        decky = types.ModuleType('decky')
        decky.DECKY_PLUGIN_SETTINGS_DIR = self.temp.name
        decky.DECKY_PLUGIN_DIR = str(ROOT)
        decky.logger = logging.getLogger('themedeck-rpc-tests')
        fake = patch.dict(sys.modules, decky=decky)
        fake.start()
        self.addCleanup(fake.stop)
        spec = importlib.util.spec_from_file_location('themedeck_rpc_test', ROOT / 'main.py')
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.plugin = self.module.Plugin()

    def tearDown(self):
        self.plugin._restore_rpc_disconnect_handler()
        self.plugin._stop_audio_server()

    async def test_expected_winerror64_closes_transport_and_is_rate_limited(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        self.addCleanup(loop.set_exception_handler, original)
        previous = Mock()
        loop.set_exception_handler(previous)
        self.plugin._install_rpc_disconnect_handler()
        error = OSError(64, 'network name no longer available')
        error.winerror = 64
        context = {'exception': error_with_trace(error), 'transport': Mock()}
        with patch.object(self.module.decky.logger, 'info') as log:
            loop.call_exception_handler(context)
            loop.call_exception_handler(context)
            self.assertEqual(log.call_count, 1)
        self.assertEqual(context['transport'].close.call_count, 2)
        previous.assert_not_called()

    async def test_unrelated_network_error_and_real_rpc_errors_are_forwarded(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        self.addCleanup(loop.set_exception_handler, original)
        previous = Mock()
        loop.set_exception_handler(previous)
        self.plugin._install_rpc_disconnect_handler()
        errors = [error_with_trace(ConnectionResetError('reset'), 'main.py'),
                  error_with_trace(ValueError('bad RPC request')),
                  error_with_trace(PermissionError('denied')),
                  error_with_trace(ConnectionResetError('reset'), function='other_function')]
        for error in errors:
            context = {'exception': error}
            loop.call_exception_handler(context)
            previous.assert_called_with(loop, context)
        self.assertEqual(previous.call_count, len(errors))

    async def test_install_idempotent_and_restore_does_not_clobber_new_handler(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        self.addCleanup(loop.set_exception_handler, original)
        previous = Mock()
        loop.set_exception_handler(previous)
        self.plugin._install_rpc_disconnect_handler()
        installed = loop.get_exception_handler()
        self.plugin._install_rpc_disconnect_handler()
        self.assertIs(installed, loop.get_exception_handler())
        self.plugin._restore_rpc_disconnect_handler()
        self.assertIs(previous, loop.get_exception_handler())
        self.plugin._install_rpc_disconnect_handler()
        new_handler = Mock()
        loop.set_exception_handler(new_handler)
        self.plugin._restore_rpc_disconnect_handler()
        self.assertIs(new_handler, loop.get_exception_handler())

    async def test_default_handler_is_used_for_unknown_errors(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        self.addCleanup(loop.set_exception_handler, original)
        loop.set_exception_handler(None)
        self.plugin._install_rpc_disconnect_handler()
        with patch.object(loop, 'default_exception_handler') as default:
            context = {'exception': ValueError('not suppressed')}
            loop.call_exception_handler(context)
            default.assert_called_once_with(context)

    async def test_backend_start_and_unload_restore_handler(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        await self.plugin._main()
        self.assertIsNot(loop.get_exception_handler(), original)
        await self.plugin._unload()
        self.assertIs(loop.get_exception_handler(), original)

    async def test_failed_start_restores_handler_and_does_not_leave_listener(self):
        loop = asyncio.get_running_loop()
        original = loop.get_exception_handler()
        with patch.object(self.plugin, '_load_tracks', side_effect=OSError('settings failure')):
            with self.assertRaisesRegex(OSError, 'settings failure'):
                await self.plugin._main()
        self.assertIs(loop.get_exception_handler(), original)
        self.assertIsNone(self.plugin._audio_server)
        self.assertTrue(self.plugin._unloading)
