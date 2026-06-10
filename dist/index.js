// Decky Loader will pass this api in, it's versioned to allow for backwards compatibility.
// @ts-ignore

// Prevents it from being duplicated in output.
const manifest = {"name":"ThemeDeck","author":"BrenticusMaximus, ZazaMastro","flags":[],"api_version":1,"publish":{"tags":["music","theme","library"],"description":"Add custom game, ambient, and Store music to Steam Gaming Mode on Windows, with local files, yt-dlp search, and automatic UI translations.","image":"https://opengraph.githubassets.com/1/SteamDeckHomebrew/PluginLoader"}};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
// Initialize
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
// Version 1 throws on version mismatch so we have to account for that here.
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const routerHook = api.routerHook;
const toaster = api.toaster;
const executeInTab = api.executeInTab;
const definePlugin = (fn) => {
    return (...args) => {
        // TODO: Maybe wrap this
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaMusic (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z"},"child":[]}]})(props);
}function FaPause (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"},"child":[]}]})(props);
}function FaPlay (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"},"child":[]}]})(props);
}function FaTrash (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"},"child":[]}]})(props);
}

const FocusableButton = (props) => (window.SP_REACT.createElement(DFL.DialogButton, { focusable: true, ...props }));
const focusFirstInteractiveElement = (anchor) => {
    const root = anchor?.parentElement;
    if (!root)
        return;
    window.setTimeout(() => {
        const selector = "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [role='button']:not([aria-disabled='true']), [role='radio']:not([aria-disabled='true']), [tabindex]:not([tabindex='-1'])";
        const element = root.querySelector(selector);
        if (element && element !== anchor) {
            element.focus();
        }
    }, 0);
};
const GAME_DETAIL_ROUTES = [
    "/library/app/:appid",
    "/library/details/:appid",
    "/library/:collection/app/:appid",
];
const DETAIL_PATTERNS = GAME_DETAIL_ROUTES.map((route) => {
    const pattern = route
        .replace(/\//g, "\\/")
        .replace(":collection", "[^\\/]+")
        .replace(":appid", "(\\d+)");
    return new RegExp(`^${pattern}`);
});
const fetchTracks = callable("get_tracks");
const fetchGlobalTrack = callable("get_global_track");
const fetchStoreTrack = callable("get_store_track");
const fetchLocalconfigAppIds = callable("get_localconfig_app_ids");
const resolveStoreAppNames = callable("resolve_store_app_names");
const assignTrack = callable("set_track");
const assignGlobalTrack = callable("set_global_track");
const assignStoreTrack = callable("set_store_track");
const deleteTrack = callable("remove_track");
const deleteGlobalTrack = callable("remove_global_track");
const deleteStoreTrack = callable("remove_store_track");
const startDeleteDownloadedTracks = callable("start_delete_downloaded_tracks");
const getDeleteDownloadedTracksProgress = callable("get_delete_downloaded_tracks_progress");
const updateTrackVolume = callable("set_volume");
const updateGlobalVolume = callable("set_global_volume");
const updateStoreVolume = callable("set_store_volume");
const updateTrackStartOffset = callable("set_start_offset");
const updateTrackLoop = callable("set_loop");
const updateGlobalStartOffset = callable("set_global_start_offset");
const updateGlobalLoop = callable("set_global_loop");
const updateStoreStartOffset = callable("set_store_start_offset");
const updateStoreLoop = callable("set_store_loop");
const listDirectory = callable("list_directory");
const getTrackAudioUrl = callable("get_track_audio_url");
const loadTrackAudio = callable("load_track_audio");
const searchYouTube = callable("search_youtube");
const downloadYouTubeAudio = callable("download_youtube_audio");
const getYouTubePreviewStream = callable("get_youtube_preview_stream");
const getYtDlpStatus = callable("get_yt_dlp_status");
const updateYtDlp = callable("update_yt_dlp");
const getAudioNormalizationStatus = callable("get_audio_normalization_status");
const getExternalMediaState = callable("get_external_media_state");
const TRACKS_UPDATED_EVENT = "themedeck:tracks-updated";
const AUDIO_EXTENSIONS = ["mp3", "aac", "flac", "ogg", "wav", "m4a", "webm"];
const AUTO_PLAY_STORAGE_KEY = "themedeck:autoPlay";
const AUTO_PLAY_EVENT = "themedeck:auto-play-changed";
const GAME_TRACK_MASTER_VOLUME_STORAGE_KEY = "themedeck:gameTrackMasterVolume";
const GAME_TRACK_MASTER_VOLUME_EVENT = "themedeck:game-track-master-volume-changed";
const AUDIO_NORMALIZATION_STORAGE_KEY = "themedeck:normalizeDownloadedAudio";
const AUDIO_NORMALIZATION_EVENT = "themedeck:audio-normalization-changed";
const AUDIO_UPMIX_STORAGE_KEY = "themedeck:upmixDownloadedAudio";
const AUDIO_UPMIX_EVENT = "themedeck:audio-upmix-changed";
const GLOBAL_AMBIENT_ENABLED_STORAGE_KEY = "themedeck:globalAmbientEnabled";
const GLOBAL_AMBIENT_ENABLED_EVENT = "themedeck:global-ambient-enabled-changed";
const STORE_TRACK_ENABLED_STORAGE_KEY = "themedeck:storeTrackEnabled";
const STORE_TRACK_ENABLED_EVENT = "themedeck:store-track-enabled-changed";
const AMBIENT_DISABLE_STORE_STORAGE_KEY = "themedeck:ambientDisableStore";
const AMBIENT_DISABLE_STORE_EVENT = "themedeck:ambient-disable-store-changed";
const AMBIENT_INTERRUPTION_MODE_STORAGE_KEY = "themedeck:ambientInterruptionMode";
const AMBIENT_INTERRUPTION_MODE_EVENT = "themedeck:ambient-interruption-mode-changed";
const LAUNCH_STOP_MODE_STORAGE_KEY = "themedeck:launchStopMode";
const LAUNCH_STOP_MODE_EVENT = "themedeck:launch-stop-mode-changed";
const GLOBAL_AMBIENT_APP_ID = -1;
const STORE_TRACK_APP_ID = -2;
const UI_MODE_GAMEPAD = 4;
const UI_MODE_DESKTOP = 7;
const UI_MODE_POLL_MS = 2000;
const UI_MODE_CACHE_MS = 1000;
const RUNNING_APP_POLL_MS = 1250;
const EXTERNAL_MEDIA_POLL_MS = 1500;
const LAUNCH_FINISH_FALLBACK_MS = 8000;
const DETAIL_ROUTE_GRACE_MS = 0;
const AUTO_PLAYBACK_DEBOUNCE_MS = 0;
const AUDIO_CACHE_DYNAMIC_LIMIT = 2;
const AUTO_ASSIGN_MAX_TRACK_SECONDS = 15 * 60;
const STEAM_APP_TYPE_APPLICATION = 1 << 2;
const STEAM_APP_TYPE_TOOL = 1 << 3;
const STEAM_APP_TYPE_DLC = 1 << 5;
const STEAM_APP_TYPE_MUSIC = 1 << 13;
const SP_TAB_CANDIDATES = [
    "SP",
    "sp",
    "SharedJSContext",
    "Steam",
    "SteamUI",
    "MainMenu",
    "GamepadUI",
    "Library",
];
const LIBRARY_EXCLUDED_APP_IDS = new Set([
    7, // Steam client
    760, // Steam screenshots/uploader component
    12210, // Steam Linux runtime/tool entries
    12211,
    12212,
    12213,
    12218,
    228980, // Steamworks Common Redistributables
]);
const EN_STRINGS = {
    introVersion: "March 3, 2026 (v2.5.4)",
    introAssign: "To assign music tracks, go to a game's page, select the gear icon, then Choose ThemeDeck music.",
    autoPlayLabel: "Auto play on game page",
    autoPlayDesc: "",
    normalizeAudioLabel: "Normalize downloaded audio",
    normalizeAudioDesc: "Uses FFmpeg loudness normalization after YouTube downloads when FFmpeg is available.",
    upmixAudioLabel: "Upmix downloaded audio to 7.1",
    upmixAudioDesc: "Uses FFmpeg to convert downloaded tracks to 7.1 channels when FFmpeg is available.",
    normalizeAudioNotice: "FFmpeg processing can make downloads take longer. These options also apply to manual downloads from Choose ThemeDeck music.",
    normalizationAvailable: "FFmpeg detected.",
    normalizationUnavailable: "FFmpeg not detected. Downloads will still work, but audio processing will be skipped.",
    normalizationSkipped: "Downloaded track saved, but FFmpeg processing was skipped: {error}",
    ffmpegNormalizedFor: "FFmpeg: normalized {game}",
    ffmpegUpmixedFor: "FFmpeg: upmixed {game}",
    ffmpegNormalizedUpmixedFor: "FFmpeg: normalized and upmixed {game}",
    ffmpegSkippedFor: "FFmpeg: skipped for {game}",
    ffmpegDisabled: "FFmpeg processing disabled",
    ffmpegFailedFor: "FFmpeg: failed for {game}: {error}",
    gameMusicVolumeLabel: "Game music volume",
    gameMusicVolumeDesc: "",
    stopMusicAfterPlay: "Stop music after pressing Play",
    stopMusicAfterPlayDesc: "",
    launchStart: "At launch start",
    launchFinish: "At launch finish",
    enableGlobalLabel: "Enable ambient track",
    enableGlobalDesc: "",
    enableStoreLabel: "Enable store track",
    enableStoreDesc: "",
    disableGlobalStoreLabel: "Disable ambient track while in game store",
    disableGlobalStoreDesc: "",
    globalInterruptionLabel: "Ambient interruption behavior",
    globalInterruptionDesc: "",
    interruptStop: "Stop (restart)",
    interruptPause: "Pause",
    interruptMute: "Mute",
    chooseGlobal: "Choose ambient track...",
    chooseStore: "Choose Store track...",
    ytdlpWarning: "Only update yt-dlp if YouTube search doesn't work.",
    ytdlpNotInstalled: "yt-dlp not installed",
    updateYtdlp: "Update yt-dlp",
    updating: "Updating...",
    autoAssignTitle: "Auto-assign missing game tracks (yt-dlp)",
    autoAssignDesc: "",
    missingCount: "Games currently without music assigned: {count}",
    libraryCount: "Total library games detected: {count}",
    autoAssignMissing: "Auto-assign missing",
    running: "Running...",
    stopButton: "STOP",
    showMissingGames: "Show games without music",
    hideMissingGames: "Hide games without music",
    showAssignedGames: "Show games with music",
    hideAssignedGames: "Hide games with music",
    noGamesMissingMusic: "No games are missing music.",
    noGamesWithMusic: "No games have music assigned yet.",
    assignedNormalizedCaption: "orange tracks have normalized volume",
    globalAmbientPanelTitle: "Ambient track",
    noGlobalTrackSelected: "No ambient track selected.",
    pausePreview: "Pause preview",
    previewTrack: "Preview track",
    removeGlobalAmbient: "Remove ambient music",
    storeOnlyPanelTitle: "Store track",
    noStoreOnlyTrackSelected: "No Store track selected.",
    removeStoreOnly: "Remove Store music",
    invalidGameId: "Invalid game id.",
    themeDeckFor: "ThemeDeck for {game}",
    noMusicSelected: "No music selected yet.",
    play: "Play",
    pause: "Pause",
    done: "Done",
    removeMusic: "Remove music",
    volume: "Volume",
    startSkip: "Start skip",
    loopTrack: "Loop track",
    loopTrackDesc: "",
    youtubeSearchTitle: "YouTube search (yt-dlp)",
    searchYoutubeDesc: "Search YouTube for game music, download audio locally, and assign it to this game.",
    installYtdlp: "Install yt-dlp",
    installing: "Installing...",
    search: "Search",
    searching: "Searching...",
    prev: "Prev",
    next: "Next",
    selected: "Selected",
    currentAssigned: "Currently assigned",
    playPreview: "Play Preview",
    stopPreview: "Stop Preview",
    loading: "Loading...",
    downloadAssign: "Download & Assign",
    downloading: "Downloading...",
    noResults: "No results yet. Search for a game soundtrack above.",
    browseLocalTitle: "Or, browse local files to assign from system storage",
    up: "Up",
    go: "Go",
    globalTrackTitle: "ThemeDeck ambient track",
    noGlobalTrack: "No ambient track selected yet.",
    storeTrackTitle: "ThemeDeck Store track",
    noStoreTrack: "No Store track selected yet.",
    savedGlobal: "Saved ambient music",
    clearedGlobal: "Cleared ambient music",
    savedStore: "Saved Store music",
    clearedStore: "Cleared Store music",
    unableAddFile: "Unable to add file: {error}",
    unknownError: "Unknown error",
    unknownUpdateError: "Unknown update error",
    ytdlpReady: "yt-dlp ready ({version})",
    failedInstallYtdlp: "Failed to install yt-dlp: {error}",
    saveTrackToast: "Saved \"{filename}\" for {game}",
    clearedTrackToast: "Cleared music for {game}",
    youtubeDownloadFailed: "YouTube download failed: {error}",
    youtubeSearchFailed: "YouTube search failed: {error}",
    couldNotSaveVolume: "Couldn't save volume",
    couldNotSaveLoop: "Couldn't save loop setting",
    couldNotSaveStart: "Couldn't save song start truncation",
    couldNotSaveGlobalVolume: "Couldn't save global track volume",
    couldNotSaveGlobalLoop: "Couldn't save global track loop setting",
    couldNotSaveGlobalStart: "Couldn't save global song start truncation",
    couldNotSaveStoreVolume: "Couldn't save store track volume",
    couldNotSaveStoreLoop: "Couldn't save store track loop setting",
    couldNotSaveStoreStart: "Couldn't save store song start truncation",
    failedRemoveGlobal: "Failed to remove global track",
    failedRemoveStore: "Failed to remove store track",
    failedLoadTracks: "Failed to load saved tracks",
    deleteDownloadedTracks: "Delete downloaded tracks",
    deleteDownloadedTracksDesc: "",
    deleteDownloadedTracksTitle: "Delete downloaded audio files?",
    confirmDeleteDownloadedTracks: "Delete all audio files downloaded by ThemeDeck? Files selected from your personal folders and assigned to games are not subject to deletion.",
    yes: "Yes",
    no: "No",
    deleting: "Deleting...",
    preparingDelete: "Preparing deletion...",
    deletedProgress: "Deleted {completed} of {total}",
    close: "Close",
    deletedDownloadedTracks: "Deleted {files} files and removed {tracks} assignments.",
    failedDeleteDownloadedTracks: "Failed to delete downloaded tracks",
    noGamesFound: "No games found in library.",
    allGamesAssigned: "All library games already have assigned music.",
    ytdlpMissing: "yt-dlp is not installed yet.",
    stoppingAfterCurrent: "Stopping after current operation...",
    skippedAlreadyAssigned: "Skipped {game} (already assigned).",
    searchForGame: "Searching YouTube for {game} ({query})...",
    noEligibleResults: "No eligible YouTube results for {game}.",
    searchFailedForGame: "Search failed for {game}: {error}",
    allDownloadAttemptsFailed: "All download attempts failed for {game}: {error}",
    confirmUpdateYtdlp: "Update yt-dlp now? Only do this if YouTube search is not working.",
    failedReadYtdlpStatus: "Failed to read yt-dlp status",
    enterSearchQuery: "Enter a search query first",
    previewFailed: "Preview failed: {error}",
    bulkStopped: "Stopped. Assigned {assigned}, skipped {skipped}, failed {failed}.",
    bulkDone: "Done. Assigned {assigned}, skipped {skipped}, failed {failed}.",
    bulkToastStopped: "Bulk assign stopped. Assigned {assigned}, skipped {skipped}, failed {failed}.",
    bulkToastDone: "Bulk assign complete. Assigned {assigned}, skipped {skipped}, failed {failed}.",
    stopMusicTimingAria: "Stop music timing on launch",
    globalAmbientBehaviorAria: "Ambient interruption behavior",
};
const makeLocale = (strings) => ({
    ...EN_STRINGS,
    ...strings,
});
const TRANSLATIONS = {
    en: makeLocale({}),
    it: makeLocale({
        introVersion: "3 marzo 2026 (v2.5.4)",
        introAssign: "Per assegnare una traccia, apri la pagina di un gioco, seleziona l'icona ingranaggio e poi Scegli musica ThemeDeck.",
        autoPlayLabel: "Riproduzione automatica nella pagina gioco",
        autoPlayDesc: "",
        normalizeAudioLabel: "Normalizza audio scaricato",
        normalizeAudioDesc: "Usa la normalizzazione loudness di FFmpeg dopo i download da YouTube, quando FFmpeg è disponibile.",
        upmixAudioLabel: "Upmix audio scaricato a 7.1",
        upmixAudioDesc: "Usa FFmpeg per convertire le tracce scaricate in 7.1 canali, quando FFmpeg è disponibile.",
        normalizeAudioNotice: "L'elaborazione FFmpeg può allungare i download. Queste opzioni valgono anche per i download manuali da Scegli musica ThemeDeck.",
        normalizationAvailable: "FFmpeg rilevato.",
        normalizationUnavailable: "FFmpeg non rilevato. I download funzionano comunque, ma l'elaborazione audio verrà saltata.",
        normalizationSkipped: "Traccia scaricata salvata, ma elaborazione FFmpeg saltata: {error}",
        gameMusicVolumeLabel: "Volume musica giochi",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Ferma la musica dopo aver premuto Gioca",
        stopMusicAfterPlayDesc: "",
        launchStart: "All'inizio dell'avvio",
        launchFinish: "Alla fine dell'avvio",
        enableGlobalLabel: "Abilita traccia ambientale",
        enableGlobalDesc: "",
        enableStoreLabel: "Abilita traccia Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Disabilita la traccia ambientale nello Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento interruzione ambientale",
        globalInterruptionDesc: "",
        interruptStop: "Ferma (riavvia)",
        interruptPause: "Pausa",
        interruptMute: "Silenzia",
        chooseGlobal: "Scegli traccia ambientale...",
        chooseStore: "Scegli traccia Store...",
        ytdlpWarning: "Aggiorna yt-dlp solo se la ricerca YouTube non funziona.",
        ytdlpNotInstalled: "yt-dlp non installato",
        updateYtdlp: "Aggiorna yt-dlp",
        updating: "Aggiornamento...",
        autoAssignTitle: "Assegna automaticamente tracce mancanti (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Giochi senza musica assegnata: {count}",
        libraryCount: "Giochi rilevati nella libreria: {count}",
        autoAssignMissing: "Assegna mancanti",
        running: "In corso...",
        stopButton: "STOP",
        showMissingGames: "Mostra giochi senza musica",
        hideMissingGames: "Nascondi giochi senza musica",
        showAssignedGames: "Mostra giochi con musica",
        hideAssignedGames: "Nascondi giochi con musica",
        noGamesMissingMusic: "Nessun gioco senza musica.",
        noGamesWithMusic: "Nessun gioco con musica assegnata.",
        assignedNormalizedCaption: "in arancione i brani con volume normalizzato",
        globalAmbientPanelTitle: "Traccia ambientale",
        noGlobalTrackSelected: "Nessuna traccia ambientale selezionata.",
        pausePreview: "Pausa anteprima",
        previewTrack: "Anteprima traccia",
        removeGlobalAmbient: "Rimuovi musica ambientale",
        storeOnlyPanelTitle: "Traccia Store",
        noStoreOnlyTrackSelected: "Nessuna traccia Store selezionata.",
        removeStoreOnly: "Rimuovi musica Store",
        invalidGameId: "ID gioco non valido.",
        themeDeckFor: "ThemeDeck per {game}",
        noMusicSelected: "Nessuna musica selezionata.",
        play: "Riproduci",
        pause: "Pausa",
        done: "Fine",
        removeMusic: "Rimuovi musica",
        volume: "Volume",
        startSkip: "Salta inizio",
        loopTrack: "Ripeti traccia",
        loopTrackDesc: "",
        youtubeSearchTitle: "Ricerca YouTube (yt-dlp)",
        searchYoutubeDesc: "Cerca musica del gioco su YouTube, scarica l'audio in locale e assegnalo al gioco.",
        installYtdlp: "Installa yt-dlp",
        installing: "Installazione...",
        search: "Cerca",
        searching: "Ricerca...",
        prev: "Precedente",
        next: "Successivo",
        selected: "Selezionato",
        currentAssigned: "Attualmente assegnato",
        playPreview: "Anteprima",
        stopPreview: "Ferma anteprima",
        loading: "Caricamento...",
        downloadAssign: "Scarica e assegna",
        downloading: "Download...",
        noResults: "Nessun risultato. Cerca una colonna sonora qui sopra.",
        browseLocalTitle: "Oppure sfoglia i file locali nello spazio di archiviazione",
        up: "Su",
        go: "Vai",
        globalTrackTitle: "Traccia ambientale ThemeDeck",
        noGlobalTrack: "Nessuna traccia ambientale selezionata.",
        storeTrackTitle: "Traccia Store ThemeDeck",
        noStoreTrack: "Nessuna traccia Store selezionata.",
        savedGlobal: "Musica ambientale salvata",
        clearedGlobal: "Musica ambientale rimossa",
        savedStore: "Musica Store salvata",
        clearedStore: "Musica Store rimossa",
        unableAddFile: "Impossibile aggiungere il file: {error}",
        unknownError: "Errore sconosciuto",
        unknownUpdateError: "Errore di aggiornamento sconosciuto",
        ytdlpReady: "yt-dlp pronto ({version})",
        failedInstallYtdlp: "Installazione yt-dlp non riuscita: {error}",
        saveTrackToast: "\"{filename}\" salvata per {game}",
        clearedTrackToast: "Musica rimossa per {game}",
        youtubeDownloadFailed: "Download YouTube non riuscito: {error}",
        youtubeSearchFailed: "Ricerca YouTube non riuscita: {error}",
        couldNotSaveVolume: "Impossibile salvare il volume",
        couldNotSaveLoop: "Impossibile salvare la ripetizione",
        couldNotSaveStart: "Impossibile salvare il taglio iniziale",
        couldNotSaveGlobalVolume: "Impossibile salvare il volume globale",
        couldNotSaveGlobalLoop: "Impossibile salvare la ripetizione globale",
        couldNotSaveGlobalStart: "Impossibile salvare il taglio iniziale globale",
        couldNotSaveStoreVolume: "Impossibile salvare il volume Store",
        couldNotSaveStoreLoop: "Impossibile salvare la ripetizione Store",
        couldNotSaveStoreStart: "Impossibile salvare il taglio iniziale Store",
        failedRemoveGlobal: "Impossibile rimuovere la traccia globale",
        failedRemoveStore: "Impossibile rimuovere la traccia Store",
        failedLoadTracks: "Impossibile caricare le tracce salvate",
        deleteDownloadedTracks: "Cancella tracce scaricate",
        deleteDownloadedTracksDesc: "",
        deleteDownloadedTracksTitle: "Eliminare i file audio scaricati?",
        confirmDeleteDownloadedTracks: "Cancellare tutti i file audio scaricati da ThemeDeck? I file selezionati dalle tue cartelle personali assegnati ai giochi non sono soggetti a eliminazione.",
        yes: "Sì",
        no: "No",
        deleting: "Cancellazione...",
        preparingDelete: "Preparazione cancellazione...",
        deletedProgress: "Cancellati {completed} di {total}",
        close: "Chiudi",
        deletedDownloadedTracks: "Cancellati {files} file e rimosse {tracks} assegnazioni.",
        failedDeleteDownloadedTracks: "Impossibile cancellare le tracce scaricate",
        noGamesFound: "Nessun gioco trovato nella libreria.",
        allGamesAssigned: "Tutti i giochi hanno già una musica assegnata.",
        ytdlpMissing: "yt-dlp non è ancora installato.",
        ffmpegNormalizedFor: "FFmpeg: normalizzato per {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 per {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizzato e upmix 7.1 per {game}",
        ffmpegSkippedFor: "FFmpeg: saltato per {game}",
        ffmpegDisabled: "Elaborazione FFmpeg disattivata",
        ffmpegFailedFor: "FFmpeg: errore per {game}: {error}",
        stoppingAfterCurrent: "Interruzione dopo l'operazione corrente...",
        skippedAlreadyAssigned: "{game} saltato (già assegnato).",
        searchForGame: "Ricerca YouTube per {game} ({query})...",
        noEligibleResults: "Nessun risultato YouTube valido per {game}.",
        searchFailedForGame: "Ricerca non riuscita per {game}: {error}",
        allDownloadAttemptsFailed: "Tutti i tentativi di download sono falliti per {game}: {error}",
        confirmUpdateYtdlp: "Aggiornare yt-dlp ora? Fallo solo se la ricerca YouTube non funziona.",
        failedReadYtdlpStatus: "Impossibile leggere lo stato di yt-dlp",
        enterSearchQuery: "Inserisci prima una ricerca",
        previewFailed: "Anteprima non riuscita: {error}",
        bulkStopped: "Interrotto. Assegnati {assigned}, saltati {skipped}, errori {failed}.",
        bulkDone: "Completato. Assegnati {assigned}, saltati {skipped}, errori {failed}.",
        bulkToastStopped: "Assegnazione interrotta. Assegnati {assigned}, saltati {skipped}, errori {failed}.",
        bulkToastDone: "Assegnazione completata. Assegnati {assigned}, saltati {skipped}, errori {failed}.",
        stopMusicTimingAria: "Momento di arresto della musica all'avvio",
        globalAmbientBehaviorAria: "Comportamento interruzione globale ambientale",
    }),
    fr: makeLocale({
        introVersion: "3 mars 2026 (v2.5.4)",
        introAssign: "Pour associer une musique, ouvrez la page d'un jeu, sélectionnez l'icône engrenage, puis Choisir la musique ThemeDeck.",
        autoPlayLabel: "Lecture automatique sur la page du jeu",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Volume des musiques de jeux",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Arrêter la musique après avoir appuyé sur Jouer",
        stopMusicAfterPlayDesc: "",
        launchStart: "Au début du lancement",
        launchFinish: "À la fin du lancement",
        enableGlobalLabel: "Activer la piste globale/ambiante",
        enableGlobalDesc: "",
        enableStoreLabel: "Activer la piste du Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Désactiver la piste globale/ambiante dans le Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportement d'interruption globale/ambiante",
        globalInterruptionDesc: "",
        interruptStop: "Arrêter (redémarrer)",
        interruptPause: "Pause",
        interruptMute: "Muet",
        chooseGlobal: "Choisir une piste globale/ambiante...",
        chooseStore: "Choisir une piste Store uniquement...",
        ytdlpWarning: "Ne mettez à jour yt-dlp que si la recherche YouTube ne fonctionne pas.",
        ytdlpNotInstalled: "yt-dlp non installé",
        updateYtdlp: "Mettre à jour yt-dlp",
        updating: "Mise à jour...",
        autoAssignTitle: "Assigner automatiquement les pistes manquantes (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Jeux sans musique assignée : {count}",
        libraryCount: "Jeux détectés dans la bibliothèque : {count}",
        autoAssignMissing: "Assigner les manquants",
        running: "En cours...",
        stopButton: "STOP",
        showMissingGames: "Afficher les jeux sans musique",
        hideMissingGames: "Masquer les jeux sans musique",
        noGamesMissingMusic: "Aucun jeu ne manque de musique.",
        globalAmbientPanelTitle: "Piste globale / ambiante",
        noGlobalTrackSelected: "Aucune piste globale sélectionnée.",
        pausePreview: "Mettre l'aperçu en pause",
        previewTrack: "Aperçu de la piste",
        removeGlobalAmbient: "Supprimer la musique globale ambiante",
        storeOnlyPanelTitle: "Piste Store uniquement",
        noStoreOnlyTrackSelected: "Aucune piste Store sélectionnée.",
        removeStoreOnly: "Supprimer la musique Store",
        confirmUpdateYtdlp: "Mettre à jour yt-dlp maintenant ? Faites-le seulement si la recherche YouTube ne fonctionne pas.",
        failedReadYtdlpStatus: "Impossible de lire l'état de yt-dlp",
        enterSearchQuery: "Saisissez d'abord une recherche",
        previewFailed: "Aperçu impossible : {error}",
        bulkStopped: "Arrêté. Assignés {assigned}, ignorés {skipped}, échecs {failed}.",
        bulkDone: "Terminé. Assignés {assigned}, ignorés {skipped}, échecs {failed}.",
        bulkToastStopped: "Assignation interrompue. Assignés {assigned}, ignorés {skipped}, échecs {failed}.",
        bulkToastDone: "Assignation terminée. Assignés {assigned}, ignorés {skipped}, échecs {failed}.",
        invalidGameId: "ID de jeu invalide.",
        themeDeckFor: "ThemeDeck pour {game}",
        noMusicSelected: "Aucune musique sélectionnée.",
        play: "Lire",
        pause: "Pause",
        done: "Terminé",
        removeMusic: "Supprimer la musique",
        volume: "Volume",
        startSkip: "Saut initial",
        loopTrack: "Lire en boucle",
        loopTrackDesc: "",
        youtubeSearchTitle: "Recherche YouTube (yt-dlp)",
        searchYoutubeDesc: "Recherchez la musique du jeu sur YouTube, téléchargez l'audio localement et assignez-le au jeu.",
        installYtdlp: "Installer yt-dlp",
        installing: "Installation...",
        search: "Rechercher",
        searching: "Recherche...",
        prev: "Précédent",
        next: "Suivant",
        selected: "Sélectionné",
        currentAssigned: "Actuellement assigné",
        playPreview: "Lire l'aperçu",
        stopPreview: "Arrêter l'aperçu",
        loading: "Chargement...",
        downloadAssign: "Télécharger et assigner",
        downloading: "Téléchargement...",
        noResults: "Aucun résultat. Recherchez une bande-son ci-dessus.",
        browseLocalTitle: "Ou parcourez les fichiers locaux du système",
        up: "Haut",
        go: "Aller",
        globalTrackTitle: "Piste globale / ambiante ThemeDeck",
        noGlobalTrack: "Aucune piste globale sélectionnée.",
        storeTrackTitle: "Piste Store uniquement ThemeDeck",
        noStoreTrack: "Aucune piste Store sélectionnée.",
    }),
    es: makeLocale({
        introVersion: "3 de marzo de 2026 (v2.5.4)",
        introAssign: "Para asignar música, abre la página de un juego, selecciona el icono de engranaje y luego Elegir música de ThemeDeck.",
        autoPlayLabel: "Reproducción automática en la página del juego",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Volumen de música de juegos",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Detener música después de pulsar Jugar",
        stopMusicAfterPlayDesc: "",
        launchStart: "Al iniciar",
        launchFinish: "Al terminar el inicio",
        enableGlobalLabel: "Activar pista global/ambiental",
        enableGlobalDesc: "",
        enableStoreLabel: "Activar pista de la tienda",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desactivar pista global/ambiental en la tienda",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamiento de interrupción global/ambiental",
        globalInterruptionDesc: "",
        interruptStop: "Detener (reiniciar)",
        interruptPause: "Pausa",
        interruptMute: "Silenciar",
        chooseGlobal: "Elegir pista global/ambiental...",
        chooseStore: "Elegir pista solo para tienda...",
        ytdlpWarning: "Actualiza yt-dlp solo si la búsqueda de YouTube no funciona.",
        ytdlpNotInstalled: "yt-dlp no instalado",
        updateYtdlp: "Actualizar yt-dlp",
        updating: "Actualizando...",
        autoAssignTitle: "Asignar automáticamente pistas faltantes (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Juegos sin música asignada: {count}",
        libraryCount: "Juegos detectados en la biblioteca: {count}",
        autoAssignMissing: "Asignar faltantes",
        running: "En curso...",
        stopButton: "STOP",
        showMissingGames: "Mostrar juegos sin música",
        hideMissingGames: "Ocultar juegos sin música",
        noGamesMissingMusic: "No faltan juegos con música.",
        globalAmbientPanelTitle: "Pista global / ambiental",
        noGlobalTrackSelected: "No hay pista global seleccionada.",
        pausePreview: "Pausar vista previa",
        previewTrack: "Vista previa de pista",
        removeGlobalAmbient: "Quitar música global ambiental",
        storeOnlyPanelTitle: "Pista solo para tienda",
        noStoreOnlyTrackSelected: "No hay pista de tienda seleccionada.",
        removeStoreOnly: "Quitar música de tienda",
        confirmUpdateYtdlp: "¿Actualizar yt-dlp ahora? Hazlo solo si la búsqueda de YouTube no funciona.",
        failedReadYtdlpStatus: "No se pudo leer el estado de yt-dlp",
        enterSearchQuery: "Escribe una búsqueda primero",
        previewFailed: "Vista previa fallida: {error}",
        bulkStopped: "Detenido. Asignados {assigned}, omitidos {skipped}, errores {failed}.",
        bulkDone: "Completado. Asignados {assigned}, omitidos {skipped}, errores {failed}.",
        bulkToastStopped: "Asignación detenida. Asignados {assigned}, omitidos {skipped}, errores {failed}.",
        bulkToastDone: "Asignación completada. Asignados {assigned}, omitidos {skipped}, errores {failed}.",
        invalidGameId: "ID de juego no válido.",
        themeDeckFor: "ThemeDeck para {game}",
        noMusicSelected: "No hay música seleccionada.",
        play: "Reproducir",
        pause: "Pausa",
        done: "Listo",
        removeMusic: "Quitar música",
        volume: "Volumen",
        startSkip: "Saltar inicio",
        loopTrack: "Repetir pista",
        loopTrackDesc: "",
        youtubeSearchTitle: "Búsqueda en YouTube (yt-dlp)",
        searchYoutubeDesc: "Busca música del juego en YouTube, descarga el audio localmente y asígnalo al juego.",
        installYtdlp: "Instalar yt-dlp",
        installing: "Instalando...",
        search: "Buscar",
        searching: "Buscando...",
        prev: "Anterior",
        next: "Siguiente",
        selected: "Seleccionado",
        currentAssigned: "Asignado actualmente",
        playPreview: "Vista previa",
        stopPreview: "Detener vista previa",
        loading: "Cargando...",
        downloadAssign: "Descargar y asignar",
        downloading: "Descargando...",
        noResults: "Sin resultados. Busca una banda sonora arriba.",
        browseLocalTitle: "O explora archivos locales del sistema",
        up: "Arriba",
        go: "Ir",
        globalTrackTitle: "Pista global / ambiental de ThemeDeck",
        noGlobalTrack: "No hay pista global seleccionada.",
        storeTrackTitle: "Pista solo para tienda de ThemeDeck",
        noStoreTrack: "No hay pista de tienda seleccionada.",
    }),
    pt: makeLocale({
        introVersion: "3 de março de 2026 (v2.5.4)",
        introAssign: "Para atribuir música, abra a página de um jogo, selecione o ícone de engrenagem e depois Escolher música ThemeDeck.",
        autoPlayLabel: "Reprodução automática na página do jogo",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Volume da música dos jogos",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Parar música depois de premir Jogar",
        stopMusicAfterPlayDesc: "",
        launchStart: "No início do arranque",
        launchFinish: "No fim do arranque",
        enableGlobalLabel: "Ativar faixa global/ambiente",
        enableGlobalDesc: "",
        enableStoreLabel: "Ativar faixa da loja",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desativar faixa global/ambiente na loja",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento de interrupção global/ambiente",
        globalInterruptionDesc: "",
        interruptStop: "Parar (reiniciar)",
        interruptPause: "Pausa",
        interruptMute: "Silenciar",
        chooseGlobal: "Escolher faixa global/ambiente...",
        chooseStore: "Escolher faixa apenas da loja...",
        ytdlpWarning: "Atualize o yt-dlp apenas se a pesquisa do YouTube não funcionar.",
        ytdlpNotInstalled: "yt-dlp não instalado",
        updateYtdlp: "Atualizar yt-dlp",
        updating: "A atualizar...",
        autoAssignTitle: "Atribuir automaticamente faixas em falta (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Jogos sem música atribuída: {count}",
        libraryCount: "Jogos detetados na biblioteca: {count}",
        autoAssignMissing: "Atribuir em falta",
        running: "Em execução...",
        stopButton: "STOP",
        showMissingGames: "Mostrar jogos sem música",
        hideMissingGames: "Ocultar jogos sem música",
        noGamesMissingMusic: "Nenhum jogo está sem música.",
        globalAmbientPanelTitle: "Faixa global / ambiente",
        noGlobalTrackSelected: "Nenhuma faixa global selecionada.",
        pausePreview: "Pausar pré-visualização",
        previewTrack: "Pré-visualizar faixa",
        removeGlobalAmbient: "Remover música global ambiente",
        storeOnlyPanelTitle: "Faixa apenas da loja",
        noStoreOnlyTrackSelected: "Nenhuma faixa da loja selecionada.",
        removeStoreOnly: "Remover música da loja",
        confirmUpdateYtdlp: "Atualizar o yt-dlp agora? Faça-o apenas se a pesquisa do YouTube não funcionar.",
        failedReadYtdlpStatus: "Não foi possível ler o estado do yt-dlp",
        enterSearchQuery: "Introduza primeiro uma pesquisa",
        previewFailed: "Pré-visualização falhou: {error}",
        bulkStopped: "Parado. Atribuídos {assigned}, ignorados {skipped}, falhas {failed}.",
        bulkDone: "Concluído. Atribuídos {assigned}, ignorados {skipped}, falhas {failed}.",
        bulkToastStopped: "Atribuição parada. Atribuídos {assigned}, ignorados {skipped}, falhas {failed}.",
        bulkToastDone: "Atribuição concluída. Atribuídos {assigned}, ignorados {skipped}, falhas {failed}.",
        invalidGameId: "ID de jogo inválido.",
        themeDeckFor: "ThemeDeck para {game}",
        noMusicSelected: "Nenhuma música selecionada.",
        play: "Reproduzir",
        pause: "Pausa",
        done: "Concluído",
        removeMusic: "Remover música",
        volume: "Volume",
        startSkip: "Saltar início",
        loopTrack: "Repetir faixa",
        loopTrackDesc: "",
        youtubeSearchTitle: "Pesquisa no YouTube (yt-dlp)",
        searchYoutubeDesc: "Pesquise música do jogo no YouTube, descarregue o áudio localmente e atribua-o ao jogo.",
        installYtdlp: "Instalar yt-dlp",
        installing: "A instalar...",
        search: "Pesquisar",
        searching: "A pesquisar...",
        prev: "Anterior",
        next: "Seguinte",
        selected: "Selecionado",
        currentAssigned: "Atualmente atribuído",
        playPreview: "Pré-visualizar",
        stopPreview: "Parar pré-visualização",
        loading: "A carregar...",
        downloadAssign: "Descarregar e atribuir",
        downloading: "A descarregar...",
        noResults: "Sem resultados. Pesquise uma banda sonora acima.",
        browseLocalTitle: "Ou navegue pelos ficheiros locais do sistema",
        up: "Subir",
        go: "Ir",
        globalTrackTitle: "Faixa global / ambiente ThemeDeck",
        noGlobalTrack: "Nenhuma faixa global selecionada.",
        storeTrackTitle: "Faixa apenas da loja ThemeDeck",
        noStoreTrack: "Nenhuma faixa da loja selecionada.",
    }),
    "pt-br": makeLocale({
        introVersion: "3 de março de 2026 (v2.5.4)",
        introAssign: "Para atribuir uma música, abra a página de um jogo, selecione o ícone de engrenagem e depois Escolher música do ThemeDeck.",
        autoPlayLabel: "Reprodução automática na página do jogo",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Volume da música dos jogos",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Parar música depois de apertar Jogar",
        stopMusicAfterPlayDesc: "",
        launchStart: "No início da inicialização",
        launchFinish: "No fim da inicialização",
        enableGlobalLabel: "Ativar faixa global/ambiente",
        enableGlobalDesc: "",
        enableStoreLabel: "Ativar faixa da loja",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desativar faixa global/ambiente na loja",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento de interrupção global/ambiente",
        globalInterruptionDesc: "",
        interruptStop: "Parar (reiniciar)",
        interruptPause: "Pausar",
        interruptMute: "Silenciar",
        chooseGlobal: "Escolher faixa global/ambiente...",
        chooseStore: "Escolher faixa apenas da loja...",
        ytdlpWarning: "Atualize o yt-dlp apenas se a busca do YouTube não funcionar.",
        ytdlpNotInstalled: "yt-dlp não instalado",
        updateYtdlp: "Atualizar yt-dlp",
        updating: "Atualizando...",
        autoAssignTitle: "Atribuir automaticamente faixas ausentes (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Jogos sem música atribuída: {count}",
        libraryCount: "Jogos detectados na biblioteca: {count}",
        autoAssignMissing: "Atribuir ausentes",
        running: "Rodando...",
        stopButton: "STOP",
        showMissingGames: "Mostrar jogos sem música",
        hideMissingGames: "Ocultar jogos sem música",
        noGamesMissingMusic: "Nenhum jogo está sem música.",
        globalAmbientPanelTitle: "Faixa global / ambiente",
        noGlobalTrackSelected: "Nenhuma faixa global selecionada.",
        pausePreview: "Pausar prévia",
        previewTrack: "Prévia da faixa",
        removeGlobalAmbient: "Remover música global ambiente",
        storeOnlyPanelTitle: "Faixa apenas da loja",
        noStoreOnlyTrackSelected: "Nenhuma faixa da loja selecionada.",
        removeStoreOnly: "Remover música da loja",
        confirmUpdateYtdlp: "Atualizar o yt-dlp agora? Faça isso só se a busca do YouTube não funcionar.",
        failedReadYtdlpStatus: "Não foi possível ler o status do yt-dlp",
        enterSearchQuery: "Digite uma busca primeiro",
        previewFailed: "Prévia falhou: {error}",
        bulkStopped: "Parado. Atribuídos {assigned}, pulados {skipped}, falhas {failed}.",
        bulkDone: "Concluído. Atribuídos {assigned}, pulados {skipped}, falhas {failed}.",
        bulkToastStopped: "Atribuição parada. Atribuídos {assigned}, pulados {skipped}, falhas {failed}.",
        bulkToastDone: "Atribuição concluída. Atribuídos {assigned}, pulados {skipped}, falhas {failed}.",
        invalidGameId: "ID de jogo inválido.",
        themeDeckFor: "ThemeDeck para {game}",
        noMusicSelected: "Nenhuma música selecionada.",
        play: "Reproduzir",
        pause: "Pausar",
        done: "Concluído",
        removeMusic: "Remover música",
        volume: "Volume",
        startSkip: "Pular início",
        loopTrack: "Repetir faixa",
        loopTrackDesc: "",
        youtubeSearchTitle: "Busca no YouTube (yt-dlp)",
        searchYoutubeDesc: "Busque música do jogo no YouTube, baixe o áudio localmente e atribua ao jogo.",
        installYtdlp: "Instalar yt-dlp",
        installing: "Instalando...",
        search: "Buscar",
        searching: "Buscando...",
        prev: "Anterior",
        next: "Próximo",
        selected: "Selecionado",
        currentAssigned: "Atribuído atualmente",
        playPreview: "Prévia",
        stopPreview: "Parar prévia",
        loading: "Carregando...",
        downloadAssign: "Baixar e atribuir",
        downloading: "Baixando...",
        noResults: "Sem resultados. Busque uma trilha sonora acima.",
        browseLocalTitle: "Ou navegue pelos arquivos locais do sistema",
        up: "Subir",
        go: "Ir",
        globalTrackTitle: "Faixa global / ambiente do ThemeDeck",
        noGlobalTrack: "Nenhuma faixa global selecionada.",
        storeTrackTitle: "Faixa apenas da loja do ThemeDeck",
        noStoreTrack: "Nenhuma faixa da loja selecionada.",
    }),
    de: makeLocale({
        introVersion: "3. März 2026 (v2.5.4)",
        introAssign: "Um Musik zuzuweisen, öffne die Spielseite, wähle das Zahnrad und dann ThemeDeck-Musik auswählen.",
        autoPlayLabel: "Automatisch auf Spielseite abspielen",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Lautstärke der Spielmusik",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Musik nach Drücken von Spielen stoppen",
        stopMusicAfterPlayDesc: "",
        launchStart: "Beim Startbeginn",
        launchFinish: "Nach Abschluss des Starts",
        enableGlobalLabel: "Globale/ambiente Spur aktivieren",
        enableGlobalDesc: "",
        enableStoreLabel: "Store-Spur aktivieren",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Globale/ambiente Spur im Store deaktivieren",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Verhalten bei globaler/ambienter Unterbrechung",
        globalInterruptionDesc: "",
        interruptStop: "Stoppen (neu starten)",
        interruptPause: "Pause",
        interruptMute: "Stumm",
        chooseGlobal: "Globale/ambiente Spur wählen...",
        chooseStore: "Nur-Store-Spur wählen...",
        ytdlpWarning: "Aktualisiere yt-dlp nur, wenn die YouTube-Suche nicht funktioniert.",
        ytdlpNotInstalled: "yt-dlp nicht installiert",
        updateYtdlp: "yt-dlp aktualisieren",
        updating: "Aktualisiere...",
        autoAssignTitle: "Fehlende Spieltitel automatisch zuweisen (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Spiele ohne zugewiesene Musik: {count}",
        libraryCount: "Erkannte Spiele in der Bibliothek: {count}",
        autoAssignMissing: "Fehlende zuweisen",
        running: "Läuft...",
        stopButton: "STOP",
        showMissingGames: "Spiele ohne Musik anzeigen",
        hideMissingGames: "Spiele ohne Musik ausblenden",
        noGamesMissingMusic: "Keine Spiele ohne Musik.",
        globalAmbientPanelTitle: "Globale / ambiente Spur",
        noGlobalTrackSelected: "Keine globale Spur ausgewählt.",
        pausePreview: "Vorschau pausieren",
        previewTrack: "Spurvorschau",
        removeGlobalAmbient: "Globale Ambient-Musik entfernen",
        storeOnlyPanelTitle: "Nur-Store-Spur",
        noStoreOnlyTrackSelected: "Keine Store-Spur ausgewählt.",
        removeStoreOnly: "Store-Musik entfernen",
        confirmUpdateYtdlp: "yt-dlp jetzt aktualisieren? Nur tun, wenn die YouTube-Suche nicht funktioniert.",
        failedReadYtdlpStatus: "yt-dlp-Status konnte nicht gelesen werden",
        enterSearchQuery: "Gib zuerst eine Suche ein",
        previewFailed: "Vorschau fehlgeschlagen: {error}",
        bulkStopped: "Gestoppt. Zugewiesen {assigned}, übersprungen {skipped}, Fehler {failed}.",
        bulkDone: "Fertig. Zugewiesen {assigned}, übersprungen {skipped}, Fehler {failed}.",
        bulkToastStopped: "Massenzuweisung gestoppt. Zugewiesen {assigned}, übersprungen {skipped}, Fehler {failed}.",
        bulkToastDone: "Massenzuweisung abgeschlossen. Zugewiesen {assigned}, übersprungen {skipped}, Fehler {failed}.",
        invalidGameId: "Ungültige Spiel-ID.",
        themeDeckFor: "ThemeDeck für {game}",
        noMusicSelected: "Keine Musik ausgewählt.",
        play: "Abspielen",
        pause: "Pause",
        done: "Fertig",
        removeMusic: "Musik entfernen",
        volume: "Lautstärke",
        startSkip: "Start überspringen",
        loopTrack: "Titel wiederholen",
        loopTrackDesc: "",
        youtubeSearchTitle: "YouTube-Suche (yt-dlp)",
        searchYoutubeDesc: "Suche Spielmusik auf YouTube, lade Audio lokal herunter und weise es dem Spiel zu.",
        installYtdlp: "yt-dlp installieren",
        installing: "Installiere...",
        search: "Suchen",
        searching: "Suche...",
        prev: "Zurück",
        next: "Weiter",
        selected: "Ausgewählt",
        currentAssigned: "Aktuell zugewiesen",
        playPreview: "Vorschau abspielen",
        stopPreview: "Vorschau stoppen",
        loading: "Lädt...",
        downloadAssign: "Herunterladen und zuweisen",
        downloading: "Lädt herunter...",
        noResults: "Noch keine Ergebnisse. Suche oben nach einem Soundtrack.",
        browseLocalTitle: "Oder lokale Dateien aus dem Systemspeicher durchsuchen",
        up: "Hoch",
        go: "Los",
        globalTrackTitle: "ThemeDeck globale / ambiente Spur",
        noGlobalTrack: "Keine globale Spur ausgewählt.",
        storeTrackTitle: "ThemeDeck Nur-Store-Spur",
        noStoreTrack: "Keine Store-Spur ausgewählt.",
    }),
    nl: makeLocale({
        introVersion: "3 maart 2026 (v2.5.4)",
        introAssign: "Om muziek toe te wijzen, open je de spelpagina, kies je het tandwiel en daarna ThemeDeck-muziek kiezen.",
        autoPlayLabel: "Automatisch afspelen op spelpagina",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Volume van spelmuziek",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Muziek stoppen na drukken op Spelen",
        stopMusicAfterPlayDesc: "",
        launchStart: "Bij startbegin",
        launchFinish: "Na het starten",
        enableGlobalLabel: "Globale/ambient-track inschakelen",
        enableGlobalDesc: "",
        enableStoreLabel: "Store-track inschakelen",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Globale/ambient-track uitschakelen in Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Gedrag bij globale/ambient-onderbreking",
        globalInterruptionDesc: "",
        interruptStop: "Stoppen (herstarten)",
        interruptPause: "Pauzeren",
        interruptMute: "Dempen",
        chooseGlobal: "Globale/ambient-track kiezen...",
        chooseStore: "Alleen Store-track kiezen...",
        ytdlpWarning: "Werk yt-dlp alleen bij als YouTube zoeken niet werkt.",
        ytdlpNotInstalled: "yt-dlp niet geïnstalleerd",
        updateYtdlp: "yt-dlp bijwerken",
        updating: "Bijwerken...",
        autoAssignTitle: "Ontbrekende speltracks automatisch toewijzen (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Spellen zonder toegewezen muziek: {count}",
        libraryCount: "Gedetecteerde spellen in bibliotheek: {count}",
        autoAssignMissing: "Ontbrekende toewijzen",
        running: "Bezig...",
        stopButton: "STOP",
        showMissingGames: "Spellen zonder muziek tonen",
        hideMissingGames: "Spellen zonder muziek verbergen",
        noGamesMissingMusic: "Geen spellen zonder muziek.",
        globalAmbientPanelTitle: "Globale / ambient-track",
        noGlobalTrackSelected: "Geen globale track geselecteerd.",
        pausePreview: "Voorbeeld pauzeren",
        previewTrack: "Trackvoorbeeld",
        removeGlobalAmbient: "Globale ambient-muziek verwijderen",
        storeOnlyPanelTitle: "Alleen Store-track",
        noStoreOnlyTrackSelected: "Geen Store-track geselecteerd.",
        removeStoreOnly: "Store-muziek verwijderen",
        confirmUpdateYtdlp: "yt-dlp nu bijwerken? Doe dit alleen als YouTube zoeken niet werkt.",
        failedReadYtdlpStatus: "Kan yt-dlp-status niet lezen",
        enterSearchQuery: "Voer eerst een zoekopdracht in",
        previewFailed: "Voorbeeld mislukt: {error}",
        bulkStopped: "Gestopt. Toegewezen {assigned}, overgeslagen {skipped}, mislukt {failed}.",
        bulkDone: "Klaar. Toegewezen {assigned}, overgeslagen {skipped}, mislukt {failed}.",
        bulkToastStopped: "Bulktoewijzing gestopt. Toegewezen {assigned}, overgeslagen {skipped}, mislukt {failed}.",
        bulkToastDone: "Bulktoewijzing voltooid. Toegewezen {assigned}, overgeslagen {skipped}, mislukt {failed}.",
        invalidGameId: "Ongeldige spel-ID.",
        themeDeckFor: "ThemeDeck voor {game}",
        noMusicSelected: "Geen muziek geselecteerd.",
        play: "Afspelen",
        pause: "Pauzeren",
        done: "Klaar",
        removeMusic: "Muziek verwijderen",
        volume: "Volume",
        startSkip: "Begin overslaan",
        loopTrack: "Track herhalen",
        loopTrackDesc: "",
        youtubeSearchTitle: "YouTube zoeken (yt-dlp)",
        searchYoutubeDesc: "Zoek spelmuziek op YouTube, download audio lokaal en wijs die toe aan dit spel.",
        installYtdlp: "yt-dlp installeren",
        installing: "Installeren...",
        search: "Zoeken",
        searching: "Zoeken...",
        prev: "Vorige",
        next: "Volgende",
        selected: "Geselecteerd",
        currentAssigned: "Momenteel toegewezen",
        playPreview: "Voorbeeld afspelen",
        stopPreview: "Voorbeeld stoppen",
        loading: "Laden...",
        downloadAssign: "Downloaden en toewijzen",
        downloading: "Downloaden...",
        noResults: "Nog geen resultaten. Zoek hierboven naar een soundtrack.",
        browseLocalTitle: "Of blader door lokale bestanden op de systeemopslag",
        up: "Omhoog",
        go: "Ga",
        globalTrackTitle: "ThemeDeck globale / ambient-track",
        noGlobalTrack: "Geen globale track geselecteerd.",
        storeTrackTitle: "ThemeDeck alleen-Store-track",
        noStoreTrack: "Geen Store-track geselecteerd.",
    }),
    uk: makeLocale({
        introVersion: "3 березня 2026 (v2.5.4)",
        introAssign: "Щоб призначити музику, відкрийте сторінку гри, виберіть значок шестерні, а потім Обрати музику ThemeDeck.",
        autoPlayLabel: "Автовідтворення на сторінці гри",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "Гучність музики ігор",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "Зупиняти музику після натискання Грати",
        stopMusicAfterPlayDesc: "",
        launchStart: "На початку запуску",
        launchFinish: "Після завершення запуску",
        enableGlobalLabel: "Увімкнути глобальний/фоновий трек",
        enableGlobalDesc: "",
        enableStoreLabel: "Увімкнути трек магазину",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Вимикати глобальний/фоновий трек у магазині",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Поведінка переривання глобальної/фонової музики",
        globalInterruptionDesc: "",
        interruptStop: "Зупинити (перезапустити)",
        interruptPause: "Пауза",
        interruptMute: "Вимкнути звук",
        chooseGlobal: "Обрати глобальний/фоновий трек...",
        chooseStore: "Обрати трек лише для магазину...",
        ytdlpWarning: "Оновлюйте yt-dlp лише якщо пошук YouTube не працює.",
        ytdlpNotInstalled: "yt-dlp не встановлено",
        updateYtdlp: "Оновити yt-dlp",
        updating: "Оновлення...",
        autoAssignTitle: "Автоматично призначити відсутні треки ігор (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "Ігри без призначеної музики: {count}",
        libraryCount: "Виявлено ігор у бібліотеці: {count}",
        autoAssignMissing: "Призначити відсутні",
        running: "Виконується...",
        stopButton: "СТОП",
        showMissingGames: "Показати ігри без музики",
        hideMissingGames: "Сховати ігри без музики",
        noGamesMissingMusic: "Немає ігор без музики.",
        globalAmbientPanelTitle: "Глобальний / фоновий трек",
        noGlobalTrackSelected: "Глобальний трек не вибрано.",
        pausePreview: "Пауза прослуховування",
        previewTrack: "Прослухати трек",
        removeGlobalAmbient: "Видалити глобальну фонову музику",
        storeOnlyPanelTitle: "Трек лише для магазину",
        noStoreOnlyTrackSelected: "Трек магазину не вибрано.",
        removeStoreOnly: "Видалити музику магазину",
        confirmUpdateYtdlp: "Оновити yt-dlp зараз? Робіть це лише якщо пошук YouTube не працює.",
        failedReadYtdlpStatus: "Не вдалося прочитати стан yt-dlp",
        enterSearchQuery: "Спочатку введіть пошук",
        previewFailed: "Прослуховування не вдалося: {error}",
        bulkStopped: "Зупинено. Призначено {assigned}, пропущено {skipped}, помилок {failed}.",
        bulkDone: "Готово. Призначено {assigned}, пропущено {skipped}, помилок {failed}.",
        bulkToastStopped: "Масове призначення зупинено. Призначено {assigned}, пропущено {skipped}, помилок {failed}.",
        bulkToastDone: "Масове призначення завершено. Призначено {assigned}, пропущено {skipped}, помилок {failed}.",
        invalidGameId: "Недійсний ID гри.",
        themeDeckFor: "ThemeDeck для {game}",
        noMusicSelected: "Музику не вибрано.",
        play: "Відтворити",
        pause: "Пауза",
        done: "Готово",
        removeMusic: "Видалити музику",
        volume: "Гучність",
        startSkip: "Пропустити початок",
        loopTrack: "Повторювати трек",
        loopTrackDesc: "",
        youtubeSearchTitle: "Пошук YouTube (yt-dlp)",
        searchYoutubeDesc: "Знайдіть музику гри на YouTube, завантажте аудіо локально та призначте його грі.",
        installYtdlp: "Встановити yt-dlp",
        installing: "Встановлення...",
        search: "Пошук",
        searching: "Пошук...",
        prev: "Назад",
        next: "Далі",
        selected: "Вибрано",
        currentAssigned: "Зараз призначено",
        playPreview: "Прослухати",
        stopPreview: "Зупинити прослуховування",
        loading: "Завантаження...",
        downloadAssign: "Завантажити й призначити",
        downloading: "Завантаження...",
        noResults: "Поки немає результатів. Пошукайте саундтрек вище.",
        browseLocalTitle: "Або перегляньте локальні файли системи",
        up: "Вгору",
        go: "Перейти",
        globalTrackTitle: "Глобальний / фоновий трек ThemeDeck",
        noGlobalTrack: "Глобальний трек не вибрано.",
        storeTrackTitle: "Трек ThemeDeck лише для магазину",
        noStoreTrack: "Трек магазину не вибрано.",
    }),
    zh: makeLocale({
        introVersion: "2026 年 3 月 3 日 (v2.5.4)",
        introAssign: "要分配音乐，请打开游戏页面，选择齿轮图标，然后选择 ThemeDeck 音乐。",
        autoPlayLabel: "在游戏页面自动播放",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "游戏音乐音量",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "按下开始游戏后停止音乐",
        stopMusicAfterPlayDesc: "",
        launchStart: "启动开始时",
        launchFinish: "启动完成时",
        enableGlobalLabel: "启用全局/环境曲目",
        enableGlobalDesc: "",
        enableStoreLabel: "启用商店曲目",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "在商店中禁用全局/环境曲目",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "全局/环境中断行为",
        globalInterruptionDesc: "",
        interruptStop: "停止（重新开始）",
        interruptPause: "暂停",
        interruptMute: "静音",
        chooseGlobal: "选择全局/环境曲目...",
        chooseStore: "选择仅商店曲目...",
        ytdlpWarning: "仅在 YouTube 搜索无法工作时更新 yt-dlp。",
        ytdlpNotInstalled: "未安装 yt-dlp",
        updateYtdlp: "更新 yt-dlp",
        updating: "正在更新...",
        autoAssignTitle: "自动分配缺失的游戏曲目 (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "尚未分配音乐的游戏：{count}",
        libraryCount: "库中检测到的游戏：{count}",
        autoAssignMissing: "自动分配缺失项",
        running: "正在运行...",
        stopButton: "停止",
        showMissingGames: "显示没有音乐的游戏",
        hideMissingGames: "隐藏没有音乐的游戏",
        noGamesMissingMusic: "没有缺少音乐的游戏。",
        globalAmbientPanelTitle: "全局 / 环境曲目",
        noGlobalTrackSelected: "未选择全局曲目。",
        pausePreview: "暂停预览",
        previewTrack: "预览曲目",
        removeGlobalAmbient: "移除全局环境音乐",
        storeOnlyPanelTitle: "仅商店曲目",
        noStoreOnlyTrackSelected: "未选择商店曲目。",
        removeStoreOnly: "移除商店音乐",
        confirmUpdateYtdlp: "现在更新 yt-dlp？仅在 YouTube 搜索无法工作时执行。",
        failedReadYtdlpStatus: "无法读取 yt-dlp 状态",
        enterSearchQuery: "请先输入搜索内容",
        previewFailed: "预览失败：{error}",
        bulkStopped: "已停止。已分配 {assigned}，已跳过 {skipped}，失败 {failed}。",
        bulkDone: "已完成。已分配 {assigned}，已跳过 {skipped}，失败 {failed}。",
        bulkToastStopped: "批量分配已停止。已分配 {assigned}，已跳过 {skipped}，失败 {failed}。",
        bulkToastDone: "批量分配已完成。已分配 {assigned}，已跳过 {skipped}，失败 {failed}。",
        invalidGameId: "无效的游戏 ID。",
        themeDeckFor: "{game} 的 ThemeDeck",
        noMusicSelected: "尚未选择音乐。",
        play: "播放",
        pause: "暂停",
        done: "完成",
        removeMusic: "移除音乐",
        volume: "音量",
        startSkip: "跳过开头",
        loopTrack: "循环曲目",
        loopTrackDesc: "",
        youtubeSearchTitle: "YouTube 搜索 (yt-dlp)",
        searchYoutubeDesc: "在 YouTube 搜索游戏音乐，下载到本地并分配给游戏。",
        installYtdlp: "安装 yt-dlp",
        installing: "正在安装...",
        search: "搜索",
        searching: "正在搜索...",
        prev: "上一个",
        next: "下一个",
        selected: "已选择",
        currentAssigned: "当前已分配",
        playPreview: "播放预览",
        stopPreview: "停止预览",
        loading: "正在加载...",
        downloadAssign: "下载并分配",
        downloading: "正在下载...",
        noResults: "还没有结果。请在上方搜索游戏原声。",
        browseLocalTitle: "或浏览系统存储中的本地文件",
        up: "上级",
        go: "前往",
        globalTrackTitle: "ThemeDeck 全局 / 环境曲目",
        noGlobalTrack: "尚未选择全局曲目。",
        storeTrackTitle: "ThemeDeck 仅商店曲目",
        noStoreTrack: "尚未选择商店曲目。",
    }),
    ja: makeLocale({
        introVersion: "2026年3月3日 (v2.5.4)",
        introAssign: "音楽を割り当てるには、ゲームのページを開き、歯車アイコンを選んでから ThemeDeck の音楽を選択してください。",
        autoPlayLabel: "ゲームページで自動再生",
        autoPlayDesc: "",
        gameMusicVolumeLabel: "ゲーム音楽の音量",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlay: "プレイを押した後に音楽を停止",
        stopMusicAfterPlayDesc: "",
        launchStart: "起動開始時",
        launchFinish: "起動完了時",
        enableGlobalLabel: "グローバル/環境トラックを有効化",
        enableGlobalDesc: "",
        enableStoreLabel: "ストアトラックを有効化",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "ストアでグローバル/環境トラックを無効化",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "グローバル/環境音楽の割り込み動作",
        globalInterruptionDesc: "",
        interruptStop: "停止（再開）",
        interruptPause: "一時停止",
        interruptMute: "ミュート",
        chooseGlobal: "グローバル/環境トラックを選択...",
        chooseStore: "ストア専用トラックを選択...",
        ytdlpWarning: "YouTube 検索が動かない場合だけ yt-dlp を更新してください。",
        ytdlpNotInstalled: "yt-dlp が未インストール",
        updateYtdlp: "yt-dlp を更新",
        updating: "更新中...",
        autoAssignTitle: "不足しているゲームトラックを自動割り当て (yt-dlp)",
        autoAssignDesc: "",
        missingCount: "音楽未設定のゲーム：{count}",
        libraryCount: "ライブラリで検出されたゲーム：{count}",
        autoAssignMissing: "未設定を自動割り当て",
        running: "実行中...",
        stopButton: "停止",
        showMissingGames: "音楽なしのゲームを表示",
        hideMissingGames: "音楽なしのゲームを隠す",
        noGamesMissingMusic: "音楽が未設定のゲームはありません。",
        globalAmbientPanelTitle: "グローバル / 環境トラック",
        noGlobalTrackSelected: "グローバルトラックが選択されていません。",
        pausePreview: "プレビューを一時停止",
        previewTrack: "トラックをプレビュー",
        removeGlobalAmbient: "グローバル環境音楽を削除",
        storeOnlyPanelTitle: "ストア専用トラック",
        noStoreOnlyTrackSelected: "ストアトラックが選択されていません。",
        removeStoreOnly: "ストア音楽を削除",
        confirmUpdateYtdlp: "今すぐ yt-dlp を更新しますか？YouTube 検索が動かない場合だけ実行してください。",
        failedReadYtdlpStatus: "yt-dlp の状態を読み取れませんでした",
        enterSearchQuery: "先に検索語を入力してください",
        previewFailed: "プレビューに失敗しました：{error}",
        bulkStopped: "停止しました。割り当て {assigned}、スキップ {skipped}、失敗 {failed}。",
        bulkDone: "完了しました。割り当て {assigned}、スキップ {skipped}、失敗 {failed}。",
        bulkToastStopped: "一括割り当てを停止しました。割り当て {assigned}、スキップ {skipped}、失敗 {failed}。",
        bulkToastDone: "一括割り当てが完了しました。割り当て {assigned}、スキップ {skipped}、失敗 {failed}。",
        invalidGameId: "無効なゲーム ID です。",
        themeDeckFor: "{game} の ThemeDeck",
        noMusicSelected: "音楽が選択されていません。",
        play: "再生",
        pause: "一時停止",
        done: "完了",
        removeMusic: "音楽を削除",
        volume: "音量",
        startSkip: "開始をスキップ",
        loopTrack: "トラックをループ",
        loopTrackDesc: "",
        youtubeSearchTitle: "YouTube 検索 (yt-dlp)",
        searchYoutubeDesc: "YouTube でゲーム音楽を検索し、音声をローカルに保存してゲームに割り当てます。",
        installYtdlp: "yt-dlp をインストール",
        installing: "インストール中...",
        search: "検索",
        searching: "検索中...",
        prev: "前へ",
        next: "次へ",
        selected: "選択中",
        currentAssigned: "現在割り当て済み",
        playPreview: "プレビュー再生",
        stopPreview: "プレビュー停止",
        loading: "読み込み中...",
        downloadAssign: "ダウンロードして割り当て",
        downloading: "ダウンロード中...",
        noResults: "まだ結果がありません。上でゲームのサウンドトラックを検索してください。",
        browseLocalTitle: "またはシステムストレージ内のローカルファイルを参照",
        up: "上へ",
        go: "移動",
        globalTrackTitle: "ThemeDeck グローバル / 環境トラック",
        noGlobalTrack: "グローバルトラックが選択されていません。",
        storeTrackTitle: "ThemeDeck ストア専用トラック",
        noStoreTrack: "ストアトラックが選択されていません。",
    }),
};
const getDetectedLocale = () => {
    const languages = [
        ...(navigator.languages ?? []),
        navigator.language,
        document.documentElement.lang,
    ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
    for (const language of languages) {
        if (language.startsWith("pt-br"))
            return "pt-br";
        if (language.startsWith("zh"))
            return "zh";
        const base = language.split("-")[0];
        if (TRANSLATIONS[base])
            return base;
    }
    return "en";
};
const ACTIVE_LOCALE = getDetectedLocale();
const LOCALIZED_UI_OVERRIDES = {
    it: {
        autoPlayDesc: "",
        gameMusicVolumeDesc: "",
        stopMusicAfterPlayDesc: "",
        enableGlobalLabel: "Abilita traccia ambientale",
        enableGlobalDesc: "",
        enableStoreLabel: "Abilita traccia Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Disabilita la traccia ambientale nello Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento interruzione ambientale",
        globalInterruptionDesc: "",
        chooseGlobal: "Scegli traccia ambientale...",
        chooseStore: "Scegli traccia Store...",
        autoAssignDesc: "",
        showAssignedGames: "Mostra giochi con musica",
        hideAssignedGames: "Nascondi giochi con musica",
        noGamesWithMusic: "Nessun gioco con musica assegnata.",
        assignedNormalizedCaption: "in arancione i brani con volume normalizzato",
        globalAmbientPanelTitle: "Traccia ambientale",
        noGlobalTrackSelected: "Nessuna traccia ambientale selezionata.",
        removeGlobalAmbient: "Rimuovi musica ambientale",
        storeOnlyPanelTitle: "Traccia Store",
        noStoreOnlyTrackSelected: "Nessuna traccia Store selezionata.",
        removeStoreOnly: "Rimuovi musica Store",
        loopTrackDesc: "",
        globalTrackTitle: "Traccia ambientale ThemeDeck",
        noGlobalTrack: "Nessuna traccia ambientale selezionata.",
        storeTrackTitle: "Traccia Store ThemeDeck",
        noStoreTrack: "Nessuna traccia Store selezionata.",
        savedGlobal: "Musica ambientale salvata",
        clearedGlobal: "Musica ambientale rimossa",
        savedStore: "Musica Store salvata",
        clearedStore: "Musica Store rimossa",
        deleteDownloadedTracksDesc: "",
        confirmDeleteDownloadedTracks: "Cancellare tutti i file audio scaricati da ThemeDeck? I file selezionati dalle tue cartelle personali assegnati ai giochi non sono soggetti a eliminazione.",
        ffmpegNormalizedFor: "FFmpeg: normalizzato per {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 per {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizzato e upmix 7.1 per {game}",
        ffmpegSkippedFor: "FFmpeg: saltato per {game}",
        ffmpegDisabled: "Elaborazione FFmpeg disattivata",
        ffmpegFailedFor: "FFmpeg: errore per {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento interruzione ambientale",
    },
    fr: {
        normalizeAudioNotice: "Le traitement FFmpeg peut allonger le telechargement. Ces options s'appliquent aussi aux telechargements manuels depuis Choisir une piste ThemeDeck.",
        upmixAudioLabel: "Upmix audio telecharge en 7.1",
        upmixAudioDesc: "Utilise FFmpeg pour convertir les pistes telechargees en 7.1 canaux quand FFmpeg est disponible.",
        enableGlobalLabel: "Activer la piste d'ambiance",
        enableGlobalDesc: "",
        enableStoreLabel: "Activer la piste Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Désactiver la piste d'ambiance dans le Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportement d'interruption de l'ambiance",
        globalInterruptionDesc: "",
        chooseGlobal: "Choisir une piste d'ambiance...",
        chooseStore: "Choisir une piste Store...",
        showAssignedGames: "Afficher les jeux avec musique",
        hideAssignedGames: "Masquer les jeux avec musique",
        noGamesWithMusic: "Aucun jeu n'a encore de musique assignée.",
        assignedNormalizedCaption: "en orange, les pistes au volume normalisé",
        globalAmbientPanelTitle: "Piste d'ambiance",
        noGlobalTrackSelected: "Aucune piste d'ambiance sélectionnée.",
        removeGlobalAmbient: "Supprimer la musique d'ambiance",
        storeOnlyPanelTitle: "Piste Store",
        noStoreOnlyTrackSelected: "Aucune piste Store sélectionnée.",
        removeStoreOnly: "Supprimer la musique Store",
        globalTrackTitle: "Piste d'ambiance ThemeDeck",
        noGlobalTrack: "Aucune piste d'ambiance sélectionnée.",
        storeTrackTitle: "Piste Store ThemeDeck",
        noStoreTrack: "Aucune piste Store sélectionnée.",
        savedGlobal: "Musique d'ambiance enregistrée",
        clearedGlobal: "Musique d'ambiance supprimée",
        savedStore: "Musique Store enregistrée",
        clearedStore: "Musique Store supprimée",
        confirmDeleteDownloadedTracks: "Supprimer tous les fichiers audio téléchargés par ThemeDeck ? Les fichiers sélectionnés dans vos dossiers personnels et assignés aux jeux ne sont pas concernés.",
        ffmpegNormalizedFor: "FFmpeg : normalisé pour {game}",
        ffmpegUpmixedFor: "FFmpeg : upmix 7.1 pour {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg : normalisé et upmix 7.1 pour {game}",
        ffmpegSkippedFor: "FFmpeg : ignoré pour {game}",
        ffmpegDisabled: "Traitement FFmpeg désactivé",
        ffmpegFailedFor: "FFmpeg : échec pour {game} : {error}",
        globalAmbientBehaviorAria: "Comportement d'interruption de l'ambiance",
    },
    es: {
        normalizeAudioNotice: "El procesamiento de FFmpeg puede hacer que las descargas tarden más. Estas opciones también se aplican a las descargas manuales desde Elegir música ThemeDeck.",
        upmixAudioLabel: "Upmix de audio descargado a 7.1",
        upmixAudioDesc: "Usa FFmpeg para convertir las pistas descargadas a 7.1 canales cuando FFmpeg está disponible.",
        enableGlobalLabel: "Activar pista ambiental",
        enableGlobalDesc: "",
        enableStoreLabel: "Activar pista Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desactivar la pista ambiental en Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamiento de interrupción ambiental",
        globalInterruptionDesc: "",
        chooseGlobal: "Elegir pista ambiental...",
        chooseStore: "Elegir pista Store...",
        showAssignedGames: "Mostrar juegos con música",
        hideAssignedGames: "Ocultar juegos con música",
        noGamesWithMusic: "Aún no hay juegos con música asignada.",
        assignedNormalizedCaption: "en naranja, pistas con volumen normalizado",
        globalAmbientPanelTitle: "Pista ambiental",
        noGlobalTrackSelected: "No hay pista ambiental seleccionada.",
        removeGlobalAmbient: "Eliminar música ambiental",
        storeOnlyPanelTitle: "Pista Store",
        noStoreOnlyTrackSelected: "No hay pista Store seleccionada.",
        removeStoreOnly: "Eliminar música Store",
        globalTrackTitle: "Pista ambiental ThemeDeck",
        noGlobalTrack: "Aún no hay pista ambiental seleccionada.",
        storeTrackTitle: "Pista Store ThemeDeck",
        noStoreTrack: "Aún no hay pista Store seleccionada.",
        savedGlobal: "Música ambiental guardada",
        clearedGlobal: "Música ambiental eliminada",
        savedStore: "Música Store guardada",
        clearedStore: "Música Store eliminada",
        confirmDeleteDownloadedTracks: "¿Eliminar todos los archivos de audio descargados por ThemeDeck? Los archivos seleccionados desde tus carpetas personales y asignados a juegos no se eliminarán.",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado y upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: omitido para {game}",
        ffmpegDisabled: "Procesamiento FFmpeg desactivado",
        ffmpegFailedFor: "FFmpeg: error en {game}: {error}",
        globalAmbientBehaviorAria: "Comportamiento de interrupción ambiental",
    },
    pt: {
        normalizeAudioNotice: "O processamento FFmpeg pode tornar os downloads mais demorados. Estas opções também se aplicam aos downloads manuais em Escolher música ThemeDeck.",
        upmixAudioLabel: "Upmix do áudio descarregado para 7.1",
        upmixAudioDesc: "Usa FFmpeg para converter faixas descarregadas para 7.1 canais quando FFmpeg está disponível.",
        enableGlobalLabel: "Ativar faixa ambiente",
        enableGlobalDesc: "",
        enableStoreLabel: "Ativar faixa Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desativar faixa ambiente na Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento de interrupção ambiente",
        globalInterruptionDesc: "",
        chooseGlobal: "Escolher faixa ambiente...",
        chooseStore: "Escolher faixa Store...",
        showAssignedGames: "Mostrar jogos com música",
        hideAssignedGames: "Ocultar jogos com música",
        noGamesWithMusic: "Ainda não há jogos com música atribuída.",
        assignedNormalizedCaption: "em laranja, faixas com volume normalizado",
        globalAmbientPanelTitle: "Faixa ambiente",
        noGlobalTrackSelected: "Nenhuma faixa ambiente selecionada.",
        removeGlobalAmbient: "Remover música ambiente",
        storeOnlyPanelTitle: "Faixa Store",
        noStoreOnlyTrackSelected: "Nenhuma faixa Store selecionada.",
        removeStoreOnly: "Remover música Store",
        globalTrackTitle: "Faixa ambiente ThemeDeck",
        noGlobalTrack: "Nenhuma faixa ambiente selecionada.",
        storeTrackTitle: "Faixa Store ThemeDeck",
        noStoreTrack: "Nenhuma faixa Store selecionada.",
        savedGlobal: "Música ambiente salva",
        clearedGlobal: "Música ambiente removida",
        savedStore: "Música Store salva",
        clearedStore: "Música Store removida",
        confirmDeleteDownloadedTracks: "Eliminar todos os ficheiros de áudio descarregados pelo ThemeDeck? Os ficheiros escolhidos nas tuas pastas pessoais e atribuídos a jogos não serão eliminados.",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado e upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: ignorado para {game}",
        ffmpegDisabled: "Processamento FFmpeg desativado",
        ffmpegFailedFor: "FFmpeg: erro em {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento de interrupção ambiente",
    },
    "pt-br": {
        normalizeAudioNotice: "O processamento FFmpeg pode deixar os downloads mais demorados. Estas opções também valem para downloads manuais em Escolher música ThemeDeck.",
        upmixAudioLabel: "Upmix do áudio baixado para 7.1",
        upmixAudioDesc: "Usa FFmpeg para converter faixas baixadas para 7.1 canais quando FFmpeg está disponível.",
        enableGlobalLabel: "Ativar faixa ambiente",
        enableGlobalDesc: "",
        enableStoreLabel: "Ativar faixa Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Desativar faixa ambiente na Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Comportamento de interrupção ambiente",
        globalInterruptionDesc: "",
        chooseGlobal: "Escolher faixa ambiente...",
        chooseStore: "Escolher faixa Store...",
        showAssignedGames: "Mostrar jogos com música",
        hideAssignedGames: "Ocultar jogos com música",
        noGamesWithMusic: "Ainda não há jogos com música atribuída.",
        assignedNormalizedCaption: "em laranja, faixas com volume normalizado",
        globalAmbientPanelTitle: "Faixa ambiente",
        noGlobalTrackSelected: "Nenhuma faixa ambiente selecionada.",
        removeGlobalAmbient: "Remover música ambiente",
        storeOnlyPanelTitle: "Faixa Store",
        noStoreOnlyTrackSelected: "Nenhuma faixa Store selecionada.",
        removeStoreOnly: "Remover música Store",
        globalTrackTitle: "Faixa ambiente ThemeDeck",
        noGlobalTrack: "Nenhuma faixa ambiente selecionada.",
        storeTrackTitle: "Faixa Store ThemeDeck",
        noStoreTrack: "Nenhuma faixa Store selecionada.",
        savedGlobal: "Música ambiente salva",
        clearedGlobal: "Música ambiente removida",
        savedStore: "Música Store salva",
        clearedStore: "Música Store removida",
        confirmDeleteDownloadedTracks: "Excluir todos os arquivos de áudio baixados pelo ThemeDeck? Os arquivos escolhidos nas suas pastas pessoais e atribuídos a jogos não serão excluídos.",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado e upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: ignorado para {game}",
        ffmpegDisabled: "Processamento FFmpeg desativado",
        ffmpegFailedFor: "FFmpeg: erro em {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento de interrupção ambiente",
    },
    de: {
        normalizeAudioNotice: "FFmpeg-Verarbeitung kann Downloads verlängern. Diese Optionen gelten auch für manuelle Downloads über ThemeDeck-Musik auswählen.",
        upmixAudioLabel: "Heruntergeladene Audiospur auf 7.1 upmixen",
        upmixAudioDesc: "Verwendet FFmpeg, um heruntergeladene Spuren auf 7.1 Kanäle zu konvertieren, wenn FFmpeg verfügbar ist.",
        enableGlobalLabel: "Umgebungsspur aktivieren",
        enableGlobalDesc: "",
        enableStoreLabel: "Store-Spur aktivieren",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Umgebungsspur im Store deaktivieren",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Unterbrechungsverhalten der Umgebungsspur",
        globalInterruptionDesc: "",
        chooseGlobal: "Umgebungsspur wählen...",
        chooseStore: "Store-Spur wählen...",
        showAssignedGames: "Spiele mit Musik anzeigen",
        hideAssignedGames: "Spiele mit Musik ausblenden",
        noGamesWithMusic: "Noch keine Spiele mit zugewiesener Musik.",
        assignedNormalizedCaption: "orange markiert: Spuren mit normalisierter Lautstärke",
        globalAmbientPanelTitle: "Umgebungsspur",
        noGlobalTrackSelected: "Keine Umgebungsspur ausgewählt.",
        removeGlobalAmbient: "Umgebungsmusik entfernen",
        storeOnlyPanelTitle: "Store-Spur",
        noStoreOnlyTrackSelected: "Keine Store-Spur ausgewählt.",
        removeStoreOnly: "Store-Musik entfernen",
        globalTrackTitle: "ThemeDeck-Umgebungsspur",
        noGlobalTrack: "Noch keine Umgebungsspur ausgewählt.",
        storeTrackTitle: "ThemeDeck-Store-Spur",
        noStoreTrack: "Noch keine Store-Spur ausgewählt.",
        savedGlobal: "Umgebungsmusik gespeichert",
        clearedGlobal: "Umgebungsmusik entfernt",
        savedStore: "Store-Musik gespeichert",
        clearedStore: "Store-Musik entfernt",
        confirmDeleteDownloadedTracks: "Alle von ThemeDeck heruntergeladenen Audiodateien löschen? Dateien aus deinen persönlichen Ordnern, die Spielen zugewiesen sind, werden nicht gelöscht.",
        ffmpegNormalizedFor: "FFmpeg: {game} normalisiert",
        ffmpegUpmixedFor: "FFmpeg: 7.1-Upmix für {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: {game} normalisiert und auf 7.1 upgemixt",
        ffmpegSkippedFor: "FFmpeg: {game} übersprungen",
        ffmpegDisabled: "FFmpeg-Verarbeitung deaktiviert",
        ffmpegFailedFor: "FFmpeg: Fehler bei {game}: {error}",
        globalAmbientBehaviorAria: "Unterbrechungsverhalten der Umgebungsspur",
    },
    nl: {
        normalizeAudioNotice: "FFmpeg-verwerking kan downloads langer laten duren. Deze opties gelden ook voor handmatige downloads via ThemeDeck-muziek kiezen.",
        upmixAudioLabel: "Gedownloade audio naar 7.1 upmixen",
        upmixAudioDesc: "Gebruikt FFmpeg om gedownloade tracks naar 7.1 kanalen te converteren wanneer FFmpeg beschikbaar is.",
        enableGlobalLabel: "Ambient-track inschakelen",
        enableGlobalDesc: "",
        enableStoreLabel: "Store-track inschakelen",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Ambient-track in Store uitschakelen",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Onderbrekingsgedrag van ambient-track",
        globalInterruptionDesc: "",
        chooseGlobal: "Ambient-track kiezen...",
        chooseStore: "Store-track kiezen...",
        showAssignedGames: "Games met muziek tonen",
        hideAssignedGames: "Games met muziek verbergen",
        noGamesWithMusic: "Er zijn nog geen games met toegewezen muziek.",
        assignedNormalizedCaption: "oranje tracks hebben genormaliseerd volume",
        globalAmbientPanelTitle: "Ambient-track",
        noGlobalTrackSelected: "Geen ambient-track geselecteerd.",
        removeGlobalAmbient: "Ambient-muziek verwijderen",
        storeOnlyPanelTitle: "Store-track",
        noStoreOnlyTrackSelected: "Geen Store-track geselecteerd.",
        removeStoreOnly: "Store-muziek verwijderen",
        globalTrackTitle: "ThemeDeck ambient-track",
        noGlobalTrack: "Nog geen ambient-track geselecteerd.",
        storeTrackTitle: "ThemeDeck Store-track",
        noStoreTrack: "Nog geen Store-track geselecteerd.",
        savedGlobal: "Ambient-muziek opgeslagen",
        clearedGlobal: "Ambient-muziek verwijderd",
        savedStore: "Store-muziek opgeslagen",
        clearedStore: "Store-muziek verwijderd",
        confirmDeleteDownloadedTracks: "Alle door ThemeDeck gedownloade audiobestanden verwijderen? Bestanden uit je persoonlijke mappen die aan games zijn toegewezen worden niet verwijderd.",
        ffmpegNormalizedFor: "FFmpeg: genormaliseerd voor {game}",
        ffmpegUpmixedFor: "FFmpeg: 7.1-upmix voor {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: genormaliseerd en 7.1-upmix voor {game}",
        ffmpegSkippedFor: "FFmpeg: overgeslagen voor {game}",
        ffmpegDisabled: "FFmpeg-verwerking uitgeschakeld",
        ffmpegFailedFor: "FFmpeg: fout bij {game}: {error}",
        globalAmbientBehaviorAria: "Onderbrekingsgedrag van ambient-track",
    },
    uk: {
        normalizeAudioNotice: "Обробка FFmpeg може збільшити час завантаження. Ці параметри також застосовуються до ручних завантажень через вибір музики ThemeDeck.",
        upmixAudioLabel: "Upmix завантаженого аудіо до 7.1",
        upmixAudioDesc: "Використовує FFmpeg для перетворення завантажених треків у 7.1 каналів, якщо FFmpeg доступний.",
        enableGlobalLabel: "Увімкнути фоновий трек",
        enableGlobalDesc: "",
        enableStoreLabel: "Увімкнути трек Store",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "Вимкнути фоновий трек у Store",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "Поведінка переривання фонового треку",
        globalInterruptionDesc: "",
        chooseGlobal: "Обрати фоновий трек...",
        chooseStore: "Обрати трек Store...",
        showAssignedGames: "Показати ігри з музикою",
        hideAssignedGames: "Сховати ігри з музикою",
        noGamesWithMusic: "Ігор із призначеною музикою ще немає.",
        assignedNormalizedCaption: "помаранчевим позначено треки з нормалізованою гучністю",
        globalAmbientPanelTitle: "Фоновий трек",
        noGlobalTrackSelected: "Фоновий трек не вибрано.",
        removeGlobalAmbient: "Видалити фонову музику",
        storeOnlyPanelTitle: "Трек Store",
        noStoreOnlyTrackSelected: "Трек Store не вибрано.",
        removeStoreOnly: "Видалити музику Store",
        globalTrackTitle: "Фоновий трек ThemeDeck",
        noGlobalTrack: "Фоновий трек ще не вибрано.",
        storeTrackTitle: "Трек Store ThemeDeck",
        noStoreTrack: "Трек Store ще не вибрано.",
        savedGlobal: "Фонову музику збережено",
        clearedGlobal: "Фонову музику видалено",
        savedStore: "Музику Store збережено",
        clearedStore: "Музику Store видалено",
        confirmDeleteDownloadedTracks: "Видалити всі аудіофайли, завантажені ThemeDeck? Файли з ваших особистих папок, призначені іграм, не видалятимуться.",
        ffmpegNormalizedFor: "FFmpeg: нормалізовано для {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 для {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: нормалізовано та upmix 7.1 для {game}",
        ffmpegSkippedFor: "FFmpeg: пропущено для {game}",
        ffmpegDisabled: "Обробку FFmpeg вимкнено",
        ffmpegFailedFor: "FFmpeg: помилка для {game}: {error}",
        globalAmbientBehaviorAria: "Поведінка переривання фонового треку",
    },
    zh: {
        normalizeAudioNotice: "FFmpeg 处理可能会让下载耗时更久。这些选项也适用于通过选择 ThemeDeck 音乐进行的手动下载。",
        upmixAudioLabel: "将下载音频 upmix 到 7.1",
        upmixAudioDesc: "FFmpeg 可用时，使用 FFmpeg 将下载的曲目转换为 7.1 声道。",
        enableGlobalLabel: "启用环境曲目",
        enableGlobalDesc: "",
        enableStoreLabel: "启用商店曲目",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "在商店中禁用环境曲目",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "环境曲目中断行为",
        globalInterruptionDesc: "",
        chooseGlobal: "选择环境曲目...",
        chooseStore: "选择商店曲目...",
        showAssignedGames: "显示已有音乐的游戏",
        hideAssignedGames: "隐藏已有音乐的游戏",
        noGamesWithMusic: "还没有分配音乐的游戏。",
        assignedNormalizedCaption: "橙色表示音量已标准化的曲目",
        globalAmbientPanelTitle: "环境曲目",
        noGlobalTrackSelected: "未选择环境曲目。",
        removeGlobalAmbient: "移除环境音乐",
        storeOnlyPanelTitle: "商店曲目",
        noStoreOnlyTrackSelected: "未选择商店曲目。",
        removeStoreOnly: "移除商店音乐",
        globalTrackTitle: "ThemeDeck 环境曲目",
        noGlobalTrack: "尚未选择环境曲目。",
        storeTrackTitle: "ThemeDeck 商店曲目",
        noStoreTrack: "尚未选择商店曲目。",
        savedGlobal: "已保存环境音乐",
        clearedGlobal: "已清除环境音乐",
        savedStore: "已保存商店音乐",
        clearedStore: "已清除商店音乐",
        confirmDeleteDownloadedTracks: "删除 ThemeDeck 下载的所有音频文件？从个人文件夹选择并分配给游戏的文件不会被删除。",
        ffmpegNormalizedFor: "FFmpeg：已为 {game} 标准化",
        ffmpegUpmixedFor: "FFmpeg：已为 {game} upmix 到 7.1",
        ffmpegNormalizedUpmixedFor: "FFmpeg：已为 {game} 标准化并 upmix 到 7.1",
        ffmpegSkippedFor: "FFmpeg：已跳过 {game}",
        ffmpegDisabled: "FFmpeg 处理已关闭",
        ffmpegFailedFor: "FFmpeg：{game} 失败：{error}",
        globalAmbientBehaviorAria: "环境曲目中断行为",
    },
    ja: {
        normalizeAudioNotice: "FFmpeg 処理により、ダウンロードに時間がかかる場合があります。これらのオプションは ThemeDeck 音楽を選択からの手動ダウンロードにも適用されます。",
        upmixAudioLabel: "ダウンロード音声を 7.1 にアップミックス",
        upmixAudioDesc: "FFmpeg が利用可能な場合、ダウンロードしたトラックを 7.1 チャンネルに変換します。",
        enableGlobalLabel: "環境トラックを有効化",
        enableGlobalDesc: "",
        enableStoreLabel: "ストアトラックを有効化",
        enableStoreDesc: "",
        disableGlobalStoreLabel: "ストアで環境トラックを無効化",
        disableGlobalStoreDesc: "",
        globalInterruptionLabel: "環境トラックの中断動作",
        globalInterruptionDesc: "",
        chooseGlobal: "環境トラックを選択...",
        chooseStore: "ストアトラックを選択...",
        showAssignedGames: "音楽ありのゲームを表示",
        hideAssignedGames: "音楽ありのゲームを非表示",
        noGamesWithMusic: "音楽が割り当てられたゲームはまだありません。",
        assignedNormalizedCaption: "オレンジは音量正規化済みトラック",
        globalAmbientPanelTitle: "環境トラック",
        noGlobalTrackSelected: "環境トラックが選択されていません。",
        removeGlobalAmbient: "環境音楽を削除",
        storeOnlyPanelTitle: "ストアトラック",
        noStoreOnlyTrackSelected: "ストアトラックが選択されていません。",
        removeStoreOnly: "ストア音楽を削除",
        globalTrackTitle: "ThemeDeck 環境トラック",
        noGlobalTrack: "環境トラックはまだ選択されていません。",
        storeTrackTitle: "ThemeDeck ストアトラック",
        noStoreTrack: "ストアトラックはまだ選択されていません。",
        savedGlobal: "環境音楽を保存しました",
        clearedGlobal: "環境音楽を削除しました",
        savedStore: "ストア音楽を保存しました",
        clearedStore: "ストア音楽を削除しました",
        confirmDeleteDownloadedTracks: "ThemeDeck がダウンロードしたすべての音声ファイルを削除しますか？個人フォルダーから選択してゲームに割り当てたファイルは削除されません。",
        ffmpegNormalizedFor: "FFmpeg: {game} を正規化しました",
        ffmpegUpmixedFor: "FFmpeg: {game} を 7.1 にアップミックスしました",
        ffmpegNormalizedUpmixedFor: "FFmpeg: {game} を正規化し 7.1 にアップミックスしました",
        ffmpegSkippedFor: "FFmpeg: {game} をスキップしました",
        ffmpegDisabled: "FFmpeg 処理は無効です",
        ffmpegFailedFor: "FFmpeg: {game} で失敗: {error}",
        globalAmbientBehaviorAria: "環境トラックの中断動作",
    },
};
const HIDDEN_TEXT_KEYS = new Set([
    "autoPlayDesc",
    "gameMusicVolumeDesc",
    "stopMusicAfterPlayDesc",
    "enableGlobalDesc",
    "enableStoreDesc",
    "disableGlobalStoreDesc",
    "globalInterruptionDesc",
    "deleteDownloadedTracksDesc",
    "autoAssignDesc",
    "loopTrackDesc",
]);
const normalizeTerminology = (text) => text
    .replace(/global\s*\/\s*ambient track/gi, "ambient track")
    .replace(/global\s*\/\s*ambient/gi, "ambient")
    .replace(/globale?\s*\/\s*(ambien\w+)/gi, "$1")
    .replace(/global\s*\/\s*(ambient\w+)/gi, "$1")
    .replace(/global ambient/gi, "ambient")
    .replace(/global track/gi, "ambient track")
    .replace(/global music/gi, "ambient music")
    .replace(/globale\s*\/\s*ambientale/gi, "ambientale")
    .replace(/globale\/ambientale/gi, "ambientale")
    .replace(/globale ambientale/gi, "ambientale")
    .replace(/traccia globale/gi, "traccia ambientale")
    .replace(/musica ambientale globale/gi, "musica ambientale")
    .replace(/Глобальний\s*\/\s*фоновий трек/gi, "Фоновий трек")
    .replace(/全局\s*\/\s*环境曲目/g, "环境曲目")
    .replace(/グローバル\s*\/\s*環境トラック/g, "環境トラック")
    .replace(/store-only track/gi, "Store track")
    .replace(/store-only music/gi, "Store music")
    .replace(/store-only/gi, "Store")
    .replace(/solo Store/gi, "Store")
    .replace(/piste Store uniquement/gi, "piste Store")
    .replace(/pista solo para tienda/gi, "pista Store")
    .replace(/faixa apenas da loja/gi, "faixa Store")
    .replace(/Nur-Store-Spur/gi, "Store-Spur")
    .replace(/Alleen Store-track/gi, "Store-track")
    .replace(/трек лише для магазину/gi, "трек Store")
    .replace(/仅商店曲目/g, "商店曲目")
    .replace(/ストア専用トラック/g, "ストアトラック");
const t = (key, values) => {
    if (HIDDEN_TEXT_KEYS.has(key)) {
        return "";
    }
    let text = LOCALIZED_UI_OVERRIDES[ACTIVE_LOCALE]?.[key] ??
        TRANSLATIONS[ACTIVE_LOCALE]?.[key] ??
        EN_STRINGS[key];
    if (!values) {
        return normalizeTerminology(text);
    }
    for (const [name, value] of Object.entries(values)) {
        text = text.split(`{${name}}`).join(String(value));
    }
    return normalizeTerminology(text);
};
const focusListeners = new Set();
let focusedAppId = null;
let locationInterval = null;
let steamAppRetry = null;
const steamAppSubscriptions = [];
const playbackListeners = new Set();
let playbackState = {
    appId: null,
    reason: "auto",
    status: "stopped",
};
let sharedAudio = null;
const audioCache = new Map();
let latestTracksForAutoPlay = {};
let latestGlobalTrackForAutoPlay = null;
let latestStoreTrackForAutoPlay = null;
let activeDetailRouteAppId = null;
let activeDetailBridgeCount = 0;
let lastDetailRouteAppId = null;
let lastDetailRouteSeenAtMs = 0;
let contextMenuActiveAppId = null;
let activeContextMenuCloser = null;
let autoPlaybackTick = null;
let autoPlaybackStarted = false;
let stopAutoPlaybackSubscription = null;
let autoPlaybackTrackRefreshInFlight = false;
let autoPlaybackRouteInterval = null;
let autoPlaybackStoreProbeInFlight = false;
let externalMediaPollInterval = null;
let externalMediaProbeInFlight = false;
let externalMediaActive = false;
let storeContextActive = false;
let playInvocationCounter = 0;
let playInFlightSignature = null;
let desktopModeActive = false;
let desktopModeLastCheck = 0;
let desktopModeRefreshInFlight = null;
let uiModePollInterval = null;
let stopUIModeSubscription = null;
let runningGameAppId = null;
let launchActivityAppId = null;
let runningAppPollInterval = null;
let runningAppRetry = null;
let runningAppRefreshInFlight = false;
const runningAppSubscriptions = [];
const launchingAppFirstSeenAtMs = new Map();
let launchStopModeRuntime = "launch_start";
let gameTrackMasterVolumeRuntime = 1;
let globalAmbientResumeSnapshot = null;
let ambientInterruptionModeRuntime = "stop";
let stopPlaybackToken = 0;
const readPreference = (key, fallback = true) => {
    try {
        const raw = window.localStorage?.getItem(key);
        if (raw === null) {
            return fallback;
        }
        return raw === "true";
    }
    catch (error) {
        console.error("[ThemeDeck] unable to read preference", { key, error });
        return fallback;
    }
};
const persistPreference = (key, event, value) => {
    try {
        window.localStorage?.setItem(key, value ? "true" : "false");
    }
    catch (error) {
        console.error("[ThemeDeck] unable to store preference", { key, error });
    }
    window.dispatchEvent(new CustomEvent(event, { detail: value }));
};
const readAutoPlaySetting = () => readPreference(AUTO_PLAY_STORAGE_KEY, true);
const persistAutoPlaySetting = (value) => persistPreference(AUTO_PLAY_STORAGE_KEY, AUTO_PLAY_EVENT, value);
const readAudioNormalizationSetting = () => readPreference(AUDIO_NORMALIZATION_STORAGE_KEY, false);
const persistAudioNormalizationSetting = (value) => persistPreference(AUDIO_NORMALIZATION_STORAGE_KEY, AUDIO_NORMALIZATION_EVENT, value);
const readAudioUpmixSetting = () => readPreference(AUDIO_UPMIX_STORAGE_KEY, false);
const persistAudioUpmixSetting = (value) => persistPreference(AUDIO_UPMIX_STORAGE_KEY, AUDIO_UPMIX_EVENT, value);
const parseGameTrackMasterVolume = (value) => {
    const numeric = typeof value === "number"
        ? value
        : Number.parseFloat(String(value ?? ""));
    if (!Number.isFinite(numeric)) {
        return 1;
    }
    return clamp(numeric);
};
const readGameTrackMasterVolumeSetting = () => {
    try {
        const raw = window.localStorage?.getItem(GAME_TRACK_MASTER_VOLUME_STORAGE_KEY);
        const parsed = raw === null ? 1 : parseGameTrackMasterVolume(raw);
        gameTrackMasterVolumeRuntime = parsed;
        return parsed;
    }
    catch (error) {
        console.error("[ThemeDeck] unable to read game track master volume", error);
        return gameTrackMasterVolumeRuntime;
    }
};
const persistGameTrackMasterVolumeSetting = (value) => {
    const normalized = parseGameTrackMasterVolume(value);
    gameTrackMasterVolumeRuntime = normalized;
    try {
        window.localStorage?.setItem(GAME_TRACK_MASTER_VOLUME_STORAGE_KEY, String(normalized));
    }
    catch (error) {
        console.error("[ThemeDeck] unable to store game track master volume", error);
    }
    window.dispatchEvent(new CustomEvent(GAME_TRACK_MASTER_VOLUME_EVENT, {
        detail: normalized,
    }));
};
const getGameTrackMasterVolumeRuntime = () => gameTrackMasterVolumeRuntime;
const readGlobalAmbientEnabledSetting = () => readPreference(GLOBAL_AMBIENT_ENABLED_STORAGE_KEY, false);
const persistGlobalAmbientEnabledSetting = (value) => persistPreference(GLOBAL_AMBIENT_ENABLED_STORAGE_KEY, GLOBAL_AMBIENT_ENABLED_EVENT, value);
const readStoreTrackEnabledSetting = () => readPreference(STORE_TRACK_ENABLED_STORAGE_KEY, true);
const persistStoreTrackEnabledSetting = (value) => persistPreference(STORE_TRACK_ENABLED_STORAGE_KEY, STORE_TRACK_ENABLED_EVENT, value);
const readAmbientDisableStoreSetting = () => readPreference(AMBIENT_DISABLE_STORE_STORAGE_KEY, true);
const persistAmbientDisableStoreSetting = (value) => persistPreference(AMBIENT_DISABLE_STORE_STORAGE_KEY, AMBIENT_DISABLE_STORE_EVENT, value);
const parseAmbientInterruptionMode = (value) => {
    if (value === "mute" || value === "pause" || value === "stop") {
        return value;
    }
    return "stop";
};
const parseLaunchStopMode = (value) => {
    if (value === "game_started" || value === "launch_start") {
        return value;
    }
    return "launch_start";
};
const readLaunchStopModeSetting = () => {
    try {
        const raw = window.localStorage?.getItem(LAUNCH_STOP_MODE_STORAGE_KEY);
        const parsed = parseLaunchStopMode(raw);
        launchStopModeRuntime = parsed;
        return parsed;
    }
    catch (error) {
        console.error("[ThemeDeck] unable to read launch stop mode", error);
        return launchStopModeRuntime;
    }
};
const persistLaunchStopModeSetting = (value) => {
    const normalized = parseLaunchStopMode(value);
    launchStopModeRuntime = normalized;
    try {
        window.localStorage?.setItem(LAUNCH_STOP_MODE_STORAGE_KEY, normalized);
    }
    catch (error) {
        console.error("[ThemeDeck] unable to store launch stop mode", error);
    }
    window.dispatchEvent(new CustomEvent(LAUNCH_STOP_MODE_EVENT, {
        detail: normalized,
    }));
};
const getLaunchStopModeRuntime = () => launchStopModeRuntime;
const readAmbientInterruptionModeSetting = () => {
    try {
        const raw = window.localStorage?.getItem(AMBIENT_INTERRUPTION_MODE_STORAGE_KEY);
        const parsed = parseAmbientInterruptionMode(raw);
        ambientInterruptionModeRuntime = parsed;
        return parsed;
    }
    catch (error) {
        console.error("[ThemeDeck] unable to read ambient interruption mode", error);
        return ambientInterruptionModeRuntime;
    }
};
const persistAmbientInterruptionModeSetting = (value) => {
    const normalized = parseAmbientInterruptionMode(value);
    ambientInterruptionModeRuntime = normalized;
    try {
        window.localStorage?.setItem(AMBIENT_INTERRUPTION_MODE_STORAGE_KEY, normalized);
    }
    catch (error) {
        console.error("[ThemeDeck] unable to store ambient interruption mode", error);
    }
    window.dispatchEvent(new CustomEvent(AMBIENT_INTERRUPTION_MODE_EVENT, {
        detail: normalized,
    }));
};
const getAmbientInterruptionModeRuntime = () => ambientInterruptionModeRuntime;
const subscribePlayback = (listener) => {
    playbackListeners.add(listener);
    return () => {
        playbackListeners.delete(listener);
    };
};
const notifyPlayback = (next) => {
    playbackState = next;
    playbackListeners.forEach((listener) => {
        try {
            listener(next);
        }
        catch (error) {
            console.error("[ThemeDeck] playback listener failed", error);
        }
    });
};
const ensureAudio = () => {
    const sharedFromWindow = window.__themedeckSharedAudio;
    if (sharedFromWindow && sharedAudio !== sharedFromWindow) {
        sharedAudio = sharedFromWindow;
    }
    if (!sharedAudio) {
        sharedAudio = new Audio();
        sharedAudio.loop = true;
        sharedAudio.preload = "auto";
        window.__themedeckSharedAudio = sharedAudio;
    }
    return sharedAudio;
};
const getPinnedAudioCachePaths = () => {
    const pinned = new Set();
    if (latestGlobalTrackForAutoPlay?.path) {
        pinned.add(latestGlobalTrackForAutoPlay.path);
    }
    return pinned;
};
const isPinnedAudioCachePath = (path) => getPinnedAudioCachePaths().has(path);
const pruneAudioCache = () => {
    const pinned = getPinnedAudioCachePaths();
    for (const [path, entry] of audioCache.entries()) {
        entry.pinned = pinned.has(path);
    }
    const removable = Array.from(audioCache.entries())
        .filter(([, entry]) => !entry.pinned)
        .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt);
    while (removable.length > AUDIO_CACHE_DYNAMIC_LIMIT) {
        const [path, entry] = removable.shift();
        if (entry.revocable) {
            URL.revokeObjectURL(entry.url);
        }
        audioCache.delete(path);
    }
};
const revokeCacheEntry = (path) => {
    const cached = audioCache.get(path);
    if (cached) {
        if (cached.revocable) {
            URL.revokeObjectURL(cached.url);
        }
        audioCache.delete(path);
    }
};
const clearAudioCache = (path, options) => {
    if (path) {
        revokeCacheEntry(path);
        return;
    }
    if (options?.preservePinned) {
        const pinned = getPinnedAudioCachePaths();
        for (const [cachedPath, entry] of Array.from(audioCache.entries())) {
            if (pinned.has(cachedPath)) {
                entry.pinned = true;
                continue;
            }
            if (entry.revocable) {
                URL.revokeObjectURL(entry.url);
            }
            audioCache.delete(cachedPath);
        }
        return;
    }
    for (const entry of audioCache.values()) {
        if (entry.revocable) {
            URL.revokeObjectURL(entry.url);
        }
    }
    audioCache.clear();
};
const decodePayloadToObjectUrl = (payload) => {
    let base64 = payload.data ?? "";
    let mime = payload.mime;
    if (base64.startsWith("data:")) {
        const match = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            mime = mime ?? match[1];
            base64 = match[2];
        }
    }
    const binary = window.atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        buffer[index] = binary.charCodeAt(index);
    }
    const blob = new Blob([buffer.buffer], {
        type: mime || "audio/mpeg",
    });
    return URL.createObjectURL(blob);
};
const verifyStreamAudioUrl = async (url) => {
    try {
        const response = await fetch(url, {
            method: "HEAD",
            cache: "no-store",
        });
        return response.ok;
    }
    catch (error) {
        console.warn("[ThemeDeck] audio stream URL verification failed", error);
        return false;
    }
};
const resolveAudioUrl = async (track) => {
    const cached = audioCache.get(track.path);
    if (cached) {
        cached.lastUsedAt = Date.now();
        cached.pinned = isPinnedAudioCachePath(track.path);
        return cached.url;
    }
    try {
        const streamPayload = await getTrackAudioUrl(track.path);
        if (streamPayload?.url && (await verifyStreamAudioUrl(streamPayload.url))) {
            audioCache.set(track.path, {
                url: streamPayload.url,
                mtime: streamPayload.mtime ?? 0,
                lastUsedAt: Date.now(),
                pinned: isPinnedAudioCachePath(track.path),
                revocable: false,
            });
            pruneAudioCache();
            return streamPayload.url;
        }
    }
    catch (error) {
        console.warn("[ThemeDeck] falling back to base64 audio payload", error);
    }
    const payload = await loadTrackAudio(track.path);
    if (!payload?.data) {
        throw new Error("No audio data returned");
    }
    const url = decodePayloadToObjectUrl(payload);
    audioCache.set(track.path, {
        url,
        mtime: payload.mtime ?? 0,
        lastUsedAt: Date.now(),
        pinned: isPinnedAudioCachePath(track.path),
        revocable: true,
    });
    pruneAudioCache();
    return url;
};
const clearGlobalAmbientResumeSnapshot = () => {
    globalAmbientResumeSnapshot = null;
};
const captureGlobalAmbientResumeSnapshot = () => {
    const mode = getAmbientInterruptionModeRuntime();
    if (mode === "stop") {
        clearGlobalAmbientResumeSnapshot();
        return;
    }
    if (playbackState.appId !== GLOBAL_AMBIENT_APP_ID ||
        playbackState.status !== "playing") {
        return;
    }
    const audio = sharedAudio;
    const globalTrack = latestGlobalTrackForAutoPlay;
    if (!audio || !globalTrack) {
        return;
    }
    let seconds = 0;
    try {
        if (Number.isFinite(audio.currentTime)) {
            seconds = Math.max(0, audio.currentTime);
        }
    }
    catch (_ignored) {
        // no-op
    }
    const durationSeconds = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
    globalAmbientResumeSnapshot = {
        path: globalTrack.path,
        seconds,
        capturedAtMs: Date.now(),
        durationSeconds,
        mode,
    };
};
const getGlobalAmbientResumeTime = (track) => {
    const snapshot = globalAmbientResumeSnapshot;
    if (!snapshot) {
        return undefined;
    }
    if (snapshot.path !== track.path) {
        clearGlobalAmbientResumeSnapshot();
        return undefined;
    }
    let nextSeconds = snapshot.seconds;
    const duration = snapshot.durationSeconds;
    if (duration && Number.isFinite(duration) && duration > 0) {
        nextSeconds %= duration;
    }
    return Math.max(0, nextSeconds);
};
const seekAudioToOffset = async (audio, targetSeconds) => {
    const resolveTargetTime = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
            return targetSeconds % audio.duration;
        }
        return targetSeconds;
    };
    const tryApply = () => {
        try {
            audio.currentTime = resolveTargetTime();
            return true;
        }
        catch (_ignored) {
            return false;
        }
    };
    if (tryApply()) {
        return true;
    }
    return await new Promise((resolve) => {
        let settled = false;
        let timeoutId = 0;
        const finish = (success) => {
            if (settled) {
                return;
            }
            settled = true;
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            audio.removeEventListener("loadedmetadata", onReady);
            audio.removeEventListener("canplay", onReady);
            audio.removeEventListener("durationchange", onReady);
            audio.removeEventListener("error", onError);
            resolve(success);
        };
        const onReady = () => {
            finish(tryApply());
        };
        const onError = () => {
            finish(false);
        };
        timeoutId = window.setTimeout(() => {
            finish(tryApply());
        }, 1500);
        audio.addEventListener("loadedmetadata", onReady);
        audio.addEventListener("canplay", onReady);
        audio.addEventListener("durationchange", onReady);
        audio.addEventListener("error", onError);
    });
};
const stopPlayback = (_fade) => {
    const token = ++stopPlaybackToken;
    const audio = sharedAudio;
    if (!audio) {
        notifyPlayback({
            appId: null,
            reason: "auto",
            status: "stopped",
        });
        return;
    }
    const finish = () => {
        if (token !== stopPlaybackToken) {
            return;
        }
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        notifyPlayback({
            appId: null,
            reason: "auto",
            status: "stopped",
        });
    };
    finish();
};
const getPlaySignature = (track, reason) => `${reason}|${track.appId}|${track.path}`;
const isIgnorablePlaybackError = (error) => {
    if (error instanceof DOMException) {
        if (error.name === "AbortError" || error.name === "NotAllowedError") {
            return true;
        }
    }
    const message = String(error?.message ?? error ?? "").toLowerCase();
    return (message.includes("interrupted") ||
        message.includes("abort") ||
        message.includes("notallowederror"));
};
const playTrack = async (track, reason) => {
    stopPlaybackToken += 1;
    const inDesktopMode = await refreshDesktopModeState();
    if (inDesktopMode) {
        return;
    }
    if (runningGameAppId !== null) {
        return;
    }
    if (externalMediaActive) {
        return;
    }
    const signature = getPlaySignature(track, reason);
    if (playInFlightSignature === signature) {
        return;
    }
    const invocationId = ++playInvocationCounter;
    playInFlightSignature = signature;
    const audio = ensureAudio();
    try {
        const nextUrl = await resolveAudioUrl(track);
        if (invocationId !== playInvocationCounter) {
            return;
        }
        if (runningGameAppId !== null) {
            return;
        }
        if (externalMediaActive) {
            return;
        }
        const sameTrack = playbackState.appId === track.appId &&
            audio.src === nextUrl &&
            playbackState.status === "playing";
        if (!sameTrack) {
            audio.src = nextUrl;
        }
        audio.loop = track.loop !== false;
        const targetVolume = getEffectiveTrackVolume(track.appId, track.volume ?? 1);
        audio.volume = targetVolume;
        const configuredOffset = clamp(track.startOffset ?? 0, 0, 30);
        const offset = typeof track.resumeTime === "number" && Number.isFinite(track.resumeTime)
            ? Math.max(0, track.resumeTime)
            : configuredOffset;
        let seekApplied = true;
        if (offset > 0) {
            seekApplied = await seekAudioToOffset(audio, offset);
        }
        else if (!sameTrack) {
            try {
                audio.currentTime = 0;
            }
            catch (_ignored) {
                // no-op
            }
        }
        if (runningGameAppId !== null) {
            return;
        }
        if (externalMediaActive) {
            return;
        }
        await audio.play();
        if (offset > 0 && !seekApplied) {
            await seekAudioToOffset(audio, offset);
        }
        if (invocationId !== playInvocationCounter) {
            return;
        }
        if (reason === "auto" &&
            track.appId === GLOBAL_AMBIENT_APP_ID &&
            typeof track.resumeTime === "number") {
            clearGlobalAmbientResumeSnapshot();
        }
        notifyPlayback({ appId: track.appId, reason, status: "playing" });
    }
    catch (error) {
        if (invocationId !== playInvocationCounter) {
            return;
        }
        if (isIgnorablePlaybackError(error)) {
            console.warn("[ThemeDeck] playback interrupted", error);
            return;
        }
        console.error("[ThemeDeck] failed to play", error);
        const message = error instanceof Error && error.message
            ? error.message
            : "Unknown playback error";
        toaster.toast({
            title: "ThemeDeck",
            body: `Can't play ${track.filename}: ${message}`,
        });
        stopPlayback();
    }
    finally {
        if (invocationId === playInvocationCounter &&
            playInFlightSignature === signature) {
            playInFlightSignature = null;
        }
    }
};
const getEffectiveTrackVolume = (appId, volume) => {
    const trackVolume = clamp(volume);
    if (appId > 0) {
        return clamp(trackVolume * getGameTrackMasterVolumeRuntime());
    }
    return trackVolume;
};
const applyVolumeToActiveTrack = (appId, volume) => {
    if (!sharedAudio) {
        return;
    }
    if (playbackState.appId !== appId ||
        playbackState.status !== "playing") {
        return;
    }
    sharedAudio.volume = getEffectiveTrackVolume(appId, volume);
};
const applyGameTrackMasterVolumeToActiveTrack = () => {
    if (!sharedAudio) {
        return;
    }
    const appId = playbackState.appId;
    if (appId === null ||
        appId <= 0 ||
        playbackState.status !== "playing") {
        return;
    }
    const activeTrack = latestTracksForAutoPlay[appId];
    if (!activeTrack) {
        return;
    }
    sharedAudio.volume = getEffectiveTrackVolume(appId, activeTrack.volume);
};
const applyStartOffsetToActiveTrack = (appId, startOffset) => {
    if (!sharedAudio) {
        return;
    }
    if (playbackState.appId !== appId || playbackState.status !== "playing") {
        return;
    }
    try {
        sharedAudio.currentTime = clamp(startOffset, 0, 30);
    }
    catch (_ignored) {
        // no-op
    }
};
const applyLoopToActiveTrack = (appId, loop) => {
    if (!sharedAudio) {
        return;
    }
    if (playbackState.appId !== appId || playbackState.status !== "playing") {
        return;
    }
    sharedAudio.loop = loop;
};
const notifyFocus = (appId) => {
    focusedAppId = appId;
    focusListeners.forEach((listener) => listener(appId));
    scheduleAutoPlaybackFromContext();
};
const setContextMenuActiveAppId = (appId) => {
    const normalized = appId && appId > 0 ? appId : null;
    if (contextMenuActiveAppId === normalized) {
        return;
    }
    contextMenuActiveAppId = normalized;
    scheduleAutoPlaybackFromContext();
};
const dispatchEscapeKey = (target) => {
    if (!target)
        return;
    for (const eventType of ["keydown", "keyup"]) {
        const event = new KeyboardEvent(eventType, {
            key: "Escape",
            code: "Escape",
            bubbles: true,
            cancelable: true,
        });
        try {
            Object.defineProperty(event, "keyCode", { get: () => 27 });
            Object.defineProperty(event, "which", { get: () => 27 });
        }
        catch {
            // Best-effort compatibility with Steam's context-menu listeners.
        }
        target.dispatchEvent(event);
    }
};
const dismissActiveContextMenu = () => {
    setContextMenuActiveAppId(null);
    try {
        activeContextMenuCloser?.();
    }
    catch (error) {
        console.error("[ThemeDeck] context menu close failed", error);
    }
    try {
        DFL.Navigation.CloseSideMenus?.();
    }
    catch (error) {
        console.error("[ThemeDeck] side menu close failed", error);
    }
    if (isGamepadContextMenuVisible()) {
        dispatchEscapeKey(document.activeElement);
        dispatchEscapeKey(document);
        dispatchEscapeKey(window);
    }
};
const getLibraryPath = () => {
    try {
        const focusedWindow = window.SteamUIStore?.GetFocusedWindowInstance?.() ??
            DFL.Router.WindowStore?.GamepadUIMainWindowInstance;
        const browserWindow = focusedWindow?.BrowserWindow ??
            DFL.Router.WindowStore?.GamepadUIMainWindowInstance?.BrowserWindow;
        return browserWindow?.location?.pathname ?? "";
    }
    catch (error) {
        console.error("[ThemeDeck] unable to read library window", error);
        return "";
    }
};
const readAppIdFromLocation = () => {
    const pathname = getLibraryPath();
    for (const pattern of DETAIL_PATTERNS) {
        const match = pathname.match(pattern);
        if (match?.[1]) {
            const parsed = Number.parseInt(match[1], 10);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }
    return null;
};
const markDetailRouteSeen = (appId) => {
    if (!appId || appId <= 0) {
        return;
    }
    activeDetailRouteAppId = appId;
    lastDetailRouteAppId = appId;
    lastDetailRouteSeenAtMs = Date.now();
};
const getEffectiveDetailRouteAppId = () => {
    const routeAppId = readAppIdFromLocation();
    if (routeAppId) {
        markDetailRouteSeen(routeAppId);
        return routeAppId;
    }
    if (activeDetailBridgeCount > 0 && activeDetailRouteAppId) {
        markDetailRouteSeen(activeDetailRouteAppId);
        return activeDetailRouteAppId;
    }
    if (lastDetailRouteAppId &&
        Date.now() - lastDetailRouteSeenAtMs < DETAIL_ROUTE_GRACE_MS) {
        return lastDetailRouteAppId;
    }
    return null;
};
const isInRecentDetailTransition = (appId) => {
    if (!lastDetailRouteAppId) {
        return false;
    }
    if (appId && appId > 0 && appId !== lastDetailRouteAppId) {
        return false;
    }
    return Date.now() - lastDetailRouteSeenAtMs < DETAIL_ROUTE_GRACE_MS;
};
const startLocationWatcher = () => {
    if (locationInterval) {
        return;
    }
    const update = () => {
        const pathname = getLibraryPath();
        if (!pathname) {
            // Steam can briefly report an empty path during focus transitions; do not
            // clear focus state on that transient signal.
            return;
        }
        const appId = readAppIdFromLocation();
        // Only promote a resolved app id. Do not push null from this poller, because
        // transient route states can otherwise interrupt active game playback.
        if (appId && appId !== focusedAppId) {
            markDetailRouteSeen(appId);
            notifyFocus(appId);
        }
    };
    update();
    locationInterval = window.setInterval(update, 750);
};
const stopLocationWatcher = () => {
    if (locationInterval) {
        window.clearInterval(locationInterval);
        locationInterval = null;
    }
};
const extractAppId = (...candidates) => {
    for (const candidate of candidates) {
        if (typeof candidate === "number" && !Number.isNaN(candidate) && candidate > 0) {
            return candidate;
        }
        if (typeof candidate === "string") {
            const parsed = Number.parseInt(candidate, 10);
            if (!Number.isNaN(parsed))
                return parsed;
        }
        if (candidate && typeof candidate === "object") {
            const possible = candidate.appid ??
                candidate.app_id ??
                candidate.unAppID ??
                candidate.nAppID ??
                candidate.id;
            if (possible) {
                const parsed = Number.parseInt(possible, 10);
                if (!Number.isNaN(parsed))
                    return parsed;
            }
        }
    }
    return null;
};
const wrapUnsubscribe = (token) => {
    if (!token)
        return null;
    if (typeof token === "function") {
        return token;
    }
    if (typeof token.dispose === "function") {
        return () => token.dispose();
    }
    if (typeof token.unregister === "function") {
        return () => token.unregister();
    }
    if (typeof token.Unregister === "function") {
        return () => token.Unregister();
    }
    return null;
};
const parseUIMode = (value) => {
    if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "desktop") {
            return UI_MODE_DESKTOP;
        }
        if (normalized === "gamepad") {
            return UI_MODE_GAMEPAD;
        }
        const parsed = Number.parseInt(normalized, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
        return null;
    }
    if (value && typeof value === "object") {
        const candidate = value.m_eUIMode ??
            value.eUIMode ??
            value.uiMode ??
            value.mode;
        return parseUIMode(candidate);
    }
    return null;
};
const setDesktopModeState = (next) => {
    if (next === desktopModeActive) {
        return;
    }
    desktopModeActive = next;
    if (desktopModeActive && playbackState.status === "playing") {
        stopPlayback();
    }
    scheduleAutoPlaybackFromContext();
};
const readDesktopModeFromWindows = async () => {
    try {
        const ui = window?.SteamClient?.UI;
        const getDesired = ui?.GetDesiredSteamUIWindows;
        if (typeof getDesired !== "function") {
            return null;
        }
        const windows = await getDesired.call(ui);
        if (!Array.isArray(windows) || !windows.length) {
            return null;
        }
        const hasGamepadWindow = windows.some((entry) => {
            const type = Number(entry?.windowType);
            return type === 0 || type === 1;
        });
        const hasDesktopWindow = windows.some((entry) => {
            const type = Number(entry?.windowType);
            return type === 5 || type === 6 || type === 7;
        });
        if (hasGamepadWindow) {
            return false;
        }
        if (hasDesktopWindow) {
            return true;
        }
    }
    catch (error) {
        console.error("[ThemeDeck] ui window probe failed", error);
    }
    return null;
};
const refreshDesktopModeState = async (force = false) => {
    const now = Date.now();
    if (!force && now - desktopModeLastCheck < UI_MODE_CACHE_MS) {
        return desktopModeActive;
    }
    if (desktopModeRefreshInFlight) {
        return desktopModeRefreshInFlight;
    }
    desktopModeRefreshInFlight = (async () => {
        let resolved = null;
        try {
            const ui = window?.SteamClient?.UI;
            const getMode = ui?.GetUIMode;
            if (typeof getMode === "function") {
                const modeValue = await getMode.call(ui);
                const mode = parseUIMode(modeValue);
                if (mode !== null) {
                    resolved = mode === UI_MODE_DESKTOP;
                }
            }
        }
        catch (error) {
            console.error("[ThemeDeck] ui mode probe failed", error);
        }
        if (resolved === null) {
            resolved = await readDesktopModeFromWindows();
        }
        if (resolved !== null) {
            setDesktopModeState(resolved);
        }
        desktopModeLastCheck = Date.now();
        return desktopModeActive;
    })();
    try {
        return await desktopModeRefreshInFlight;
    }
    finally {
        desktopModeRefreshInFlight = null;
    }
};
const startDesktopModeWatcher = () => {
    void refreshDesktopModeState(true);
    if (uiModePollInterval) {
        return;
    }
    const ui = window?.SteamClient?.UI;
    const registerForUIModeChanged = ui?.RegisterForUIModeChanged;
    if (typeof registerForUIModeChanged === "function") {
        try {
            const token = registerForUIModeChanged.call(ui, (modeValue) => {
                const parsed = parseUIMode(modeValue);
                if (parsed !== null) {
                    setDesktopModeState(parsed === UI_MODE_DESKTOP);
                    return;
                }
                void refreshDesktopModeState(true);
            });
            stopUIModeSubscription = wrapUnsubscribe(token);
        }
        catch (error) {
            console.error("[ThemeDeck] ui mode subscription failed", error);
        }
    }
    uiModePollInterval = window.setInterval(() => {
        void refreshDesktopModeState();
    }, UI_MODE_POLL_MS);
};
const stopDesktopModeWatcher = () => {
    stopUIModeSubscription?.();
    stopUIModeSubscription = null;
    if (uiModePollInterval) {
        window.clearInterval(uiModePollInterval);
        uiModePollInterval = null;
    }
};
const startSteamAppWatchers = () => {
    const apps = window?.SteamClient?.Apps;
    if (!apps) {
        if (steamAppRetry)
            return;
        steamAppRetry = window.setInterval(() => {
            if (startSteamAppWatchers()) {
                window.clearInterval(steamAppRetry);
                steamAppRetry = null;
            }
        }, 2000);
        return false;
    }
    const handlers = [
        apps.RegisterForAppDetails?.bind(apps),
        apps.RegisterForAppOverviewChanges?.bind(apps),
    ].filter(Boolean);
    handlers.forEach((registerFn) => {
        try {
            const unsub = registerFn((...args) => {
                const candidate = extractAppId(...args);
                if (candidate) {
                    notifyFocus(candidate);
                }
            });
            const cleaner = wrapUnsubscribe(unsub);
            if (cleaner) {
                steamAppSubscriptions.push(cleaner);
            }
        }
        catch (error) {
            console.error("[ThemeDeck] steam app watcher failed", error);
        }
    });
    return handlers.length > 0;
};
const stopSteamAppWatchers = () => {
    steamAppSubscriptions.splice(0).forEach((clean) => {
        try {
            clean();
        }
        catch (error) {
            console.error("[ThemeDeck] steam app watcher cleanup failed", error);
        }
    });
    if (steamAppRetry) {
        window.clearInterval(steamAppRetry);
        steamAppRetry = null;
    }
};
const isEligibleRunningAppId = (appId) => Number.isFinite(appId) &&
    appId > 0 &&
    !LIBRARY_EXCLUDED_APP_IDS.has(appId);
const getStateText = (candidate) => String(candidate?.state ??
    candidate?.app_state ??
    candidate?.strAppState ??
    candidate?.status ??
    candidate?.m_eAppState ??
    candidate?.eAppState ??
    "")
    .trim()
    .toLowerCase();
const hasStartedMarker = (candidate) => {
    if (!candidate || typeof candidate !== "object") {
        return false;
    }
    const startedFlags = [
        candidate.playing,
        candidate.in_game,
        candidate.inGame,
        candidate.bInGame,
        candidate.BInGame,
        candidate.is_ingame,
        candidate.isInGame,
    ];
    if (startedFlags.some((value) => value === true ||
        value === 1 ||
        value === "1" ||
        String(value).toLowerCase() === "true")) {
        return true;
    }
    const stateText = getStateText(candidate);
    if (!stateText) {
        return false;
    }
    if (stateText.includes("in-game") ||
        stateText.includes("in_game") ||
        stateText.includes("ingame") ||
        stateText.includes("playing") ||
        stateText.includes("active") ||
        stateText === "running") {
        return true;
    }
    return false;
};
const hasLaunchingMarker = (candidate) => {
    if (!candidate || typeof candidate !== "object") {
        return false;
    }
    const launchFlags = [
        candidate.running,
        candidate.is_running,
        candidate.isRunning,
        candidate.bIsRunning,
        candidate.BIsRunning,
    ];
    if (launchFlags.some((value) => value === true ||
        value === 1 ||
        value === "1" ||
        String(value).toLowerCase() === "true")) {
        return true;
    }
    const stateText = getStateText(candidate);
    if (!stateText) {
        return false;
    }
    return (stateText.includes("launch") ||
        stateText.includes("starting") ||
        stateText.includes("prelaunch") ||
        stateText.includes("pre-launch") ||
        stateText.includes("queued") ||
        stateText.includes("initializing"));
};
const collectRunningAppStates = (candidate, target, assumeRunning, visited = new Set()) => {
    if (candidate == null) {
        return;
    }
    if (typeof candidate === "number" || typeof candidate === "bigint") {
        const appId = Number(candidate);
        if (assumeRunning && isEligibleRunningAppId(appId)) {
            target.launching.add(appId);
        }
        return;
    }
    if (typeof candidate === "string") {
        const parsed = Number.parseInt(candidate, 10);
        if (assumeRunning && !Number.isNaN(parsed) && isEligibleRunningAppId(parsed)) {
            target.launching.add(parsed);
        }
        return;
    }
    if (typeof candidate !== "object") {
        return;
    }
    if (visited.has(candidate)) {
        return;
    }
    visited.add(candidate);
    if (Array.isArray(candidate)) {
        candidate.forEach((entry) => collectRunningAppStates(entry, target, assumeRunning, visited));
        return;
    }
    if (candidate instanceof Set) {
        candidate.forEach((entry) => collectRunningAppStates(entry, target, assumeRunning, visited));
        return;
    }
    if (candidate instanceof Map) {
        candidate.forEach((value, key) => {
            collectRunningAppStates(value, target, assumeRunning, visited);
            if (assumeRunning) {
                collectRunningAppStates(key, target, true, visited);
            }
        });
        return;
    }
    const appId = extractAppId(candidate);
    const started = hasStartedMarker(candidate);
    const launching = hasLaunchingMarker(candidate);
    if (appId && (assumeRunning || started || launching)) {
        if (isEligibleRunningAppId(appId)) {
            if (started) {
                target.started.add(appId);
            }
            else {
                target.launching.add(appId);
            }
        }
    }
    [
        "runningApps",
        "running_apps",
        "apps",
        "sessions",
        "games",
        "rgRunningApps",
        "rgApps",
        "rgGames",
        "map_running",
    ].forEach((key) => {
        if (key in candidate) {
            collectRunningAppStates(candidate[key], target, assumeRunning, visited);
        }
    });
};
const readRunningGameAppId = async () => {
    const snapshot = {
        started: new Set(),
        launching: new Set(),
    };
    const steamApps = window?.SteamClient?.Apps;
    const appStore = window?.appStore;
    const methodSources = [
        { owner: steamApps, method: "GetRunningApps", assumeRunning: true },
        { owner: steamApps, method: "GetRunningAppList", assumeRunning: true },
        { owner: steamApps, method: "GetAppsRunning", assumeRunning: true },
        { owner: steamApps, method: "GetCurrentlyRunningApp", assumeRunning: true },
        { owner: appStore, method: "GetRunningApps", assumeRunning: true },
        { owner: appStore, method: "GetCurrentlyRunningApp", assumeRunning: true },
    ];
    for (const source of methodSources) {
        const fn = source.owner?.[source.method];
        if (typeof fn !== "function") {
            continue;
        }
        try {
            const result = await Promise.resolve(fn.call(source.owner));
            collectRunningAppStates(result, snapshot, source.assumeRunning);
        }
        catch (_ignored) {
            // no-op
        }
    }
    [
        steamApps?.m_mapRunningApps,
        steamApps?.m_runningApps,
        steamApps?.runningApps,
        appStore?.m_mapRunningApps,
        appStore?.m_runningApps,
        appStore?.runningApps,
        DFL.Router?.WindowStore?.m_mapRunningApps,
        DFL.Router?.WindowStore?.m_runningApps,
        DFL.Router?.WindowStore?.runningApps,
        DFL.Router?.MainRunningApp,
        DFL.Router?.RunningApp,
    ].forEach((value) => collectRunningAppStates(value, snapshot, true));
    const mode = getLaunchStopModeRuntime();
    if (mode === "game_started") {
        const startedOnlyMethods = [
            { owner: steamApps, method: "GetCurrentGameID" },
            { owner: steamApps, method: "GetRunningGameID" },
            { owner: appStore, method: "GetCurrentGameID" },
            { owner: appStore, method: "GetRunningGameID" },
        ];
        for (const source of startedOnlyMethods) {
            const fn = source.owner?.[source.method];
            if (typeof fn !== "function") {
                continue;
            }
            try {
                const directAppId = extractAppId(await Promise.resolve(fn.call(source.owner)));
                if (directAppId && isEligibleRunningAppId(directAppId)) {
                    snapshot.started.add(directAppId);
                }
            }
            catch (_ignored) {
                // no-op
            }
        }
    }
    const now = Date.now();
    for (const appId of Array.from(launchingAppFirstSeenAtMs.keys())) {
        if (!snapshot.launching.has(appId)) {
            launchingAppFirstSeenAtMs.delete(appId);
        }
    }
    for (const appId of snapshot.launching.values()) {
        if (!launchingAppFirstSeenAtMs.has(appId)) {
            launchingAppFirstSeenAtMs.set(appId, now);
        }
    }
    const ids = new Set(snapshot.started);
    if (mode !== "game_started") {
        for (const appId of snapshot.launching.values()) {
            ids.add(appId);
        }
    }
    else {
        for (const appId of snapshot.launching.values()) {
            const firstSeen = launchingAppFirstSeenAtMs.get(appId) ?? now;
            if (now - firstSeen >= LAUNCH_FINISH_FALLBACK_MS) {
                ids.add(appId);
            }
        }
    }
    const launchOrRunIds = new Set([
        ...snapshot.started.values(),
        ...snapshot.launching.values(),
    ]);
    const routeAppId = readAppIdFromLocation();
    if (routeAppId && launchOrRunIds.has(routeAppId)) {
        launchActivityAppId = routeAppId;
    }
    else if (focusedAppId && launchOrRunIds.has(focusedAppId)) {
        launchActivityAppId = focusedAppId;
    }
    else {
        launchActivityAppId = Array.from(launchOrRunIds.values()).sort((a, b) => a - b)[0] ?? null;
    }
    const routeCheckAppId = routeAppId;
    if (routeCheckAppId && ids.has(routeCheckAppId)) {
        return routeCheckAppId;
    }
    if (focusedAppId && ids.has(focusedAppId)) {
        return focusedAppId;
    }
    const ordered = Array.from(ids.values()).sort((a, b) => a - b);
    return ordered[0] ?? null;
};
const setRunningGameAppId = (next) => {
    const normalized = next && isEligibleRunningAppId(next) ? next : null;
    if (runningGameAppId === normalized) {
        return;
    }
    runningGameAppId = normalized;
    if (runningGameAppId !== null && playbackState.status === "playing") {
        if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
            captureGlobalAmbientResumeSnapshot();
        }
        stopPlayback();
    }
    scheduleAutoPlaybackFromContext();
};
const refreshRunningGameState = async () => {
    if (runningAppRefreshInFlight) {
        return;
    }
    runningAppRefreshInFlight = true;
    try {
        const next = await readRunningGameAppId();
        setRunningGameAppId(next);
    }
    catch (error) {
        console.error("[ThemeDeck] running game probe failed", error);
    }
    finally {
        runningAppRefreshInFlight = false;
    }
};
const startRunningGameWatcher = () => {
    if (runningAppPollInterval) {
        return;
    }
    const apps = window?.SteamClient?.Apps;
    if (!apps) {
        if (!runningAppRetry) {
            runningAppRetry = window.setInterval(() => {
                const retryApps = window?.SteamClient?.Apps;
                if (!retryApps) {
                    return;
                }
                window.clearInterval(runningAppRetry);
                runningAppRetry = null;
                startRunningGameWatcher();
            }, 2000);
        }
        return;
    }
    const registerMethods = [
        "RegisterForRunningAppsChanged",
        "RegisterForRunningAppChanges",
        "RegisterForAppRunningStateChanged",
        "RegisterForAppRunningStateChange",
        "RegisterForGameActionStart",
        "RegisterForGameActionEnd",
        "RegisterForGameLaunched",
        "RegisterForGameExited",
        "RegisterForAppDetails",
        "RegisterForAppOverviewChanges",
    ];
    registerMethods.forEach((method) => {
        const register = apps?.[method];
        if (typeof register !== "function") {
            return;
        }
        try {
            const token = register.call(apps, () => {
                void refreshRunningGameState();
            });
            const clean = wrapUnsubscribe(token);
            if (clean) {
                runningAppSubscriptions.push(clean);
            }
        }
        catch (error) {
            console.error("[ThemeDeck] running watcher failed", { method, error });
        }
    });
    runningAppPollInterval = window.setInterval(() => {
        void refreshRunningGameState();
    }, RUNNING_APP_POLL_MS);
    void refreshRunningGameState();
};
const stopRunningGameWatcher = () => {
    runningAppSubscriptions.splice(0).forEach((clean) => {
        try {
            clean();
        }
        catch (error) {
            console.error("[ThemeDeck] running watcher cleanup failed", error);
        }
    });
    if (runningAppPollInterval) {
        window.clearInterval(runningAppPollInterval);
        runningAppPollInterval = null;
    }
    if (runningAppRetry) {
        window.clearInterval(runningAppRetry);
        runningAppRetry = null;
    }
    runningAppRefreshInFlight = false;
    runningGameAppId = null;
    launchActivityAppId = null;
    launchingAppFirstSeenAtMs.clear();
};
const resolveLibraryContextMenu = () => {
    try {
        const module = DFL.findModuleByExport((exported) => exported?.toString && exported.toString().includes("().LibraryContextMenu"));
        const candidate = Object.values(module ?? {}).find((sibling) => sibling?.toString?.().includes("navigator:"));
        const component = DFL.fakeRenderComponent(candidate);
        return component?.type ?? candidate ?? null;
    }
    catch (error) {
        console.error("[ThemeDeck] unable to resolve context menu", error);
        return null;
    }
};
const extractAppIdFromTree = (node) => {
    if (!node) {
        return null;
    }
    const candidate = extractAppId(node?.appid, node?.overview?.appid, node?._owner?.pendingProps?.overview?.appid, node?.props?.overview?.appid);
    if (candidate) {
        return candidate;
    }
    const children = node?.children ?? node?.props?.children;
    if (!children)
        return null;
    if (Array.isArray(children)) {
        for (const child of children) {
            const result = extractAppIdFromTree(child);
            if (result)
                return result;
        }
    }
    else {
        return extractAppIdFromTree(children);
    }
    return null;
};
const coerceMenuChildren = (children) => {
    if (!children)
        return null;
    if (Array.isArray(children))
        return children;
    if (Array.isArray(children?.props?.children))
        return children.props.children;
    if (Array.isArray(children?.children))
        return children.children;
    return null;
};
const pruneThemeDeckMenu = (children) => {
    const list = coerceMenuChildren(children);
    if (!Array.isArray(list))
        return;
    const existing = list.findIndex((entry) => entry?.key === "themedeck-change-music");
    if (existing !== -1) {
        list.splice(existing, 1);
    }
};
const insertThemeDeckMenu = (children, appId) => {
    if (!appId)
        return;
    const list = coerceMenuChildren(children);
    if (!Array.isArray(list))
        return;
    pruneThemeDeckMenu(list);
    const propertiesIdx = list.findIndex((item) => DFL.findInReactTree(item, (node) => {
        const handler = node?.onSelected ?? node?.props?.onSelected;
        return (typeof handler === "function" &&
            handler.toString().includes("AppProperties"));
    }));
    const openThemeDeck = () => {
        const latestAppId = extractAppId(appId) ??
            readAppIdFromLocation() ??
            extractAppId(focusedAppId);
        if (!latestAppId) {
            toaster.toast({
                title: "ThemeDeck",
                body: "Couldn't determine current game app id",
            });
            return;
        }
        dismissActiveContextMenu();
        DFL.Navigation.Navigate(`/themedeck/${latestAppId}`);
        window.setTimeout(dismissActiveContextMenu, 0);
    };
    const menuItem = (window.SP_REACT.createElement(DFL.MenuItem, { key: "themedeck-change-music", bInteractableItem: true, onClick: openThemeDeck, onSelected: openThemeDeck }, "Choose ThemeDeck music..."));
    if (propertiesIdx >= 0) {
        list.splice(propertiesIdx, 0, menuItem);
    }
    else {
        list.push(menuItem);
    }
};
const isGameContextMenu = (items) => {
    if (!items?.length)
        return false;
    return !!DFL.findInReactTree(items, (node) => {
        const source = [
            node?.props?.onSelected,
            node?.props?.onClick,
            node?.onSelected,
            node?.onClick,
        ]
            .filter((handler) => typeof handler === "function")
            .map((handler) => handler.toString())
            .join("\n");
        return (source.includes("launchSource") ||
            source.includes("PlayGame") ||
            source.includes("Launch") ||
            source.includes("AppProperties") ||
            source.includes("ShowAppProperties"));
    });
};
const isLibraryAppContextMenu = (items) => {
    if (!items?.length)
        return false;
    return !!DFL.findInReactTree(items, (node) => {
        const source = [
            node?.props?.onSelected,
            node?.props?.onClick,
            node?.onSelected,
            node?.onClick,
        ]
            .filter((handler) => typeof handler === "function")
            .map((handler) => handler.toString())
            .join("\n");
        if (!source)
            return false;
        return (source.includes("launchSource") ||
            source.includes("AppProperties") ||
            source.includes("ShowAppProperties") ||
            source.includes("InstallApp") ||
            source.includes("Download"));
    });
};
const deriveAppIdFromMenuItems = (items, fallback) => {
    if (!items || !items.length) {
        return fallback ?? null;
    }
    const parent = items.find((entry) => entry?._owner?.pendingProps?.overview?.appid);
    const fromOwner = extractAppId(parent?._owner?.pendingProps?.overview?.appid);
    if (fromOwner) {
        return fromOwner;
    }
    const fromOverview = DFL.findInTree(items, (node) => node?.overview?.appid ?? node?.props?.overview?.appid, { walkable: ["props", "children", "_owner", "pendingProps"] });
    const overviewAppId = extractAppId(fromOverview?.overview?.appid, fromOverview?.props?.overview?.appid);
    if (overviewAppId) {
        return overviewAppId;
    }
    const foundAppNode = DFL.findInTree(items, (node) => node?.app?.appid ??
        node?.props?.app?.appid ??
        node?.appid ??
        node?.props?.appid ??
        node?.app_id ??
        node?.props?.app_id, { walkable: ["props", "children", "_owner", "pendingProps"] });
    const fromAppNode = extractAppId(foundAppNode?.app?.appid, foundAppNode?.props?.app?.appid, foundAppNode?.appid, foundAppNode?.props?.appid, foundAppNode?.app_id, foundAppNode?.props?.app_id);
    if (fromAppNode) {
        return fromAppNode;
    }
    return fallback ?? null;
};
const patchMenuItems = (menuItems, fallbackAppId) => {
    const entries = coerceMenuChildren(menuItems);
    if (!Array.isArray(entries) || !entries.length)
        return null;
    if (!isGameContextMenu(entries) && !isLibraryAppContextMenu(entries)) {
        return null;
    }
    const derivedAppId = deriveAppIdFromMenuItems(entries, fallbackAppId);
    if (!derivedAppId)
        return null;
    insertThemeDeckMenu(entries, derivedAppId);
    return derivedAppId;
};
const patchContextMenuFocus = () => {
    const MenuComponent = resolveLibraryContextMenu();
    if (!MenuComponent?.prototype) {
        return null;
    }
    const state = { appId: null };
    const patches = {};
    if (typeof MenuComponent.prototype.componentWillUnmount === "function") {
        patches.unmount = DFL.afterPatch(MenuComponent.prototype, "componentWillUnmount", () => {
            setContextMenuActiveAppId(null);
            activeContextMenuCloser = null;
        });
    }
    patches.outer = DFL.afterPatch(MenuComponent.prototype, "render", function (_args, component) {
        const instance = this;
        const closeMenu = typeof instance?.HideMenu === "function"
            ? () => instance.HideMenu()
            : typeof instance?.HideIfSubmenu === "function"
                ? () => instance.HideIfSubmenu()
                : typeof instance?.props?.onCancel === "function"
                    ? () => instance.props.onCancel()
                    : null;
        if (closeMenu) {
            activeContextMenuCloser = closeMenu;
        }
        let appId = extractAppId(component?._owner?.pendingProps?.overview?.appid) ?? null;
        if (!appId) {
            const fallback = DFL.findInTree(component?.props?.children, (node) => node?.app?.appid, { walkable: ["props", "children"] });
            if (fallback?.app?.appid) {
                appId = extractAppId(fallback.app.appid);
            }
        }
        if (appId) {
            state.appId = appId;
            setContextMenuActiveAppId(appId);
            // Do not broadcast context-menu app focus into playback state.
            // Autoplay should react only to actual game detail routes.
        }
        if (!patches.inner) {
            patches.inner = DFL.afterPatch(component, "type", (_innerArgs, rendered) => {
                DFL.afterPatch(rendered.type.prototype, "render", (_renderArgs, node) => {
                    const menuItems = node?.props?.children?.[0] ?? node?.props?.children;
                    const fallbackAppId = extractAppIdFromTree(node) ?? state.appId;
                    const patched = patchMenuItems(menuItems, fallbackAppId);
                    if (patched) {
                        state.appId = patched;
                        setContextMenuActiveAppId(patched);
                    }
                    return node;
                });
                DFL.afterPatch(rendered.type.prototype, "shouldComponentUpdate", ([nextProps], shouldUpdate) => {
                    if (shouldUpdate === true) {
                        const fallbackAppId = extractAppIdFromTree(nextProps?.children) ?? state.appId;
                        const patched = patchMenuItems(nextProps?.children, fallbackAppId);
                        if (patched) {
                            state.appId = patched;
                            setContextMenuActiveAppId(patched);
                        }
                    }
                    return shouldUpdate;
                });
                return rendered;
            });
        }
        else if (appId) {
            const patched = patchMenuItems(component?.props?.children, appId);
            if (patched) {
                state.appId = patched;
                setContextMenuActiveAppId(patched);
            }
        }
        return component;
    });
    return () => {
        patches.outer?.unpatch();
        patches.inner?.unpatch();
        patches.unmount?.unpatch();
        setContextMenuActiveAppId(null);
        activeContextMenuCloser = null;
    };
};
const injectBridgeIntoRoute = (routePattern) => routerHook.addPatch(routePattern, (tree) => {
    const routeProps = DFL.findInReactTree(tree, (node) => node?.renderFunc);
    if (!routeProps) {
        return tree;
    }
    const handler = DFL.createReactTreePatcher([
        (input) => DFL.findInReactTree(input, (x) => x?.props?.children?.props?.overview)?.props?.children,
    ], (_, ret) => {
        const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
            typeof x?.props?.className === "string" &&
            x.props.className.includes(DFL.appDetailsClasses.InnerContainer));
        if (!container ||
            !Array.isArray(container.props.children) ||
            container.props.children.some((child) => child?.key === "themedeck-bridge")) {
            return ret;
        }
        container.props.children = [
            ...container.props.children,
            window.SP_REACT.createElement(GameFocusBridge, { key: "themedeck-bridge" }),
        ];
        return ret;
    });
    DFL.afterPatch(routeProps, "renderFunc", handler);
    return tree;
});
const GameFocusBridge = () => {
    const params = DFL.useParams();
    const parsed = params?.appid ? Number.parseInt(params.appid, 10) : NaN;
    const appId = Number.isNaN(parsed) ? null : parsed;
    SP_REACT.useEffect(() => {
        activeDetailBridgeCount += 1;
        markDetailRouteSeen(appId);
        notifyFocus(appId);
        return () => {
            activeDetailBridgeCount = Math.max(0, activeDetailBridgeCount - 1);
            markDetailRouteSeen(appId);
            if (activeDetailBridgeCount === 0) {
                if (!readAppIdFromLocation()) {
                    activeDetailRouteAppId = null;
                    lastDetailRouteSeenAtMs = Date.now();
                }
                notifyFocus(null);
            }
        };
    }, [appId]);
    return null;
};
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const getErrorMessage = (error, fallback) => {
    if (error instanceof Error && error.message)
        return error.message;
    if (typeof error === "string" && error.trim())
        return error;
    if (error && typeof error === "object") {
        const candidate = error;
        const nested = candidate.message ??
            candidate.error ??
            candidate.cause?.message ??
            candidate.details?.message;
        if (typeof nested === "string" && nested.trim()) {
            return nested;
        }
        try {
            const serialized = JSON.stringify(error);
            if (serialized && serialized !== "{}") {
                return serialized;
            }
        }
        catch (_ignored) {
            // no-op
        }
    }
    return fallback;
};
const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) {
        return "";
    }
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};
const isAutoAssignableYouTubeResult = (result) => typeof result.duration === "number" &&
    Number.isFinite(result.duration) &&
    result.duration > 0 &&
    result.duration <= AUTO_ASSIGN_MAX_TRACK_SECONDS;
const looksLikeSteamSoundtrackName = (name) => /\b(?:original\s+)?soundtrack\b/i.test(name || "") ||
    /\bOST\b/i.test(name || "");
const cleanGameSearchName = (name) => (name || "")
    .replace(/[\u2122\u00ae\u00a9]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const buildGameMusicSearchQueries = (name, appId) => {
    const unknownNamePattern = /^(?:Steam\s+)?App\s+\d+$/i;
    const cleaned = cleanGameSearchName(name);
    const isUnknownName = unknownNamePattern.test(cleaned);
    const queries = [];
    if (!isUnknownName && cleaned) {
        queries.push(`${cleaned} Game OST Soundtrack`, `${cleaned} OST Soundtrack`, `${cleaned} Game Soundtrack`);
    }
    if (appId > 0) {
        queries.push(`Steam app ${appId} Game OST Soundtrack`, `Steam app ${appId} OST Soundtrack`);
    }
    if (!isUnknownName && cleaned) {
        queries.push(`${cleaned} main theme`, `${cleaned} main menu theme`, `${cleaned} XMB theme`);
    }
    if (!queries.length) {
        queries.push(`Steam app ${appId} Game OST Soundtrack`);
    }
    return Array.from(new Set(queries));
};
const normalizeGlobalTrack = (raw) => {
    if (!raw?.path) {
        return null;
    }
    return {
        path: raw.path,
        filename: raw.filename || raw.path.split("/").pop() || "Global track",
        volume: typeof raw.volume === "number" ? clamp(raw.volume) : 1,
        startOffset: typeof raw.start_offset === "number"
            ? clamp(raw.start_offset, 0, 30)
            : 0,
        loop: raw.loop !== false,
        normalized: raw.normalized === true,
    };
};
const normalizeTracks = (raw) => {
    const normalized = {};
    if (!raw) {
        return normalized;
    }
    for (const [key, track] of Object.entries(raw)) {
        if (!track)
            continue;
        const idFromKey = Number.parseInt(key, 10);
        const appId = Number.isNaN(idFromKey) ? track.app_id : idFromKey;
        if (appId === undefined || appId === null || Number.isNaN(appId))
            continue;
        normalized[appId] = {
            appId,
            path: track.path,
            filename: track.filename ||
                track.path?.split("/").pop() ||
                `Track ${appId}`,
            volume: typeof track.volume === "number" ? clamp(track.volume) : 1,
            startOffset: typeof track.start_offset === "number"
                ? clamp(track.start_offset, 0, 30)
                : 0,
            loop: track.loop !== false,
            normalized: track.normalized === true,
        };
    }
    return normalized;
};
const getStoreRouteCandidates = () => {
    const candidates = new Set();
    const pushLocation = (loc) => {
        if (!loc)
            return;
        const composed = `${loc.pathname || ""}${loc.hash || ""}${loc.search || ""}`
            .trim()
            .toLowerCase();
        if (composed) {
            candidates.add(composed);
        }
        const href = String(loc.href || "").trim().toLowerCase();
        if (href) {
            candidates.add(href);
        }
    };
    try {
        const focusedWindow = window.SteamUIStore?.GetFocusedWindowInstance?.() ??
            DFL.Router.WindowStore?.GamepadUIMainWindowInstance;
        const browserWindow = focusedWindow?.BrowserWindow ??
            DFL.Router.WindowStore?.GamepadUIMainWindowInstance?.BrowserWindow;
        pushLocation(browserWindow?.location ?? null);
    }
    catch {
        // ignore
    }
    pushLocation(window.location);
    try {
        pushLocation(window.top?.location ?? null);
    }
    catch {
        // ignore cross-origin access
    }
    return Array.from(candidates);
};
const looksLikeStoreSignal = (value) => {
    if (typeof value !== "string")
        return false;
    const text = value.toLowerCase();
    return (text.includes("/store") ||
        text.includes("#/store") ||
        text.includes("tab=store") ||
        text.includes("storehome") ||
        text.includes("store.steampowered.com") ||
        text.includes("store%2esteampowered%2ecom") ||
        (text.includes("openurl") && text.includes("store")));
};
const looksLikeThemeDeckSignal = (value) => {
    if (typeof value !== "string")
        return false;
    const text = value.toLowerCase();
    return (text.includes("/themedeck") ||
        text.includes("#/themedeck") ||
        text.includes("%2fthemedeck"));
};
const isStoreRoute = (route) => {
    const text = (route || "").toLowerCase();
    if (!text)
        return false;
    const variants = new Set([text]);
    const tryDecode = (value) => {
        try {
            const decoded = decodeURIComponent(value);
            if (decoded && decoded !== value) {
                variants.add(decoded);
            }
        }
        catch {
            // ignore decode issues
        }
    };
    tryDecode(text);
    for (const value of Array.from(variants)) {
        tryDecode(value);
    }
    for (const value of variants) {
        if (looksLikeStoreSignal(value)) {
            return true;
        }
    }
    return false;
};
const detectStoreFromWindowState = () => {
    const focusedCandidates = [
        window.SteamUIStore?.GetFocusedWindowInstance?.(),
        DFL.Router?.WindowStore?.GetFocusedWindowInstance?.(),
        DFL.Router?.WindowStore?.m_FocusedWindowInstance,
        DFL.Router?.WindowStore?.m_FocusedWindow,
        DFL.Router?.WindowStore,
        window.SteamUIStore,
    ];
    for (const candidate of focusedCandidates) {
        if (!candidate)
            continue;
        const directValues = [
            candidate?.strTitle,
            candidate?.m_strTitle,
            candidate?.title,
            candidate?.name,
            candidate?.WindowType,
            candidate?.m_eWindowType,
            candidate?.route,
            candidate?.path,
            candidate?.url,
            candidate?.href,
            candidate?.location?.href,
            candidate?.BrowserWindow?.location?.href,
            candidate?.BrowserWindow?.document?.URL,
            candidate?.BrowserWindow?.document?.location?.href,
        ];
        if (directValues.some((value) => looksLikeStoreSignal(value))) {
            return true;
        }
        const queue = [candidate];
        const seen = new WeakSet();
        let scanned = 0;
        while (queue.length && scanned < 250) {
            const next = queue.shift();
            scanned += 1;
            if (!next || typeof next !== "object") {
                continue;
            }
            const objectValue = next;
            if (seen.has(objectValue)) {
                continue;
            }
            seen.add(objectValue);
            for (const [key, value] of Object.entries(objectValue)) {
                if (typeof value === "string" &&
                    /url|href|path|route|uri|src|title|name|location/i.test(key) &&
                    looksLikeStoreSignal(value)) {
                    return true;
                }
                if (value && typeof value === "object") {
                    queue.push(value);
                }
            }
        }
    }
    return false;
};
const isThemeDeckRouteActive = () => {
    const candidates = getStoreRouteCandidates();
    if (candidates.some((route) => looksLikeThemeDeckSignal(route))) {
        return true;
    }
    try {
        const path = getLibraryPath();
        if (looksLikeThemeDeckSignal(path)) {
            return true;
        }
    }
    catch {
        // ignore
    }
    return false;
};
const isGamepadContextMenuVisible = () => {
    try {
        const modalClassName = String(DFL.gamepadContextMenuClasses?.BasicContextMenuModal || "").trim();
        const activeClassName = String(DFL.gamepadContextMenuClasses?.active || "").trim();
        if (!modalClassName) {
            return false;
        }
        const nodes = Array.from(document.getElementsByClassName(modalClassName));
        for (const node of nodes) {
            const style = window.getComputedStyle(node);
            if (style.display === "none" ||
                style.visibility === "hidden" ||
                Number(style.opacity || "1") === 0) {
                continue;
            }
            const isMarkedActive = (!!activeClassName &&
                (node.classList.contains(activeClassName) ||
                    !!node.closest(`.${activeClassName}`))) ||
                node.getAttribute("aria-hidden") === "false";
            if (!isMarkedActive) {
                continue;
            }
            const rect = node.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                return true;
            }
        }
    }
    catch (error) {
        console.error("[ThemeDeck] context menu visibility probe failed", error);
    }
    return false;
};
const isStorePathSync = () => {
    if (getStoreRouteCandidates().some((route) => isStoreRoute(route))) {
        return true;
    }
    if (detectStoreFromWindowState()) {
        return true;
    }
    try {
        const hasStoreFrame = document.querySelector("iframe[src*='store.steampowered.com'], webview[src*='store.steampowered.com'], a[href*='store.steampowered.com']") !== null;
        if (hasStoreFrame) {
            return true;
        }
    }
    catch {
        // ignore DOM probe failures
    }
    return false;
};
const isStorePath = () => storeContextActive || isStorePathSync();
const detectStoreFromTabs = async () => {
    const probeCode = `
    (() => {
      try {
        const href = String(window.location?.href || "").toLowerCase();
        const path = String(window.location?.pathname || "").toLowerCase();
        const hash = String(window.location?.hash || "").toLowerCase();
        const search = String(window.location?.search || "").toLowerCase();
        const full = href + " " + path + " " + hash + " " + search;
        if (full.includes("store.steampowered.com") || full.includes("/store") || full.includes("#/store")) {
          return true;
        }
        const hasStoreFrame = !!document.querySelector("iframe[src*='store.steampowered.com'], webview[src*='store.steampowered.com'], a[href*='store.steampowered.com']");
        if (hasStoreFrame) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    })();
  `;
    const results = await Promise.all(SP_TAB_CANDIDATES.map(async (tab) => {
        try {
            const result = await Promise.race([
                executeInTab(tab, true, probeCode),
                new Promise((resolve) => {
                    window.setTimeout(() => resolve(null), 1000);
                }),
            ]);
            const value = result && typeof result === "object" && "result" in result
                ? result.result
                : result;
            return value === true || value === "true";
        }
        catch {
            return false;
        }
    }));
    return results.some(Boolean);
};
const refreshStoreContext = async () => {
    if (autoPlaybackStoreProbeInFlight) {
        return;
    }
    autoPlaybackStoreProbeInFlight = true;
    try {
        const syncStore = isStorePathSync();
        const tabStore = await detectStoreFromTabs();
        const next = syncStore || tabStore;
        if (next !== storeContextActive) {
            storeContextActive = next;
            scheduleAutoPlaybackFromContext();
        }
    }
    catch (error) {
        console.error("[ThemeDeck] refresh store context failed", error);
    }
    finally {
        autoPlaybackStoreProbeInFlight = false;
    }
};
const setExternalMediaActive = (active) => {
    if (externalMediaActive === active) {
        return;
    }
    externalMediaActive = active;
    scheduleAutoPlaybackFromContext();
};
const refreshExternalMediaState = async () => {
    if (externalMediaProbeInFlight) {
        return;
    }
    externalMediaProbeInFlight = true;
    try {
        const state = await getExternalMediaState();
        setExternalMediaActive(!!state?.active);
    }
    catch (error) {
        console.error("[ThemeDeck] external media probe failed", error);
        setExternalMediaActive(false);
    }
    finally {
        externalMediaProbeInFlight = false;
    }
};
const resolveAutoTrackFromContext = () => {
    if (runningGameAppId !== null) {
        return null;
    }
    // Trust only a game-details route/bridge, with a short grace window for Steam
    // remounts. Tile/context-menu focus alone must not trigger game playback.
    const effectiveAppId = getEffectiveDetailRouteAppId();
    if (effectiveAppId && readAutoPlaySetting()) {
        const gameTrack = latestTracksForAutoPlay[effectiveAppId];
        if (gameTrack) {
            return gameTrack;
        }
    }
    // Never promote global/store ambient while an app launch/run is in progress.
    if (launchActivityAppId !== null) {
        return null;
    }
    const inStore = isStorePath();
    if (inStore && readStoreTrackEnabledSetting() && latestStoreTrackForAutoPlay) {
        return {
            appId: STORE_TRACK_APP_ID,
            path: latestStoreTrackForAutoPlay.path,
            filename: latestStoreTrackForAutoPlay.filename,
            volume: latestStoreTrackForAutoPlay.volume,
            startOffset: latestStoreTrackForAutoPlay.startOffset,
            loop: latestStoreTrackForAutoPlay.loop,
        };
    }
    if (inStore && readAmbientDisableStoreSetting()) {
        return null;
    }
    if (!readGlobalAmbientEnabledSetting()) {
        return null;
    }
    if (!latestGlobalTrackForAutoPlay) {
        return null;
    }
    const currentPath = getLibraryPath();
    if (!currentPath && playbackState.reason === "auto" && playbackState.status === "playing") {
        if (playbackState.appId === STORE_TRACK_APP_ID &&
            readStoreTrackEnabledSetting() &&
            latestStoreTrackForAutoPlay) {
            return {
                appId: STORE_TRACK_APP_ID,
                path: latestStoreTrackForAutoPlay.path,
                filename: latestStoreTrackForAutoPlay.filename,
                volume: latestStoreTrackForAutoPlay.volume,
                startOffset: latestStoreTrackForAutoPlay.startOffset,
                loop: latestStoreTrackForAutoPlay.loop,
            };
        }
        if (playbackState.appId === GLOBAL_AMBIENT_APP_ID && latestGlobalTrackForAutoPlay) {
            const resumeTime = getGlobalAmbientResumeTime(latestGlobalTrackForAutoPlay);
            return {
                appId: GLOBAL_AMBIENT_APP_ID,
                path: latestGlobalTrackForAutoPlay.path,
                filename: latestGlobalTrackForAutoPlay.filename,
                volume: latestGlobalTrackForAutoPlay.volume,
                startOffset: latestGlobalTrackForAutoPlay.startOffset,
                loop: latestGlobalTrackForAutoPlay.loop,
                resumeTime,
            };
        }
        if (playbackState.appId &&
            playbackState.appId > 0 &&
            (playbackState.appId === getEffectiveDetailRouteAppId() ||
                playbackState.appId === launchActivityAppId)) {
            const currentGameTrack = latestTracksForAutoPlay[playbackState.appId];
            if (currentGameTrack) {
                return currentGameTrack;
            }
        }
    }
    if (readAmbientDisableStoreSetting() && isStorePath()) {
        return null;
    }
    const resumeTime = getGlobalAmbientResumeTime(latestGlobalTrackForAutoPlay);
    return {
        appId: GLOBAL_AMBIENT_APP_ID,
        path: latestGlobalTrackForAutoPlay.path,
        filename: latestGlobalTrackForAutoPlay.filename,
        volume: latestGlobalTrackForAutoPlay.volume,
        startOffset: latestGlobalTrackForAutoPlay.startOffset,
        loop: latestGlobalTrackForAutoPlay.loop,
        resumeTime,
    };
};
const applyAutoPlaybackFromContext = () => {
    if (desktopModeActive) {
        if (playbackState.status === "playing") {
            stopPlayback();
        }
        return;
    }
    if (runningGameAppId !== null) {
        if (playbackState.status === "playing") {
            if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
                captureGlobalAmbientResumeSnapshot();
            }
            stopPlayback();
        }
        return;
    }
    if (externalMediaActive) {
        if (playbackState.status === "playing") {
            if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
                captureGlobalAmbientResumeSnapshot();
            }
            stopPlayback();
        }
        return;
    }
    if (isGamepadContextMenuVisible()) {
        // Do not change autoplay track selection while a context menu is open.
        return;
    }
    const launchSuppressionActive = launchActivityAppId !== null &&
        (activeDetailRouteAppId === launchActivityAppId ||
            playbackState.appId === launchActivityAppId ||
            runningGameAppId === launchActivityAppId);
    if (launchSuppressionActive &&
        playbackState.status === "playing" &&
        (playbackState.appId === GLOBAL_AMBIENT_APP_ID ||
            playbackState.appId === STORE_TRACK_APP_ID)) {
        if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
            captureGlobalAmbientResumeSnapshot();
        }
        stopPlayback();
        return;
    }
    if (isThemeDeckRouteActive()) {
        if (playbackState.reason === "auto" && playbackState.status === "playing") {
            if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
                captureGlobalAmbientResumeSnapshot();
            }
            stopPlayback();
        }
        return;
    }
    const shouldSuppressGlobal = !readGlobalAmbientEnabledSetting() ||
        (readAmbientDisableStoreSetting() && isStorePath());
    if (shouldSuppressGlobal &&
        playbackState.appId === GLOBAL_AMBIENT_APP_ID &&
        playbackState.status === "playing") {
        captureGlobalAmbientResumeSnapshot();
        stopPlayback();
        return;
    }
    if (playbackState.reason === "manual") {
        return;
    }
    if (launchActivityAppId !== null &&
        playbackState.reason === "auto" &&
        playbackState.status === "playing" &&
        playbackState.appId === launchActivityAppId &&
        playbackState.appId > 0) {
        // During launch transition, keep the currently-playing game track alive.
        return;
    }
    const nextTrack = resolveAutoTrackFromContext();
    if (!nextTrack) {
        const recentlyLeftSameDetail = playbackState.reason === "auto" &&
            playbackState.status === "playing" &&
            playbackState.appId !== null &&
            playbackState.appId > 0 &&
            playbackState.appId === lastDetailRouteAppId &&
            Date.now() - lastDetailRouteSeenAtMs < DETAIL_ROUTE_GRACE_MS;
        if (recentlyLeftSameDetail) {
            return;
        }
        if (playbackState.reason === "auto" && playbackState.status === "playing") {
            if (playbackState.appId === GLOBAL_AMBIENT_APP_ID) {
                captureGlobalAmbientResumeSnapshot();
            }
            stopPlayback();
        }
        return;
    }
    if (playbackState.reason === "auto" &&
        playbackState.status === "playing" &&
        playbackState.appId === GLOBAL_AMBIENT_APP_ID &&
        nextTrack.appId !== GLOBAL_AMBIENT_APP_ID) {
        captureGlobalAmbientResumeSnapshot();
    }
    if (playbackState.reason === "auto" &&
        playbackState.status === "playing" &&
        playbackState.appId !== null &&
        playbackState.appId > 0 &&
        nextTrack.appId <= 0 &&
        isInRecentDetailTransition(playbackState.appId)) {
        return;
    }
    if (playbackState.reason === "auto" &&
        playbackState.status === "playing" &&
        playbackState.appId === nextTrack.appId) {
        return;
    }
    playTrack(nextTrack, "auto");
};
const scheduleAutoPlaybackFromContext = () => {
    if (autoPlaybackTick) {
        window.clearTimeout(autoPlaybackTick);
    }
    autoPlaybackTick = window.setTimeout(() => {
        autoPlaybackTick = null;
        applyAutoPlaybackFromContext();
    }, AUTO_PLAYBACK_DEBOUNCE_MS);
};
const refreshAutoPlaybackTrackCache = async () => {
    if (autoPlaybackTrackRefreshInFlight) {
        return;
    }
    autoPlaybackTrackRefreshInFlight = true;
    try {
        const [trackData, globalData, storeData] = await Promise.all([
            fetchTracks(),
            fetchGlobalTrack(),
            fetchStoreTrack(),
        ]);
        latestTracksForAutoPlay = normalizeTracks(trackData);
        latestGlobalTrackForAutoPlay = normalizeGlobalTrack(globalData);
        latestStoreTrackForAutoPlay = normalizeGlobalTrack(storeData);
        pruneAudioCache();
        if (!latestGlobalTrackForAutoPlay ||
            (globalAmbientResumeSnapshot &&
                globalAmbientResumeSnapshot.path !== latestGlobalTrackForAutoPlay.path)) {
            clearGlobalAmbientResumeSnapshot();
        }
        scheduleAutoPlaybackFromContext();
    }
    catch (error) {
        console.error("[ThemeDeck] refresh auto playback cache failed", error);
    }
    finally {
        autoPlaybackTrackRefreshInFlight = false;
    }
};
const handleLaunchStopModeChanged = () => {
    void refreshRunningGameState();
    scheduleAutoPlaybackFromContext();
};
const startAutoPlaybackCoordinator = () => {
    if (autoPlaybackStarted) {
        return;
    }
    autoPlaybackStarted = true;
    ambientInterruptionModeRuntime = readAmbientInterruptionModeSetting();
    launchStopModeRuntime = readLaunchStopModeSetting();
    gameTrackMasterVolumeRuntime = readGameTrackMasterVolumeSetting();
    startDesktopModeWatcher();
    startRunningGameWatcher();
    refreshAutoPlaybackTrackCache();
    refreshExternalMediaState();
    stopAutoPlaybackSubscription = subscribePlayback(() => {
        scheduleAutoPlaybackFromContext();
    });
    window.addEventListener(AUTO_PLAY_EVENT, scheduleAutoPlaybackFromContext);
    window.addEventListener(GLOBAL_AMBIENT_ENABLED_EVENT, scheduleAutoPlaybackFromContext);
    window.addEventListener(STORE_TRACK_ENABLED_EVENT, scheduleAutoPlaybackFromContext);
    window.addEventListener(AMBIENT_DISABLE_STORE_EVENT, scheduleAutoPlaybackFromContext);
    window.addEventListener(AMBIENT_INTERRUPTION_MODE_EVENT, scheduleAutoPlaybackFromContext);
    window.addEventListener(LAUNCH_STOP_MODE_EVENT, handleLaunchStopModeChanged);
    window.addEventListener(TRACKS_UPDATED_EVENT, refreshAutoPlaybackTrackCache);
    refreshStoreContext();
    autoPlaybackRouteInterval = window.setInterval(() => {
        scheduleAutoPlaybackFromContext();
        refreshStoreContext();
    }, 750);
    externalMediaPollInterval = window.setInterval(() => {
        refreshExternalMediaState();
    }, EXTERNAL_MEDIA_POLL_MS);
};
const stopAutoPlaybackCoordinator = () => {
    if (!autoPlaybackStarted) {
        return;
    }
    autoPlaybackStarted = false;
    stopRunningGameWatcher();
    stopAutoPlaybackSubscription?.();
    stopAutoPlaybackSubscription = null;
    window.removeEventListener(AUTO_PLAY_EVENT, scheduleAutoPlaybackFromContext);
    window.removeEventListener(GLOBAL_AMBIENT_ENABLED_EVENT, scheduleAutoPlaybackFromContext);
    window.removeEventListener(STORE_TRACK_ENABLED_EVENT, scheduleAutoPlaybackFromContext);
    window.removeEventListener(AMBIENT_DISABLE_STORE_EVENT, scheduleAutoPlaybackFromContext);
    window.removeEventListener(AMBIENT_INTERRUPTION_MODE_EVENT, scheduleAutoPlaybackFromContext);
    window.removeEventListener(LAUNCH_STOP_MODE_EVENT, handleLaunchStopModeChanged);
    window.removeEventListener(TRACKS_UPDATED_EVENT, refreshAutoPlaybackTrackCache);
    stopDesktopModeWatcher();
    if (autoPlaybackRouteInterval) {
        window.clearInterval(autoPlaybackRouteInterval);
        autoPlaybackRouteInterval = null;
    }
    if (externalMediaPollInterval) {
        window.clearInterval(externalMediaPollInterval);
        externalMediaPollInterval = null;
    }
    externalMediaActive = false;
    externalMediaProbeInFlight = false;
    activeDetailRouteAppId = null;
    activeDetailBridgeCount = 0;
    lastDetailRouteAppId = null;
    lastDetailRouteSeenAtMs = 0;
    contextMenuActiveAppId = null;
    storeContextActive = false;
};
const useTrackState = (options) => {
    const [tracks, setTracks] = SP_REACT.useState({});
    const [globalTrack, setGlobalTrack] = SP_REACT.useState(null);
    const [storeTrack, setStoreTrack] = SP_REACT.useState(null);
    const [loadingTracks, setLoadingTracks] = SP_REACT.useState(true);
    const silent = false;
    const refreshTracks = SP_REACT.useCallback(async () => {
        try {
            const [trackData, globalData, storeData] = await Promise.all([
                fetchTracks(),
                fetchGlobalTrack(),
                fetchStoreTrack(),
            ]);
            const normalizedTracks = normalizeTracks(trackData);
            const normalizedGlobal = normalizeGlobalTrack(globalData);
            const normalizedStore = normalizeGlobalTrack(storeData);
            setTracks(normalizedTracks);
            setGlobalTrack(normalizedGlobal);
            setStoreTrack(normalizedStore);
            latestTracksForAutoPlay = normalizedTracks;
            latestGlobalTrackForAutoPlay = normalizedGlobal;
            latestStoreTrackForAutoPlay = normalizedStore;
            pruneAudioCache();
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] load tracks failed", error);
            {
                toaster.toast({
                    title: "ThemeDeck",
                    body: t("failedLoadTracks"),
                });
            }
        }
        finally {
            setLoadingTracks(false);
        }
    }, [silent]);
    SP_REACT.useEffect(() => {
        refreshTracks();
    }, [refreshTracks]);
    SP_REACT.useEffect(() => {
        const handler = () => {
            clearAudioCache(undefined, { preservePinned: true });
            refreshTracks();
        };
        window.addEventListener(TRACKS_UPDATED_EVENT, handler);
        return () => window.removeEventListener(TRACKS_UPDATED_EVENT, handler);
    }, [refreshTracks]);
    return {
        tracks,
        setTracks,
        globalTrack,
        setGlobalTrack,
        storeTrack,
        setStoreTrack,
        loadingTracks,
        refreshTracks,
    };
};
const DeleteDownloadedTracksProgressModal = ({ closeModal, onFinished, }) => {
    const [progress, setProgress] = SP_REACT.useState({
        running: true,
        status: "planning",
        total: 0,
        completed: 0,
        total_files: 0,
        removed_files: 0,
        total_tracks: 0,
        removed_tracks: 0,
        message: t("preparingDelete"),
    });
    const finishedRef = SP_REACT.useRef(false);
    SP_REACT.useEffect(() => {
        let cancelled = false;
        let intervalId = null;
        const applyProgress = (next) => {
            if (cancelled)
                return;
            setProgress(next);
            if (!next.running && !finishedRef.current) {
                finishedRef.current = true;
                onFinished(next);
            }
        };
        const poll = async () => {
            try {
                applyProgress(await getDeleteDownloadedTracksProgress());
            }
            catch (error) {
                applyProgress({
                    running: false,
                    status: "failed",
                    total: 0,
                    completed: 0,
                    total_files: 0,
                    removed_files: 0,
                    total_tracks: 0,
                    removed_tracks: 0,
                    message: t("failedDeleteDownloadedTracks"),
                    error: getErrorMessage(error, t("unknownError")),
                });
            }
        };
        const start = async () => {
            try {
                applyProgress(await startDeleteDownloadedTracks());
                intervalId = window.setInterval(() => {
                    void poll();
                }, 350);
            }
            catch (error) {
                applyProgress({
                    running: false,
                    status: "failed",
                    total: 0,
                    completed: 0,
                    total_files: 0,
                    removed_files: 0,
                    total_tracks: 0,
                    removed_tracks: 0,
                    message: t("failedDeleteDownloadedTracks"),
                    error: getErrorMessage(error, t("unknownError")),
                });
            }
        };
        void start();
        return () => {
            cancelled = true;
            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
        };
    }, [onFinished]);
    const percent = progress.total > 0
        ? Math.min(100, Math.round((progress.completed / progress.total) * 100))
        : progress.status === "completed"
            ? 100
            : 0;
    const isDone = !progress.running;
    return (window.SP_REACT.createElement(DFL.ModalRoot, { closeModal: closeModal, bDisableBackgroundDismiss: progress.running, bHideCloseIcon: progress.running },
        window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" } },
            window.SP_REACT.createElement("div", { style: { fontSize: "1.15rem", fontWeight: 700 } }, t("deleteDownloadedTracks")),
            window.SP_REACT.createElement("div", { style: { opacity: 0.82, fontSize: "0.9rem" } }, progress.message || t("deleting")),
            window.SP_REACT.createElement("div", { style: {
                    width: "100%",
                    height: "0.7rem",
                    borderRadius: "0.45rem",
                    background: "rgba(255,255,255,0.18)",
                    overflow: "hidden",
                } },
                window.SP_REACT.createElement("div", { style: {
                        width: `${percent}%`,
                        height: "100%",
                        background: progress.status === "failed"
                            ? "rgba(255, 107, 107, 0.95)"
                            : "rgba(98, 168, 255, 0.95)",
                        transition: "width 0.18s ease",
                    } })),
            window.SP_REACT.createElement("div", { style: { opacity: 0.85, fontSize: "0.86rem" } }, t("deletedProgress", {
                completed: progress.completed,
                total: progress.total || progress.completed,
            })),
            progress.current_path ? (window.SP_REACT.createElement("div", { style: {
                    opacity: 0.68,
                    fontSize: "0.78rem",
                    overflowWrap: "anywhere",
                } }, progress.current_path)) : null,
            progress.error ? (window.SP_REACT.createElement("div", { style: { color: "#ff8f8f", fontSize: "0.84rem" } }, progress.error)) : null,
            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", disabled: !isDone, onClick: closeModal, style: { alignSelf: "flex-end", minWidth: "8rem" } }, t("close")))));
};
const getDisplayName = (appId) => {
    const store = window?.appStore;
    const overview = store?.GetAppOverviewByAppID?.(appId) ||
        store?.GetAppOverviewByGameID?.(appId);
    return cleanGameSearchName(String(overview?.display_name ||
        overview?.localized_name ||
        overview?.name ||
        `App ${appId}`));
};
const getThemeDeckRouteAppId = (pathname) => {
    const path = pathname || window.location.pathname || "";
    const match = path.match(/\/themedeck\/(\d+)/);
    if (!match)
        return null;
    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};
const usePlaybackStateValue = () => {
    const [state, setState] = SP_REACT.useState(playbackState);
    SP_REACT.useEffect(() => subscribePlayback(setState), []);
    return state;
};
const useBooleanPreference = (readFn, persistFn, eventName) => {
    const [value, setValue] = SP_REACT.useState(() => readFn());
    SP_REACT.useEffect(() => {
        const handler = (event) => {
            const detail = event.detail;
            if (typeof detail === "boolean") {
                setValue(detail);
                return;
            }
            setValue(readFn());
        };
        window.addEventListener(eventName, handler);
        return () => window.removeEventListener(eventName, handler);
    }, [readFn, eventName]);
    const update = SP_REACT.useCallback((next) => {
        setValue(next);
        persistFn(next);
    }, [persistFn]);
    return [value, update];
};
const useAutoPlaySetting = () => useBooleanPreference(readAutoPlaySetting, persistAutoPlaySetting, AUTO_PLAY_EVENT);
const useAudioNormalizationSetting = () => useBooleanPreference(readAudioNormalizationSetting, persistAudioNormalizationSetting, AUDIO_NORMALIZATION_EVENT);
const useAudioUpmixSetting = () => useBooleanPreference(readAudioUpmixSetting, persistAudioUpmixSetting, AUDIO_UPMIX_EVENT);
const useGameTrackMasterVolumeSetting = () => {
    const [value, setValue] = SP_REACT.useState(() => readGameTrackMasterVolumeSetting());
    SP_REACT.useEffect(() => {
        const handler = (event) => {
            const detail = event.detail;
            if (typeof detail === "number" && Number.isFinite(detail)) {
                setValue(parseGameTrackMasterVolume(detail));
                return;
            }
            setValue(readGameTrackMasterVolumeSetting());
        };
        window.addEventListener(GAME_TRACK_MASTER_VOLUME_EVENT, handler);
        return () => window.removeEventListener(GAME_TRACK_MASTER_VOLUME_EVENT, handler);
    }, []);
    const update = SP_REACT.useCallback((next) => {
        const normalized = parseGameTrackMasterVolume(next);
        setValue(normalized);
        persistGameTrackMasterVolumeSetting(normalized);
        applyGameTrackMasterVolumeToActiveTrack();
    }, []);
    return [value, update];
};
const useAmbientDisableStoreSetting = () => useBooleanPreference(readAmbientDisableStoreSetting, persistAmbientDisableStoreSetting, AMBIENT_DISABLE_STORE_EVENT);
const useGlobalAmbientEnabledSetting = () => useBooleanPreference(readGlobalAmbientEnabledSetting, persistGlobalAmbientEnabledSetting, GLOBAL_AMBIENT_ENABLED_EVENT);
const useStoreTrackEnabledSetting = () => useBooleanPreference(readStoreTrackEnabledSetting, persistStoreTrackEnabledSetting, STORE_TRACK_ENABLED_EVENT);
const useAmbientInterruptionModeSetting = () => {
    const [mode, setMode] = SP_REACT.useState(readAmbientInterruptionModeSetting());
    SP_REACT.useEffect(() => {
        const handler = (event) => {
            const detail = event.detail;
            setMode(parseAmbientInterruptionMode(detail));
        };
        window.addEventListener(AMBIENT_INTERRUPTION_MODE_EVENT, handler);
        return () => window.removeEventListener(AMBIENT_INTERRUPTION_MODE_EVENT, handler);
    }, []);
    const update = SP_REACT.useCallback((value) => {
        const normalized = parseAmbientInterruptionMode(value);
        setMode(normalized);
        if (normalized === "stop") {
            clearGlobalAmbientResumeSnapshot();
        }
        persistAmbientInterruptionModeSetting(normalized);
    }, []);
    return [mode, update];
};
const useLaunchStopModeSetting = () => {
    const [mode, setMode] = SP_REACT.useState(readLaunchStopModeSetting());
    SP_REACT.useEffect(() => {
        const handler = (event) => {
            const detail = event.detail;
            setMode(parseLaunchStopMode(detail));
        };
        window.addEventListener(LAUNCH_STOP_MODE_EVENT, handler);
        return () => window.removeEventListener(LAUNCH_STOP_MODE_EVENT, handler);
    }, []);
    const update = SP_REACT.useCallback((value) => {
        const normalized = parseLaunchStopMode(value);
        setMode(normalized);
        persistLaunchStopModeSetting(normalized);
    }, []);
    return [mode, update];
};
const Content = () => {
    const { tracks, setTracks, globalTrack, setGlobalTrack, storeTrack, setStoreTrack, refreshTracks, } = useTrackState();
    const [library, setLibrary] = SP_REACT.useState([]);
    const [autoPlay, setAutoPlay] = useAutoPlaySetting();
    const [normalizeDownloadedAudio, setNormalizeDownloadedAudio] = useAudioNormalizationSetting();
    const [upmixDownloadedAudio, setUpmixDownloadedAudio] = useAudioUpmixSetting();
    const [audioNormalizationStatus, setAudioNormalizationStatus] = SP_REACT.useState({ available: false });
    const [gameTrackMasterVolume, setGameTrackMasterVolume] = useGameTrackMasterVolumeSetting();
    const [globalAmbientEnabled, setGlobalAmbientEnabled] = useGlobalAmbientEnabledSetting();
    const [storeTrackEnabled, setStoreTrackEnabled] = useStoreTrackEnabledSetting();
    const [ambientDisableStore, setAmbientDisableStore] = useAmbientDisableStoreSetting();
    const [ambientInterruptionMode, setAmbientInterruptionMode] = useAmbientInterruptionModeSetting();
    const [launchStopMode, setLaunchStopMode] = useLaunchStopModeSetting();
    const [ytDlpStatus, setYtDlpStatus] = SP_REACT.useState({
        installed: false,
    });
    const [ytDlpBusy, setYtDlpBusy] = SP_REACT.useState(false);
    const [bulkAssign, setBulkAssign] = SP_REACT.useState({
        running: false,
        stopRequested: false,
        total: 0,
        completed: 0,
        assigned: 0,
        skipped: 0,
        failed: 0,
        currentGame: "",
        message: "",
        ffmpegMessage: "",
    });
    const bulkAssignStopRequestedRef = SP_REACT.useRef(false);
    const bulkAssignRunIdRef = SP_REACT.useRef(0);
    const [showMissingGames, setShowMissingGames] = SP_REACT.useState(false);
    const [showAssignedGames, setShowAssignedGames] = SP_REACT.useState(false);
    const [resolvedMissingNames, setResolvedMissingNames] = SP_REACT.useState({});
    const [failedMissingNameIds, setFailedMissingNameIds] = SP_REACT.useState({});
    const missingNameAttemptsRef = SP_REACT.useRef(new Map());
    const resolvingMissingNameIdsRef = SP_REACT.useRef(new Set());
    const [missingResolveInFlightCount, setMissingResolveInFlightCount] = SP_REACT.useState(0);
    const playback = usePlaybackStateValue();
    const topFocusRef = SP_REACT.useRef(null);
    const getGameName = SP_REACT.useCallback((appId) => {
        const store = window?.appStore;
        const overview = store?.GetAppOverviewByAppID?.(appId);
        const candidate = overview?.display_name ||
            overview?.localized_name ||
            overview?.name ||
            library.find((game) => game.appid === appId)?.name ||
            tracks[appId]?.filename ||
            getDisplayName(appId);
        return cleanGameSearchName(String(candidate || `App ${appId}`));
    }, [tracks, library]);
    const libraryGames = SP_REACT.useMemo(() => {
        const seen = new Set();
        const unique = [];
        for (const game of library) {
            if (!game || !Number.isFinite(game.appid) || game.appid <= 0) {
                continue;
            }
            if (seen.has(game.appid)) {
                continue;
            }
            seen.add(game.appid);
            unique.push(game);
        }
        return unique;
    }, [library]);
    const unassignedLibraryGameCount = SP_REACT.useMemo(() => libraryGames.filter((game) => !tracks[game.appid]).length, [libraryGames, tracks]);
    const missingGamesStatus = SP_REACT.useMemo(() => {
        const unknownNamePattern = /^(?:Steam\s+)?App\s+\d+$/i;
        return libraryGames
            .filter((game) => !tracks[game.appid])
            .map((game) => {
            const resolvedName = cleanGameSearchName(String(resolvedMissingNames[game.appid] || ""));
            const baseName = cleanGameSearchName(String(getGameName(game.appid) || game.name || ""));
            const fallbackName = resolvedName || baseName;
            const isUnknown = !fallbackName || unknownNamePattern.test(fallbackName);
            const failed = !!failedMissingNameIds[game.appid];
            const status = isUnknown
                ? failed
                    ? "failed"
                    : "pending"
                : "resolved";
            const name = status === "failed"
                ? "Name unavailable"
                : fallbackName;
            return {
                appid: game.appid,
                name,
                status,
                isNonSteam: game.isNonSteam === true,
            };
        })
            .sort((a, b) => {
            if (a.status !== b.status) {
                if (a.status === "resolved")
                    return -1;
                if (b.status === "resolved")
                    return 1;
                if (a.status === "failed")
                    return 1;
                if (b.status === "failed")
                    return -1;
            }
            return a.name.localeCompare(b.name);
        });
    }, [libraryGames, tracks, getGameName, resolvedMissingNames, failedMissingNameIds]);
    const missingGamesList = SP_REACT.useMemo(() => missingGamesStatus.filter((game) => game.status !== "pending"), [missingGamesStatus]);
    const assignedGamesList = SP_REACT.useMemo(() => {
        return libraryGames
            .filter((game) => !!tracks[game.appid])
            .map((game) => ({
            appid: game.appid,
            name: cleanGameSearchName(String(getGameName(game.appid) || game.name)),
            isNonSteam: game.isNonSteam === true,
            normalized: tracks[game.appid]?.normalized === true,
        }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [libraryGames, tracks, getGameName]);
    const missingGameNameStats = SP_REACT.useMemo(() => {
        const total = missingGamesStatus.length;
        const resolved = missingGamesStatus.filter((game) => game.status === "resolved").length;
        const failed = missingGamesStatus.filter((game) => game.status === "failed").length;
        const pending = Math.max(0, total - resolved - failed);
        const processed = resolved + failed;
        const percent = total > 0 ? Math.round((processed / total) * 100) : 100;
        return { total, resolved, failed, pending, processed, percent };
    }, [missingGamesStatus]);
    const unresolvedMissingGameIds = SP_REACT.useMemo(() => {
        return missingGamesStatus
            .filter((game) => game.status === "pending")
            .map((game) => game.appid);
    }, [missingGamesStatus]);
    SP_REACT.useEffect(() => {
        const activeMissingIds = new Set(libraryGames
            .filter((game) => !tracks[game.appid])
            .map((game) => game.appid));
        setResolvedMissingNames((prev) => {
            let changed = false;
            const next = {};
            for (const [idRaw, name] of Object.entries(prev)) {
                const appId = Number.parseInt(idRaw, 10);
                if (activeMissingIds.has(appId)) {
                    next[appId] = name;
                }
                else {
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        setFailedMissingNameIds((prev) => {
            let changed = false;
            const next = {};
            for (const idRaw of Object.keys(prev)) {
                const appId = Number.parseInt(idRaw, 10);
                if (activeMissingIds.has(appId)) {
                    next[appId] = true;
                }
                else {
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        for (const appId of Array.from(missingNameAttemptsRef.current.keys())) {
            if (!activeMissingIds.has(appId)) {
                missingNameAttemptsRef.current.delete(appId);
            }
        }
        for (const appId of Array.from(resolvingMissingNameIdsRef.current.values())) {
            if (!activeMissingIds.has(appId)) {
                resolvingMissingNameIdsRef.current.delete(appId);
            }
        }
        setMissingResolveInFlightCount(resolvingMissingNameIdsRef.current.size);
    }, [libraryGames, tracks]);
    SP_REACT.useEffect(() => {
        if (!showMissingGames) {
            return;
        }
        let cancelled = false;
        const resolveBatch = async () => {
            if (cancelled) {
                return;
            }
            if (!unresolvedMissingGameIds.length) {
                return;
            }
            const idsToResolve = unresolvedMissingGameIds
                .filter((appId) => !resolvingMissingNameIdsRef.current.has(appId))
                .slice(0, 6);
            if (!idsToResolve.length) {
                return;
            }
            idsToResolve.forEach((appId) => {
                resolvingMissingNameIdsRef.current.add(appId);
            });
            setMissingResolveInFlightCount(resolvingMissingNameIdsRef.current.size);
            try {
                const resolved = await resolveStoreAppNames(idsToResolve);
                if (cancelled || !resolved || typeof resolved !== "object") {
                    return;
                }
                const updates = {};
                const resolvedIdSet = new Set();
                for (const [idRaw, nameRaw] of Object.entries(resolved)) {
                    const appId = Number.parseInt(idRaw, 10);
                    const name = cleanGameSearchName(String(nameRaw || ""));
                    if (!Number.isFinite(appId) || appId <= 0 || !name) {
                        continue;
                    }
                    updates[appId] = name;
                    resolvedIdSet.add(appId);
                    missingNameAttemptsRef.current.delete(appId);
                }
                const failedNow = [];
                for (const appId of idsToResolve) {
                    if (resolvedIdSet.has(appId)) {
                        continue;
                    }
                    const attempts = (missingNameAttemptsRef.current.get(appId) || 0) + 1;
                    missingNameAttemptsRef.current.set(appId, attempts);
                    if (attempts >= 3) {
                        failedNow.push(appId);
                        missingNameAttemptsRef.current.delete(appId);
                    }
                }
                if (Object.keys(updates).length) {
                    setResolvedMissingNames((prev) => ({
                        ...prev,
                        ...updates,
                    }));
                }
                if (Object.keys(updates).length || failedNow.length) {
                    setFailedMissingNameIds((prev) => {
                        const next = { ...prev };
                        for (const appId of Object.keys(updates).map((id) => Number(id))) {
                            delete next[appId];
                        }
                        for (const appId of failedNow) {
                            next[appId] = true;
                        }
                        return next;
                    });
                }
            }
            catch (error) {
                console.error("[ThemeDeck] failed to resolve missing game names", error);
            }
            finally {
                idsToResolve.forEach((appId) => resolvingMissingNameIdsRef.current.delete(appId));
                setMissingResolveInFlightCount(resolvingMissingNameIdsRef.current.size);
            }
        };
        void resolveBatch();
        const intervalId = window.setInterval(() => {
            void resolveBatch();
        }, 1800);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [showMissingGames, unresolvedMissingGameIds]);
    const loadLibrary = SP_REACT.useCallback(async () => {
        try {
            const byId = new Map();
            const readBooleanFlag = (value) => {
                try {
                    return typeof value === "function" ? value() === true : value === true;
                }
                catch {
                    return false;
                }
            };
            const addEntry = (entry, fallbackId, options) => {
                const fallbackAppId = Number.parseInt(String(fallbackId ?? ""), 10);
                let appid = Number.NaN;
                let nameCandidate;
                if (entry && typeof entry === "object") {
                    const appidRaw = entry?.appid ??
                        entry?.app_id ??
                        entry?.unAppID ??
                        entry?.nAppID ??
                        entry?.id ??
                        fallbackId;
                    appid = Number.parseInt(String(appidRaw ?? ""), 10);
                    nameCandidate =
                        entry?.display_name ||
                            entry?.localized_name ||
                            entry?.name ||
                            entry?.strTitle ||
                            entry?.title;
                }
                else if (typeof entry === "number" || typeof entry === "bigint") {
                    appid = Number(entry);
                }
                else if (typeof entry === "string") {
                    const entryAsId = Number.parseInt(entry, 10);
                    if (Number.isFinite(entryAsId) && entryAsId > 0) {
                        appid = entryAsId;
                    }
                    else if (Number.isFinite(fallbackAppId) && fallbackAppId > 0) {
                        appid = fallbackAppId;
                        nameCandidate = entry;
                    }
                }
                else if (Number.isFinite(fallbackAppId) && fallbackAppId > 0) {
                    appid = fallbackAppId;
                }
                if (!Number.isFinite(appid) || appid <= 0) {
                    return;
                }
                if (LIBRARY_EXCLUDED_APP_IDS.has(appid)) {
                    return;
                }
                const overview = appStore?.GetAppOverviewByAppID?.(appid) ||
                    appStore?.GetAppOverviewByGameID?.(appid);
                const isNonSteam = options?.isNonSteam === true ||
                    entry?.isNonSteam === true ||
                    entry?.is_non_steam === true ||
                    entry?.is_shortcut === true ||
                    readBooleanFlag(entry?.BIsShortcut) ||
                    readBooleanFlag(entry?.BIsModOrShortcut) ||
                    readBooleanFlag(overview?.BIsShortcut) ||
                    readBooleanFlag(overview?.BIsModOrShortcut);
                const appType = Number(overview?.app_type ?? entry?.app_type ?? NaN);
                const isDlc = Number.isFinite(appType) && (appType & STEAM_APP_TYPE_DLC) !== 0;
                const isSteamSoundtrack = !isNonSteam &&
                    Number.isFinite(appType) &&
                    (appType & STEAM_APP_TYPE_MUSIC) !== 0;
                const isSteamSoftware = !isNonSteam &&
                    Number.isFinite(appType) &&
                    (appType &
                        (STEAM_APP_TYPE_APPLICATION | STEAM_APP_TYPE_TOOL)) !==
                        0;
                if (isDlc || isSteamSoundtrack || isSteamSoftware) {
                    return;
                }
                if (overview?.visible_in_game_list === false) {
                    return;
                }
                const name = cleanGameSearchName(String(overview?.display_name ||
                    overview?.localized_name ||
                    overview?.name ||
                    nameCandidate ||
                    getDisplayName(appid) ||
                    `App ${appid}`));
                if (!isNonSteam && looksLikeSteamSoundtrackName(name)) {
                    return;
                }
                const existing = byId.get(appid);
                if (!existing || existing.name.startsWith("App ")) {
                    byId.set(appid, { appid, name, isNonSteam });
                }
                else if (isNonSteam && !existing.isNonSteam) {
                    byId.set(appid, { ...existing, isNonSteam: true });
                }
            };
            const addCollection = (raw, options) => {
                if (!raw) {
                    return;
                }
                if (Array.isArray(raw)) {
                    raw.forEach((entry) => addEntry(entry, undefined, options));
                    return;
                }
                if (raw instanceof Set) {
                    raw.forEach((value) => addEntry(value, undefined, options));
                    return;
                }
                if (raw instanceof Map) {
                    raw.forEach((value, key) => addEntry(value, key, options));
                    return;
                }
                if (typeof raw?.values === "function") {
                    try {
                        Array.from(raw.values()).forEach((entry) => addEntry(entry, undefined, options));
                        return;
                    }
                    catch (_ignored) {
                        // Fall through to object probing below.
                    }
                }
                if (typeof raw === "object") {
                    Object.entries(raw).forEach(([key, value]) => addEntry(value, key, options));
                    addEntry(raw, undefined, options);
                }
            };
            const steamApps = window?.SteamClient?.Apps;
            const appStore = window?.appStore;
            const bootstrap = steamApps?.GetLibraryBootstrapData?.() ??
                appStore?.GetLibraryBootstrapData?.();
            addCollection(bootstrap?.library?.apps);
            addCollection(bootstrap?.apps);
            addCollection(bootstrap?.rgApps);
            addCollection(appStore?.m_mapAppOverview);
            addCollection(appStore?.m_mapAppData);
            addCollection(appStore?.m_mapOwnedApps);
            addCollection(appStore?.m_mapApps);
            addCollection(appStore?.m_rgApps);
            addCollection(appStore?.m_rgAppData);
            addCollection(appStore?.m_rgAppOverviews);
            addCollection(appStore?.m_rgOwnedApps);
            try {
                const ownedResponse = await Promise.resolve(steamApps?.GetOwnedGames?.());
                addCollection(ownedResponse?.apps);
                addCollection(ownedResponse?.rgApps);
                addCollection(ownedResponse?.games);
                addCollection(ownedResponse?.rgGames);
            }
            catch (_ignored) {
                // no-op
            }
            try {
                const localconfigAppIds = await fetchLocalconfigAppIds();
                addCollection(localconfigAppIds?.app_ids ?? []);
                addCollection(localconfigAppIds?.shortcuts ?? [], { isNonSteam: true });
            }
            catch (error) {
                console.error("[ThemeDeck] localconfig app id fallback failed", error);
            }
            const games = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
            setLibrary(games);
            console.info("[ThemeDeck] library detection count", games.length);
        }
        catch (error) {
            console.error("[ThemeDeck] library load failed", error);
        }
    }, []);
    SP_REACT.useEffect(() => {
        void loadLibrary();
        const intervalId = window.setInterval(() => {
            void loadLibrary();
        }, 5000);
        const timeoutId = window.setTimeout(() => {
            window.clearInterval(intervalId);
        }, 30000);
        return () => {
            window.clearInterval(intervalId);
            window.clearTimeout(timeoutId);
        };
    }, [loadLibrary]);
    const refreshYtDlpStatus = SP_REACT.useCallback(async () => {
        try {
            const status = await getYtDlpStatus();
            setYtDlpStatus(status);
        }
        catch (error) {
            console.error("[ThemeDeck] yt-dlp status failed", error);
        }
    }, []);
    SP_REACT.useEffect(() => {
        refreshYtDlpStatus();
    }, [refreshYtDlpStatus]);
    SP_REACT.useEffect(() => {
        let cancelled = false;
        const refresh = async () => {
            try {
                const status = await getAudioNormalizationStatus();
                if (!cancelled) {
                    setAudioNormalizationStatus(status);
                }
            }
            catch (error) {
                console.error("[ThemeDeck] audio normalization status failed", error);
            }
        };
        void refresh();
        return () => {
            cancelled = true;
        };
    }, []);
    const handleUpdateYtDlp = async () => {
        const confirmed = window.confirm(t("confirmUpdateYtdlp"));
        if (!confirmed) {
            return;
        }
        setYtDlpBusy(true);
        try {
            const status = await updateYtDlp();
            setYtDlpStatus(status);
            toaster.toast({
                title: "ThemeDeck",
                body: t("ytdlpReady", { version: status.version || "latest" }),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] update yt-dlp failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: `Failed to update yt-dlp: ${getErrorMessage(error, t("unknownUpdateError"))}`,
            });
        }
        finally {
            setYtDlpBusy(false);
            refreshYtDlpStatus();
        }
    };
    const handleDeleteDownloadsFinished = SP_REACT.useCallback(async (progress) => {
        stopPlayback();
        clearAudioCache();
        window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
        await refreshTracks();
        scheduleAutoPlaybackFromContext();
        if (progress.status === "completed") {
            toaster.toast({
                title: "ThemeDeck",
                body: t("deletedDownloadedTracks", {
                    files: progress.removed_files,
                    tracks: progress.removed_tracks,
                }),
            });
        }
    }, [refreshTracks]);
    const handleDeleteDownloadedTracks = () => {
        let confirmModal = null;
        let progressModal = null;
        const closeConfirm = () => confirmModal?.Close();
        const openProgress = () => {
            closeConfirm();
            const closeProgress = () => progressModal?.Close();
            progressModal = DFL.showModal(window.SP_REACT.createElement(DeleteDownloadedTracksProgressModal, { closeModal: closeProgress, onFinished: handleDeleteDownloadsFinished }), undefined, { strTitle: t("deleteDownloadedTracks") });
        };
        confirmModal = DFL.showModal(window.SP_REACT.createElement(DFL.ConfirmModal, { strTitle: t("deleteDownloadedTracksTitle"), strDescription: t("confirmDeleteDownloadedTracks"), strOKButtonText: t("yes"), strCancelButtonText: t("no"), bDestructiveWarning: true, onOK: openProgress, onCancel: closeConfirm, closeModal: closeConfirm }), undefined, { strTitle: t("deleteDownloadedTracksTitle") });
    };
    const handleStopBulkAssign = SP_REACT.useCallback(() => {
        if (!bulkAssign.running) {
            return;
        }
        bulkAssignStopRequestedRef.current = true;
        setBulkAssign((prev) => ({
            ...prev,
            stopRequested: true,
            message: t("stoppingAfterCurrent"),
        }));
    }, [bulkAssign.running]);
    const handleAutoAssignMissingTracks = SP_REACT.useCallback(async () => {
        if (bulkAssign.running || ytDlpBusy) {
            return;
        }
        if (!ytDlpStatus.installed) {
            toaster.toast({
                title: "ThemeDeck",
                body: t("ytdlpMissing"),
            });
            return;
        }
        if (!libraryGames.length) {
            toaster.toast({
                title: "ThemeDeck",
                body: t("noGamesFound"),
            });
            return;
        }
        let latestTracks = tracks;
        try {
            latestTracks = normalizeTracks(await fetchTracks());
        }
        catch (_ignored) {
            // Keep using current in-memory tracks if refresh fails.
        }
        const allMissingGames = libraryGames.filter((game) => !latestTracks[game.appid]);
        if (!allMissingGames.length) {
            toaster.toast({
                title: "ThemeDeck",
                body: t("allGamesAssigned"),
            });
            return;
        }
        const unknownNamePattern = /^App\s+\d+$/i;
        const resolvedNameById = new Map();
        for (const game of allMissingGames) {
            const baseName = cleanGameSearchName(getGameName(game.appid) || game.name || `App ${game.appid}`);
            if (baseName && !unknownNamePattern.test(baseName.trim())) {
                resolvedNameById.set(game.appid, baseName);
            }
        }
        const unresolvedIds = allMissingGames
            .map((game) => game.appid)
            .filter((appId) => !resolvedNameById.has(appId));
        if (unresolvedIds.length) {
            try {
                const resolvedFromStore = await resolveStoreAppNames(unresolvedIds);
                for (const [idRaw, nameRaw] of Object.entries(resolvedFromStore || {})) {
                    const appId = Number.parseInt(idRaw, 10);
                    const name = String(nameRaw || "").trim();
                    if (!Number.isFinite(appId) || appId <= 0 || !name) {
                        continue;
                    }
                    resolvedNameById.set(appId, name);
                }
            }
            catch (error) {
                console.error("[ThemeDeck] resolve store app names failed", error);
            }
        }
        const getSearchName = (game) => cleanGameSearchName((resolvedNameById.get(game.appid) ||
            getGameName(game.appid) ||
            game.name ||
            `App ${game.appid}`));
        const missingGames = allMissingGames;
        const unknownNameCount = allMissingGames.filter((game) => unknownNamePattern.test(getSearchName(game).trim())).length;
        const runId = Date.now();
        bulkAssignRunIdRef.current = runId;
        bulkAssignStopRequestedRef.current = false;
        let completed = 0;
        let assigned = 0;
        let skipped = 0;
        let failed = 0;
        setBulkAssign({
            running: true,
            stopRequested: false,
            total: missingGames.length,
            completed: 0,
            assigned: 0,
            skipped: 0,
            failed: 0,
            currentGame: "",
            message: unknownNameCount > 0
                ? `Preparing bulk assignment... (${unknownNameCount} unnamed games will still be attempted)`
                : "Preparing bulk assignment...",
            ffmpegMessage: "",
        });
        for (const game of missingGames) {
            if (bulkAssignRunIdRef.current !== runId ||
                bulkAssignStopRequestedRef.current) {
                break;
            }
            const gameName = getSearchName(game);
            const queryCandidates = buildGameMusicSearchQueries(gameName, game.appid);
            try {
                latestTracks = normalizeTracks(await fetchTracks());
            }
            catch (_ignored) {
                latestTracks = tracks;
            }
            if (latestTracks[game.appid]) {
                completed += 1;
                skipped += 1;
                setBulkAssign((prev) => ({
                    ...prev,
                    completed,
                    skipped,
                    currentGame: gameName,
                    message: t("skippedAlreadyAssigned", { game: gameName }),
                }));
                continue;
            }
            const candidateResults = [];
            const seenVideoIds = new Set();
            let hadSearchError = false;
            let searchErrorSummary = "";
            for (const query of queryCandidates) {
                if (bulkAssignRunIdRef.current !== runId ||
                    bulkAssignStopRequestedRef.current) {
                    break;
                }
                setBulkAssign((prev) => ({
                    ...prev,
                    currentGame: gameName,
                    message: t("searchForGame", { game: gameName, query }),
                }));
                try {
                    const response = await searchYouTube(query, 5);
                    const results = response?.results || [];
                    for (const result of results) {
                        if (!isAutoAssignableYouTubeResult(result)) {
                            continue;
                        }
                        if (!result?.id || seenVideoIds.has(result.id)) {
                            continue;
                        }
                        seenVideoIds.add(result.id);
                        candidateResults.push(result);
                        if (candidateResults.length >= 8) {
                            break;
                        }
                    }
                    if (candidateResults.length >= 3) {
                        break;
                    }
                }
                catch (error) {
                    hadSearchError = true;
                    searchErrorSummary = getErrorMessage(error, "Unknown search error");
                }
            }
            if (bulkAssignRunIdRef.current !== runId ||
                bulkAssignStopRequestedRef.current) {
                break;
            }
            if (!candidateResults.length) {
                completed += 1;
                if (hadSearchError) {
                    failed += 1;
                }
                else {
                    skipped += 1;
                }
                setBulkAssign((prev) => ({
                    ...prev,
                    completed,
                    skipped,
                    failed,
                    currentGame: gameName,
                    message: hadSearchError
                        ? t("searchFailedForGame", {
                            game: gameName,
                            error: searchErrorSummary,
                        })
                        : t("noEligibleResults", { game: gameName }),
                }));
                continue;
            }
            try {
                latestTracks = normalizeTracks(await fetchTracks());
            }
            catch (_ignored) {
                latestTracks = tracks;
            }
            if (latestTracks[game.appid]) {
                completed += 1;
                skipped += 1;
                setBulkAssign((prev) => ({
                    ...prev,
                    completed,
                    skipped,
                    currentGame: gameName,
                    message: t("skippedAlreadyAssigned", { game: gameName }),
                }));
                continue;
            }
            let assignedCurrentGame = false;
            let lastDownloadError = "";
            for (let index = 0; index < candidateResults.length; index += 1) {
                if (bulkAssignRunIdRef.current !== runId ||
                    bulkAssignStopRequestedRef.current) {
                    break;
                }
                const result = candidateResults[index];
                setBulkAssign((prev) => ({
                    ...prev,
                    currentGame: gameName,
                    message: `Downloading match ${index + 1}/${candidateResults.length} for ${gameName}...`,
                }));
                try {
                    const normalizationEnabled = readAudioNormalizationSetting();
                    const upmixEnabled = readAudioUpmixSetting();
                    const ffmpegEnabled = normalizationEnabled || upmixEnabled;
                    const response = await downloadYouTubeAudio(game.appid, result.webpage_url, normalizationEnabled, upmixEnabled);
                    const ffmpegError = response.ffmpeg_error ?? response.normalization_error ?? null;
                    const normalized = normalizeTracks(response?.tracks);
                    latestTracks = normalized;
                    setTracks(normalized);
                    latestTracksForAutoPlay = normalized;
                    window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
                    assigned += 1;
                    completed += 1;
                    assignedCurrentGame = true;
                    setBulkAssign((prev) => ({
                        ...prev,
                        completed,
                        assigned,
                        currentGame: gameName,
                        ffmpegStatus: response.ffmpeg_processed
                            ? "success"
                            : ffmpegError
                                ? "failed"
                                : ffmpegEnabled
                                    ? "skipped"
                                    : "disabled",
                        ffmpegMessage: response.ffmpeg_processed
                            ? response.normalized && response.upmixed
                                ? t("ffmpegNormalizedUpmixedFor", { game: gameName })
                                : response.upmixed
                                    ? t("ffmpegUpmixedFor", { game: gameName })
                                    : t("ffmpegNormalizedFor", { game: gameName })
                            : ffmpegError
                                ? t("ffmpegFailedFor", {
                                    game: gameName,
                                    error: ffmpegError,
                                })
                                : ffmpegEnabled
                                    ? t("ffmpegSkippedFor", { game: gameName })
                                    : t("ffmpegDisabled"),
                        message: ffmpegError
                            ? t("normalizationSkipped", {
                                error: ffmpegError,
                            })
                            : `Assigned ${gameName}.`,
                    }));
                    break;
                }
                catch (error) {
                    lastDownloadError = getErrorMessage(error, "Unknown download error");
                }
            }
            if (!assignedCurrentGame) {
                completed += 1;
                failed += 1;
                setBulkAssign((prev) => ({
                    ...prev,
                    completed,
                    failed,
                    currentGame: gameName,
                    message: t("allDownloadAttemptsFailed", {
                        game: gameName,
                        error: lastDownloadError || "No usable results",
                    }),
                }));
            }
        }
        if (bulkAssignRunIdRef.current !== runId) {
            return;
        }
        const wasStopped = bulkAssignStopRequestedRef.current;
        bulkAssignStopRequestedRef.current = false;
        setBulkAssign((prev) => ({
            ...prev,
            running: false,
            stopRequested: false,
            currentGame: "",
            message: wasStopped
                ? t("bulkStopped", { assigned, skipped, failed })
                : t("bulkDone", { assigned, skipped, failed }),
        }));
        toaster.toast({
            title: "ThemeDeck",
            body: wasStopped
                ? t("bulkToastStopped", { assigned, skipped, failed })
                : t("bulkToastDone", { assigned, skipped, failed }),
        });
    }, [
        bulkAssign.running,
        getGameName,
        libraryGames,
        tracks,
        ytDlpBusy,
        ytDlpStatus.installed,
        setTracks,
    ]);
    const handleGlobalPreviewToggle = () => {
        if (!globalTrack)
            return;
        if (playback.appId === GLOBAL_AMBIENT_APP_ID &&
            playback.status === "playing") {
            stopPlayback();
            return;
        }
        playTrack({
            appId: GLOBAL_AMBIENT_APP_ID,
            path: globalTrack.path,
            filename: globalTrack.filename,
            volume: globalTrack.volume,
            startOffset: globalTrack.startOffset,
            loop: globalTrack.loop,
        }, "manual");
    };
    const handleGlobalVolumeChange = async (value) => {
        if (!globalTrack)
            return;
        const normalizedVolume = clamp(value / 100);
        const nextGlobal = { ...globalTrack, volume: normalizedVolume };
        setGlobalTrack(nextGlobal);
        latestGlobalTrackForAutoPlay = nextGlobal;
        applyVolumeToActiveTrack(GLOBAL_AMBIENT_APP_ID, normalizedVolume);
        try {
            const updated = await updateGlobalVolume(normalizedVolume);
            const normalized = normalizeGlobalTrack(updated);
            setGlobalTrack(normalized);
            latestGlobalTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] global volume update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveGlobalVolume"),
            });
        }
    };
    const handleGlobalStartOffsetChange = async (value) => {
        if (!globalTrack)
            return;
        const normalizedOffset = clamp(value, 0, 30);
        const nextGlobal = { ...globalTrack, startOffset: normalizedOffset };
        setGlobalTrack(nextGlobal);
        latestGlobalTrackForAutoPlay = nextGlobal;
        applyStartOffsetToActiveTrack(GLOBAL_AMBIENT_APP_ID, normalizedOffset);
        try {
            const updated = await updateGlobalStartOffset(normalizedOffset);
            const normalized = normalizeGlobalTrack(updated);
            setGlobalTrack(normalized);
            latestGlobalTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] global start offset update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveGlobalStart"),
            });
        }
    };
    const handleGlobalLoopChange = async (value) => {
        if (!globalTrack)
            return;
        const nextGlobal = { ...globalTrack, loop: value };
        setGlobalTrack(nextGlobal);
        latestGlobalTrackForAutoPlay = nextGlobal;
        applyLoopToActiveTrack(GLOBAL_AMBIENT_APP_ID, value);
        try {
            const updated = await updateGlobalLoop(value);
            const normalized = normalizeGlobalTrack(updated);
            setGlobalTrack(normalized);
            latestGlobalTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] global loop update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveGlobalLoop"),
            });
        }
    };
    const handleRemoveGlobalTrack = async () => {
        if (!globalTrack)
            return;
        try {
            const removedPath = globalTrack.path;
            const updated = await deleteGlobalTrack();
            const normalized = normalizeTracks(updated);
            setTracks(normalized);
            setGlobalTrack(null);
            latestTracksForAutoPlay = normalized;
            latestGlobalTrackForAutoPlay = null;
            clearGlobalAmbientResumeSnapshot();
            clearAudioCache(removedPath);
            if (playback.appId === GLOBAL_AMBIENT_APP_ID) {
                stopPlayback();
            }
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] remove global track failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("failedRemoveGlobal"),
            });
        }
    };
    const handleStorePreviewToggle = () => {
        if (!storeTrack)
            return;
        if (playback.appId === STORE_TRACK_APP_ID && playback.status === "playing") {
            stopPlayback();
            return;
        }
        playTrack({
            appId: STORE_TRACK_APP_ID,
            path: storeTrack.path,
            filename: storeTrack.filename,
            volume: storeTrack.volume,
            startOffset: storeTrack.startOffset,
            loop: storeTrack.loop,
        }, "manual");
    };
    const handleStoreVolumeChange = async (value) => {
        if (!storeTrack)
            return;
        const normalizedVolume = clamp(value / 100);
        const nextStore = { ...storeTrack, volume: normalizedVolume };
        setStoreTrack(nextStore);
        latestStoreTrackForAutoPlay = nextStore;
        applyVolumeToActiveTrack(STORE_TRACK_APP_ID, normalizedVolume);
        try {
            const updated = await updateStoreVolume(normalizedVolume);
            const normalized = normalizeGlobalTrack(updated);
            setStoreTrack(normalized);
            latestStoreTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] store volume update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveStoreVolume"),
            });
        }
    };
    const handleStoreStartOffsetChange = async (value) => {
        if (!storeTrack)
            return;
        const normalizedOffset = clamp(value, 0, 30);
        const nextStore = { ...storeTrack, startOffset: normalizedOffset };
        setStoreTrack(nextStore);
        latestStoreTrackForAutoPlay = nextStore;
        applyStartOffsetToActiveTrack(STORE_TRACK_APP_ID, normalizedOffset);
        try {
            const updated = await updateStoreStartOffset(normalizedOffset);
            const normalized = normalizeGlobalTrack(updated);
            setStoreTrack(normalized);
            latestStoreTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] store start offset update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveStoreStart"),
            });
        }
    };
    const handleStoreLoopChange = async (value) => {
        if (!storeTrack)
            return;
        const nextStore = { ...storeTrack, loop: value };
        setStoreTrack(nextStore);
        latestStoreTrackForAutoPlay = nextStore;
        applyLoopToActiveTrack(STORE_TRACK_APP_ID, value);
        try {
            const updated = await updateStoreLoop(value);
            const normalized = normalizeGlobalTrack(updated);
            setStoreTrack(normalized);
            latestStoreTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] store loop update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveStoreLoop"),
            });
        }
    };
    const handleRemoveStoreTrack = async () => {
        if (!storeTrack)
            return;
        try {
            const removedPath = storeTrack.path;
            const updated = await deleteStoreTrack();
            const normalized = normalizeTracks(updated);
            setTracks(normalized);
            setStoreTrack(null);
            latestTracksForAutoPlay = normalized;
            latestStoreTrackForAutoPlay = null;
            clearAudioCache(removedPath);
            if (playback.appId === STORE_TRACK_APP_ID) {
                stopPlayback();
            }
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
        }
        catch (error) {
            console.error("[ThemeDeck] remove store track failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("failedRemoveStore"),
            });
        }
    };
    SP_REACT.useEffect(() => {
        focusFirstInteractiveElement(topFocusRef.current);
    }, []);
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement("div", { className: "themedeck-main", style: {
                paddingBottom: "1.5rem",
                paddingRight: "0.85rem",
                paddingLeft: "0.25rem",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                overflowX: "hidden",
            } },
            window.SP_REACT.createElement("style", null, `
        .themedeck-main,
        .themedeck-main * {
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        .themedeck-main .themedeck-fit {
          width: calc(100% - 0.35rem) !important;
          max-width: calc(100% - 0.35rem) !important;
          min-width: 0 !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
        }
        .themedeck-main .themedeck-wrap {
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }
        .themedeck-main [class*="PanelSectionRow"] {
          max-width: 100% !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        .themedeck-main [class*="PanelSectionRow"] > * {
          max-width: 100% !important;
          min-width: 0 !important;
        }
        .themedeck-main [class*="FieldLabel"],
        .themedeck-main [class*="FieldDescription"],
        .themedeck-main [class*="ValueSuffix"],
        .themedeck-main [class*="Value"] {
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }
      `),
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement("div", null,
                window.SP_REACT.createElement(DFL.PanelSection, null,
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement(DFL.ToggleField, { checked: autoPlay, label: t("autoPlayLabel"), description: t("autoPlayDesc"), onChange: (value) => setAutoPlay(value) })),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { width: "100%" } },
                            window.SP_REACT.createElement(DFL.ToggleField, { checked: normalizeDownloadedAudio, label: t("normalizeAudioLabel"), description: t("normalizeAudioDesc"), onChange: (value) => setNormalizeDownloadedAudio(value) }),
                            window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                                window.SP_REACT.createElement(DFL.ToggleField, { checked: upmixDownloadedAudio, label: t("upmixAudioLabel"), description: t("upmixAudioDesc"), onChange: (value) => setUpmixDownloadedAudio(value) })),
                            window.SP_REACT.createElement("div", { style: {
                                    opacity: 0.72,
                                    fontSize: "0.78rem",
                                    lineHeight: 1.25,
                                    marginTop: "0.2rem",
                                    overflowWrap: "anywhere",
                                } }, t("normalizeAudioNotice")),
                            window.SP_REACT.createElement("div", { style: {
                                    opacity: 0.78,
                                    fontSize: "0.82rem",
                                    marginTop: "0.2rem",
                                    color: audioNormalizationStatus.available
                                        ? "inherit"
                                        : "#ffb3b3",
                                    overflowWrap: "anywhere",
                                } }, audioNormalizationStatus.available
                                ? `${t("normalizationAvailable")} ${audioNormalizationStatus.path || ""}`.trim()
                                : t("normalizationUnavailable")))),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { width: "100%" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(gameTrackMasterVolume * 100), label: t("gameMusicVolumeLabel"), min: 0, max: 100, step: 5, valueSuffix: "%", showValue: true, onChange: (value) => setGameTrackMasterVolume(clamp(value / 100)) }),
                            t("gameMusicVolumeDesc") ? (window.SP_REACT.createElement("div", { style: { opacity: 0.78, fontSize: "0.82rem", marginTop: "0.2rem" } }, t("gameMusicVolumeDesc"))) : null)),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { width: "100%" } },
                            window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, t("stopMusicAfterPlay")),
                            t("stopMusicAfterPlayDesc") ? (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.85rem" } }, t("stopMusicAfterPlayDesc"))) : null,
                            window.SP_REACT.createElement("div", { style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.35rem",
                                    marginTop: "0.45rem",
                                }, role: "radiogroup", "aria-label": t("stopMusicTimingAria") }, [
                                {
                                    value: "launch_start",
                                    label: t("launchStart"),
                                },
                                {
                                    value: "game_started",
                                    label: t("launchFinish"),
                                },
                            ].map((option) => (window.SP_REACT.createElement(FocusableButton, { key: option.value, className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => setLaunchStopMode(option.value), role: "radio", "aria-checked": launchStopMode === option.value, style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    justifyContent: "flex-start",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    whiteSpace: "normal",
                                    textAlign: "left",
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                    border: launchStopMode === option.value
                                        ? "1px solid rgba(120, 180, 255, 0.85)"
                                        : undefined,
                                } },
                                window.SP_REACT.createElement("span", { style: { minWidth: "1.4rem", textAlign: "center" } }, launchStopMode === option.value ? "(x)" : "( )"),
                                window.SP_REACT.createElement("span", null, option.label))))))),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement(DFL.ToggleField, { checked: globalAmbientEnabled, label: t("enableGlobalLabel"), description: t("enableGlobalDesc"), onChange: (value) => {
                                setGlobalAmbientEnabled(value);
                                scheduleAutoPlaybackFromContext();
                            } })),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement(DFL.ToggleField, { checked: storeTrackEnabled, label: t("enableStoreLabel"), description: t("enableStoreDesc"), onChange: (value) => {
                                setStoreTrackEnabled(value);
                                scheduleAutoPlaybackFromContext();
                            } })),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement(DFL.ToggleField, { checked: ambientDisableStore, label: t("disableGlobalStoreLabel"), description: t("disableGlobalStoreDesc"), onChange: (value) => {
                                setAmbientDisableStore(value);
                                scheduleAutoPlaybackFromContext();
                            } })),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { width: "100%" } },
                            window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, t("globalInterruptionLabel")),
                            t("globalInterruptionDesc") ? (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.85rem" } }, t("globalInterruptionDesc"))) : null,
                            window.SP_REACT.createElement("div", { style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.35rem",
                                    marginTop: "0.45rem",
                                }, role: "radiogroup", "aria-label": t("globalAmbientBehaviorAria") }, [
                                {
                                    value: "stop",
                                    label: t("interruptStop"),
                                },
                                {
                                    value: "pause",
                                    label: t("interruptPause"),
                                },
                                {
                                    value: "mute",
                                    label: t("interruptMute"),
                                },
                            ].map((option) => (window.SP_REACT.createElement(FocusableButton, { key: option.value, className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => setAmbientInterruptionMode(option.value), role: "radio", "aria-checked": ambientInterruptionMode === option.value, style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    justifyContent: "flex-start",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    whiteSpace: "normal",
                                    textAlign: "left",
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                    border: ambientInterruptionMode === option.value
                                        ? "1px solid rgba(120, 180, 255, 0.85)"
                                        : undefined,
                                } },
                                window.SP_REACT.createElement("span", { style: { minWidth: "1.4rem", textAlign: "center" } }, ambientInterruptionMode === option.value ? "(x)" : "( )"),
                                window.SP_REACT.createElement("span", null, option.label))))))),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: {
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                                alignItems: "stretch",
                            } },
                            window.SP_REACT.createElement("div", { style: { color: "#ff6b6b", fontWeight: 700, fontSize: "0.86rem" } }, t("ytdlpWarning")),
                            window.SP_REACT.createElement("div", { style: { color: "#ff8f8f", fontSize: "0.84rem" } }, ytDlpStatus.installed
                                ? `yt-dlp ${ytDlpStatus.version || ""}`.trim()
                                : t("ytdlpNotInstalled")),
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: handleUpdateYtDlp, disabled: ytDlpBusy, style: {
                                    textAlign: "left",
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                    color: "#ff6b6b",
                                    border: "1px solid rgba(255, 107, 107, 0.7)",
                                } }, ytDlpBusy ? t("updating") : t("updateYtdlp")))),
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: {
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                                alignItems: "stretch",
                            } },
                            t("deleteDownloadedTracksDesc") ? (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.84rem" } }, t("deleteDownloadedTracksDesc"))) : null,
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: handleDeleteDownloadedTracks, style: {
                                    textAlign: "left",
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                    color: "#ff8f8f",
                                    border: "1px solid rgba(255, 143, 143, 0.62)",
                                } }, t("deleteDownloadedTracks")))))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("autoAssignTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: { width: "100%" } },
                        t("autoAssignDesc") ? (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.85rem" } }, t("autoAssignDesc"))) : null,
                        window.SP_REACT.createElement("div", { style: { opacity: 0.95, fontSize: "0.88rem", marginTop: "0.25rem", fontWeight: 600 } }, t("missingCount", { count: unassignedLibraryGameCount })),
                        window.SP_REACT.createElement("div", { style: { opacity: 0.75, fontSize: "0.8rem", marginTop: "0.15rem" } }, t("libraryCount", { count: libraryGames.length })),
                        window.SP_REACT.createElement("div", { style: {
                                marginTop: "0.5rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                                alignItems: "stretch",
                            } },
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: handleAutoAssignMissingTracks, disabled: bulkAssign.running || ytDlpBusy || !ytDlpStatus.installed, style: {
                                    textAlign: "left",
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                } }, bulkAssign.running ? t("running") : t("autoAssignMissing")),
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: handleStopBulkAssign, disabled: !bulkAssign.running, style: {
                                    fontSize: "0.92rem",
                                    paddingRight: "0.65rem",
                                    paddingLeft: "0.65rem",
                                } }, t("stopButton"))),
                        (bulkAssign.running || bulkAssign.message) && (window.SP_REACT.createElement("div", { style: { marginTop: "0.55rem" } },
                            window.SP_REACT.createElement("div", { style: {
                                    width: "100%",
                                    height: "0.55rem",
                                    borderRadius: "0.35rem",
                                    background: "rgba(255,255,255,0.18)",
                                    overflow: "hidden",
                                } },
                                window.SP_REACT.createElement("div", { style: {
                                        width: `${bulkAssign.total > 0
                                            ? Math.min(100, Math.round((bulkAssign.completed / bulkAssign.total) * 100))
                                            : 0}%`,
                                        height: "100%",
                                        background: "rgba(98, 168, 255, 0.95)",
                                        transition: "width 0.2s ease",
                                    } })),
                            window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem", fontSize: "0.82rem", opacity: 0.85 } },
                                bulkAssign.completed,
                                "/",
                                bulkAssign.total,
                                " completed",
                                " • ",
                                "assigned ",
                                bulkAssign.assigned),
                            window.SP_REACT.createElement("div", { style: { marginTop: "0.15rem", fontSize: "0.82rem", opacity: 0.85 } },
                                "skipped ",
                                bulkAssign.skipped,
                                " • ",
                                "failed ",
                                bulkAssign.failed),
                            bulkAssign.currentGame && (window.SP_REACT.createElement("div", { style: { marginTop: "0.2rem", fontSize: "0.82rem", opacity: 0.85 } },
                                "Current game: ",
                                bulkAssign.currentGame,
                                bulkAssign.stopRequested ? " (stopping...)" : "")),
                            !!bulkAssign.message && (window.SP_REACT.createElement("div", { style: { marginTop: "0.2rem", fontSize: "0.82rem", opacity: 0.85 } }, bulkAssign.message)),
                            !!bulkAssign.ffmpegMessage && (window.SP_REACT.createElement("div", { style: {
                                    marginTop: "0.2rem",
                                    fontSize: "0.82rem",
                                    color: bulkAssign.ffmpegStatus === "success"
                                        ? "#ffb15c"
                                        : bulkAssign.ffmpegStatus === "failed"
                                            ? "#ff8f8f"
                                            : "rgba(255,255,255,0.72)",
                                } }, bulkAssign.ffmpegMessage)))))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                        } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => setShowMissingGames((prev) => !prev), style: {
                                textAlign: "left",
                                fontSize: "0.92rem",
                                paddingRight: "0.65rem",
                                paddingLeft: "0.65rem",
                            } }, showMissingGames ? t("hideMissingGames") : t("showMissingGames")),
                        showMissingGames ? (window.SP_REACT.createElement("div", { style: {
                                width: "100%",
                                borderRadius: "0.4rem",
                                background: "rgba(255,255,255,0.05)",
                                padding: "0.55rem 0.65rem",
                                maxHeight: "16rem",
                                overflowY: "auto",
                                overflowX: "hidden",
                            } }, missingGameNameStats.total > 0 ? (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                            window.SP_REACT.createElement("div", { style: { fontSize: "0.82rem", opacity: 0.9, marginBottom: "0.35rem" } },
                                missingGameNameStats.resolved,
                                "/",
                                missingGameNameStats.total,
                                " names resolved",
                                " • ",
                                "pending ",
                                missingGameNameStats.pending,
                                " • ",
                                "unavailable ",
                                missingGameNameStats.failed,
                                missingResolveInFlightCount > 0
                                    ? ` • checking ${missingResolveInFlightCount}`
                                    : ""),
                            window.SP_REACT.createElement("div", { style: {
                                    width: "100%",
                                    height: "0.5rem",
                                    borderRadius: "0.35rem",
                                    background: "rgba(255,255,255,0.16)",
                                    overflow: "hidden",
                                    marginBottom: "0.45rem",
                                } },
                                window.SP_REACT.createElement("div", { style: {
                                        width: `${missingGameNameStats.percent}%`,
                                        height: "100%",
                                        background: "rgba(98, 168, 255, 0.95)",
                                        transition: "width 0.25s ease",
                                    } })),
                            missingGameNameStats.pending > 0 && missingGamesList.length === 0 ? (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.86rem", marginBottom: "0.25rem" } }, "Resolving game names...")) : null,
                            missingGamesList.map((game) => (window.SP_REACT.createElement("div", { key: game.appid, style: {
                                    padding: "0.22rem 0",
                                    fontSize: "0.86rem",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                    color: game.status === "failed"
                                        ? "rgba(255, 200, 200, 0.92)"
                                        : game.isNonSteam
                                            ? "#6fe28f"
                                            : "inherit",
                                } },
                                game.name,
                                " (",
                                game.appid,
                                ")"))))) : (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.86rem" } }, t("noGamesMissingMusic"))))) : null)),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                        } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => setShowAssignedGames((prev) => !prev), style: {
                                textAlign: "left",
                                fontSize: "0.92rem",
                                paddingRight: "0.65rem",
                                paddingLeft: "0.65rem",
                            } }, showAssignedGames ? t("hideAssignedGames") : t("showAssignedGames")),
                        showAssignedGames ? (window.SP_REACT.createElement("div", { style: {
                                width: "100%",
                                borderRadius: "0.4rem",
                                background: "rgba(255,255,255,0.05)",
                                padding: "0.55rem 0.65rem",
                                maxHeight: "16rem",
                                overflowY: "auto",
                                overflowX: "hidden",
                            } }, assignedGamesList.length > 0 ? (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                            window.SP_REACT.createElement("div", { style: { fontSize: "0.82rem", opacity: 0.82, marginBottom: "0.35rem" } }, t("assignedNormalizedCaption")),
                            assignedGamesList.map((game) => (window.SP_REACT.createElement("div", { key: game.appid, style: {
                                    padding: "0.22rem 0",
                                    fontSize: "0.86rem",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                    color: game.normalized ? "#ffb15c" : "inherit",
                                } },
                                game.name,
                                " (",
                                game.appid,
                                ")"))))) : (window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.86rem" } }, t("noGamesWithMusic"))))) : null))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("globalAmbientPanelTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => DFL.Navigation.Navigate("/themedeck/global"), style: {
                            textAlign: "left",
                            fontSize: "0.92rem",
                            paddingRight: "0.65rem",
                            paddingLeft: "0.65rem",
                        } }, t("chooseGlobal"))),
                !globalTrack ? (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", null, t("noGlobalTrackSelected")))) : (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: { width: "100%" } },
                        window.SP_REACT.createElement("div", { style: { fontWeight: 600, overflowWrap: "anywhere" } }, globalTrack.filename),
                        window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.9rem", overflowWrap: "anywhere" } }, globalTrack.path),
                        window.SP_REACT.createElement("div", { style: {
                                display: "flex",
                                gap: "0.5rem",
                                marginTop: "0.5rem",
                                flexWrap: "nowrap",
                            } },
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", style: {
                                    width: "3rem",
                                    height: "2.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }, title: playback.appId === GLOBAL_AMBIENT_APP_ID &&
                                    playback.status === "playing"
                                    ? t("pausePreview")
                                    : t("previewTrack"), onClick: handleGlobalPreviewToggle }, playback.appId === GLOBAL_AMBIENT_APP_ID &&
                                playback.status === "playing" ? (window.SP_REACT.createElement(FaPause, null)) : (window.SP_REACT.createElement(FaPlay, null))),
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", style: {
                                    width: "3rem",
                                    height: "2.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }, title: t("removeGlobalAmbient"), onClick: handleRemoveGlobalTrack },
                                window.SP_REACT.createElement(FaTrash, null))),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.5rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(globalTrack.volume * 100), label: t("volume"), min: 0, max: 100, step: 5, valueSuffix: "%", showValue: true, onChange: handleGlobalVolumeChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(globalTrack.startOffset), label: t("startSkip"), min: 0, max: 30, step: 1, valueSuffix: "s", showValue: true, onChange: handleGlobalStartOffsetChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.ToggleField, { checked: globalTrack.loop, label: t("loopTrack"), description: t("loopTrackDesc"), onChange: handleGlobalLoopChange })))))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("storeOnlyPanelTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton themedeck-fit themedeck-wrap", onClick: () => DFL.Navigation.Navigate("/themedeck/store"), style: {
                            textAlign: "left",
                            fontSize: "0.92rem",
                            paddingRight: "0.65rem",
                            paddingLeft: "0.65rem",
                        } }, t("chooseStore"))),
                !storeTrack ? (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", null, t("noStoreOnlyTrackSelected")))) : (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: { width: "100%" } },
                        window.SP_REACT.createElement("div", { style: { fontWeight: 600, overflowWrap: "anywhere" } }, storeTrack.filename),
                        window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.9rem", overflowWrap: "anywhere" } }, storeTrack.path),
                        window.SP_REACT.createElement("div", { style: {
                                display: "flex",
                                gap: "0.5rem",
                                marginTop: "0.5rem",
                                flexWrap: "nowrap",
                            } },
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", style: {
                                    width: "3rem",
                                    height: "2.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }, title: playback.appId === STORE_TRACK_APP_ID &&
                                    playback.status === "playing"
                                    ? t("pausePreview")
                                    : t("previewTrack"), onClick: handleStorePreviewToggle }, playback.appId === STORE_TRACK_APP_ID &&
                                playback.status === "playing" ? (window.SP_REACT.createElement(FaPause, null)) : (window.SP_REACT.createElement(FaPlay, null))),
                            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", style: {
                                    width: "3rem",
                                    height: "2.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }, title: t("removeStoreOnly"), onClick: handleRemoveStoreTrack },
                                window.SP_REACT.createElement(FaTrash, null))),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.5rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(storeTrack.volume * 100), label: t("volume"), min: 0, max: 100, step: 5, valueSuffix: "%", showValue: true, onChange: handleStoreVolumeChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(storeTrack.startOffset), label: t("startSkip"), min: 0, max: 30, step: 1, valueSuffix: "s", showValue: true, onChange: handleStoreStartOffsetChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.ToggleField, { checked: storeTrack.loop, label: t("loopTrack"), description: t("loopTrackDesc"), onChange: handleStoreLoopChange })))))))));
};
const ChangeTheme = () => {
    const params = DFL.useParams();
    const appId = Number(params?.appid);
    const [track, setTrack] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [currentDir, setCurrentDir] = SP_REACT.useState("/home/deck");
    const [browser, setBrowser] = SP_REACT.useState({
        path: "/home/deck",
        dirs: [],
        files: [],
    });
    const [browserLoading, setBrowserLoading] = SP_REACT.useState(true);
    const [manualPath, setManualPath] = SP_REACT.useState("/home/deck");
    const [ytDlpStatus, setYtDlpStatus] = SP_REACT.useState({
        installed: false,
    });
    const [ytDlpBusy, setYtDlpBusy] = SP_REACT.useState(false);
    const [youtubeQuery, setYoutubeQuery] = SP_REACT.useState("");
    const [youtubeLoading, setYoutubeLoading] = SP_REACT.useState(false);
    const [youtubeResults, setYoutubeResults] = SP_REACT.useState([]);
    const [youtubeError, setYoutubeError] = SP_REACT.useState("");
    const [downloadingVideoId, setDownloadingVideoId] = SP_REACT.useState(null);
    const [routePathname, setRoutePathname] = SP_REACT.useState(window.location.pathname || "");
    const [selectedYouTubeId, setSelectedYouTubeId] = SP_REACT.useState(null);
    const topFocusRef = SP_REACT.useRef(null);
    const assignedVideoId = SP_REACT.useMemo(() => {
        if (!track?.filename)
            return "";
        const match = track.filename.match(/\[([A-Za-z0-9_-]{6,})\]\.[A-Za-z0-9]+$/);
        return match?.[1] ?? "";
    }, [track?.filename]);
    const [previewLoadingVideoId, setPreviewLoadingVideoId] = SP_REACT.useState(null);
    const [previewingVideoId, setPreviewingVideoId] = SP_REACT.useState(null);
    const previewAudioRef = SP_REACT.useRef(null);
    const playback = usePlaybackStateValue();
    const loadTrack = SP_REACT.useCallback(async () => {
        if (!appId)
            return;
        setLoading(true);
        try {
            const data = await fetchTracks();
            const normalized = normalizeTracks(data);
            setTrack(normalized[appId] ?? null);
        }
        catch (error) {
            console.error("[ThemeDeck] failed to load track", error);
        }
        finally {
            setLoading(false);
        }
    }, [appId]);
    SP_REACT.useEffect(() => {
        loadTrack();
    }, [loadTrack]);
    SP_REACT.useEffect(() => {
        let lastPath = window.location.pathname || "";
        const intervalId = window.setInterval(() => {
            const currentPath = window.location.pathname || "";
            if (currentPath !== lastPath) {
                lastPath = currentPath;
                setRoutePathname(currentPath);
            }
        }, 150);
        return () => window.clearInterval(intervalId);
    }, []);
    SP_REACT.useEffect(() => {
        const routeAppId = getThemeDeckRouteAppId(routePathname);
        const targetAppId = appId || routeAppId;
        if (!targetAppId)
            return;
        setYoutubeError("");
        setYoutubeResults([]);
        setYoutubeQuery("");
        const nextQuery = buildGameMusicSearchQueries(getDisplayName(targetAppId), targetAppId)[0];
        setYoutubeQuery(nextQuery);
        const delayedRefresh = window.setTimeout(() => {
            setYoutubeQuery(nextQuery);
        }, 250);
        return () => {
            window.clearTimeout(delayedRefresh);
        };
    }, [appId, routePathname]);
    SP_REACT.useEffect(() => {
        if (!youtubeResults.length) {
            setSelectedYouTubeId(null);
            return;
        }
        const currentlySelected = youtubeResults.find((item) => item.id === selectedYouTubeId);
        if (!currentlySelected) {
            setSelectedYouTubeId(youtubeResults[0].id);
        }
    }, [youtubeResults, selectedYouTubeId]);
    const refreshYtDlpStatus = SP_REACT.useCallback(async (silent = false) => {
        try {
            const status = await getYtDlpStatus();
            setYtDlpStatus(status);
        }
        catch (error) {
            console.error("[ThemeDeck] yt-dlp status failed", error);
            if (!silent) {
                toaster.toast({
                    title: "ThemeDeck",
                    body: t("failedReadYtdlpStatus"),
                });
            }
        }
    }, []);
    SP_REACT.useEffect(() => {
        refreshYtDlpStatus(true);
    }, [refreshYtDlpStatus]);
    const refreshDirectory = SP_REACT.useCallback(async (nextDir) => {
        if (!appId)
            return;
        setBrowserLoading(true);
        try {
            const listing = await listDirectory(nextDir || currentDir);
            setBrowser(listing);
            setCurrentDir(listing.path);
            setManualPath(listing.path);
        }
        catch (error) {
            console.error("[ThemeDeck] list directory failed", error);
        }
        finally {
            setBrowserLoading(false);
        }
    }, [appId, currentDir]);
    SP_REACT.useEffect(() => {
        refreshDirectory("/home/deck");
    }, []);
    SP_REACT.useEffect(() => {
        focusFirstInteractiveElement(topFocusRef.current);
    }, [appId]);
    SP_REACT.useEffect(() => () => {
        const preview = previewAudioRef.current;
        if (preview) {
            preview.pause();
            preview.src = "";
            previewAudioRef.current = null;
        }
    }, []);
    const saveFromPath = async (fullPath) => {
        if (!appId)
            return;
        try {
            const filename = fullPath.split("/").pop() || "track";
            await assignTrack(appId, fullPath, filename);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            await loadTrack();
            toaster.toast({
                title: "ThemeDeck",
                body: t("saveTrackToast", {
                    filename,
                    game: getDisplayName(appId),
                }),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] save from path failed", error);
            const message = error instanceof Error && error.message
                ? error.message
                : "Unable to add that file";
            console.error("[ThemeDeck] save from path detailed error", {
                app: appId,
                message,
                error,
                fullPath,
            });
            toaster.toast({
                title: "ThemeDeck",
                body: t("unableAddFile", { error: `${fullPath}: ${message}` }),
            });
        }
    };
    const handleYouTubeSearch = async () => {
        if (!ytDlpStatus.installed) {
            toaster.toast({
                title: "ThemeDeck",
                body: t("ytdlpMissing"),
            });
            return;
        }
        const query = youtubeQuery.trim();
        if (!query) {
            toaster.toast({
                title: "ThemeDeck",
                body: t("enterSearchQuery"),
            });
            return;
        }
        setYoutubeLoading(true);
        setYoutubeError("");
        try {
            const response = await searchYouTube(query, 20);
            setYoutubeResults(response?.results ?? []);
        }
        catch (error) {
            console.error("[ThemeDeck] youtube search failed", error);
            const message = getErrorMessage(error, "Unknown search error");
            setYoutubeError(message);
            toaster.toast({
                title: "ThemeDeck",
                body: t("youtubeSearchFailed", { error: message }),
            });
        }
        finally {
            setYoutubeLoading(false);
            refreshYtDlpStatus(true);
        }
    };
    const stopPreview = () => {
        const preview = previewAudioRef.current;
        if (!preview)
            return;
        preview.pause();
        preview.currentTime = 0;
        preview.src = "";
        setPreviewingVideoId(null);
    };
    const handleYouTubePreview = async (result) => {
        if (previewingVideoId === result.id) {
            stopPreview();
            return;
        }
        setPreviewLoadingVideoId(result.id);
        try {
            const response = await getYouTubePreviewStream(result.webpage_url);
            const streamUrl = (response?.stream_url || "").trim();
            if (!streamUrl) {
                throw new Error("No preview stream URL returned");
            }
            let preview = previewAudioRef.current;
            if (!preview) {
                preview = new Audio();
                preview.preload = "none";
                previewAudioRef.current = preview;
            }
            preview.onended = () => {
                setPreviewingVideoId(null);
            };
            preview.onerror = () => {
                setPreviewingVideoId(null);
            };
            preview.pause();
            preview.currentTime = 0;
            preview.src = streamUrl;
            await preview.play();
            setPreviewingVideoId(result.id);
        }
        catch (error) {
            const message = getErrorMessage(error, "Preview failed");
            toaster.toast({
                title: "ThemeDeck",
                body: t("previewFailed", { error: message }),
            });
            setPreviewingVideoId(null);
        }
        finally {
            setPreviewLoadingVideoId(null);
            refreshYtDlpStatus(true);
        }
    };
    const handleYouTubeDownload = async (result) => {
        if (!appId)
            return;
        setDownloadingVideoId(result.id);
        try {
            const response = await downloadYouTubeAudio(appId, result.webpage_url, readAudioNormalizationSetting(), readAudioUpmixSetting());
            const ffmpegError = response.ffmpeg_error ?? response.normalization_error ?? null;
            const normalized = normalizeTracks(response?.tracks);
            setTrack(normalized[appId] ?? null);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            if (ffmpegError) {
                toaster.toast({
                    title: "ThemeDeck",
                    body: t("normalizationSkipped", {
                        error: ffmpegError,
                    }),
                });
            }
            toaster.toast({
                title: "ThemeDeck",
                body: t("saveTrackToast", {
                    filename: response.filename,
                    game: getDisplayName(appId),
                }),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] youtube download failed", error);
            const message = getErrorMessage(error, "Unknown download error");
            toaster.toast({
                title: "ThemeDeck",
                body: t("youtubeDownloadFailed", { error: message }),
            });
        }
        finally {
            setDownloadingVideoId(null);
            refreshYtDlpStatus(true);
        }
    };
    const selectedYouTubeResult = SP_REACT.useMemo(() => youtubeResults.find((item) => item.id === selectedYouTubeId) ?? null, [youtubeResults, selectedYouTubeId]);
    const joinPath = (base, child) => base === "/" ? `/${child}` : `${base.replace(/\/$/, "")}/${child}`;
    const goUp = () => {
        if (currentDir === "/")
            return;
        const parent = currentDir.replace(/\/[^/]+$/, "") || "/";
        refreshDirectory(parent);
    };
    const handleDirClick = (dir) => {
        refreshDirectory(joinPath(currentDir, dir));
    };
    const handleFileClick = (file) => {
        saveFromPath(joinPath(currentDir, file));
    };
    const handleManualGo = () => {
        if (!manualPath)
            return;
        refreshDirectory(manualPath);
    };
    const handleRemove = async () => {
        if (!appId)
            return;
        try {
            await deleteTrack(appId);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            setTrack(null);
            toaster.toast({
                title: "ThemeDeck",
                body: t("clearedTrackToast", { game: getDisplayName(appId) }),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] route remove failed", error);
        }
    };
    const handleTrackVolumeChange = async (value) => {
        if (!track || !appId)
            return;
        const normalizedVolume = clamp(value / 100);
        const nextTrack = { ...track, volume: normalizedVolume };
        setTrack(nextTrack);
        applyVolumeToActiveTrack(appId, normalizedVolume);
        try {
            const updated = await updateTrackVolume(appId, normalizedVolume);
            const normalizedTracks = normalizeTracks(updated);
            setTrack(normalizedTracks[appId] ?? nextTrack);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
        }
        catch (error) {
            console.error("[ThemeDeck] route volume update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveVolume"),
            });
        }
    };
    const handleTrackStartOffsetChange = async (value) => {
        if (!track || !appId)
            return;
        const normalizedOffset = clamp(value, 0, 30);
        const nextTrack = { ...track, startOffset: normalizedOffset };
        setTrack(nextTrack);
        applyStartOffsetToActiveTrack(appId, normalizedOffset);
        try {
            const updated = await updateTrackStartOffset(appId, normalizedOffset);
            const normalizedTracks = normalizeTracks(updated);
            setTrack(normalizedTracks[appId] ?? nextTrack);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
        }
        catch (error) {
            console.error("[ThemeDeck] route start offset update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveStart"),
            });
        }
    };
    const handleTrackLoopChange = async (value) => {
        if (!track || !appId)
            return;
        const nextTrack = { ...track, loop: value };
        setTrack(nextTrack);
        applyLoopToActiveTrack(appId, value);
        try {
            const updated = await updateTrackLoop(appId, value);
            const normalizedTracks = normalizeTracks(updated);
            setTrack(normalizedTracks[appId] ?? nextTrack);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
        }
        catch (error) {
            console.error("[ThemeDeck] route loop update failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("couldNotSaveLoop"),
            });
        }
    };
    const handleTrackPreviewToggle = () => {
        if (!track || !appId)
            return;
        if (playback.appId === appId && playback.status === "playing") {
            stopPlayback();
            return;
        }
        playTrack(track, "manual");
    };
    if (!appId) {
        return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
            window.SP_REACT.createElement("div", { style: { padding: 24, paddingBottom: 120 } },
                window.SP_REACT.createElement(DFL.PanelSection, { title: "ThemeDeck" },
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null, t("invalidGameId"))))));
    }
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement("div", { style: {
                padding: 24,
                paddingTop: 48,
                paddingBottom: 140,
                minHeight: "100vh",
                boxSizing: "border-box",
            } },
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("themeDeckFor", { game: getDisplayName(appId) }) },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, loading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : track ? (window.SP_REACT.createElement("div", null,
                    window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, track.filename),
                    window.SP_REACT.createElement("div", { style: { opacity: 0.8 } }, track.path))) : (window.SP_REACT.createElement("div", null, t("noMusicSelected")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "nowrap",
                            alignItems: "center",
                        } },
                        track ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleTrackPreviewToggle, style: { minWidth: "6.5rem", whiteSpace: "nowrap" } }, playback.appId === appId && playback.status === "playing"
                            ? t("pause")
                            : t("play"))) : null,
                        track ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleRemove, style: { minWidth: "8.5rem", whiteSpace: "nowrap" } }, t("removeMusic"))) : null,
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => DFL.Navigation.NavigateBack(), style: { minWidth: "6rem", whiteSpace: "nowrap" } }, t("done")))),
                track ? (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: { width: "100%" } },
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.25rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(track.volume * 100), label: t("volume"), min: 0, max: 100, step: 5, valueSuffix: "%", showValue: true, onChange: handleTrackVolumeChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.SliderField, { value: Math.round(track.startOffset), label: t("startSkip"), min: 0, max: 30, step: 1, valueSuffix: "s", showValue: true, onChange: handleTrackStartOffsetChange })),
                        window.SP_REACT.createElement("div", { style: { marginTop: "0.35rem" } },
                            window.SP_REACT.createElement(DFL.ToggleField, { checked: track.loop, label: t("loopTrack"), description: t("loopTrackDesc"), onChange: handleTrackLoopChange }))))) : null),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("youtubeSearchTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                        } },
                        window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, ytDlpStatus.installed
                            ? `yt-dlp ${ytDlpStatus.version || ""}`.trim()
                            : t("ytdlpNotInstalled")),
                        ytDlpStatus.path ? (window.SP_REACT.createElement("div", { style: { fontFamily: "monospace", fontSize: "0.8rem", opacity: 0.8 } }, ytDlpStatus.path)) : null,
                        window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.85rem" } }, t("searchYoutubeDesc")),
                        !ytDlpStatus.installed ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: async () => {
                                setYtDlpBusy(true);
                                try {
                                    const status = await updateYtDlp();
                                    setYtDlpStatus(status);
                                    toaster.toast({
                                        title: "ThemeDeck",
                                        body: t("ytdlpReady", { version: status.version || "latest" }),
                                    });
                                }
                                catch (error) {
                                    toaster.toast({
                                        title: "ThemeDeck",
                                        body: t("failedInstallYtdlp", {
                                            error: getErrorMessage(error, t("unknownUpdateError")),
                                        }),
                                    });
                                }
                                finally {
                                    setYtDlpBusy(false);
                                    refreshYtDlpStatus(true);
                                }
                            }, disabled: ytDlpBusy, style: { width: "fit-content" } }, ytDlpBusy ? t("installing") : t("installYtdlp"))) : null)),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(DFL.TextField, { value: youtubeQuery, onChange: (event) => setYoutubeQuery(event.target.value), style: { width: "100%", minWidth: "22rem" } }),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleYouTubeSearch, disabled: youtubeLoading || ytDlpBusy, style: { minWidth: "12rem" } }, youtubeLoading ? t("searching") : t("search")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, youtubeError ? (window.SP_REACT.createElement("div", { style: {
                        width: "100%",
                        padding: "0.55rem 0.7rem",
                        borderRadius: "0.35rem",
                        background: "rgba(255, 90, 90, 0.13)",
                        color: "#ffd7d7",
                        fontSize: "0.85rem",
                        lineHeight: 1.35,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    } }, youtubeError)) : null),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, youtubeLoading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : (window.SP_REACT.createElement("div", { style: {
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    } },
                    !!selectedYouTubeResult && youtubeResults.length > 1 ? (window.SP_REACT.createElement("div", { style: { display: "flex", gap: "0.45rem", flexWrap: "wrap" } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => {
                                const index = youtubeResults.findIndex((item) => item.id === selectedYouTubeResult.id);
                                const next = index <= 0 ? youtubeResults[youtubeResults.length - 1] : youtubeResults[index - 1];
                                setSelectedYouTubeId(next.id);
                            }, style: { minWidth: "6rem", whiteSpace: "nowrap" } }, t("prev")),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => {
                                const index = youtubeResults.findIndex((item) => item.id === selectedYouTubeResult.id);
                                const next = index >= youtubeResults.length - 1 ? youtubeResults[0] : youtubeResults[index + 1];
                                setSelectedYouTubeId(next.id);
                            }, style: { minWidth: "6rem", whiteSpace: "nowrap" } }, t("next")),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => handleYouTubePreview(selectedYouTubeResult), disabled: previewLoadingVideoId !== null || downloadingVideoId !== null, style: { minWidth: "8rem", whiteSpace: "nowrap" } }, previewingVideoId === selectedYouTubeResult.id ? t("stopPreview") : t("playPreview")),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => handleYouTubeDownload(selectedYouTubeResult), disabled: downloadingVideoId !== null, style: { minWidth: "11rem", whiteSpace: "nowrap" } }, downloadingVideoId === selectedYouTubeResult.id ? t("downloading") : t("downloadAssign")))) : null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "grid",
                            gap: "0.5rem",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        } },
                        youtubeResults.map((result) => {
                            const duration = formatDuration(result.duration);
                            const thumbnailUrl = `https://i.ytimg.com/vi/${encodeURIComponent(result.id)}/hqdefault.jpg`;
                            const isCurrentlyAssigned = !!assignedVideoId && assignedVideoId === result.id;
                            const isSelected = selectedYouTubeId === result.id;
                            return (window.SP_REACT.createElement(DFL.Focusable, { key: result.id, "flow-children": "column", onActivate: () => setSelectedYouTubeId(result.id), style: {
                                    borderRadius: "0.4rem",
                                    padding: "0.6rem",
                                    background: isCurrentlyAssigned
                                        ? "rgba(80, 190, 90, 0.22)"
                                        : "rgba(255,255,255,0.05)",
                                    border: isCurrentlyAssigned
                                        ? "1px solid rgba(120, 230, 130, 0.75)"
                                        : isSelected
                                            ? "1px solid rgba(120, 180, 255, 0.85)"
                                            : "1px solid transparent",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.35rem",
                                } },
                                isSelected ? (window.SP_REACT.createElement("div", { style: { fontSize: "0.72rem", opacity: 0.9 } }, t("selected"))) : null,
                                window.SP_REACT.createElement("div", { onClick: () => setSelectedYouTubeId(result.id), style: { cursor: "pointer" } },
                                    window.SP_REACT.createElement("img", { src: thumbnailUrl, alt: result.title, style: {
                                            width: "100%",
                                            aspectRatio: "16 / 9",
                                            objectFit: "cover",
                                            borderRadius: "0.35rem",
                                            background: "rgba(0,0,0,0.25)",
                                        } })),
                                isCurrentlyAssigned ? (window.SP_REACT.createElement("div", { style: {
                                        display: "inline-block",
                                        width: "fit-content",
                                        padding: "0.15rem 0.4rem",
                                        borderRadius: "0.3rem",
                                        background: "rgba(120, 230, 130, 0.2)",
                                        color: "#b9fbc1",
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                    } }, t("currentAssigned"))) : null,
                                window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, result.title),
                                window.SP_REACT.createElement("div", { style: { opacity: 0.8, fontSize: "0.85rem" } }, [result.uploader || "", duration].filter(Boolean).join("  |  ") ||
                                    "YouTube"),
                                window.SP_REACT.createElement("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" } },
                                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => {
                                            setSelectedYouTubeId(result.id);
                                            handleYouTubePreview(result);
                                        }, disabled: previewLoadingVideoId !== null || downloadingVideoId !== null, style: { minWidth: "8rem", whiteSpace: "nowrap" } }, previewLoadingVideoId === result.id
                                        ? t("loading")
                                        : previewingVideoId === result.id
                                            ? t("stopPreview")
                                            : t("playPreview")),
                                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => {
                                            setSelectedYouTubeId(result.id);
                                            handleYouTubeDownload(result);
                                        }, disabled: downloadingVideoId !== null, style: { minWidth: "11rem", whiteSpace: "nowrap" } }, downloadingVideoId === result.id
                                        ? t("downloading")
                                        : t("downloadAssign")))));
                        }),
                        !youtubeResults.length && (window.SP_REACT.createElement("div", { style: { opacity: 0.7, whiteSpace: "nowrap" } }, t("noResults")))))))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("browseLocalTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "flex",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: goUp }, t("up")),
                        window.SP_REACT.createElement("div", { style: { flexGrow: 1, fontFamily: "monospace" } }, currentDir))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(DFL.TextField, { value: manualPath, onChange: (e) => setManualPath(e.target.value), style: { width: "100%", minWidth: "20rem" } }),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleManualGo }, t("go")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, browserLoading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : (window.SP_REACT.createElement("div", { style: {
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                        paddingRight: "0.25rem",
                    } },
                    browser.dirs.map((dir) => (window.SP_REACT.createElement(FocusableButton, { key: `dir-${dir}`, className: "DialogButton", onClick: () => handleDirClick(dir), style: { justifyContent: "flex-start" } },
                        "\uD83D\uDCC1 ",
                        dir))),
                    browser.files
                        .filter((file) => AUDIO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(`.${ext}`)))
                        .map((file) => (window.SP_REACT.createElement(FocusableButton, { key: `file-${file}`, className: "DialogButton", onClick: () => handleFileClick(file), style: { justifyContent: "flex-start" } },
                        "\uD83C\uDFB5 ",
                        file))),
                    !browser.dirs.length && !browser.files.length && (window.SP_REACT.createElement("div", { style: { opacity: 0.6 } }, "Folder is empty.")))))))));
};
const ChangeGlobalTheme = () => {
    const [track, setTrack] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [currentDir, setCurrentDir] = SP_REACT.useState("/home/deck");
    const [browser, setBrowser] = SP_REACT.useState({
        path: "/home/deck",
        dirs: [],
        files: [],
    });
    const [browserLoading, setBrowserLoading] = SP_REACT.useState(true);
    const [manualPath, setManualPath] = SP_REACT.useState("/home/deck");
    const topFocusRef = SP_REACT.useRef(null);
    const loadTrack = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchGlobalTrack();
            setTrack(normalizeGlobalTrack(data));
        }
        catch (error) {
            console.error("[ThemeDeck] failed to load global track", error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    SP_REACT.useEffect(() => {
        loadTrack();
    }, [loadTrack]);
    const refreshDirectory = SP_REACT.useCallback(async (nextDir) => {
        setBrowserLoading(true);
        try {
            const listing = await listDirectory(nextDir || currentDir);
            setBrowser(listing);
            setCurrentDir(listing.path);
            setManualPath(listing.path);
        }
        catch (error) {
            console.error("[ThemeDeck] list directory failed", error);
        }
        finally {
            setBrowserLoading(false);
        }
    }, [currentDir]);
    SP_REACT.useEffect(() => {
        refreshDirectory("/home/deck");
    }, []);
    SP_REACT.useEffect(() => {
        focusFirstInteractiveElement(topFocusRef.current);
    }, []);
    const saveFromPath = async (fullPath) => {
        try {
            const filename = fullPath.split("/").pop() || "track";
            const saved = await assignGlobalTrack(fullPath, filename);
            const normalized = normalizeGlobalTrack(saved);
            setTrack(normalized);
            latestGlobalTrackForAutoPlay = normalized;
            clearGlobalAmbientResumeSnapshot();
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
            toaster.toast({
                title: "ThemeDeck",
                body: t("savedGlobal"),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] global save from path failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("unableAddFile", {
                    error: getErrorMessage(error, t("unknownError")),
                }),
            });
        }
    };
    const joinPath = (base, child) => base === "/" ? `/${child}` : `${base.replace(/\/$/, "")}/${child}`;
    const goUp = () => {
        if (currentDir === "/")
            return;
        const parent = currentDir.replace(/\/[^/]+$/, "") || "/";
        refreshDirectory(parent);
    };
    const handleDirClick = (dir) => {
        refreshDirectory(joinPath(currentDir, dir));
    };
    const handleFileClick = (file) => {
        saveFromPath(joinPath(currentDir, file));
    };
    const handleManualGo = () => {
        if (!manualPath)
            return;
        refreshDirectory(manualPath);
    };
    const handleRemove = async () => {
        try {
            await deleteGlobalTrack();
            setTrack(null);
            latestGlobalTrackForAutoPlay = null;
            clearGlobalAmbientResumeSnapshot();
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
            toaster.toast({
                title: "ThemeDeck",
                body: t("clearedGlobal"),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] global remove failed", error);
        }
    };
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement("div", { style: {
                padding: 24,
                paddingTop: 48,
                paddingBottom: 140,
                minHeight: "100vh",
                boxSizing: "border-box",
            } },
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("globalTrackTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, loading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : track ? (window.SP_REACT.createElement("div", null,
                    window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, track.filename),
                    window.SP_REACT.createElement("div", { style: { opacity: 0.8 } }, track.path))) : (window.SP_REACT.createElement("div", null, t("noGlobalTrack")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "nowrap",
                            alignItems: "center",
                        } },
                        track ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleRemove, style: { minWidth: "8.5rem", whiteSpace: "nowrap" } }, t("removeMusic"))) : null,
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => DFL.Navigation.NavigateBack(), style: { minWidth: "6rem", whiteSpace: "nowrap" } }, t("done"))))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("browseLocalTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "flex",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: goUp }, t("up")),
                        window.SP_REACT.createElement("div", { style: { flexGrow: 1, fontFamily: "monospace" } }, currentDir))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(DFL.TextField, { value: manualPath, onChange: (e) => setManualPath(e.target.value), style: { width: "100%", minWidth: "20rem" } }),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleManualGo }, t("go")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, browserLoading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : (window.SP_REACT.createElement("div", { style: {
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                        paddingRight: "0.25rem",
                    } },
                    browser.dirs.map((dir) => (window.SP_REACT.createElement(FocusableButton, { key: `dir-${dir}`, className: "DialogButton", onClick: () => handleDirClick(dir), style: { justifyContent: "flex-start" } },
                        "\uD83D\uDCC1 ",
                        dir))),
                    browser.files
                        .filter((file) => AUDIO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(`.${ext}`)))
                        .map((file) => (window.SP_REACT.createElement(FocusableButton, { key: `file-${file}`, className: "DialogButton", onClick: () => handleFileClick(file), style: { justifyContent: "flex-start" } },
                        "\uD83C\uDFB5 ",
                        file))),
                    !browser.dirs.length && !browser.files.length && (window.SP_REACT.createElement("div", { style: { opacity: 0.6 } }, "Folder is empty.")))))))));
};
const ChangeStoreTheme = () => {
    const [track, setTrack] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [currentDir, setCurrentDir] = SP_REACT.useState("/home/deck");
    const [browser, setBrowser] = SP_REACT.useState({
        path: "/home/deck",
        dirs: [],
        files: [],
    });
    const [browserLoading, setBrowserLoading] = SP_REACT.useState(true);
    const [manualPath, setManualPath] = SP_REACT.useState("/home/deck");
    const topFocusRef = SP_REACT.useRef(null);
    const loadTrack = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchStoreTrack();
            setTrack(normalizeGlobalTrack(data));
        }
        catch (error) {
            console.error("[ThemeDeck] failed to load store track", error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    SP_REACT.useEffect(() => {
        loadTrack();
    }, [loadTrack]);
    const refreshDirectory = SP_REACT.useCallback(async (nextDir) => {
        setBrowserLoading(true);
        try {
            const listing = await listDirectory(nextDir || currentDir);
            setBrowser(listing);
            setCurrentDir(listing.path);
            setManualPath(listing.path);
        }
        catch (error) {
            console.error("[ThemeDeck] list directory failed", error);
        }
        finally {
            setBrowserLoading(false);
        }
    }, [currentDir]);
    SP_REACT.useEffect(() => {
        refreshDirectory("/home/deck");
    }, []);
    SP_REACT.useEffect(() => {
        focusFirstInteractiveElement(topFocusRef.current);
    }, []);
    const saveFromPath = async (fullPath) => {
        try {
            const filename = fullPath.split("/").pop() || "track";
            const saved = await assignStoreTrack(fullPath, filename);
            const normalized = normalizeGlobalTrack(saved);
            setTrack(normalized);
            latestStoreTrackForAutoPlay = normalized;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
            toaster.toast({
                title: "ThemeDeck",
                body: t("savedStore"),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] store save from path failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("unableAddFile", {
                    error: getErrorMessage(error, t("unknownError")),
                }),
            });
        }
    };
    const joinPath = (base, child) => base === "/" ? `/${child}` : `${base.replace(/\/$/, "")}/${child}`;
    const goUp = () => {
        if (currentDir === "/")
            return;
        const parent = currentDir.replace(/\/[^/]+$/, "") || "/";
        refreshDirectory(parent);
    };
    const handleDirClick = (dir) => {
        refreshDirectory(joinPath(currentDir, dir));
    };
    const handleFileClick = (file) => {
        saveFromPath(joinPath(currentDir, file));
    };
    const handleManualGo = () => {
        if (!manualPath)
            return;
        refreshDirectory(manualPath);
    };
    const handleRemove = async () => {
        try {
            await deleteStoreTrack();
            setTrack(null);
            latestStoreTrackForAutoPlay = null;
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            scheduleAutoPlaybackFromContext();
            toaster.toast({
                title: "ThemeDeck",
                body: t("clearedStore"),
            });
        }
        catch (error) {
            console.error("[ThemeDeck] store remove failed", error);
        }
    };
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement("div", { style: {
                padding: 24,
                paddingTop: 48,
                paddingBottom: 140,
                minHeight: "100vh",
                boxSizing: "border-box",
            } },
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("storeTrackTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, loading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : track ? (window.SP_REACT.createElement("div", null,
                    window.SP_REACT.createElement("div", { style: { fontWeight: 600 } }, track.filename),
                    window.SP_REACT.createElement("div", { style: { opacity: 0.8 } }, track.path))) : (window.SP_REACT.createElement("div", null, t("noStoreTrack")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            width: "100%",
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "nowrap",
                            alignItems: "center",
                        } },
                        track ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleRemove, style: { minWidth: "8.5rem", whiteSpace: "nowrap" } }, t("removeMusic"))) : null,
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => DFL.Navigation.NavigateBack(), style: { minWidth: "6rem", whiteSpace: "nowrap" } }, t("done"))))),
            window.SP_REACT.createElement(DFL.PanelSection, { title: t("browseLocalTitle") },
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "flex",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: goUp }, t("up")),
                        window.SP_REACT.createElement("div", { style: { flexGrow: 1, fontFamily: "monospace" } }, currentDir))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                    window.SP_REACT.createElement("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            width: "100%",
                            gap: "0.5rem",
                            alignItems: "center",
                        } },
                        window.SP_REACT.createElement(DFL.TextField, { value: manualPath, onChange: (e) => setManualPath(e.target.value), style: { width: "100%", minWidth: "20rem" } }),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleManualGo }, t("go")))),
                window.SP_REACT.createElement(DFL.PanelSectionRow, null, browserLoading ? (window.SP_REACT.createElement(DFL.Spinner, null)) : (window.SP_REACT.createElement("div", { style: {
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                        paddingRight: "0.25rem",
                    } },
                    browser.dirs.map((dir) => (window.SP_REACT.createElement(FocusableButton, { key: `dir-${dir}`, className: "DialogButton", onClick: () => handleDirClick(dir), style: { justifyContent: "flex-start" } },
                        "\uD83D\uDCC1 ",
                        dir))),
                    browser.files
                        .filter((file) => AUDIO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(`.${ext}`)))
                        .map((file) => (window.SP_REACT.createElement(FocusableButton, { key: `file-${file}`, className: "DialogButton", onClick: () => handleFileClick(file), style: { justifyContent: "flex-start" } },
                        "\uD83C\uDFB5 ",
                        file))),
                    !browser.dirs.length && !browser.files.length && (window.SP_REACT.createElement("div", { style: { opacity: 0.6 } }, "Folder is empty.")))))))));
};
var index = definePlugin(() => {
    startLocationWatcher();
    startSteamAppWatchers();
    startAutoPlaybackCoordinator();
    const gamePatches = GAME_DETAIL_ROUTES.map((path) => injectBridgeIntoRoute(path));
    const contextMenuUnpatch = patchContextMenuFocus();
    routerHook.addRoute("/themedeck/global", () => window.SP_REACT.createElement(ChangeGlobalTheme, null), { exact: true });
    routerHook.addRoute("/themedeck/store", () => window.SP_REACT.createElement(ChangeStoreTheme, null), { exact: true });
    routerHook.addRoute("/themedeck/:appid", () => window.SP_REACT.createElement(ChangeTheme, null), { exact: true });
    return {
        name: "ThemeDeck",
        titleView: (window.SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "ThemeDeck")),
        icon: window.SP_REACT.createElement(FaMusic, null),
        content: window.SP_REACT.createElement(Content, null),
        onDismount() {
            stopLocationWatcher();
            stopSteamAppWatchers();
            stopAutoPlaybackCoordinator();
            stopPlayback();
            clearAudioCache();
            contextMenuUnpatch?.();
            gamePatches.forEach((patch, index) => {
                try {
                    routerHook.removePatch(GAME_DETAIL_ROUTES[index], patch);
                }
                catch (error) {
                    console.error("[ThemeDeck] remove patch failed", error);
                }
            });
            try {
                routerHook.removeRoute("/themedeck/:appid");
            }
            catch (error) {
                console.error("[ThemeDeck] remove route failed", error);
            }
            try {
                routerHook.removeRoute("/themedeck/global");
            }
            catch (error) {
                console.error("[ThemeDeck] remove global route failed", error);
            }
            try {
                routerHook.removeRoute("/themedeck/store");
            }
            catch (error) {
                console.error("[ThemeDeck] remove store route failed", error);
            }
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
