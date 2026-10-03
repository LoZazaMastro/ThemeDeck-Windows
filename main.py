from __future__ import annotations

import asyncio
import base64
import hashlib
import errno
import html as html_lib
import json
import os
import re
import secrets
import shutil
import socket
import ssl
import struct
import subprocess
import tempfile
import threading
import time
import traceback
import urllib.parse
import urllib.request
import urllib.error
import zlib
from pathlib import Path
from typing import Any

import decky

IS_WINDOWS = os.name == "nt"
SUPPORTED_AUDIO_EXTENSIONS = {"mp3", "aac", "flac", "ogg", "wav", "m4a", "webm"}
YTDLP_RELEASE_URLS = (
    (
        "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.exe",
    )
    if IS_WINDOWS
    else (
        "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp",
        "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_linux",
    )
)
YTDLP_RELEASE_API = "https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest"
NOW_PLAYING_SNAPSHOT_URL = "http://127.0.0.1:38947/snapshot"
NOW_PLAYING_IGNORE_TOKENS = ("steam", "steamwebhelper", "decky", "themedeck", "theme deck")


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def clamp_seconds(value: float, minimum: float = 0.0, maximum: float = 30.0) -> float:
    return max(minimum, min(maximum, value))


class _AudioRequest:
    """Small, bounded HTTP/1.x adapter; no http.server/socketserver dependency.

    Decky's frozen Windows runtime does not always ship those optional modules.
    Only one request is accepted per connection, always with Connection: close.
    """

    MAX_HEADERS = 16 * 1024
    _REASONS = {
        200: "OK", 204: "No Content", 206: "Partial Content",
        400: "Bad Request", 403: "Forbidden", 404: "Not Found",
        405: "Method Not Allowed", 408: "Request Timeout",
        416: "Range Not Satisfiable", 431: "Request Header Fields Too Large",
        500: "Internal Server Error", 503: "Service Unavailable",
    }

    def __init__(self, connection: socket.socket) -> None:
        self.connection = connection
        self.path = ""
        self.method = ""
        self.headers: dict[str, str] = {}
        self.headers_sent = False
        self._response: list[str] = []
        self.wfile = self

    def read_headers(self) -> bool:
        data = bytearray()
        while b"\r\n\r\n" not in data:
            block = self.connection.recv(min(4096, self.MAX_HEADERS + 1 - len(data)))
            if not block:
                return False
            data.extend(block)
            if len(data) > self.MAX_HEADERS:
                self.send_error(431)
                return False
        lines = bytes(data).split(b"\r\n\r\n", 1)[0].decode("iso-8859-1").split("\r\n")
        parts = lines[0].split(" ")
        if len(parts) != 3 or parts[2] not in {"HTTP/1.0", "HTTP/1.1"}:
            self.send_error(400)
            return False
        self.method, self.path, _version = parts
        if not self.path.startswith("/") or any(ord(c) < 32 for c in self.path):
            self.send_error(400)
            return False
        for line in lines[1:]:
            name, separator, value = line.partition(":")
            if (not separator or not re.fullmatch(r"[!#$%&'*+.^_`|~0-9A-Za-z-]+", name)
                    or any(ord(c) < 32 and c != "\t" for c in value)):
                self.send_error(400)
                return False
            name = name.lower()
            if name in self.headers:
                self.send_error(400)
                return False
            self.headers[name] = value.strip()
        return True

    def send_response(self, status: int) -> None:
        if self.headers_sent:
            raise RuntimeError("Audio response headers already sent")
        self._response = [f"HTTP/1.1 {status} {self._REASONS.get(status, 'Error')}",
                          "Server: ThemeDeckAudio/2.0", "Connection: close"]

    def send_header(self, name: str, value: str) -> None:
        if "\r" in name + value or "\n" in name + value:
            raise ValueError("Invalid response header")
        self._response.append(f"{name}: {value}")

    def end_headers(self) -> None:
        data = ("\r\n".join(self._response) + "\r\n\r\n").encode("iso-8859-1")
        self.headers_sent = True
        self.connection.sendall(data)

    def send_error(self, status: int) -> None:
        if self.headers_sent:
            return
        self.send_response(status)
        self.send_header("Content-Length", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def write(self, data: bytes) -> None:
        self.connection.sendall(data)


class _AudioStreamServer:
    """Loopback-only audio server with bounded workers and deterministic teardown."""

    MAX_CLIENTS = 16

    def __init__(self, plugin: Any) -> None:
        self._plugin = plugin
        self._stopped = threading.Event()
        self._lock = threading.Lock()
        self._clients: set[socket.socket] = set()
        self._workers: set[threading.Thread] = set()
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            if IS_WINDOWS and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                self._socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            self._socket.bind(("127.0.0.1", 0))
            self._socket.listen(self.MAX_CLIENTS)
            # accept sleeps in the OS until a client connects; shutdown wakes it.
            self._socket.settimeout(None)
            self.server_address = self._socket.getsockname()
        except BaseException:
            self._socket.close()
            raise

    def serve_forever(self) -> None:
        while not self._stopped.is_set():
            try:
                connection, _address = self._socket.accept()
            except socket.timeout:
                continue
            except OSError:
                if not self._stopped.is_set():
                    decky.logger.exception("ThemeDeck audio listener failed")
                break
            with self._lock:
                if self._stopped.is_set() or len(self._clients) >= self.MAX_CLIENTS:
                    connection.close()
                    continue
                self._clients.add(connection)
                worker = threading.Thread(target=self._serve_client, args=(connection,),
                                          name="ThemeDeckAudioClient", daemon=True)
                self._workers.add(worker)
                try:
                    worker.start()
                except BaseException:
                    self._workers.discard(worker)
                    self._clients.discard(connection)
                    connection.close()
                    raise

    def _serve_client(self, connection: socket.socket) -> None:
        request = _AudioRequest(connection)
        try:
            connection.settimeout(10.0)
            if not request.read_headers():
                return
            connection.settimeout(30.0)
            if request.method == "OPTIONS":
                if urllib.parse.urlsplit(request.path).path != "/audio":
                    request.send_error(404)
                    return
                request.send_response(204)
                request.send_header("Content-Length", "0")
                request.send_header("Access-Control-Allow-Origin", "*")
                request.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
                request.send_header("Access-Control-Allow-Headers", "Range")
                if request.headers.get("access-control-request-private-network") == "true":
                    request.send_header("Access-Control-Allow-Private-Network", "true")
                request.end_headers()
            elif request.method in {"GET", "HEAD"}:
                self._plugin._handle_audio_stream_request(request, request.method == "HEAD")
            else:
                request.send_error(405)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError, socket.timeout):
            # Browsers cancel old requests during seeking, navigation and reloads.
            pass
        except OSError as error:
            if not self._stopped.is_set() and not _is_expected_connection_close(error):
                decky.logger.error(f"ThemeDeck audio connection failed: {error}")
        except Exception:
            decky.logger.exception("ThemeDeck audio request failed")
            try:
                request.send_error(500)
            except OSError:
                pass
        finally:
            connection.close()
            with self._lock:
                self._clients.discard(connection)
                self._workers.discard(threading.current_thread())

    def shutdown(self) -> None:
        self._stopped.set()
        try:
            self._socket.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        self._socket.close()
        with self._lock:
            clients = list(self._clients)
            workers = list(self._workers)
        for connection in clients:
            try:
                connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            connection.close()
        deadline = time.monotonic() + 1.5
        for worker in workers:
            if worker is not threading.current_thread():
                worker.join(timeout=max(0.0, deadline - time.monotonic()))

    def server_close(self) -> None:
        self.shutdown()


def _is_expected_connection_close(error: BaseException) -> bool:
    return isinstance(error, OSError) and (
        getattr(error, "winerror", None) in {64, 109, 232, 995, 10053, 10054}
        or getattr(error, "errno", None) in {errno.ECONNRESET, errno.ECONNABORTED, errno.EPIPE}
        or isinstance(error, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError))
    )


def _is_decky_local_socket_disconnect(error: BaseException) -> bool:
    if not _is_expected_connection_close(error):
        return False
    tb = error.__traceback__
    while tb is not None:
        code = tb.tb_frame.f_code
        filename = code.co_filename.replace("\\", "/").lower()
        if (filename.endswith("decky_loader/localplatform/localsocket.py")
                and code.co_name in {"_listen_for_method_call", "_read_single_line"}):
            return True
        tb = tb.tb_next
    return False


class Plugin:
    def __init__(self) -> None:
        self._tracks: dict[str, dict[str, Any]] = {}
        self._tracks_revision = 0
        self._global_track_key = "__global__"
        self._store_track_key = "__store__"
        self._plugin_dir = Path(
            getattr(decky, "DECKY_PLUGIN_DIR", Path(__file__).resolve().parent)
        )
        self._settings_dir = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)
        self._tracks_file = self._settings_dir / "tracks.json"
        self._bin_dir = self._settings_dir / "bin"
        self._yt_dlp_name = "yt-dlp.exe" if IS_WINDOWS else "yt-dlp"
        self._yt_dlp_path = self._bin_dir / self._yt_dlp_name
        self._ffmpeg_name = "ffmpeg.exe" if IS_WINDOWS else "ffmpeg"
        self._ffprobe_name = "ffprobe.exe" if IS_WINDOWS else "ffprobe"
        self._yt_venv_dir = self._settings_dir / "ytvenv"
        self._yt_venv_bin = self._yt_venv_dir / ("Scripts" if IS_WINDOWS else "bin")
        self._yt_venv_python = self._yt_venv_bin / ("python.exe" if IS_WINDOWS else "python")
        self._yt_venv_yt_dlp = self._yt_venv_bin / self._yt_dlp_name
        self._yt_dlp_update_progress: dict[str, Any] = {
            "running": False,
            "progress": 0,
            "phase": "idle",
            "version": "",
            "error": "",
        }
        self._yt_dlp_update_task: asyncio.Task[Any] | None = None
        self._downloads_dir = self._settings_dir / "downloads"
        self._discover_download_jobs: dict[str, dict[str, Any]] = {}
        self._active_audio_downloads = 0
        self._delete_downloaded_tracks_task: asyncio.Task[Any] | None = None
        self._delete_downloaded_tracks_job_id = 0
        self._delete_downloaded_tracks_progress = (
            self._new_delete_downloaded_tracks_progress("idle")
        )
        self._audio_server: _AudioStreamServer | None = None
        self._audio_server_thread: threading.Thread | None = None
        self._audio_server_port: int | None = None
        self._audio_server_token = secrets.token_urlsafe(24)
        self._audio_server_lock = threading.RLock()
        self._unloading = False
        self._rpc_exception_loop: asyncio.AbstractEventLoop | None = None
        self._rpc_exception_handler: Any = None
        self._previous_exception_handler: Any = None
        self._last_rpc_disconnect_log = 0.0

    async def _main(self) -> None:
        self._unloading = False
        self._install_rpc_disconnect_handler()
        try:
            self._settings_dir.mkdir(parents=True, exist_ok=True)
            self._bin_dir.mkdir(parents=True, exist_ok=True)
            self._downloads_dir.mkdir(parents=True, exist_ok=True)
            self._load_tracks()
            await asyncio.to_thread(self._start_audio_server)
        except BaseException:
            self._unloading = True
            await asyncio.to_thread(self._stop_audio_server)
            self._restore_rpc_disconnect_handler()
            raise
        decky.logger.info("ThemeDeck backend ready")

    async def _unload(self) -> None:
        self._unloading = True
        try:
            if self._yt_dlp_update_task and not self._yt_dlp_update_task.done():
                await asyncio.shield(self._yt_dlp_update_task)
        finally:
            try:
                await asyncio.to_thread(self._stop_audio_server)
            finally:
                self._restore_rpc_disconnect_handler()
        decky.logger.info("ThemeDeck backend unloaded")

    def _install_rpc_disconnect_handler(self) -> None:
        if self._rpc_exception_handler is not None:
            return
        loop = asyncio.get_running_loop()
        previous = loop.get_exception_handler()
        self._rpc_exception_loop = loop
        self._previous_exception_handler = previous

        def handler(active_loop: asyncio.AbstractEventLoop, context: dict[str, Any]) -> None:
            error = context.get("exception")
            if (self._rpc_exception_handler is handler and isinstance(error, BaseException)
                    and _is_decky_local_socket_disconnect(error)):
                transport = context.get("transport")
                if transport is not None:
                    try:
                        transport.close()
                    except Exception:
                        pass
                now = time.monotonic()
                if now - self._last_rpc_disconnect_log >= 5.0:
                    self._last_rpc_disconnect_log = now
                    decky.logger.info("Decky local RPC connection closed; listener remains available")
                return
            if previous is not None:
                previous(active_loop, context)
            else:
                active_loop.default_exception_handler(context)

        self._rpc_exception_handler = handler
        loop.set_exception_handler(handler)

    def _restore_rpc_disconnect_handler(self) -> None:
        loop = self._rpc_exception_loop
        handler = self._rpc_exception_handler
        if loop is not None and not loop.is_closed() and loop.get_exception_handler() is handler:
            loop.set_exception_handler(self._previous_exception_handler)
        self._rpc_exception_handler = None
        self._rpc_exception_loop = None
        self._previous_exception_handler = None

    async def _migration(self) -> None:
        self._settings_dir.mkdir(parents=True, exist_ok=True)
        self._bin_dir.mkdir(parents=True, exist_ok=True)
        self._downloads_dir.mkdir(parents=True, exist_ok=True)

    async def get_tracks(self) -> dict[str, dict[str, Any]]:
        return self._tracks

    async def start_discover_download(
        self,
        target: str,
        video_url: str,
        normalize_audio: bool = False,
        upmix_audio: bool = False,
        app_id: int | None = None,
    ) -> dict[str, Any]:
        if target not in {"ambient", "store", "game"}:
            raise ValueError("Invalid download target")
        if target == "game" and (type(app_id) is not int or app_id <= 0):
            raise ValueError("Invalid app id")
        job_id = secrets.token_hex(8)
        self._discover_download_jobs[job_id] = {
            "jobId": job_id,
            "running": True,
            "status": "starting",
            "progress": 4,
            "target": str(target or ""),
            "filename": "",
            "error": "",
        }
        asyncio.create_task(
            self._run_discover_download_job(
                job_id, target, video_url, normalize_audio, upmix_audio, app_id
            )
        )
        return dict(self._discover_download_jobs[job_id])

    async def start_game_download(self, app_id: int, video_url: str,
                                  normalize_audio: bool = False, upmix_audio: bool = False) -> dict[str, Any]:
        return await self.start_discover_download("game", video_url, normalize_audio, upmix_audio, app_id)

    async def get_discover_download_progress(self, job_id: str) -> dict[str, Any]:
        job = self._discover_download_jobs.get(str(job_id or ""))
        if not job:
            return {
                "jobId": str(job_id or ""),
                "running": False,
                "status": "missing",
                "progress": 0,
                "error": "Download job not found",
            }
        return dict(job)

    async def _run_discover_download_job(
        self,
        job_id: str,
        target: str,
        video_url: str,
        normalize_audio: bool,
        upmix_audio: bool,
        app_id: int | None = None,
    ) -> None:
        job = self._discover_download_jobs[job_id]
        try:
            job.update(status="downloading", progress=18)
            if target == "game":
                result = await self.download_youtube_audio(app_id, video_url, normalize_audio, upmix_audio)
            else:
                result = await self.download_discover_audio(target, video_url, normalize_audio, upmix_audio)
            job.update(
                running=False,
                status="completed",
                progress=100,
                filename=str(result.get("filename") or ""),
                result=result,
            )
        except Exception as error:
            decky.logger.error(f"Discover download failed: {error}")
            job.update(
                running=False,
                status="failed",
                progress=100,
                error=f"{type(error).__name__}: {error}",
            )
        finally:
            if len(self._discover_download_jobs) > 24:
                for old_id in list(self._discover_download_jobs)[:-16]:
                    if not self._discover_download_jobs[old_id].get("running"):
                        self._discover_download_jobs.pop(old_id, None)

    async def get_localconfig_app_ids(self) -> dict[str, Any]:
        return {
            "app_ids": self._read_localconfig_app_ids(),
            "shortcuts": self._read_steam_shortcuts(),
        }

    async def get_external_media_state(self) -> dict[str, Any]:
        return await asyncio.to_thread(self._read_external_media_state)

    async def resolve_store_app_names(self, app_ids: list[int]) -> dict[str, str]:
        unique_ids = sorted(
            {
                int(value)
                for value in app_ids or []
                if isinstance(value, (int, float, str)) and str(value).strip()
            }
        )
        unique_ids = [app_id for app_id in unique_ids if app_id > 0]
        if not unique_ids:
            return {}

        resolved: dict[str, str] = {}
        chunk_size = 20
        for index in range(0, len(unique_ids), chunk_size):
            chunk = unique_ids[index : index + chunk_size]
            try:
                resolved.update(
                    await asyncio.to_thread(self._resolve_store_app_names_chunk, chunk)
                )
            except Exception as error:
                decky.logger.error(
                    f"resolve_store_app_names chunk failed ({chunk[0]}..{chunk[-1]}): {error}"
                )

        unresolved_ids = [app_id for app_id in unique_ids if str(app_id) not in resolved]
        if unresolved_ids:
            decky.logger.info(
                f"resolve_store_app_names falling back for {len(unresolved_ids)} app ids"
            )

            semaphore = asyncio.Semaphore(2)

            async def resolve_one(app_id: int) -> tuple[int, str | None]:
                async with semaphore:
                    try:
                        community_name = await asyncio.to_thread(
                            self._resolve_steamcommunity_app_name, app_id
                        )
                        if community_name:
                            return app_id, community_name
                    except Exception as error:
                        decky.logger.error(
                            f"resolve_steamcommunity_app_name failed ({app_id}): {error}"
                        )
                    return app_id, None

            resolved_pairs = await asyncio.gather(
                *(resolve_one(app_id) for app_id in unresolved_ids)
            )
            for app_id, name in resolved_pairs:
                if name:
                    resolved[str(app_id)] = name
        return resolved

    async def set_track(
        self, app_id: int, path: str, filename: str, normalized: bool | None = None
    ) -> dict[str, dict[str, Any]]:
        key = str(app_id)
        decky.logger.info(f"set_track request app={app_id} path={path}")
        try:
            resolved = Path(path).expanduser().resolve()
            if not resolved.exists() or not resolved.is_file():
                raise ValueError(f"File not found or inaccessible: {resolved}")
            try:
                resolved.open("rb").close()
            except PermissionError as error:
                raise PermissionError(f"Permission denied: {resolved}") from error
            previous = self._tracks.get(key, {})
            keep_previous_normalized = (
                normalized is None and str(resolved) == str(previous.get("path", ""))
            )
            self._tracks[key] = {
                "app_id": app_id,
                "path": str(resolved),
                "filename": filename,
                "volume": previous.get("volume", 1.0),
                "start_offset": previous.get("start_offset", 0.0),
                "loop": bool(previous.get("loop", True)),
                "normalized": bool(
                    previous.get("normalized", False)
                    if keep_previous_normalized
                    else normalized
                ),
            }
            self._save_tracks()
            self._delete_replaced_managed_audio(
                str(previous.get("path") or ""), str(resolved)
            )
            decky.logger.info(f"set_track stored app={app_id} path={resolved}")
            return self._tracks
        except Exception as error:
            decky.logger.error(
                f"set_track failed app={app_id} path={path}: {error}"
            )
            raise

    async def get_track_audio_url(self, path: str) -> dict[str, Any]:
        return await asyncio.to_thread(self._get_track_audio_url_sync, path)

    async def load_track_audio(self, path: str) -> dict[str, Any]:
        raise RuntimeError(
            "Legacy base64 audio transfer is disabled; use get_track_audio_url"
        )

    def _mime_for_audio_path(self, path: Path) -> str:
        suffix = path.suffix.lower().lstrip(".")
        return {
            "mp3": "audio/mpeg",
            "aac": "audio/aac",
            "flac": "audio/flac",
            "ogg": "audio/ogg",
            "wav": "audio/wav",
            "m4a": "audio/mp4",
            "webm": "audio/webm",
        }.get(suffix, "application/octet-stream")

    def _known_audio_paths(self) -> set[str]:
        paths: set[str] = set()
        for track in list(self._tracks.values()):
            path = track.get("path") if isinstance(track, dict) else None
            if not path:
                continue
            try:
                paths.add(str(Path(str(path)).expanduser().resolve()))
            except Exception:
                continue
        return paths

    def _delete_replaced_managed_audio(self, previous_path: str, new_path: str) -> None:
        if not previous_path:
            return
        try:
            previous = Path(previous_path).expanduser().resolve()
            replacement = Path(new_path).expanduser().resolve()
            downloads_root = self._downloads_dir.resolve()
            if previous == replacement or not self._is_path_within(previous, downloads_root):
                return
            if str(previous) in self._known_audio_paths():
                return
            if previous.exists() and previous.is_file():
                previous.unlink()
                decky.logger.info(f"Deleted replaced managed track: {previous}")
            parent = previous.parent
            while parent != downloads_root and self._is_path_within(parent, downloads_root):
                try:
                    parent.rmdir()
                except OSError:
                    break
                parent = parent.parent
        except Exception as error:
            decky.logger.error(
                f"Failed deleting replaced managed track {previous_path}: {error}"
            )

    def _can_stream_audio_path(self, path: Path) -> bool:
        try:
            resolved = path.expanduser().resolve()
        except Exception:
            return False
        if not resolved.exists() or not resolved.is_file():
            return False
        if resolved.suffix.lower().lstrip(".") not in SUPPORTED_AUDIO_EXTENSIONS:
            return False
        return str(resolved) in self._known_audio_paths()

    def _start_audio_server(self) -> None:
        with self._audio_server_lock:
            if self._unloading:
                raise RuntimeError("ThemeDeck is unloading")
            if self._audio_server and self._audio_server_thread and self._audio_server_thread.is_alive():
                return
            if self._audio_server:
                self._audio_server.shutdown()
            server = _AudioStreamServer(self)
            thread = threading.Thread(target=server.serve_forever,
                                      name="ThemeDeckAudioServer", daemon=True)
            try:
                thread.start()
            except BaseException:
                server.server_close()
                raise
            self._audio_server = server
            self._audio_server_thread = thread
            self._audio_server_port = int(server.server_address[1])
            decky.logger.info(
                f"ThemeDeck audio stream server listening on 127.0.0.1:{self._audio_server_port}"
            )

    def _stop_audio_server(self) -> None:
        with self._audio_server_lock:
            server = self._audio_server
            thread = self._audio_server_thread
            self._audio_server = None
            self._audio_server_port = None
            self._audio_server_thread = None
            if server is not None:
                server.shutdown()
            if thread and thread.is_alive() and thread is not threading.current_thread():
                thread.join(timeout=1.0)

    def _get_track_audio_url_sync(self, path: str) -> dict[str, Any]:
        with self._audio_server_lock:
            resolved = Path(path).expanduser().resolve()
            if not self._can_stream_audio_path(resolved):
                raise PermissionError(f"Audio file is not assigned in ThemeDeck: {resolved}")
            self._start_audio_server()
            if not self._audio_server_port:
                raise RuntimeError("ThemeDeck audio stream server is not available")
            stats = resolved.stat()
            query = urllib.parse.urlencode(
                {
                    "token": self._audio_server_token,
                    "path": str(resolved),
                    "v": str(stats.st_mtime),
                }
            )
            return {
                "url": f"http://127.0.0.1:{self._audio_server_port}/audio?{query}",
                "mime": self._mime_for_audio_path(resolved),
                "mtime": stats.st_mtime,
                "size": stats.st_size,
            }

    def _handle_audio_stream_request(
        self, handler: _AudioRequest, head_only: bool
    ) -> None:
        try:
            parsed = urllib.parse.urlparse(handler.path)
            if parsed.path != "/audio":
                handler.send_error(404)
                return

            params = urllib.parse.parse_qs(parsed.query)
            token = params.get("token", [""])[0]
            if not secrets.compare_digest(token.encode("utf-8"), self._audio_server_token.encode("ascii")):
                handler.send_error(403)
                return

            raw_path = params.get("path", [""])[0]
            if not raw_path:
                handler.send_error(400)
                return

            resolved = Path(raw_path).expanduser().resolve()
            if not self._can_stream_audio_path(resolved):
                handler.send_error(403)
                return

            file_size = resolved.stat().st_size
            if file_size <= 0:
                handler.send_error(404)
                return

            start = 0
            end = file_size - 1
            status = 200
            range_header = handler.headers.get("range", "")
            if range_header:
                match = re.match(r"bytes=(\d*)-(\d*)$", range_header.strip())
                if not match or not any(match.groups()):
                    self._send_audio_range_error(handler, file_size)
                    return
                start_text, end_text = match.groups()
                if start_text:
                    start = int(start_text)
                    end = int(end_text) if end_text else file_size - 1
                elif end_text:
                    suffix_length = int(end_text)
                    start = max(file_size - suffix_length, 0)
                    end = file_size - 1
                if start < 0 or start >= file_size or end < start:
                    self._send_audio_range_error(handler, file_size)
                    return
                end = min(end, file_size - 1)
                status = 206

            content_length = end - start + 1
            handler.send_response(status)
            handler.send_header("Content-Type", self._mime_for_audio_path(resolved))
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
            handler.send_header("X-Content-Type-Options", "nosniff")
            handler.send_header("Content-Length", str(content_length))
            handler.send_header("Access-Control-Allow-Origin", "*")
            handler.send_header("Cache-Control", "private, max-age=3600")
            if status == 206:
                handler.send_header(
                    "Content-Range", f"bytes {start}-{end}/{file_size}"
                )
            handler.end_headers()

            if head_only:
                return

            remaining = content_length
            with resolved.open("rb") as audio_file:
                audio_file.seek(start)
                while remaining > 0:
                    chunk = audio_file.read(min(256 * 1024, remaining))
                    if not chunk:
                        break
                    handler.wfile.write(chunk)
                    remaining -= len(chunk)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, socket.timeout):
            return
        except OSError as error:
            if self._unloading or _is_expected_connection_close(error):
                return
            decky.logger.error(f"Audio stream file or socket error: {error}")
            try:
                handler.send_error(500)
            except OSError:
                pass
        except Exception as error:
            decky.logger.error(f"Audio stream request failed: {error}")
            try:
                handler.send_error(500)
            except Exception:
                pass

    def _send_audio_range_error(self, handler: _AudioRequest, file_size: int) -> None:
        handler.send_response(416)
        handler.send_header("Content-Range", f"bytes */{file_size}")
        handler.send_header("Content-Length", "0")
        handler.send_header("Access-Control-Allow-Origin", "*")
        handler.send_header("Cache-Control", "no-store")
        handler.end_headers()

    async def set_volume(
        self, app_id: int, volume: float
    ) -> dict[str, dict[str, Any]]:
        key = str(app_id)
        if key not in self._tracks:
            raise ValueError(f"No track found for app {app_id}")
        self._tracks[key]["volume"] = clamp(volume)
        self._save_tracks()
        return self._tracks

    async def set_start_offset(
        self, app_id: int, start_offset: float
    ) -> dict[str, dict[str, Any]]:
        key = str(app_id)
        if key not in self._tracks:
            raise ValueError(f"No track found for app {app_id}")
        self._tracks[key]["start_offset"] = clamp_seconds(start_offset)
        self._save_tracks()
        return self._tracks

    async def set_loop(self, app_id: int, loop: bool) -> dict[str, dict[str, Any]]:
        key = str(app_id)
        if key not in self._tracks:
            raise ValueError(f"No track found for app {app_id}")
        self._tracks[key]["loop"] = bool(loop)
        self._save_tracks()
        return self._tracks

    async def remove_track(self, app_id: int) -> dict[str, dict[str, Any]]:
        self._tracks.pop(str(app_id), None)
        self._save_tracks()
        return self._tracks

    async def get_track(self, app_id: int) -> dict[str, Any] | None:
        return self._tracks.get(str(app_id))

    async def get_global_track(self) -> dict[str, Any] | None:
        return self._tracks.get(self._global_track_key)

    async def set_global_track(self, path: str, filename: str) -> dict[str, Any]:
        decky.logger.info(f"set_global_track request path={path}")
        try:
            resolved = Path(path).expanduser().resolve()
            if not resolved.exists() or not resolved.is_file():
                raise ValueError(f"File not found or inaccessible: {resolved}")
            try:
                resolved.open("rb").close()
            except PermissionError as error:
                raise PermissionError(f"Permission denied: {resolved}") from error
            previous = self._tracks.get(self._global_track_key, {})
            self._tracks[self._global_track_key] = {
                "scope": "global",
                "path": str(resolved),
                "filename": filename,
                "volume": previous.get("volume", 1.0),
                "start_offset": previous.get("start_offset", 0.0),
                "loop": bool(previous.get("loop", True)),
            }
            self._save_tracks()
            self._delete_replaced_managed_audio(
                str(previous.get("path") or ""), str(resolved)
            )
            return self._tracks[self._global_track_key]
        except Exception as error:
            decky.logger.error(f"set_global_track failed path={path}: {error}")
            raise

    async def set_global_volume(self, volume: float) -> dict[str, Any]:
        if self._global_track_key not in self._tracks:
            raise ValueError("No global track found")
        self._tracks[self._global_track_key]["volume"] = clamp(volume)
        self._save_tracks()
        return self._tracks[self._global_track_key]

    async def set_global_start_offset(self, start_offset: float) -> dict[str, Any]:
        if self._global_track_key not in self._tracks:
            raise ValueError("No global track found")
        self._tracks[self._global_track_key]["start_offset"] = clamp_seconds(
            start_offset
        )
        self._save_tracks()
        return self._tracks[self._global_track_key]

    async def set_global_loop(self, loop: bool) -> dict[str, Any]:
        if self._global_track_key not in self._tracks:
            raise ValueError("No global track found")
        self._tracks[self._global_track_key]["loop"] = bool(loop)
        self._save_tracks()
        return self._tracks[self._global_track_key]

    async def remove_global_track(self) -> dict[str, dict[str, Any]]:
        self._tracks.pop(self._global_track_key, None)
        self._save_tracks()
        return self._tracks

    async def get_store_track(self) -> dict[str, Any] | None:
        return self._tracks.get(self._store_track_key)

    async def set_store_track(self, path: str, filename: str) -> dict[str, Any]:
        decky.logger.info(f"set_store_track request path={path}")
        try:
            resolved = Path(path).expanduser().resolve()
            if not resolved.exists() or not resolved.is_file():
                raise ValueError(f"File not found or inaccessible: {resolved}")
            try:
                resolved.open("rb").close()
            except PermissionError as error:
                raise PermissionError(f"Permission denied: {resolved}") from error
            previous = self._tracks.get(self._store_track_key, {})
            self._tracks[self._store_track_key] = {
                "scope": "store",
                "path": str(resolved),
                "filename": filename,
                "volume": previous.get("volume", 1.0),
                "start_offset": previous.get("start_offset", 0.0),
                "loop": bool(previous.get("loop", True)),
            }
            self._save_tracks()
            self._delete_replaced_managed_audio(
                str(previous.get("path") or ""), str(resolved)
            )
            return self._tracks[self._store_track_key]
        except Exception as error:
            decky.logger.error(f"set_store_track failed path={path}: {error}")
            raise

    async def set_store_volume(self, volume: float) -> dict[str, Any]:
        if self._store_track_key not in self._tracks:
            raise ValueError("No store track found")
        self._tracks[self._store_track_key]["volume"] = clamp(volume)
        self._save_tracks()
        return self._tracks[self._store_track_key]

    async def set_store_start_offset(self, start_offset: float) -> dict[str, Any]:
        if self._store_track_key not in self._tracks:
            raise ValueError("No store track found")
        self._tracks[self._store_track_key]["start_offset"] = clamp_seconds(
            start_offset
        )
        self._save_tracks()
        return self._tracks[self._store_track_key]

    async def set_store_loop(self, loop: bool) -> dict[str, Any]:
        if self._store_track_key not in self._tracks:
            raise ValueError("No store track found")
        self._tracks[self._store_track_key]["loop"] = bool(loop)
        self._save_tracks()
        return self._tracks[self._store_track_key]

    async def remove_store_track(self) -> dict[str, dict[str, Any]]:
        self._tracks.pop(self._store_track_key, None)
        self._save_tracks()
        return self._tracks

    async def delete_downloaded_tracks(self) -> dict[str, Any]:
        return await asyncio.to_thread(self._delete_downloaded_tracks_sync)

    async def delete_unused_tracks(self) -> dict[str, Any]:
        return await asyncio.to_thread(self._delete_unused_tracks_sync)

    async def get_unused_tracks_plan(self) -> dict[str, Any]:
        """Read-only preview: no track assignment or audio file is changed."""
        return await asyncio.to_thread(self._unused_tracks_plan)

    async def start_delete_downloaded_tracks(self) -> dict[str, Any]:
        if (
            self._delete_downloaded_tracks_task
            and not self._delete_downloaded_tracks_task.done()
        ):
            return dict(self._delete_downloaded_tracks_progress)

        self._delete_downloaded_tracks_job_id += 1
        job_id = self._delete_downloaded_tracks_job_id
        self._set_delete_downloaded_tracks_progress(
            {
                "running": True,
                "status": "planning",
                "total": 0,
                "completed": 0,
                "total_files": 0,
                "removed_files": 0,
                "total_tracks": 0,
                "removed_tracks": 0,
                "current_path": "",
                "message": "Preparing deletion...",
                "error": "",
                "updated_at": time.time(),
            }
        )
        self._delete_downloaded_tracks_task = asyncio.create_task(
            self._delete_downloaded_tracks_worker(job_id)
        )
        return dict(self._delete_downloaded_tracks_progress)

    async def get_delete_downloaded_tracks_progress(self) -> dict[str, Any]:
        return dict(self._delete_downloaded_tracks_progress)

    async def get_audio_normalization_status(self) -> dict[str, Any]:
        invocation = self._resolve_ffmpeg_invocation()
        return {
            "available": bool(invocation),
            "path": invocation.get("path") if invocation else None,
            "source": invocation.get("source") if invocation else None,
        }

    async def list_directory(
        self, path: str | None = None
    ) -> dict[str, Any]:
        base = path or os.path.expanduser("~")
        resolved = Path(os.path.expanduser(base)).resolve()
        if not resolved.exists():
            resolved = resolved.parent
        if not resolved.exists() or not resolved.is_dir():
            resolved = Path(os.path.expanduser("~"))
        decky.logger.info(f"Listing directory: {resolved}")

        directories: list[str] = []
        files: list[str] = []

        try:
            for entry in sorted(resolved.iterdir(), key=lambda p: p.name.lower()):
                try:
                    if entry.is_dir():
                        directories.append(entry.name)
                    elif entry.is_file():
                        files.append(entry.name)
                except PermissionError:
                    continue
        except Exception as error:
            decky.logger.error(f"Failed to list directory {resolved}: {error}")

        return {
            "path": str(resolved),
            "dirs": directories,
            "files": files,
        }

    async def validate_audio_path(self, path: str) -> dict[str, Any]:
        result = await self._validate_audio_path_impl(path)
        if isinstance(result, dict) and "valid" not in result:
            result["valid"] = bool(result.get("ok"))
        return result

    async def _validate_audio_path_impl(self, path: str) -> dict[str, Any]:
        candidate = (path or "").strip()
        if not candidate:
            return {
                "ok": False,
                "is_file": False,
                "is_dir": False,
                "path": "",
                "message": "No path selected.",
            }
        try:
            resolved = Path(candidate).expanduser().resolve()
        except Exception as error:
            return {
                "ok": False,
                "is_file": False,
                "is_dir": False,
                "path": candidate,
                "message": str(error),
            }

        if resolved.is_dir():
            return {
                "ok": False,
                "is_file": False,
                "is_dir": True,
                "path": str(resolved),
                "message": "Choose an audio file, not a folder.",
            }
        if not resolved.exists() or not resolved.is_file():
            return {
                "ok": False,
                "is_file": False,
                "is_dir": False,
                "path": str(resolved),
                "message": "File not found or inaccessible.",
            }
        if resolved.suffix.lower().lstrip(".") not in SUPPORTED_AUDIO_EXTENSIONS:
            return {
                "ok": False,
                "is_file": True,
                "is_dir": False,
                "path": str(resolved),
                "message": "Please choose a supported audio file.",
            }
        return {
            "ok": True,
            "is_file": True,
            "is_dir": False,
            "path": str(resolved),
            "parent": str(resolved.parent),
            "filename": resolved.name,
            "message": "",
        }

    async def get_yt_dlp_status(self) -> dict[str, Any]:
        invocation = self._resolve_yt_dlp_invocation()
        installed = bool(invocation)
        status: dict[str, Any] = {
            "installed": installed,
            "path": invocation["path"] if invocation else "",
            "source": "none",
            "version": "",
        }
        if not invocation:
            return status
        status["source"] = invocation["source"]
        version = await self._get_yt_dlp_version(invocation)
        if version:
            status["version"] = version
        return status

    async def get_yt_dlp_update_progress(self) -> dict[str, Any]:
        return dict(self._yt_dlp_update_progress)

    async def start_yt_dlp_update(self) -> dict[str, Any]:
        if self._yt_dlp_update_task and not self._yt_dlp_update_task.done():
            return dict(self._yt_dlp_update_progress)
        self._yt_dlp_update_progress = {
            "jobId": secrets.token_hex(8),
            "running": True,
            "progress": 2,
            "phase": "starting",
            "version": "",
            "error": "",
        }
        self._yt_dlp_update_task = asyncio.create_task(self._run_yt_dlp_update())
        return dict(self._yt_dlp_update_progress)

    async def _run_yt_dlp_update(self) -> None:
        try:
            status = await self._perform_yt_dlp_update()
            self._yt_dlp_update_progress.update(running=False, phase="completed", progress=100, result=status)
        except Exception as error:
            self._yt_dlp_update_progress.update(running=False, phase="failed", error=str(error))
            decky.logger.error(f"yt-dlp update failed: {error}")

    async def update_yt_dlp(self) -> dict[str, Any]:
        await self.start_yt_dlp_update()
        await asyncio.shield(self._yt_dlp_update_task)
        if self._yt_dlp_update_progress["phase"] != "completed":
            raise RuntimeError(self._yt_dlp_update_progress.get("error") or "yt-dlp update failed")
        return dict(self._yt_dlp_update_progress["result"])

    async def _perform_yt_dlp_update(self) -> dict[str, Any]:
        self._bin_dir.mkdir(parents=True, exist_ok=True)
        venv_error = None if IS_WINDOWS else await self._install_yt_dlp_in_venv()
        status = {} if IS_WINDOWS else await self.get_yt_dlp_status()
        if (
            not IS_WINDOWS
            and status.get("installed")
            and status.get("source") in {"venv", "system"}
        ):
            if status.get("version"):
                decky.logger.info(
                    f"yt-dlp available via {status.get('source')} ({status.get('version')})"
                )
            self._yt_dlp_update_progress.update(
                {
                    "running": False,
                    "progress": 100,
                    "phase": "completed",
                    "version": status.get("version") or "",
                    "error": "",
                }
            )
            return status

        file_descriptor, temp_name = tempfile.mkstemp(
            prefix="yt-dlp-",
            suffix=".exe" if IS_WINDOWS else "",
            dir=str(self._bin_dir),
        )
        os.close(file_descriptor)
        temp_path = Path(temp_name)
        backup_path = self._yt_dlp_path.with_suffix(self._yt_dlp_path.suffix + ".bak")
        promoted = False
        try:
            release_version = await self._download_yt_dlp_binary(temp_path)
            self._set_yt_dlp_update_progress(90, "verifying")
            temp_path.chmod(0o755)
            version = await self._get_yt_dlp_version(
                {
                    "command": [str(temp_path)],
                    "env": None,
                }
            )
            if not version or version != release_version:
                raise RuntimeError(
                    "Downloaded yt-dlp version does not match the selected nightly release"
                )

            self._set_yt_dlp_update_progress(95, "installing", version=version)
            if backup_path.exists():
                backup_path.unlink()
            if self._yt_dlp_path.exists():
                shutil.copy2(self._yt_dlp_path, backup_path)
            try:
                temp_path.replace(self._yt_dlp_path)
                promoted = True
            except Exception:
                if backup_path.exists() and not self._yt_dlp_path.exists():
                    backup_path.replace(self._yt_dlp_path)
                raise

            installed_version = await self._get_yt_dlp_version(
                {
                    "command": [str(self._yt_dlp_path)],
                    "env": None,
                }
            )
            if installed_version != version:
                raise RuntimeError("Installed yt-dlp did not pass version verification")
            status = await self.get_yt_dlp_status()
            if status.get("source") != "local" or status.get("version") != version:
                raise RuntimeError("ThemeDeck is not using the updated yt-dlp executable")
            try:
                backup_path.unlink(missing_ok=True)
            except OSError:
                decky.logger.warning("yt-dlp installed; the previous backup could not be removed")
            decky.logger.info(f"yt-dlp updated successfully ({version})")
        except Exception as error:
            if promoted:
                try:
                    if backup_path.exists():
                        backup_path.replace(self._yt_dlp_path)
                    else:
                        self._yt_dlp_path.unlink(missing_ok=True)
                except OSError as restore_error:
                    raise RuntimeError(f"yt-dlp verification failed: {error}; rollback failed: {restore_error}") from error
            self._yt_dlp_update_progress.update(
                {
                    "running": False,
                    "phase": "failed",
                    "error": self._trim_message(str(error), 220),
                }
            )
            decky.logger.error(f"Failed to update yt-dlp: {error}")
            if IS_WINDOWS:
                raise RuntimeError(f"Failed to update yt-dlp: {error}") from error
            pip_error = None if IS_WINDOWS else await self._try_install_yt_dlp_with_pip()
            status = await self.get_yt_dlp_status()
            if status.get("installed"):
                decky.logger.info("yt-dlp update failed; keeping current available binary")
                if not IS_WINDOWS and pip_error is None:
                    self._yt_dlp_update_progress.update(
                        {
                            "running": False,
                            "progress": 100,
                            "phase": "completed",
                            "version": status.get("version") or "",
                            "error": "",
                        }
                    )
                    return status
            summary = self._trim_message(str(error), 140)
            if venv_error:
                summary = self._trim_message(f"{summary}; venv: {venv_error}", 220)
            if pip_error:
                summary = self._trim_message(f"{summary}; pip: {pip_error}", 220)
            raise RuntimeError(f"Failed to update yt-dlp: {summary}") from error
        finally:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except OSError:
                    pass
        status = await self.get_yt_dlp_status()
        if not status.get("installed"):
            raise RuntimeError("yt-dlp update completed but executable was not found")
        self._yt_dlp_update_progress.update(
            {
                "running": False,
                "progress": 100,
                "phase": "completed",
                "version": status.get("version") or "",
                "error": "",
            }
        )
        return status

    async def search_youtube(self, query: str, limit: int = 10) -> dict[str, Any]:
        try:
            cleaned_query = (query or "").strip()
            if not cleaned_query:
                raise ValueError("Search query is required")

            yt_dlp = self._require_yt_dlp_invocation()
            safe_limit = max(1, min(int(limit), 80))
            command = [
                *yt_dlp["command"],
                "--no-warnings",
                "--no-check-certificate",
                "--skip-download",
                "--flat-playlist",
                "--print",
                "%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(url)s",
                f"ytsearch{safe_limit}:{cleaned_query}",
            ]
            result = await self._run_command(command, timeout=90, env=yt_dlp["env"])
            if result.returncode != 0:
                raise RuntimeError(self._command_error(result, "YouTube search failed"))

            results: list[dict[str, Any]] = []
            for raw_line in (result.stdout or "").splitlines():
                line = raw_line.strip()
                if not line:
                    continue
                parts = line.split("\t")
                if len(parts) < 2:
                    continue
                video_id = parts[0].strip()
                if not video_id:
                    continue
                title = parts[1].strip() or video_id
                uploader = parts[2].strip() if len(parts) > 2 else ""
                duration_raw = parts[3].strip() if len(parts) > 3 else ""
                duration: int | None = None
                if duration_raw:
                    try:
                        duration = int(float(duration_raw))
                    except ValueError:
                        duration = None
                url_raw = parts[4].strip() if len(parts) > 4 else ""
                if url_raw.startswith("http://") or url_raw.startswith("https://"):
                    webpage_url = url_raw
                else:
                    webpage_url = f"https://www.youtube.com/watch?v={video_id}"
                results.append(
                    {
                        "id": video_id,
                        "title": title,
                        "uploader": uploader,
                        "duration": duration,
                        "webpage_url": webpage_url,
                    }
                )
            return {"results": results}
        except Exception as error:
            decky.logger.error(f"search_youtube failed query={query!r}: {error}")
            decky.logger.error(traceback.format_exc())
            raise

    async def get_youtube_preview_stream(self, video_url: str) -> dict[str, Any]:
        yt_dlp = self._require_yt_dlp_invocation()
        normalized_url = self._normalize_youtube_url(video_url)
        command = [
            *yt_dlp["command"],
            "--no-warnings",
            "--no-check-certificate",
            "--no-playlist",
            "--dump-single-json",
            normalized_url,
        ]
        result = await self._run_command(command, timeout=90, env=yt_dlp["env"])
        if result.returncode != 0:
            raise RuntimeError(
                self._command_error(result, "Failed to resolve preview stream")
            )
        try:
            payload = json.loads(result.stdout or "{}")
        except json.JSONDecodeError as error:
            raise RuntimeError(f"yt-dlp returned invalid preview metadata: {error}") from error

        candidates: list[tuple[int, float, str]] = []
        for media_format in payload.get("formats") or []:
            if not isinstance(media_format, dict):
                continue
            url = str(media_format.get("url") or "").strip()
            acodec = str(media_format.get("acodec") or "none").lower()
            vcodec = str(media_format.get("vcodec") or "none").lower()
            extension = str(media_format.get("ext") or "").lower()
            if not url.startswith(("http://", "https://")) or acodec == "none":
                continue
            audio_only = vcodec in {"", "none"}
            # Steam CEF handles AAC/M4A most consistently. Keep Opus/WebM and
            # a muxed MP4 as fallbacks for videos without a usable AAC stream.
            if extension in {"m4a", "mp4"} or acodec.startswith("mp4a"):
                compatibility = 0 if audio_only else 2
            elif extension == "webm" or "opus" in acodec:
                compatibility = 1 if audio_only else 3
            else:
                compatibility = 4 if audio_only else 5
            bitrate = float(media_format.get("abr") or media_format.get("tbr") or 0)
            candidates.append((compatibility, -bitrate, url))

        stream_urls: list[str] = []
        for _, _, url in sorted(candidates):
            if url not in stream_urls:
                stream_urls.append(url)
            if len(stream_urls) >= 5:
                break
        if not stream_urls:
            raise RuntimeError("yt-dlp did not return a playable preview stream URL")
        return {"stream_url": stream_urls[0], "stream_urls": stream_urls}

    async def download_youtube_audio(
        self,
        app_id: int,
        video_url: str,
        normalize_audio: bool = False,
        upmix_audio: bool = False,
    ) -> dict[str, Any]:
        self._active_audio_downloads += 1
        try:
            return await self._download_youtube_audio_impl(app_id, video_url, normalize_audio, upmix_audio)
        finally:
            self._active_audio_downloads -= 1

    async def _download_youtube_audio_impl(
        self,
        app_id: int,
        video_url: str,
        normalize_audio: bool = False,
        upmix_audio: bool = False,
    ) -> dict[str, Any]:
        if app_id <= 0:
            raise ValueError("Invalid app id")

        yt_dlp = self._require_yt_dlp_invocation()
        normalized_url = self._normalize_youtube_url(video_url)
        app_download_dir = self._downloads_dir / str(app_id)
        app_download_dir.mkdir(parents=True, exist_ok=True)

        command = [
            *yt_dlp["command"],
            "--no-warnings",
            "--no-check-certificate",
            "--no-playlist",
            "--restrict-filenames",
            "--force-overwrites",
            "--paths",
            str(app_download_dir),
            "-o",
            "%(title).150B [%(id)s].%(ext)s",
            "--print",
            "after_move:filepath",
        ]
        if IS_WINDOWS:
            command.extend(["-f", "ba[ext=m4a]/ba[ext=webm]/bestaudio/best"])
        else:
            command.extend(
                [
                    "--extract-audio",
                    "--audio-format",
                    "mp3",
                    "--audio-quality",
                    "0",
                ]
            )
        command.append(normalized_url)
        result = await self._run_command(command, timeout=900, env=yt_dlp["env"])
        if result.returncode != 0:
            raise RuntimeError(
                self._command_error(result, "YouTube download failed")
            )

        output_lines = [
            line.strip() for line in (result.stdout or "").splitlines() if line.strip()
        ]
        downloaded_path = self._extract_downloaded_path(output_lines, app_download_dir)
        if not downloaded_path:
            downloaded_path = self._find_latest_audio_file(app_download_dir)
        if not downloaded_path:
            raise RuntimeError("Download completed but no audio file was found")

        normalized = False
        upmixed = False
        ffmpeg_processed = False
        ffmpeg_error: str | None = None
        if normalize_audio or upmix_audio:
            try:
                processed_path = await self._process_audio_file(
                    downloaded_path,
                    normalize_audio=normalize_audio,
                    upmix_audio=upmix_audio,
                )
                downloaded_path = processed_path
                normalized = normalize_audio
                upmixed = upmix_audio
                ffmpeg_processed = True
            except Exception as error:
                ffmpeg_error = self._trim_message(str(error), 180)
                decky.logger.error(
                    f"FFmpeg audio processing skipped for {downloaded_path}: {error}"
                )

        tracks = await self.set_track(
            app_id, str(downloaded_path), downloaded_path.name, normalized
        )
        return {
            "tracks": tracks,
            "path": str(downloaded_path),
            "filename": downloaded_path.name,
            "normalized": normalized,
            "upmixed": upmixed,
            "ffmpeg_processed": ffmpeg_processed,
            "ffmpeg_error": ffmpeg_error,
            "normalization_error": ffmpeg_error,
        }

    async def download_discover_audio(
        self,
        target: str,
        video_url: str,
        normalize_audio: bool = False,
        upmix_audio: bool = False,
    ) -> dict[str, Any]:
        clean_target = str(target or "").strip().lower()
        if clean_target not in {"ambient", "store"}:
            raise ValueError("Discover target must be ambient or store")

        temporary_app_id = 2147483001 if clean_target == "ambient" else 2147483002
        result = await self.download_youtube_audio(
            temporary_app_id,
            video_url,
            normalize_audio,
            upmix_audio,
        )
        path = str(result.get("path") or "")
        filename = str(result.get("filename") or Path(path).name or "track")
        if clean_target == "ambient":
            assigned = await self.set_global_track(path, filename)
        else:
            assigned = await self.set_store_track(path, filename)
        self._tracks.pop(str(temporary_app_id), None)
        self._save_tracks()
        return {
            **result,
            "target": clean_target,
            "assigned": assigned,
        }

    def _load_tracks(self) -> None:
        if not self._tracks_file.exists():
            self._tracks = {}
            return

        try:
            with self._tracks_file.open("r", encoding="utf-8") as handle:
                self._tracks = json.load(handle)
            changed = False
            for key, track in list(self._tracks.items()):
                if not isinstance(track, dict):
                    continue
                if "loop" not in track:
                    track["loop"] = True
                    changed = True
                if "normalized" not in track and str(key).lstrip("-").isdigit():
                    track["normalized"] = False
                    changed = True
            if changed:
                self._save_tracks()
        except Exception as error:
            decky.logger.error(f"Failed to read tracks.json: {error}")
            self._tracks = {}

    def _save_tracks(self) -> None:
        self._tracks_revision += 1
        try:
            with self._tracks_file.open("w", encoding="utf-8") as handle:
                json.dump(self._tracks, handle, indent=2, ensure_ascii=False)
        except Exception as error:
            decky.logger.error(f"Failed to save tracks.json: {error}")

    def _delete_downloaded_tracks_sync(self) -> dict[str, Any]:
        self._downloads_dir.mkdir(parents=True, exist_ok=True)
        downloads_root = self._downloads_dir.resolve()
        removed_files = 0
        removed_dirs = 0
        removed_tracks = 0

        for key, track in list(self._tracks.items()):
            if not isinstance(track, dict):
                continue
            path_value = track.get("path")
            if not path_value:
                continue
            try:
                resolved = Path(str(path_value)).expanduser().resolve()
            except Exception:
                continue
            if self._is_path_within(resolved, downloads_root):
                self._tracks.pop(key, None)
                removed_tracks += 1

        for child in list(downloads_root.iterdir()):
            try:
                if child.is_symlink() or child.is_file():
                    child.unlink()
                    removed_files += 1
                elif child.is_dir():
                    removed_files += sum(
                        1
                        for nested in child.rglob("*")
                        if nested.is_symlink() or nested.is_file()
                    )
                    shutil.rmtree(child)
                    removed_dirs += 1
            except Exception as error:
                decky.logger.error(f"Failed to delete downloaded track path {child}: {error}")

        self._save_tracks()
        return {
            "tracks": self._tracks,
            "removed_files": removed_files,
            "removed_dirs": removed_dirs,
            "removed_tracks": removed_tracks,
        }

    def _delete_unused_tracks_sync(self) -> dict[str, Any]:
        plan = self._unused_tracks_plan()
        if not plan["ok"]:
            return {**plan, "tracks": self._tracks, "removed_files": 0, "removed_tracks": 0}
        self._downloads_dir.mkdir(parents=True, exist_ok=True)
        downloads_root = self._downloads_dir.resolve()
        removed_files = 0
        removed_dirs = 0
        removed_tracks = 0
        failed: list[str] = []
        # Revalidate assignments after the read-only scan: an editor may have
        # changed a song while filesystem discovery ran on the worker thread.
        for key, original in plan["orphan_tracks"].items():
            if self._tracks.get(key) == original:
                self._tracks.pop(key, None)
                removed_tracks += 1
        if removed_tracks:
            temporary = self._tracks_file.with_suffix(".cleanup.tmp")
            try:
                if self._tracks_file.exists():
                    shutil.copy2(self._tracks_file, self._tracks_file.with_suffix(".cleanup.bak"))
                temporary.write_text(json.dumps(self._tracks, indent=2, ensure_ascii=False), encoding="utf-8")
                os.replace(temporary, self._tracks_file)
                self._tracks_revision += 1
            except Exception:
                for key, original in plan["orphan_tracks"].items():
                    self._tracks.setdefault(key, original)
                raise
            finally:
                temporary.unlink(missing_ok=True)
        known_revision = self._tracks_revision
        known_paths = self._known_audio_paths()
        for path in plan["files"]:
            child = Path(path)
            try:
                resolved = child.expanduser().resolve()
                if not self._is_path_within(resolved, downloads_root):
                    continue
                if known_revision != self._tracks_revision:
                    known_revision = self._tracks_revision
                    known_paths = self._known_audio_paths()
                if self._active_audio_downloads or str(resolved) in known_paths:
                    continue
                child.unlink()
                removed_files += 1
            except Exception as error:
                failed.append(str(child))
                decky.logger.error(f"Failed to delete unused track path {child}: {error}")

        dirs = set()
        for path in plan["files"]:
            parent = Path(path).parent
            while parent != downloads_root and self._is_path_within(parent, downloads_root):
                dirs.add(parent)
                parent = parent.parent
        dirs = list(dirs)
        dirs.sort(key=lambda path: len(path.parts), reverse=True)
        for child in dirs:
            try:
                if child == downloads_root:
                    continue
                if not any(child.iterdir()):
                    child.rmdir()
                    removed_dirs += 1
            except Exception:
                continue

        return {
            "ok": not failed,
            "tracks": self._tracks,
            "removed": removed_files,
            "removed_files": removed_files,
            "removed_dirs": removed_dirs,
            "removed_tracks": removed_tracks,
            "inventory_complete": plan["inventory_complete"],
            "failed": failed,
        }

    def _unused_tracks_plan(self) -> dict[str, Any]:
        root = self._downloads_dir.resolve()
        installed, shortcuts, steam_complete, shortcuts_complete = self._cleanup_game_inventory()
        orphan_tracks: dict[str, dict[str, Any]] = {}
        protected: set[str] = set()
        for key, track in list(self._tracks.items()):
            if not isinstance(track, dict) or not track.get("path"):
                continue
            path = Path(str(track["path"])).expanduser().resolve()
            app_id = int(key) & 0xFFFFFFFF if str(key).lstrip("-").isdigit() else None
            missing = app_id is not None and (
                (app_id >= 0x80000000 and shortcuts_complete and app_id not in shortcuts)
                or (0 < app_id < 0x80000000 and steam_complete and app_id not in installed)
            )
            if missing and self._is_path_within(path, root):
                orphan_tracks[key] = dict(track)
            else:
                protected.add(str(path))
        files: list[str] = []
        if root.exists():
            for directory, subdirs, names in os.walk(root, followlinks=False):
                # Never walk links/junctions into user-owned folders.
                subdirs[:] = [name for name in subdirs
                    if not (Path(directory, name).is_symlink()
                            or getattr(Path(directory, name).stat(), "st_file_attributes", 0) & 0x400)]
                for name in names:
                    path = Path(directory, name)
                    if path.is_symlink() or path.suffix.lower().lstrip(".") not in SUPPORTED_AUDIO_EXTENSIONS:
                        continue
                    resolved = path.resolve()
                    if self._is_path_within(resolved, root) and str(resolved) not in protected:
                        files.append(str(resolved))
        busy = self._active_audio_downloads > 0 or any(job.get("running") for job in self._discover_download_jobs.values())
        return {"ok": not busy, "reason": "download_in_progress" if busy else "ready",
                "files": files, "orphan_tracks": orphan_tracks,
                "inventory_complete": {"steam": steam_complete, "shortcuts": shortcuts_complete}}

    def _cleanup_game_inventory(self) -> tuple[set[int], set[int], bool, bool]:
        """Installed manifests, not localconfig's history of previously played games."""
        installed: set[int] = set()
        shortcuts: set[int] = set()
        roots = {base.parent.resolve() for base in self._steam_userdata_roots()
                 if (base.parent / "steamapps").is_dir() or (base.parent / "steam.exe").is_file()}
        steam_complete = bool(roots)
        shortcuts_complete = bool(roots)
        libraries: set[Path] = set()
        for root in roots:
            libraries.add(root / "steamapps")
            config = root / "steamapps" / "libraryfolders.vdf"
            try:
                if config.exists():
                    text = config.read_text(encoding="utf-8")
                    if text.count("{") != text.count("}"):
                        raise ValueError("Incomplete Steam library list")
                    for value in re.findall(r'"path"\s+"((?:\\.|[^"\\])*)"', text, re.I):
                        libraries.add(Path(value.replace("\\\\", "\\")) / "steamapps")
                else:
                    # An unavailable library list is not evidence of an uninstall.
                    steam_complete = False
            except (OSError, ValueError):
                steam_complete = False
            userdata = root / "userdata"
            try:
                accounts = [p for p in userdata.iterdir() if p.name.isdigit() and p.is_dir()]
                if not accounts:
                    shortcuts_complete = False
                for account in accounts:
                    folder = account / "config"
                    if not folder.is_dir():
                        shortcuts_complete = False
                        continue
                    path = folder / "shortcuts.vdf"
                    if path.exists():
                        shortcuts.update(self._cleanup_shortcut_ids(path.read_bytes()))
            except (OSError, ValueError):
                shortcuts_complete = False
        for library in libraries:
            try:
                if not library.is_dir():
                    steam_complete = False
                    continue
                for manifest in library.glob("appmanifest_*.acf"):
                    text = manifest.read_text(encoding="utf-8")
                    match = re.search(r'"appid"\s+"(\d+)"', text, re.I)
                    if not match or text.count("{") != text.count("}"):
                        steam_complete = False
                    else:
                        installed.add(int(match.group(1)))
            except (OSError, ValueError):
                steam_complete = False
        return installed, shortcuts, steam_complete, shortcuts_complete

    def _cleanup_shortcut_ids(self, data: bytes) -> set[int]:
        # The display parser tolerates damaged files; deletion must not.
        pos = 0
        def text() -> str:
            nonlocal pos
            end = data.find(b"\0", pos)
            if end < 0:
                raise ValueError("Incomplete shortcut string")
            value = data[pos:end].decode("utf-8", errors="strict")
            pos = end + 1
            return value
        def read_object() -> dict[str, Any]:
            nonlocal pos
            result: dict[str, Any] = {}
            while pos < len(data):
                kind = data[pos]
                pos += 1
                if kind == 8:
                    return result
                key = text().lower()
                if kind == 0:
                    result[key] = read_object()
                elif kind == 1:
                    result[key] = text()
                elif kind in (2, 7):
                    size = 4 if kind == 2 else 8
                    if pos + size > len(data):
                        raise ValueError("Incomplete shortcut integer")
                    result[key] = int.from_bytes(data[pos:pos + size], "little")
                    pos += size
                else:
                    raise ValueError("Unsupported shortcut field")
            raise ValueError("Incomplete shortcuts object")
        root = read_object()
        container = root.get("shortcuts")
        if not isinstance(container, dict) or pos != len(data):
            raise ValueError("Invalid shortcuts object")
        ids: set[int] = set()
        for entry in container.values():
            if isinstance(entry, dict):
                app_id = entry.get("appid")
                if not isinstance(app_id, int):
                    app_id = self._shortcut_app_id(str(entry.get("exe", "")), str(entry.get("appname", "")))
                ids.add(app_id & 0xFFFFFFFF)
        return ids

    async def _delete_downloaded_tracks_worker(self, job_id: int) -> None:
        try:
            downloads_root = self._downloads_dir.resolve()
            self._downloads_dir.mkdir(parents=True, exist_ok=True)
            files_to_delete: list[Path] = []
            dirs_to_delete: list[Path] = []

            for child in list(downloads_root.rglob("*")):
                try:
                    if child.is_symlink() or child.is_file():
                        files_to_delete.append(child)
                    elif child.is_dir():
                        dirs_to_delete.append(child)
                except Exception:
                    continue

            dirs_to_delete.sort(key=lambda path: len(path.parts), reverse=True)
            track_keys: list[str] = []
            for key, track in list(self._tracks.items()):
                if not isinstance(track, dict):
                    continue
                path_value = track.get("path")
                if not path_value:
                    continue
                try:
                    resolved = Path(str(path_value)).expanduser().resolve()
                except Exception:
                    continue
                if self._is_path_within(resolved, downloads_root):
                    track_keys.append(key)

            total = len(files_to_delete) + len(dirs_to_delete) + len(track_keys)
            self._set_delete_downloaded_tracks_progress(
                {
                    "running": True,
                    "status": "deleting",
                    "total": total,
                    "completed": 0,
                    "total_files": len(files_to_delete),
                    "removed_files": 0,
                    "total_tracks": len(track_keys),
                    "removed_tracks": 0,
                    "current_path": "",
                    "message": "Deleting downloaded audio files...",
                    "error": "",
                    "updated_at": time.time(),
                }
            )

            completed = 0
            removed_files = 0
            removed_tracks = 0

            for key in track_keys:
                if job_id != self._delete_downloaded_tracks_job_id:
                    return
                self._tracks.pop(key, None)
                removed_tracks += 1
                completed += 1
                self._update_delete_downloaded_tracks_progress(
                    completed=completed,
                    removed_tracks=removed_tracks,
                    current_path=f"track:{key}",
                )
                await asyncio.sleep(0)

            for path in files_to_delete:
                if job_id != self._delete_downloaded_tracks_job_id:
                    return
                try:
                    path.unlink(missing_ok=True)
                    removed_files += 1
                except Exception as error:
                    decky.logger.error(f"Failed to delete downloaded file {path}: {error}")
                completed += 1
                self._update_delete_downloaded_tracks_progress(
                    completed=completed,
                    removed_files=removed_files,
                    current_path=str(path),
                )
                await asyncio.sleep(0)

            for path in dirs_to_delete:
                if job_id != self._delete_downloaded_tracks_job_id:
                    return
                try:
                    path.rmdir()
                except OSError:
                    try:
                        shutil.rmtree(path)
                    except Exception as error:
                        decky.logger.error(
                            f"Failed to delete downloaded directory {path}: {error}"
                        )
                completed += 1
                self._update_delete_downloaded_tracks_progress(
                    completed=completed,
                    current_path=str(path),
                )
                await asyncio.sleep(0)

            self._save_tracks()
            self._set_delete_downloaded_tracks_progress(
                {
                    **self._delete_downloaded_tracks_progress,
                    "running": False,
                    "status": "completed",
                    "completed": total,
                    "removed_files": removed_files,
                    "removed_tracks": removed_tracks,
                    "current_path": "",
                    "message": "Deletion complete.",
                    "error": "",
                    "updated_at": time.time(),
                }
            )
        except Exception as error:
            decky.logger.error(f"Downloaded track deletion failed: {error}")
            self._set_delete_downloaded_tracks_progress(
                {
                    **self._delete_downloaded_tracks_progress,
                    "running": False,
                    "status": "failed",
                    "message": "Deletion failed.",
                    "error": self._trim_message(str(error), 220),
                    "updated_at": time.time(),
                }
            )

    def _new_delete_downloaded_tracks_progress(self, status: str) -> dict[str, Any]:
        return {
            "running": False,
            "status": status,
            "total": 0,
            "completed": 0,
            "total_files": 0,
            "removed_files": 0,
            "total_tracks": 0,
            "removed_tracks": 0,
            "current_path": "",
            "message": "",
            "error": "",
            "updated_at": time.time(),
        }

    def _set_delete_downloaded_tracks_progress(self, progress: dict[str, Any]) -> None:
        self._delete_downloaded_tracks_progress = progress

    def _update_delete_downloaded_tracks_progress(self, **updates: Any) -> None:
        self._delete_downloaded_tracks_progress = {
            **self._delete_downloaded_tracks_progress,
            **updates,
            "updated_at": time.time(),
        }

    @staticmethod
    def _is_path_within(path: Path, parent: Path) -> bool:
        try:
            path.relative_to(parent)
            return True
        except ValueError:
            return False

    def _steam_userdata_roots(self) -> list[Path]:
        candidates = [
            Path.home() / ".local" / "share" / "Steam" / "userdata",
            Path.home() / ".steam" / "steam" / "userdata",
        ]
        if IS_WINDOWS:
            windows_candidates: list[Path] = []
            for env_name in ("PROGRAMFILES(X86)", "PROGRAMFILES", "LOCALAPPDATA"):
                value = os.environ.get(env_name)
                if value:
                    windows_candidates.append(Path(value) / "Steam" / "userdata")
            steam_path = self._read_windows_steam_path()
            if steam_path:
                windows_candidates.append(steam_path / "userdata")
            candidates = windows_candidates + candidates
        return candidates

    def _read_localconfig_app_ids(self) -> list[int]:
        candidates = self._steam_userdata_roots()
        app_ids: set[int] = set()
        for base in candidates:
            if not base.exists():
                continue
            try:
                for user_dir in base.iterdir():
                    if not user_dir.is_dir():
                        continue
                    localconfig = user_dir / "config" / "localconfig.vdf"
                    if not localconfig.exists() or not localconfig.is_file():
                        continue
                    app_ids.update(self._extract_app_ids_from_localconfig(localconfig))
            except Exception as error:
                decky.logger.error(
                    f"Failed scanning localconfig under {base}: {error}"
                )
        return sorted(app_ids)

    def _extract_app_ids_from_localconfig(self, path: Path) -> set[int]:
        app_ids: set[int] = set()
        try:
            lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception as error:
            decky.logger.error(f"Failed reading localconfig {path}: {error}")
            return app_ids

        current_section: str | None = None
        pending_section: str | None = None
        depth = 0
        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                continue

            if current_section is None:
                section_match = re.fullmatch(r'"([^"]+)"', line)
                # Only trust the localconfig "apps" section. "apptickets" includes
                # alias/internal ticket ids that can map to the same canonical app.
                if section_match and section_match.group(1).lower() in {"apps"}:
                    pending_section = section_match.group(1).lower()
                    continue
                if pending_section and line == "{":
                    current_section = pending_section
                    pending_section = None
                    depth = 1
                    continue
                pending_section = None
                continue

            if line == "{":
                depth += 1
                continue
            if line == "}":
                depth -= 1
                if depth <= 0:
                    current_section = None
                    depth = 0
                continue

            if depth == 1:
                match = re.match(r'^"(\d{1,7})"', line)
                if match:
                    try:
                        app_id = int(match.group(1))
                    except ValueError:
                        continue
                    if app_id > 0:
                        app_ids.add(app_id)

        return app_ids

    def _read_steam_shortcuts(self) -> list[dict[str, Any]]:
        shortcuts: dict[int, dict[str, Any]] = {}
        for base in self._steam_userdata_roots():
            if not base.exists():
                continue
            try:
                for user_dir in base.iterdir():
                    if not user_dir.is_dir():
                        continue
                    shortcut_file = user_dir / "config" / "shortcuts.vdf"
                    if not shortcut_file.exists() or not shortcut_file.is_file():
                        continue
                    for shortcut in self._extract_shortcuts_from_vdf(shortcut_file):
                        name = self._clean_game_title_safe(str(shortcut.get("name") or ""))
                        if not name:
                            continue
                        exe = str(shortcut.get("exe") or "")
                        app_id = shortcut.get("appid")
                        if not isinstance(app_id, int) or app_id <= 0:
                            app_id = self._shortcut_app_id(exe, name)
                        if app_id <= 0:
                            continue
                        shortcuts[app_id] = {
                            "appid": app_id,
                            "name": name,
                            "isNonSteam": True,
                        }
            except Exception as error:
                decky.logger.error(
                    f"Failed scanning Steam shortcuts under {base}: {error}"
                )
        return sorted(shortcuts.values(), key=lambda item: item["name"].casefold())

    def _extract_shortcuts_from_vdf(self, path: Path) -> list[dict[str, Any]]:
        try:
            data = path.read_bytes()
        except Exception as error:
            decky.logger.error(f"Failed reading shortcuts.vdf {path}: {error}")
            return []

        try:
            root, _pos = self._parse_binary_vdf_object(data, 0)
            container = root.get("shortcuts", root)
            if isinstance(container, dict):
                shortcuts: list[dict[str, Any]] = []
                for value in container.values():
                    if not isinstance(value, dict):
                        continue
                    name = str(value.get("appname") or value.get("name") or "").strip()
                    exe = str(value.get("exe") or "").strip()
                    if name:
                        shortcuts.append(
                            {"name": name, "exe": exe, "appid": value.get("appid")}
                        )
                return shortcuts
        except Exception as error:
            decky.logger.error(f"Failed parsing binary shortcuts.vdf {path}: {error}")

        text = data.decode("utf-8", errors="ignore")
        names = re.findall(r"appname\x00([^\x00]+)", text)
        exes = re.findall(r"exe\x00([^\x00]+)", text)
        return [
            {
                "name": name.strip(),
                "exe": exes[index].strip() if index < len(exes) else "",
            }
            for index, name in enumerate(names)
            if name.strip()
        ]

    def _parse_binary_vdf_object(
        self, data: bytes, pos: int
    ) -> tuple[dict[str, Any], int]:
        result: dict[str, Any] = {}
        while pos < len(data):
            value_type = data[pos]
            pos += 1
            if value_type == 0x08:
                break
            key, pos = self._read_vdf_cstring(data, pos)
            if value_type == 0x00:
                child, pos = self._parse_binary_vdf_object(data, pos)
                result[key] = child
            elif value_type == 0x01:
                value, pos = self._read_vdf_cstring(data, pos)
                result[key] = value
            elif value_type == 0x02:
                if pos + 4 > len(data):
                    break
                result[key] = int.from_bytes(data[pos : pos + 4], "little", signed=True)
                pos += 4
            elif value_type == 0x07:
                if pos + 8 > len(data):
                    break
                result[key] = int.from_bytes(data[pos : pos + 8], "little", signed=False)
                pos += 8
            else:
                break
        return result, pos

    @staticmethod
    def _read_vdf_cstring(data: bytes, pos: int) -> tuple[str, int]:
        end = data.find(b"\x00", pos)
        if end < 0:
            return "", len(data)
        return data[pos:end].decode("utf-8", errors="ignore"), end + 1

    @staticmethod
    def _shortcut_app_id(exe: str, name: str) -> int:
        digest = zlib.crc32((exe + name).encode("utf-8", errors="ignore")) & 0xFFFFFFFF
        return (digest | 0x80000000) & 0xFFFFFFFF

    @staticmethod
    def _clean_game_title(name: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"[™®©]", "", name or "")).strip()

    @staticmethod
    def _clean_game_title_safe(name: str) -> str:
        return re.sub(
            r"\s+",
            " ",
            re.sub(r"[\u2122\u00ae\u00a9]", "", name or ""),
        ).strip()

    def _read_external_media_state(self) -> dict[str, Any]:
        try:
            request = urllib.request.Request(
                NOW_PLAYING_SNAPSHOT_URL,
                headers={"User-Agent": "ThemeDeck/2.5.4 (+Decky Loader)"},
            )
            with urllib.request.urlopen(request, timeout=0.6) as response:
                payload = json.loads(response.read().decode("utf-8", errors="ignore"))
        except Exception:
            return {"active": False, "player": ""}

        if not isinstance(payload, dict):
            return {"active": False, "player": ""}

        candidates: list[dict[str, Any]] = []
        selected = payload.get("selected")
        if isinstance(selected, dict):
            candidates.append(selected)
        players = payload.get("players")
        if isinstance(players, list):
            for player in players:
                if isinstance(player, dict) and player not in candidates:
                    candidates.append(player)

        for player in candidates:
            if self._external_media_player_is_playing(player):
                name = str(player.get("name") or player.get("id") or "").strip()
                return {"active": True, "player": name}
        return {"active": False, "player": ""}

    async def get_steam_media_state(self) -> dict[str, Any]:
        return await asyncio.to_thread(self._steam_cdp_media_state_sync)

    def _steam_cdp_media_state_sync(self) -> dict[str, Any]:
        started = time.monotonic()
        try:
            request = urllib.request.Request(
                "http://127.0.0.1:8080/json",
                headers={"User-Agent": "ThemeDeck/3.0"},
            )
            with urllib.request.urlopen(request, timeout=0.55) as response:
                targets = json.loads(response.read().decode("utf-8", errors="replace"))
        except Exception as error:
            return {
                "active": False,
                "player": "",
                "error": f"{type(error).__name__}: {error}",
                "durationMs": round((time.monotonic() - started) * 1000),
            }

        debuggable_targets = [
            target
            for target in targets if isinstance(target, dict)
            and str(target.get("type") or "").lower() in {"iframe", "page"}
            and str(target.get("webSocketDebuggerUrl") or "").startswith("ws://")
        ]

        def media_target_priority(target: dict[str, Any]) -> int:
            text = str(target.get("url") or target.get("title") or "").lower()
            if any(
                marker in text
                for marker in (
                    "settings",
                    "personalization",
                    "personalisation",
                    "startup",
                    "boot",
                    "movie",
                    "bigpicture",
                    "steamui",
                    "gamepadui",
                )
            ):
                return 0
            if re.search(
                r"(?:youtube\.com|youtube-nocookie\.com|youtu\.be|store\.steampowered\.com|steamcommunity\.com)",
                text,
                flags=re.IGNORECASE,
            ):
                return 1
            return 2

        media_targets = sorted(debuggable_targets, key=media_target_priority)[:12]

        expression = """(() => {
          const media = Array.from(document.querySelectorAll('video, audio'));
          const isVisible = (node) => {
            try {
              if (node.classList?.contains('trailerhero-video') || node.closest?.('.trailerhero-host')) return false;
              const style = window.getComputedStyle(node);
              const rect = node.getBoundingClientRect?.();
              const hasSize = !rect || rect.width >= 24 || rect.height >= 24 || Number(node.videoWidth || 0) >= 24 || Number(node.videoHeight || 0) >= 24;
              return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && hasSize;
            } catch {
              return false;
            }
          };
          const activeMedia = media.find((node) => {
            const playing = !node.paused && !node.ended && node.readyState >= 2;
            if (!playing) return false;
            // Audio-aware only: a video counts as active media just when it is
            // visible AND not muted AND has volume. Muted Store trailers and
            // silent SteamGridDB animated artwork are videos too and must NOT
            // pause the music (and must not keep the state 'active' after the
            // Store, which delayed the Home track).
            return isVisible(node) && !node.muted && Number(node.volume || 0) > 0.01;
          });
          if (!activeMedia) return { active: false, found: media.length > 0, mediaCount: media.length };
          return {
            active: true,
            found: true,
            mediaCount: media.length,
            tag: activeMedia.tagName,
            paused: Boolean(activeMedia.paused),
            ended: Boolean(activeMedia.ended),
            muted: Boolean(activeMedia.muted),
            volume: Number(activeMedia.volume || 0),
            readyState: Number(activeMedia.readyState || 0),
            currentTime: Number(activeMedia.currentTime || 0)
          };
        })()"""

        inspected: list[dict[str, Any]] = []
        for target in media_targets[:8]:
            try:
                state = self._cdp_evaluate_sync(
                    str(target.get("webSocketDebuggerUrl")), expression, timeout=0.32
                )
                if not isinstance(state, dict):
                    continue
                inspected.append(
                    {
                        "url": str(target.get("url") or "")[:500],
                        **state,
                    }
                )
                if state.get("active"):
                    return {
                        "active": True,
                        "player": "Steam media",
                        "targets": len(media_targets),
                        "inspected": inspected,
                        "durationMs": round((time.monotonic() - started) * 1000),
                    }
            except Exception as error:
                inspected.append(
                    {
                        "url": str(target.get("url") or "")[:500],
                        "active": False,
                        "error": f"{type(error).__name__}: {error}",
                    }
                )
        return {
            "active": False,
            "player": "",
            "targets": len(media_targets),
            "inspected": inspected,
            "durationMs": round((time.monotonic() - started) * 1000),
        }

    @staticmethod
    def _cdp_evaluate_sync(
        websocket_url: str, expression: str, timeout: float = 0.5
    ) -> Any:
        parsed = urllib.parse.urlparse(websocket_url)
        host = parsed.hostname or "127.0.0.1"
        port = int(parsed.port or 80)
        path = parsed.path or "/"
        if parsed.query:
            path += "?" + parsed.query
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        connection = socket.create_connection((host, port), timeout=timeout)
        connection.settimeout(timeout)

        def receive_exact(length: int) -> bytes:
            chunks = bytearray()
            while len(chunks) < length:
                chunk = connection.recv(length - len(chunks))
                if not chunk:
                    raise RuntimeError("CDP WebSocket closed")
                chunks.extend(chunk)
            return bytes(chunks)

        try:
            handshake = (
                f"GET {path} HTTP/1.1\r\n"
                f"Host: {host}:{port}\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Key: {key}\r\n"
                "Sec-WebSocket-Version: 13\r\n\r\n"
            ).encode("ascii")
            connection.sendall(handshake)
            response = bytearray()
            while b"\r\n\r\n" not in response and len(response) < 16384:
                response.extend(connection.recv(2048))
            if not bytes(response).startswith(b"HTTP/1.1 101"):
                raise RuntimeError("CDP WebSocket handshake failed")
            expected_accept = base64.b64encode(
                hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode("ascii")).digest()
            ).decode("ascii")
            if expected_accept.lower() not in bytes(response).decode("latin1", errors="ignore").lower():
                raise RuntimeError("CDP WebSocket accept mismatch")

            message = json.dumps(
                {
                    "id": 1,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expression, "returnByValue": True},
                },
                separators=(",", ":"),
            ).encode("utf-8")
            mask = os.urandom(4)
            length = len(message)
            if length < 126:
                header = bytes((0x81, 0x80 | length))
            elif length <= 0xFFFF:
                header = bytes((0x81, 0x80 | 126)) + struct.pack("!H", length)
            else:
                header = bytes((0x81, 0x80 | 127)) + struct.pack("!Q", length)
            masked = bytes(value ^ mask[index % 4] for index, value in enumerate(message))
            connection.sendall(header + mask + masked)

            deadline = time.monotonic() + timeout
            while time.monotonic() < deadline:
                first, second = receive_exact(2)
                opcode = first & 0x0F
                payload_length = second & 0x7F
                if payload_length == 126:
                    payload_length = struct.unpack("!H", receive_exact(2))[0]
                elif payload_length == 127:
                    payload_length = struct.unpack("!Q", receive_exact(8))[0]
                mask_key = receive_exact(4) if second & 0x80 else b""
                payload = receive_exact(payload_length)
                if mask_key:
                    payload = bytes(
                        value ^ mask_key[index % 4]
                        for index, value in enumerate(payload)
                    )
                if opcode == 0x9:
                    connection.sendall(bytes((0x8A, len(payload))) + payload)
                    continue
                if opcode != 0x1:
                    continue
                decoded = json.loads(payload.decode("utf-8", errors="replace"))
                if decoded.get("id") != 1:
                    continue
                return (
                    decoded.get("result", {})
                    .get("result", {})
                    .get("value")
                )
            raise TimeoutError("CDP evaluation timed out")
        finally:
            connection.close()

    def _external_media_player_is_playing(self, player: dict[str, Any]) -> bool:
        status = str(
            player.get("status")
            or player.get("playbackStatus")
            or player.get("playback_status")
            or ""
        ).strip().lower()
        is_playing = status == "playing" or player.get("isPlaying") is True
        if not is_playing:
            return False

        searchable = " ".join(
            str(player.get(key) or "")
            for key in (
                "id",
                "name",
                "app",
                "appName",
                "sourceAppUserModelId",
                "title",
                "artist",
                "album",
            )
        ).lower()
        if any(token in searchable for token in NOW_PLAYING_IGNORE_TOKENS):
            return False
        return True

    def _read_windows_steam_path(self) -> Path | None:
        if not IS_WINDOWS:
            return None
        try:
            import winreg
        except Exception:
            return None

        registry_locations = (
            (winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Valve\Steam"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\WOW6432Node\Valve\Steam"),
        )
        for hive, key_path in registry_locations:
            try:
                with winreg.OpenKey(hive, key_path) as key:
                    for value_name in ("SteamPath", "InstallPath"):
                        try:
                            value, _value_type = winreg.QueryValueEx(key, value_name)
                        except OSError:
                            continue
                        if isinstance(value, str) and value.strip():
                            candidate = Path(value.replace("/", "\\")).expanduser()
                            if candidate.exists():
                                return candidate
            except OSError:
                continue
        return None

    def _resolve_store_app_names_chunk(self, app_ids: list[int]) -> dict[str, str]:
        if not app_ids:
            return {}
        resolved: dict[str, str] = {}
        for app_id in app_ids:
            if app_id <= 0:
                continue
            name = self._resolve_store_app_name_single(app_id)
            if name:
                resolved[str(app_id)] = name
        return resolved

    def _resolve_store_app_name_single(self, app_id: int) -> str | None:
        if app_id <= 0:
            return None
        context = ssl._create_unverified_context()
        url = (
            "https://store.steampowered.com/api/appdetails"
            f"?appids={app_id}&filters=basic&l=english"
        )
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "ThemeDeck/2.5.0 (+Decky Loader)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=10, context=context) as response:
                payload = json.loads(response.read().decode("utf-8", errors="ignore"))
        except Exception:
            return None

        if not isinstance(payload, dict):
            return None
        value = payload.get(str(app_id))
        if not isinstance(value, dict) or not value.get("success"):
            return None
        data = value.get("data")
        if not isinstance(data, dict):
            return None
        name = data.get("name")
        if isinstance(name, str) and name.strip():
            return name.strip()
        return None

    def _resolve_steamcommunity_app_name(self, app_id: int) -> str | None:
        if app_id <= 0:
            return None

        url = f"https://steamcommunity.com/app/{app_id}/?l=english"
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) ThemeDeck/2.5.0",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        context = ssl._create_unverified_context()
        try:
            with urllib.request.urlopen(request, timeout=10, context=context) as response:
                final_url = response.geturl()
                payload = response.read().decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as error:
            # Steam Community rate-limits occasionally; skip quietly.
            if error.code == 429:
                return None
            raise

        canonical_match = re.search(r"/app/(\d+)", final_url or "", re.IGNORECASE)
        if canonical_match:
            canonical_app_id = int(canonical_match.group(1))
            if canonical_app_id > 0:
                # Secondary safety: normalize redirect/alias ids to canonical app id.
                canonical_name = self._resolve_store_app_name_single(canonical_app_id)
                if canonical_name:
                    return canonical_name

        title_match = re.search(
            r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
            payload,
            re.IGNORECASE,
        )
        if not title_match:
            title_match = re.search(
                r"<title>(.*?)</title>", payload, re.IGNORECASE | re.DOTALL
            )
        if not title_match:
            return None

        raw_title = html_lib.unescape(title_match.group(1)).strip()
        if not raw_title:
            return None

        cleaned = re.sub(r"^\s*Steam Community\s*::\s*", "", raw_title, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+on\s+Steam\s*$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*::\s*Steam Community\s*$", "", cleaned, flags=re.IGNORECASE)
        if cleaned.lower() in {"steam community", "error", "access denied"}:
            return None
        cleaned = cleaned.strip()
        if not cleaned:
            return None
        return cleaned

    def _resolve_yt_dlp_invocation(self) -> dict[str, Any] | None:
        def executable_exists(path: Path) -> bool:
            return path.exists() and path.is_file() and (
                IS_WINDOWS or os.access(path, os.X_OK)
            )

        if not IS_WINDOWS and executable_exists(self._yt_venv_yt_dlp):
            return {
                "command": [str(self._yt_venv_yt_dlp)],
                "env": None,
                "source": "venv",
                "path": str(self._yt_venv_yt_dlp),
            }

        if executable_exists(self._yt_dlp_path):
            return {
                "command": [str(self._yt_dlp_path)],
                "env": None,
                "source": "local",
                "path": str(self._yt_dlp_path),
            }

        bundled_yt_dlp = Path(__file__).resolve().parent / self._yt_dlp_name
        if executable_exists(bundled_yt_dlp):
            return {
                "command": [str(bundled_yt_dlp)],
                "env": None,
                "source": "bundled",
                "path": str(bundled_yt_dlp),
            }

        system_yt_dlp = shutil.which(self._yt_dlp_name) or shutil.which("yt-dlp")
        if system_yt_dlp:
            return {
                "command": [system_yt_dlp],
                "env": None,
                "source": "system",
                "path": system_yt_dlp,
            }

        user_yt_dlp = Path.home() / ".local" / "bin" / "yt-dlp"
        if not IS_WINDOWS and executable_exists(user_yt_dlp):
            return {
                "command": [str(user_yt_dlp)],
                "env": None,
                "source": "system",
                "path": str(user_yt_dlp),
            }

        return None

    def _resolve_ffmpeg_invocation(self) -> dict[str, Any] | None:
        def executable_exists(path: Path) -> bool:
            return path.exists() and path.is_file() and (
                IS_WINDOWS or os.access(path, os.X_OK)
            )

        candidates = [
            self._plugin_dir / self._ffmpeg_name,
            self._plugin_dir / "bin" / self._ffmpeg_name,
            Path(__file__).resolve().parent / self._ffmpeg_name,
            Path(__file__).resolve().parent / "bin" / self._ffmpeg_name,
            self._bin_dir / self._ffmpeg_name,
        ]
        for candidate in candidates:
            if executable_exists(candidate):
                return {
                    "command": [str(candidate)],
                    "env": None,
                    "source": "bundled"
                    if self._is_path_within(candidate.resolve(), self._plugin_dir.resolve())
                    else "local",
                    "path": str(candidate),
                }

        system_ffmpeg = shutil.which(self._ffmpeg_name) or shutil.which("ffmpeg")
        if system_ffmpeg:
            return {
                "command": [system_ffmpeg],
                "env": None,
                "source": "system",
                "path": system_ffmpeg,
            }

        return None

    def _require_yt_dlp_invocation(self) -> dict[str, Any]:
        invocation = self._resolve_yt_dlp_invocation()
        if not invocation:
            raise RuntimeError(
                "yt-dlp is not available. Use the ThemeDeck install/update button."
            )
        return invocation

    async def _process_audio_file(
        self,
        input_path: Path,
        normalize_audio: bool = True,
        upmix_audio: bool = True,
    ) -> Path:
        # Surround upmix is now performed in real time by the WebAudio graph in
        # the frontend (works for every track and respects the QAM toggle), so
        # FFmpeg no longer needs to re-encode to 8 channels here. Only run FFmpeg
        # when loudness normalization is requested; this also removes the slow
        # 7.1 re-encode from the download path.
        if not normalize_audio:
            return input_path

        invocation = self._resolve_ffmpeg_invocation()
        if not invocation:
            raise RuntimeError("FFmpeg is not available in the ThemeDeck package")

        resolved_input = input_path.expanduser().resolve()
        if not resolved_input.exists() or not resolved_input.is_file():
            raise FileNotFoundError(f"Audio file not found: {resolved_input}")

        output_path = resolved_input.with_suffix(".m4a")
        temp_path = resolved_input.with_name(
            f"{resolved_input.stem}.processing-{int(time.time() * 1000)}.m4a"
        )
        command = [
            *invocation["command"],
            "-hide_banner",
            "-y",
            "-i",
            str(resolved_input),
            "-vn",
            "-sn",
            "-dn",
        ]
        if normalize_audio:
            command.extend(["-af", "loudnorm=I=-16:TP=-1.5:LRA=11"])
        audio_bitrate = "384k"
        command.extend(
            [
                "-c:a",
                "aac",
                "-b:a",
                audio_bitrate,
                "-ar",
                "48000",
            ]
        )
        command.append(str(temp_path))
        result = await self._run_command(command, timeout=900, env=invocation["env"])
        if result.returncode != 0:
            try:
                temp_path.unlink(missing_ok=True)
            except Exception:
                pass
            raise RuntimeError(self._command_error(result, "Audio processing failed"))

        if not temp_path.exists() or temp_path.stat().st_size <= 0:
            raise RuntimeError("Audio processing finished but no output file was created")

        if output_path.exists():
            output_path.unlink()
        temp_path.replace(output_path)
        if output_path != resolved_input and resolved_input.exists():
            try:
                resolved_input.unlink()
            except Exception as error:
                decky.logger.error(f"Failed to remove pre-normalized file {resolved_input}: {error}")
        return output_path

    async def _get_yt_dlp_version(self, invocation: dict[str, Any]) -> str | None:
        command = [*invocation["command"], "--version"]
        result = await self._run_command(command, timeout=20, env=invocation["env"])
        if result.returncode != 0:
            return None
        version = (result.stdout or "").strip()
        if not version:
            return None
        return version.splitlines()[0]

    async def _run_command(
        self, command: list[str], timeout: int = 120, env: dict[str, str] | None = None
    ) -> subprocess.CompletedProcess[str]:
        decky.logger.info(f"Executing command: {' '.join(command)}")
        run_env = os.environ.copy()
        # Decky loader can inject PyInstaller/OpenSSL paths that break Python tools.
        run_env.pop("LD_LIBRARY_PATH", None)
        run_env.pop("PYTHONHOME", None)
        run_env.pop("PYTHONPATH", None)
        if env:
            run_env.update(env)
        run_kwargs: dict[str, Any] = {
            "capture_output": True,
            "text": True,
            "check": False,
            "timeout": timeout,
            "env": run_env,
        }
        if IS_WINDOWS:
            run_kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        result = await asyncio.to_thread(
            subprocess.run,
            command,
            **run_kwargs,
        )
        if result.returncode != 0:
            decky.logger.error(
                f"Command failed rc={result.returncode}: {' '.join(command)}"
            )
            if result.stderr:
                decky.logger.error(f"stderr: {result.stderr}")
            if result.stdout:
                decky.logger.error(f"stdout: {result.stdout}")
        return result

    def _command_error(
        self, result: subprocess.CompletedProcess[str], fallback: str
    ) -> str:
        stderr = (result.stderr or "").strip()
        stdout = (result.stdout or "").strip()
        if stderr and stdout:
            return self._trim_message(
                f"{stderr.splitlines()[-1]} | {stdout.splitlines()[-1]}", 220
            )
        if stderr:
            return self._trim_message(stderr.splitlines()[-1], 220)
        if stdout:
            return self._trim_message(stdout.splitlines()[-1], 220)
        return fallback

    def _normalize_youtube_url(self, value: str) -> str:
        candidate = (value or "").strip()
        if not candidate:
            raise ValueError("YouTube URL is required")

        if "://" not in candidate and candidate.startswith(
            ("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be")
        ):
            candidate = f"https://{candidate}"
        elif "://" not in candidate and "/" not in candidate and " " not in candidate:
            candidate = f"https://www.youtube.com/watch?v={candidate}"

        parsed = urllib.parse.urlparse(candidate)
        host = parsed.netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        if host not in {"youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"}:
            raise ValueError("Only YouTube links are supported")
        return candidate

    def _extract_downloaded_path(
        self, lines: list[str], base_dir: Path
    ) -> Path | None:
        for line in reversed(lines):
            raw = line.strip()
            if not raw:
                continue
            candidate = Path(raw).expanduser()
            if not candidate.is_absolute():
                candidate = (base_dir / candidate).expanduser()
            resolved = candidate.resolve()
            if (
                resolved.exists()
                and resolved.is_file()
                and resolved.suffix.lower().lstrip(".") in SUPPORTED_AUDIO_EXTENSIONS
            ):
                return resolved
        return None

    def _find_latest_audio_file(self, directory: Path) -> Path | None:
        if not directory.exists():
            return None
        audio_files = [
            path
            for path in directory.iterdir()
            if path.is_file()
            and path.suffix.lower().lstrip(".") in SUPPORTED_AUDIO_EXTENSIONS
        ]
        if not audio_files:
            return None
        return max(audio_files, key=lambda path: path.stat().st_mtime)

    async def _download_yt_dlp_binary(self, target_path: Path) -> str:
        self._set_yt_dlp_update_progress(3, "checking")
        return await asyncio.to_thread(self._download_yt_dlp_binary_sync, target_path)

    def _download_yt_dlp_binary_sync(self, target_path: Path) -> str:
        headers = {"User-Agent": "ThemeDeck/3.3.4 (+Decky Loader)", "Cache-Control": "no-cache"}
        request = urllib.request.Request(YTDLP_RELEASE_API, headers={**headers, "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read(2 * 1024 * 1024 + 1)
        if len(data) > 2 * 1024 * 1024:
            raise RuntimeError("Nightly release metadata exceeded the size limit")
        release = json.loads(data)
        tag = release.get("tag_name", "")
        if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d{6}", tag):
            raise RuntimeError("Invalid nightly release version")
        asset_name = "yt-dlp.exe" if IS_WINDOWS else "yt-dlp"
        asset = next((a for a in release.get("assets", []) if a.get("name") == asset_name), None)
        if not asset:
            raise RuntimeError("The nightly release does not contain the required executable")
        base = f"https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/{tag}/"
        url = asset.get("browser_download_url")
        if url != base + asset_name:
            raise RuntimeError("Unexpected nightly executable URL")
        digest = asset.get("digest") or ""
        if not re.fullmatch(r"sha256:[a-fA-F0-9]{64}", digest):
            checksum_asset = next((a for a in release.get("assets", []) if a.get("name") == "SHA2-256SUMS"), {})
            if checksum_asset.get("browser_download_url") != base + "SHA2-256SUMS":
                raise RuntimeError("Nightly release has no SHA-256 checksum")
            with urllib.request.urlopen(urllib.request.Request(base + "SHA2-256SUMS", headers=headers), timeout=30) as response:
                checksums = response.read(65537)
            if len(checksums) > 65536:
                raise RuntimeError("Checksum file exceeded the size limit")
            match = re.search(r"^([a-fA-F0-9]{64})\s+\*?" + re.escape(asset_name) + r"\s*$", checksums.decode("utf-8"), re.MULTILINE)
            if not match:
                raise RuntimeError("Executable checksum is missing")
            digest = "sha256:" + match[1]
        maximum_size = 100 * 1024 * 1024
        expected_size = asset.get("size")
        if type(expected_size) is not int or not 0 < expected_size <= maximum_size:
            raise RuntimeError("Invalid nightly executable size")
        self._set_yt_dlp_update_progress(5, "downloading")
        sha256 = hashlib.sha256()
        deadline = time.monotonic() + 180
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
            with target_path.open("wb") as destination:
                downloaded = 0
                while True:
                    if time.monotonic() >= deadline:
                        raise TimeoutError("Nightly executable download timed out")
                    chunk = response.read(256 * 1024)
                    if not chunk:
                        break
                    downloaded += len(chunk)
                    if downloaded > expected_size:
                        raise RuntimeError("Nightly executable exceeded the declared size")
                    destination.write(chunk)
                    sha256.update(chunk)
                    self._set_yt_dlp_update_progress(5 + int(downloaded / expected_size * 80), "downloading")
                destination.flush()
                os.fsync(destination.fileno())
        if downloaded != expected_size or sha256.hexdigest() != digest[7:].lower():
            raise RuntimeError("Nightly executable failed SHA-256 or size verification")
        if not self._is_valid_yt_dlp_binary(target_path):
            raise RuntimeError("Downloaded file is not a valid yt-dlp executable")
        return tag

    def _set_yt_dlp_update_progress(
        self, progress: int, phase: str, version: str = ""
    ) -> None:
        self._yt_dlp_update_progress.update(
            {
                "running": progress < 100,
                "progress": max(0, min(100, int(progress))),
                "phase": phase,
                "version": version or self._yt_dlp_update_progress.get("version", ""),
                "error": "",
            }
        )

    def _is_valid_yt_dlp_binary(self, path: Path) -> bool:
        try:
            content = path.read_bytes()
        except OSError:
            return False
        if len(content) < 64:
            return False
        head = content[:4096].lower()
        if b"<!doctype html" in head or b"<html" in head:
            return False
        if content.startswith(b"\x7fELF"):
            return True
        if content.startswith(b"#!"):
            return True
        if content.startswith(b"MZ"):
            return True
        if len(content) > 1024 * 1024:
            return True
        return False

    def _trim_message(self, message: str, limit: int = 220) -> str:
        cleaned = " ".join((message or "").split())
        if len(cleaned) <= limit:
            return cleaned
        return f"{cleaned[:limit - 3]}..."

    async def _try_install_yt_dlp_with_pip(self) -> str | None:
        if IS_WINDOWS:
            return "pip fallback skipped on Windows; use bundled yt-dlp.exe"
        python3 = shutil.which("python3")
        if not python3:
            return "python3 not found"
        command = [
            python3,
            "-m",
            "pip",
            "install",
            "--upgrade",
            "--user",
            "yt-dlp",
            "--trusted-host",
            "pypi.org",
            "--trusted-host",
            "files.pythonhosted.org",
        ]
        result = await self._run_command(command, timeout=300)
        if result.returncode == 0:
            return None
        return self._command_error(result, "pip install failed")

    async def _install_yt_dlp_in_venv(self) -> str | None:
        if IS_WINDOWS:
            return "venv install skipped on Windows; use bundled yt-dlp.exe"
        python3 = shutil.which("python3")
        if not python3:
            return "python3 not found"

        self._yt_venv_dir.parent.mkdir(parents=True, exist_ok=True)
        create_venv_result = await self._run_command(
            [python3, "-m", "venv", str(self._yt_venv_dir)],
            timeout=180,
        )
        if create_venv_result.returncode != 0:
            return self._command_error(create_venv_result, "venv creation failed")

        if not self._yt_venv_python.exists():
            return f"venv python not found at {self._yt_venv_python}"

        install_result = await self._run_command(
            [
                str(self._yt_venv_python),
                "-m",
                "pip",
                "install",
                "--upgrade",
                "pip",
                "yt-dlp",
                "--trusted-host",
                "pypi.org",
                "--trusted-host",
                "files.pythonhosted.org",
            ],
            timeout=300,
        )
        if install_result.returncode != 0:
            return self._command_error(install_result, "venv pip install failed")

        if not self._yt_venv_yt_dlp.exists():
            return f"yt-dlp not found at {self._yt_venv_yt_dlp}"
        return None
