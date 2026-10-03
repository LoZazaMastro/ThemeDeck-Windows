// @ts-nocheck
// Insert into Steam's Properties section, including nested React fragments.
// Return the original tree when no Properties action exists.
function insertPluginSection(React, tree, entry) {
    const keys = new Set(['playhub-metadata-edit', 'themedeck-change-music',
        'trailerhero-game-settings', 'launch-curtain-game-settings',
        'quick-settings-game-profile', 'playhub-artworks-change-artwork']);
    const collected = new Map();
    let anchor;
    function scan(node, depth = 0) {
        if (!node || depth > 32)
            return;
        if (Array.isArray(node)) {
            node.forEach(n => scan(n, depth + 1));
            return;
        }
        if (!React.isValidElement(node))
            return;
        if (keys.has(node.key)) {
            collected.set(node.key, node);
            return;
        }
        const handler = node.props?.onSelected ?? node.props?.onClick;
        if (typeof handler === 'function' && /(?:Show)?AppProperties/.test(Function.prototype.toString.call(handler)))
            anchor = node;
        scan(node.props?.children, depth + 1);
    }
    scan(tree);
    if (!anchor)
        return tree;
    collected.set(entry.key, entry);
    const ordered = [...keys].filter(key => collected.has(key)).map(key => collected.get(key));
    function visit(node, depth = 0) {
        if (!node || depth > 32)
            return node;
        if (Array.isArray(node))
            return node.flatMap(n => n === anchor ? [...ordered, n] : keys.has(n?.key) ? [] : [visit(n, depth + 1)]);
        if (!React.isValidElement(node))
            return node;
        if (keys.has(node.key))
            return null;
        if (node === anchor)
            return [...ordered, node];
        if (node.props?.children === undefined)
            return node;
        return React.cloneElement(node, { children: visit(node.props.children, depth + 1) });
    }
    return visit(tree);
}
// Steam's MobX menu replaces instance.render after its first render.
// Patch the inner native Menu as well, deriving the game from React owners.
function installMenuSectionFallback(React, ui, inject) {
    let proto, hooks, oldUseId, changedUseId = false;
    if (typeof ui.applyHookStubs !== 'function' || typeof ui.removeHookStubs !== 'function')
        return () => { };
    try {
        hooks = ui.applyHookStubs();
        oldUseId = hooks.useId;
        hooks.useId = () => "playhub-menu-probe";
        changedUseId = true;
        proto = ui.Menu({ children: [] })?.type?.prototype;
    }
    catch {
        return () => { };
    }
    finally {
        if (changedUseId)
            hooks.useId = oldUseId;
        ui.removeHookStubs();
    }
    if (!proto || typeof proto.render !== 'function')
        return () => { };
    let active = true;
    const restores = [];
    const appFor = (tree, instance) => {
        // Production React elements omit _owner; the mounted native Menu fiber
        // still identifies its enclosing LibraryContextMenu and selected games.
        for (let f = instance?._reactInternals?.return, i = 0; f && i < 32; f = f.return, i++) {
            if (typeof f.stateNode?.GetTargetApps === 'function') {
                const targets = f.stateNode.GetTargetApps();
                if (targets?.length !== 1)
                    return 0;
                const id = Number(targets[0]?.appid);
                return Number.isInteger(id) && id > 0 && id <= 0xffffffff ? id : 0;
            }
        }
        const ids = new Set();
        let multi = false;
        const seen = new Set();
        function walk(n, depth = 0) {
            if (!n || depth > 24 || seen.has(n))
                return;
            if (typeof n === 'object')
                seen.add(n);
            if (Array.isArray(n)) {
                n.forEach(x => walk(x, depth + 1));
                return;
            }
            if (!React.isValidElement(n))
                return;
            for (let owner = n._owner, i = 0; owner && i < 24; owner = owner.return, i++) {
                if (typeof owner.stateNode?.GetTargetApps === 'function') {
                    const targets = owner.stateNode.GetTargetApps();
                    if (targets?.length !== 1) {
                        multi = true;
                        break;
                    }
                    const id = Number(targets[0]?.appid);
                    if (Number.isInteger(id) && id > 0 && id <= 0xffffffff)
                        ids.add(id);
                    break;
                }
                const id = Number(owner.pendingProps?.overview?.appid ?? owner.memoizedProps?.overview?.appid);
                if (Number.isInteger(id) && id > 0 && id <= 0xffffffff) {
                    ids.add(id);
                    break;
                }
            }
            walk(n.props?.children, depth + 1);
        }
        walk(tree);
        return !multi && ids.size === 1 ? [...ids][0] : 0;
    };
    const transform = (tree, instance) => {
        if (!active)
            return tree;
        try {
            const id = appFor(tree, instance);
            return id ? inject(tree, id) : tree;
        }
        catch (e) {
            console.warn('[Playhub menu] native menu injection skipped', e);
            return tree;
        }
    };
    function patch(name, wrap) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, name);
        const original = proto[name];
        if (typeof original !== 'function' || (descriptor && !descriptor.configurable && !descriptor.writable))
            return;
        const replacement = function (...args) { return active ? wrap.call(this, original, args) : original.apply(this, args); };
        Object.defineProperty(proto, name, { configurable: true, writable: true, enumerable: descriptor?.enumerable ?? false, value: replacement });
        restores.push(() => { if (proto[name] === replacement) {
            if (descriptor)
                Object.defineProperty(proto, name, descriptor);
            else
                delete proto[name];
        } });
    }
    patch('render', function (original, args) { return transform(original.apply(this, args), this); });
    patch('shouldComponentUpdate', function (original, args) {
        const children = args[0]?.children;
        if (Array.isArray(children) && !Object.isFrozen(children)) {
            const wrapper = React.createElement(React.Fragment, { children });
            const result = transform(wrapper, this);
            if (result !== wrapper && Array.isArray(result?.props?.children))
                children.splice(0, children.length, ...result.props.children);
        }
        return original.apply(this, args);
    });
    return () => { active = false; restores.reverse().forEach(restore => restore()); };
}

// Decky Loader will pass this api in, it's versioned to allow for backwards compatibility.
// @ts-ignore

// Prevents it from being duplicated in output.
const manifest = {"name":"ThemeDeck","author":"BrenticusMaximus, LoZazaMastro","flags":[],"api_version":1,"publish":{"tags":["music","theme","library"],"description":"Add custom game, ambient, and Store music to Steam Gaming Mode on Windows, with local files, yt-dlp, and Now Playing awareness.","image":"https://opengraph.githubassets.com/1/SteamDeckHomebrew/PluginLoader"},"version":"3.3.7"};
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
function FaArrowLeft (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"},"child":[]}]})(props);
}function FaCheck (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"},"child":[]}]})(props);
}function FaChevronRight (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 320 512"},"child":[{"tag":"path","attr":{"d":"M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"},"child":[]}]})(props);
}function FaCompactDisc (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 496 512"},"child":[{"tag":"path","attr":{"d":"M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM88 256H56c0-105.9 86.1-192 192-192v32c-88.2 0-160 71.8-160 160zm160 96c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96zm0-128c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"},"child":[]}]})(props);
}function FaDownload (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},"child":[]}]})(props);
}function FaFolder (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z"},"child":[]}]})(props);
}function FaMinus (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"},"child":[]}]})(props);
}function FaMusic (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z"},"child":[]}]})(props);
}function FaPause (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"},"child":[]}]})(props);
}function FaPlay (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"},"child":[]}]})(props);
}function FaPlus (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"},"child":[]}]})(props);
}function FaRedo (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"},"child":[]}]})(props);
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
    return new RegExp(`^${pattern}(?:/|$)`);
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
const searchYouTube = callable("search_youtube");
const downloadYouTubeAudio = callable("download_youtube_audio");
const startDiscoverDownload = callable("start_discover_download");
const startGameDownload = callable("start_game_download");
const getDiscoverDownloadProgress = callable("get_discover_download_progress");
const getYouTubePreviewStream = callable("get_youtube_preview_stream");
const playYouTubePreview = async (audio, response) => {
    const candidates = Array.from(new Set([...(response.stream_urls || []), response.stream_url].filter(Boolean)));
    let lastError = new Error("No preview stream URL returned");
    for (const url of candidates) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        try {
            await new Promise((resolve, reject) => {
                const timeout = window.setTimeout(() => finish(new Error("Preview stream timed out")), 6500);
                const finish = (error) => {
                    window.clearTimeout(timeout);
                    audio.removeEventListener("canplay", ready);
                    audio.removeEventListener("error", failed);
                    if (error)
                        reject(error);
                    else
                        resolve();
                };
                const ready = () => finish();
                const failed = () => finish(new Error("Unsupported preview stream"));
                audio.addEventListener("canplay", ready, { once: true });
                audio.addEventListener("error", failed, { once: true });
                audio.src = url;
                audio.load();
            });
            await audio.play();
            return;
        }
        catch (error) {
            lastError = error;
        }
    }
    throw lastError;
};
const getYtDlpStatus = callable("get_yt_dlp_status");
const startYtDlpUpdate = callable("start_yt_dlp_update");
const getYtDlpUpdateProgress = callable("get_yt_dlp_update_progress");
const getAudioNormalizationStatus = callable("get_audio_normalization_status");
const getExternalMediaState = callable("get_external_media_state");
const getSteamMediaState = callable("get_steam_media_state");
const deleteUnusedTracks = callable("delete_unused_tracks");
const validateAudioPath = callable("validate_audio_path");
const TRACKS_UPDATED_EVENT = "themedeck:tracks-updated";
const AUDIO_EXTENSIONS = ["mp3", "aac", "flac", "ogg", "wav", "m4a", "webm"];
const EXCLUDED_AUTO_ASSIGN_STORAGE_KEY = "themedeck:excludedAutoAssignAppIds";
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
const RUNNING_APP_POLL_MS = 3000;
const EXTERNAL_MEDIA_POLL_MS = 500;
const STEAM_CDP_MEDIA_POLL_MS = 3000;
const LEGACY_EXTERNAL_MEDIA_POLL_MS = 1500;
const NOW_PLAYING_ACTIVITY_EVENT = "playhub:now-playing-activity";
const NOW_PLAYING_ACTIVITY_GLOBAL = "__playhubNowPlayingActivity";
const NOW_PLAYING_ACTIVITY_MAX_AGE_MS = 6500;
const STORE_CONTEXT_POLL_MS = 1500;
const LAUNCH_FINISH_FALLBACK_MS = 8000;
const DETAIL_ROUTE_GRACE_MS = 0;
const AUTO_PLAYBACK_DEBOUNCE_MS = 80;
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
    introVersion: "ThemeDeck 3.3.7",
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
    autoAssignTitle: "Assign missing tracks",
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
    chooseAutoAssignExclusions: "Exclude games from automatic assignment",
    autoAssignExclusionsTitle: "Automatic assignment exclusions",
    autoAssignExclusionsDesc: "Checked games will be skipped when assigning missing tracks.",
    back: "Back",
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
    removeTrack: "Remove track",
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
    browseLocalTitle: "Choose a local file",
    chooseAudioFile: "Choose audio file",
    up: "Up",
    go: "Go",
    globalTrackTitle: "Ambient track",
    noGlobalTrack: "No ambient track selected yet.",
    storeTrackTitle: "Store track",
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
    deleteDownloadedTracks: "Delete all downloads",
    deleteDownloadedTracksDesc: "",
    deleteDownloadedTracksTitle: "Delete all ThemeDeck downloads?",
    confirmDeleteDownloadedTracks: "Delete all audio files downloaded by ThemeDeck? Files selected from your personal folders and assigned to games are not subject to deletion.",
    yes: "Yes",
    no: "No",
    deleting: "Deleting...",
    preparingDelete: "Preparing deletion...",
    deletedProgress: "Deleted {completed} of {total}",
    close: "Close",
    deletedDownloadedTracks: "Deleted {files} files and removed {tracks} assignments.",
    failedDeleteDownloadedTracks: "Failed to delete downloaded tracks",
    deleteUnusedDownloadedTracks: "Delete unused downloads",
    deleteUnusedDownloadedTracksTitle: "Delete unused downloaded files?",
    confirmDeleteUnusedDownloadedTracks: "ThemeDeck deletes downloaded music for uninstalled Steam games, removed non-Steam shortcuts, and unused tracks. Music shared with another game, Ambient, or Store stays available.",
    deletedUnusedDownloadedTracks: "Removed {files} unused files.",
    failedDeleteUnusedDownloadedTracks: "Couldn't delete unused downloads",
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
        autoAssignTitle: "Assegna tracce mancanti",
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
        chooseAutoAssignExclusions: "Escludi giochi dall'assegnazione automatica",
        autoAssignExclusionsTitle: "Esclusioni assegnazione automatica",
        autoAssignExclusionsDesc: "I giochi selezionati verranno ignorati durante l'assegnazione delle tracce mancanti.",
        back: "Indietro",
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
        removeTrack: "Rimuovi brano",
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
        browseLocalTitle: "Scegli un file locale",
        chooseAudioFile: "Scegli file audio",
        up: "Su",
        go: "Vai",
        globalTrackTitle: "Traccia ambientale",
        noGlobalTrack: "Nessuna traccia ambientale selezionata.",
        storeTrackTitle: "Traccia Store",
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
        autoAssignTitle: "Assigner les pistes manquantes",
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
        globalTrackTitle: "Piste d'ambiance",
        noGlobalTrack: "Aucune piste globale sélectionnée.",
        storeTrackTitle: "Piste Store",
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
        autoAssignTitle: "Asignar pistas faltantes",
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
        globalTrackTitle: "Pista ambiental",
        noGlobalTrack: "No hay pista global seleccionada.",
        storeTrackTitle: "Pista Store",
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
        autoAssignTitle: "Atribuir faixas em falta",
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
        globalTrackTitle: "Faixa ambiente",
        noGlobalTrack: "Nenhuma faixa global selecionada.",
        storeTrackTitle: "Faixa Store",
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
        autoAssignTitle: "Atribuir faixas ausentes",
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
        globalTrackTitle: "Faixa ambiente",
        noGlobalTrack: "Nenhuma faixa global selecionada.",
        storeTrackTitle: "Faixa Store",
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
        autoAssignTitle: "Fehlende Titel zuweisen",
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
        globalTrackTitle: "Umgebungsspur",
        noGlobalTrack: "Keine globale Spur ausgewählt.",
        storeTrackTitle: "Store-Spur",
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
        autoAssignTitle: "Ontbrekende tracks toewijzen",
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
        globalTrackTitle: "Ambient-track",
        noGlobalTrack: "Geen globale track geselecteerd.",
        storeTrackTitle: "Store-track",
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
        autoAssignTitle: "Призначити відсутні треки",
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
        globalTrackTitle: "Фоновий трек",
        noGlobalTrack: "Глобальний трек не вибрано.",
        storeTrackTitle: "Трек Store",
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
        autoAssignTitle: "分配缺失曲目",
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
        globalTrackTitle: "环境曲目",
        noGlobalTrack: "尚未选择全局曲目。",
        storeTrackTitle: "商店曲目",
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
        autoAssignTitle: "不足しているトラックを割り当て",
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
        globalTrackTitle: "環境トラック",
        noGlobalTrack: "グローバルトラックが選択されていません。",
        storeTrackTitle: "ストアトラック",
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
        introVersion: "ThemeDeck 3.3.7",
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
        globalTrackTitle: "Traccia ambientale",
        noGlobalTrack: "Nessuna traccia ambientale selezionata.",
        storeTrackTitle: "Traccia Store",
        noStoreTrack: "Nessuna traccia Store selezionata.",
        savedGlobal: "Musica ambientale salvata",
        clearedGlobal: "Musica ambientale rimossa",
        savedStore: "Musica Store salvata",
        clearedStore: "Musica Store rimossa",
        deleteDownloadedTracksDesc: "",
        deleteDownloadedTracks: "Cancella tutti i download",
        deleteDownloadedTracksTitle: "Eliminare tutti i download ThemeDeck?",
        confirmDeleteDownloadedTracks: "Cancellare tutti i file audio scaricati da ThemeDeck? I file selezionati dalle tue cartelle personali assegnati ai giochi non sono soggetti a eliminazione.",
        deleteUnusedDownloadedTracks: "Cancella download non usati",
        deleteUnusedDownloadedTracksTitle: "Eliminare i download non usati?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck elimina la musica scaricata per i giochi Steam disinstallati, i collegamenti rimossi da Steam e le tracce inutilizzate. La musica condivisa con altri giochi, Ambiente o Negozio viene conservata.",
        deletedUnusedDownloadedTracks: "Rimossi {files} file non usati.",
        failedDeleteUnusedDownloadedTracks: "Impossibile cancellare i download non usati",
        ffmpegNormalizedFor: "FFmpeg: normalizzato per {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 per {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizzato e upmix 7.1 per {game}",
        ffmpegSkippedFor: "FFmpeg: saltato per {game}",
        ffmpegDisabled: "Elaborazione FFmpeg disattivata",
        ffmpegFailedFor: "FFmpeg: errore per {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento interruzione ambientale",
    },
    fr: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Exclure des jeux de l'attribution automatique",
        autoAssignExclusionsTitle: "Exclusions de l'attribution automatique",
        autoAssignExclusionsDesc: "Les jeux cochés seront ignorés lors de l'attribution des pistes manquantes.",
        back: "Retour",
        removeTrack: "Supprimer la piste",
        browseLocalTitle: "Choisir un fichier local",
        chooseAudioFile: "Choisir un fichier audio",
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
        globalTrackTitle: "Piste d'ambiance",
        noGlobalTrack: "Aucune piste d'ambiance sélectionnée.",
        storeTrackTitle: "Piste Store",
        noStoreTrack: "Aucune piste Store sélectionnée.",
        savedGlobal: "Musique d'ambiance enregistrée",
        clearedGlobal: "Musique d'ambiance supprimée",
        savedStore: "Musique Store enregistrée",
        clearedStore: "Musique Store supprimée",
        deleteDownloadedTracks: "Supprimer tous les téléchargements",
        deleteDownloadedTracksTitle: "Supprimer tous les téléchargements ThemeDeck ?",
        confirmDeleteDownloadedTracks: "Supprimer tous les fichiers audio téléchargés par ThemeDeck ? Les fichiers sélectionnés dans vos dossiers personnels et assignés aux jeux ne sont pas concernés.",
        deleteUnusedDownloadedTracks: "Supprimer les téléchargements inutilisés",
        deleteUnusedDownloadedTracksTitle: "Supprimer les fichiers téléchargés inutilisés ?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck supprime la musique téléchargée des jeux Steam désinstallés, des raccourcis retirés de Steam et les pistes inutilisées. La musique partagée avec un autre jeu, Ambiance ou Boutique est conservée.",
        deletedUnusedDownloadedTracks: "{files} fichiers inutilisés supprimés.",
        failedDeleteUnusedDownloadedTracks: "Impossible de supprimer les téléchargements inutilisés",
        ffmpegNormalizedFor: "FFmpeg : normalisé pour {game}",
        ffmpegUpmixedFor: "FFmpeg : upmix 7.1 pour {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg : normalisé et upmix 7.1 pour {game}",
        ffmpegSkippedFor: "FFmpeg : ignoré pour {game}",
        ffmpegDisabled: "Traitement FFmpeg désactivé",
        ffmpegFailedFor: "FFmpeg : échec pour {game} : {error}",
        globalAmbientBehaviorAria: "Comportement d'interruption de l'ambiance",
    },
    es: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Excluir juegos de la asignación automática",
        autoAssignExclusionsTitle: "Exclusiones de asignación automática",
        autoAssignExclusionsDesc: "Los juegos marcados se omitirán al asignar pistas faltantes.",
        back: "Atrás",
        removeTrack: "Eliminar pista",
        browseLocalTitle: "Elegir un archivo local",
        chooseAudioFile: "Elegir archivo de audio",
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
        globalTrackTitle: "Pista ambiental",
        noGlobalTrack: "Aún no hay pista ambiental seleccionada.",
        storeTrackTitle: "Pista Store",
        noStoreTrack: "Aún no hay pista Store seleccionada.",
        savedGlobal: "Música ambiental guardada",
        clearedGlobal: "Música ambiental eliminada",
        savedStore: "Música Store guardada",
        clearedStore: "Música Store eliminada",
        deleteDownloadedTracks: "Eliminar todas las descargas",
        deleteDownloadedTracksTitle: "¿Eliminar todas las descargas de ThemeDeck?",
        confirmDeleteDownloadedTracks: "¿Eliminar todos los archivos de audio descargados por ThemeDeck? Los archivos seleccionados desde tus carpetas personales y asignados a juegos no se eliminarán.",
        deleteUnusedDownloadedTracks: "Eliminar descargas no usadas",
        deleteUnusedDownloadedTracksTitle: "¿Eliminar los archivos descargados no usados?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck elimina la música descargada de juegos de Steam desinstalados, accesos directos eliminados y pistas sin uso. La música compartida con otro juego, Ambiente o Tienda se conserva.",
        deletedUnusedDownloadedTracks: "Se eliminaron {files} archivos no usados.",
        failedDeleteUnusedDownloadedTracks: "No se pudieron eliminar las descargas no usadas",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado y upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: omitido para {game}",
        ffmpegDisabled: "Procesamiento FFmpeg desactivado",
        ffmpegFailedFor: "FFmpeg: error en {game}: {error}",
        globalAmbientBehaviorAria: "Comportamiento de interrupción ambiental",
    },
    pt: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Excluir jogos da atribuição automática",
        autoAssignExclusionsTitle: "Exclusões da atribuição automática",
        autoAssignExclusionsDesc: "Os jogos assinalados serão ignorados ao atribuir faixas em falta.",
        back: "Voltar",
        removeTrack: "Remover faixa",
        browseLocalTitle: "Escolher um ficheiro local",
        chooseAudioFile: "Escolher ficheiro de áudio",
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
        globalTrackTitle: "Faixa ambiente",
        noGlobalTrack: "Nenhuma faixa ambiente selecionada.",
        storeTrackTitle: "Faixa Store",
        noStoreTrack: "Nenhuma faixa Store selecionada.",
        savedGlobal: "Música ambiente salva",
        clearedGlobal: "Música ambiente removida",
        savedStore: "Música Store salva",
        clearedStore: "Música Store removida",
        deleteDownloadedTracks: "Eliminar todos os downloads",
        deleteDownloadedTracksTitle: "Eliminar todos os downloads do ThemeDeck?",
        confirmDeleteDownloadedTracks: "Eliminar todos os ficheiros de áudio descarregados pelo ThemeDeck? Os ficheiros escolhidos nas tuas pastas pessoais e atribuídos a jogos não serão eliminados.",
        deleteUnusedDownloadedTracks: "Eliminar downloads não usados",
        deleteUnusedDownloadedTracksTitle: "Eliminar ficheiros descarregados não usados?",
        confirmDeleteUnusedDownloadedTracks: "O ThemeDeck elimina a música descarregada de jogos Steam desinstalados, atalhos removidos e faixas sem uso. A música partilhada com outro jogo, Ambiente ou Loja é mantida.",
        deletedUnusedDownloadedTracks: "Eliminados {files} ficheiros não usados.",
        failedDeleteUnusedDownloadedTracks: "Falha ao eliminar downloads não usados",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado e upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: ignorado para {game}",
        ffmpegDisabled: "Processamento FFmpeg desativado",
        ffmpegFailedFor: "FFmpeg: erro em {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento de interrupção ambiente",
    },
    "pt-br": {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Excluir jogos da atribuição automática",
        autoAssignExclusionsTitle: "Exclusões da atribuição automática",
        autoAssignExclusionsDesc: "Os jogos marcados serão ignorados ao atribuir faixas ausentes.",
        back: "Voltar",
        removeTrack: "Remover faixa",
        browseLocalTitle: "Escolher um arquivo local",
        chooseAudioFile: "Escolher arquivo de áudio",
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
        globalTrackTitle: "Faixa ambiente",
        noGlobalTrack: "Nenhuma faixa ambiente selecionada.",
        storeTrackTitle: "Faixa Store",
        noStoreTrack: "Nenhuma faixa Store selecionada.",
        savedGlobal: "Música ambiente salva",
        clearedGlobal: "Música ambiente removida",
        savedStore: "Música Store salva",
        clearedStore: "Música Store removida",
        deleteDownloadedTracks: "Excluir todos os downloads",
        deleteDownloadedTracksTitle: "Excluir todos os downloads do ThemeDeck?",
        confirmDeleteDownloadedTracks: "Excluir todos os arquivos de áudio baixados pelo ThemeDeck? Os arquivos escolhidos nas suas pastas pessoais e atribuídos a jogos não serão excluídos.",
        deleteUnusedDownloadedTracks: "Excluir downloads não usados",
        deleteUnusedDownloadedTracksTitle: "Excluir arquivos baixados não usados?",
        confirmDeleteUnusedDownloadedTracks: "O ThemeDeck exclui a música baixada de jogos Steam desinstalados, atalhos removidos e faixas sem uso. A música compartilhada com outro jogo, Ambiente ou Loja é mantida.",
        deletedUnusedDownloadedTracks: "{files} arquivos não usados excluídos.",
        failedDeleteUnusedDownloadedTracks: "Falha ao excluir downloads não usados",
        ffmpegNormalizedFor: "FFmpeg: normalizado para {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 para {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: normalizado e upmix 7.1 para {game}",
        ffmpegSkippedFor: "FFmpeg: ignorado para {game}",
        ffmpegDisabled: "Processamento FFmpeg desativado",
        ffmpegFailedFor: "FFmpeg: erro em {game}: {error}",
        globalAmbientBehaviorAria: "Comportamento de interrupção ambiente",
    },
    de: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Spiele von der automatischen Zuweisung ausschließen",
        autoAssignExclusionsTitle: "Ausnahmen für automatische Zuweisung",
        autoAssignExclusionsDesc: "Markierte Spiele werden beim Zuweisen fehlender Spuren übersprungen.",
        back: "Zurück",
        removeTrack: "Spur entfernen",
        browseLocalTitle: "Lokale Datei auswählen",
        chooseAudioFile: "Audiodatei auswählen",
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
        globalTrackTitle: "Umgebungsspur",
        noGlobalTrack: "Noch keine Umgebungsspur ausgewählt.",
        storeTrackTitle: "Store-Spur",
        noStoreTrack: "Noch keine Store-Spur ausgewählt.",
        savedGlobal: "Umgebungsmusik gespeichert",
        clearedGlobal: "Umgebungsmusik entfernt",
        savedStore: "Store-Musik gespeichert",
        clearedStore: "Store-Musik entfernt",
        deleteDownloadedTracks: "Alle Downloads löschen",
        deleteDownloadedTracksTitle: "Alle ThemeDeck-Downloads löschen?",
        confirmDeleteDownloadedTracks: "Alle von ThemeDeck heruntergeladenen Audiodateien löschen? Dateien aus deinen persönlichen Ordnern, die Spielen zugewiesen sind, werden nicht gelöscht.",
        deleteUnusedDownloadedTracks: "Ungenutzte Downloads löschen",
        deleteUnusedDownloadedTracksTitle: "Ungenutzte heruntergeladene Dateien löschen?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck löscht heruntergeladene Musik für deinstallierte Steam-Spiele, entfernte Steam-Verknüpfungen und ungenutzte Titel. Musik für andere Spiele, Hintergrundmusik oder den Shop bleibt erhalten.",
        deletedUnusedDownloadedTracks: "{files} ungenutzte Dateien gelöscht.",
        failedDeleteUnusedDownloadedTracks: "Ungenutzte Downloads konnten nicht gelöscht werden",
        ffmpegNormalizedFor: "FFmpeg: {game} normalisiert",
        ffmpegUpmixedFor: "FFmpeg: 7.1-Upmix für {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: {game} normalisiert und auf 7.1 upgemixt",
        ffmpegSkippedFor: "FFmpeg: {game} übersprungen",
        ffmpegDisabled: "FFmpeg-Verarbeitung deaktiviert",
        ffmpegFailedFor: "FFmpeg: Fehler bei {game}: {error}",
        globalAmbientBehaviorAria: "Unterbrechungsverhalten der Umgebungsspur",
    },
    nl: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Games uitsluiten van automatische toewijzing",
        autoAssignExclusionsTitle: "Uitsluitingen voor automatische toewijzing",
        autoAssignExclusionsDesc: "Aangevinkte games worden overgeslagen bij het toewijzen van ontbrekende tracks.",
        back: "Terug",
        removeTrack: "Track verwijderen",
        browseLocalTitle: "Lokaal bestand kiezen",
        chooseAudioFile: "Audiobestand kiezen",
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
        globalTrackTitle: "Ambient-track",
        noGlobalTrack: "Nog geen ambient-track geselecteerd.",
        storeTrackTitle: "Store-track",
        noStoreTrack: "Nog geen Store-track geselecteerd.",
        savedGlobal: "Ambient-muziek opgeslagen",
        clearedGlobal: "Ambient-muziek verwijderd",
        savedStore: "Store-muziek opgeslagen",
        clearedStore: "Store-muziek verwijderd",
        deleteDownloadedTracks: "Alle downloads verwijderen",
        deleteDownloadedTracksTitle: "Alle ThemeDeck-downloads verwijderen?",
        confirmDeleteDownloadedTracks: "Alle door ThemeDeck gedownloade audiobestanden verwijderen? Bestanden uit je persoonlijke mappen die aan games zijn toegewezen worden niet verwijderd.",
        deleteUnusedDownloadedTracks: "Ongebruikte downloads verwijderen",
        deleteUnusedDownloadedTracksTitle: "Ongebruikte gedownloade bestanden verwijderen?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck verwijdert gedownloade muziek voor verwijderde Steam-games, verwijderde snelkoppelingen en ongebruikte nummers. Muziek die een ander spel, Achtergrond of Winkel gebruikt, blijft behouden.",
        deletedUnusedDownloadedTracks: "{files} ongebruikte bestanden verwijderd.",
        failedDeleteUnusedDownloadedTracks: "Ongebruikte downloads konden niet worden verwijderd",
        ffmpegNormalizedFor: "FFmpeg: genormaliseerd voor {game}",
        ffmpegUpmixedFor: "FFmpeg: 7.1-upmix voor {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: genormaliseerd en 7.1-upmix voor {game}",
        ffmpegSkippedFor: "FFmpeg: overgeslagen voor {game}",
        ffmpegDisabled: "FFmpeg-verwerking uitgeschakeld",
        ffmpegFailedFor: "FFmpeg: fout bij {game}: {error}",
        globalAmbientBehaviorAria: "Onderbrekingsgedrag van ambient-track",
    },
    uk: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "Виключити ігри з автоматичного призначення",
        autoAssignExclusionsTitle: "Виключення автоматичного призначення",
        autoAssignExclusionsDesc: "Позначені ігри буде пропущено під час призначення відсутніх треків.",
        back: "Назад",
        removeTrack: "Видалити трек",
        browseLocalTitle: "Вибрати локальний файл",
        chooseAudioFile: "Вибрати аудіофайл",
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
        globalTrackTitle: "Фоновий трек",
        noGlobalTrack: "Фоновий трек ще не вибрано.",
        storeTrackTitle: "Трек Store",
        noStoreTrack: "Трек Store ще не вибрано.",
        savedGlobal: "Фонову музику збережено",
        clearedGlobal: "Фонову музику видалено",
        savedStore: "Музику Store збережено",
        clearedStore: "Музику Store видалено",
        deleteDownloadedTracks: "Видалити всі завантаження",
        deleteDownloadedTracksTitle: "Видалити всі завантаження ThemeDeck?",
        confirmDeleteDownloadedTracks: "Видалити всі аудіофайли, завантажені ThemeDeck? Файли з ваших особистих папок, призначені іграм, не видалятимуться.",
        deleteUnusedDownloadedTracks: "Видалити невикористані завантаження",
        deleteUnusedDownloadedTracksTitle: "Видалити невикористані завантажені файли?",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck видаляє завантажену музику для видалених ігор Steam, видалених ярликів і невикористані треки. Музика, яку використовують інші ігри, фон або магазин, зберігається.",
        deletedUnusedDownloadedTracks: "Видалено невикористаних файлів: {files}.",
        failedDeleteUnusedDownloadedTracks: "Не вдалося видалити невикористані завантаження",
        ffmpegNormalizedFor: "FFmpeg: нормалізовано для {game}",
        ffmpegUpmixedFor: "FFmpeg: upmix 7.1 для {game}",
        ffmpegNormalizedUpmixedFor: "FFmpeg: нормалізовано та upmix 7.1 для {game}",
        ffmpegSkippedFor: "FFmpeg: пропущено для {game}",
        ffmpegDisabled: "Обробку FFmpeg вимкнено",
        ffmpegFailedFor: "FFmpeg: помилка для {game}: {error}",
        globalAmbientBehaviorAria: "Поведінка переривання фонового треку",
    },
    zh: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "从自动分配中排除游戏",
        autoAssignExclusionsTitle: "自动分配排除项",
        autoAssignExclusionsDesc: "分配缺失曲目时将跳过已勾选的游戏。",
        back: "返回",
        removeTrack: "移除曲目",
        browseLocalTitle: "选择本地文件",
        chooseAudioFile: "选择音频文件",
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
        globalTrackTitle: "环境曲目",
        noGlobalTrack: "尚未选择环境曲目。",
        storeTrackTitle: "商店曲目",
        noStoreTrack: "尚未选择商店曲目。",
        savedGlobal: "已保存环境音乐",
        clearedGlobal: "已清除环境音乐",
        savedStore: "已保存商店音乐",
        clearedStore: "已清除商店音乐",
        deleteDownloadedTracks: "删除所有下载",
        deleteDownloadedTracksTitle: "删除所有 ThemeDeck 下载？",
        confirmDeleteDownloadedTracks: "删除 ThemeDeck 下载的所有音频文件？从个人文件夹选择并分配给游戏的文件不会被删除。",
        deleteUnusedDownloadedTracks: "删除未使用的下载",
        deleteUnusedDownloadedTracksTitle: "删除未使用的已下载文件？",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck 会删除已卸载 Steam 游戏和已移除快捷方式的下载音乐，以及未使用曲目。其他游戏、环境音轨或商店共用的音乐会保留。",
        deletedUnusedDownloadedTracks: "已删除 {files} 个未使用文件。",
        failedDeleteUnusedDownloadedTracks: "无法删除未使用的下载",
        ffmpegNormalizedFor: "FFmpeg：已为 {game} 标准化",
        ffmpegUpmixedFor: "FFmpeg：已为 {game} upmix 到 7.1",
        ffmpegNormalizedUpmixedFor: "FFmpeg：已为 {game} 标准化并 upmix 到 7.1",
        ffmpegSkippedFor: "FFmpeg：已跳过 {game}",
        ffmpegDisabled: "FFmpeg 处理已关闭",
        ffmpegFailedFor: "FFmpeg：{game} 失败：{error}",
        globalAmbientBehaviorAria: "环境曲目中断行为",
    },
    ja: {
        introVersion: "ThemeDeck 3.3.7",
        chooseAutoAssignExclusions: "自動割り当てからゲームを除外",
        autoAssignExclusionsTitle: "自動割り当ての除外設定",
        autoAssignExclusionsDesc: "チェックしたゲームは未設定トラックの割り当て時にスキップされます。",
        back: "戻る",
        removeTrack: "トラックを削除",
        browseLocalTitle: "ローカルファイルを選択",
        chooseAudioFile: "音声ファイルを選択",
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
        globalTrackTitle: "環境トラック",
        noGlobalTrack: "環境トラックはまだ選択されていません。",
        storeTrackTitle: "ストアトラック",
        noStoreTrack: "ストアトラックはまだ選択されていません。",
        savedGlobal: "環境音楽を保存しました",
        clearedGlobal: "環境音楽を削除しました",
        savedStore: "ストア音楽を保存しました",
        clearedStore: "ストア音楽を削除しました",
        deleteDownloadedTracks: "すべてのダウンロードを削除",
        deleteDownloadedTracksTitle: "ThemeDeck のすべてのダウンロードを削除しますか？",
        confirmDeleteDownloadedTracks: "ThemeDeck がダウンロードしたすべての音声ファイルを削除しますか？個人フォルダーから選択してゲームに割り当てたファイルは削除されません。",
        deleteUnusedDownloadedTracks: "未使用のダウンロードを削除",
        deleteUnusedDownloadedTracksTitle: "未使用のダウンロード済みファイルを削除しますか？",
        confirmDeleteUnusedDownloadedTracks: "ThemeDeck は、アンインストールした Steam ゲームや削除したショートカットのダウンロード音楽、未使用の曲を削除します。他のゲーム、環境トラック、ストアで共有する音楽は保持されます。",
        deletedUnusedDownloadedTracks: "{files} 個の未使用ファイルを削除しました。",
        failedDeleteUnusedDownloadedTracks: "未使用のダウンロードを削除できませんでした",
        ffmpegNormalizedFor: "FFmpeg: {game} を正規化しました",
        ffmpegUpmixedFor: "FFmpeg: {game} を 7.1 にアップミックスしました",
        ffmpegNormalizedUpmixedFor: "FFmpeg: {game} を正規化し 7.1 にアップミックスしました",
        ffmpegSkippedFor: "FFmpeg: {game} をスキップしました",
        ffmpegDisabled: "FFmpeg 処理は無効です",
        ffmpegFailedFor: "FFmpeg: {game} で失敗: {error}",
        globalAmbientBehaviorAria: "環境トラックの中断動作",
    },
};
const SECONDARY_TRANSLATIONS = {
    fr: {
        normalizeAudioLabel: "Normaliser l'audio téléchargé", normalizeAudioDesc: "Utilise la normalisation du volume FFmpeg après les téléchargements YouTube lorsque FFmpeg est disponible.", normalizationAvailable: "FFmpeg détecté.", normalizationUnavailable: "FFmpeg non détecté. Les téléchargements fonctionneront, mais le traitement audio sera ignoré.", normalizationSkipped: "Piste téléchargée enregistrée, mais le traitement FFmpeg a été ignoré : {error}",
        unableAddFile: "Impossible d'ajouter le fichier : {error}", unknownError: "Erreur inconnue", unknownUpdateError: "Erreur de mise à jour inconnue", ytdlpReady: "yt-dlp prêt ({version})", failedInstallYtdlp: "Échec de l'installation de yt-dlp : {error}", saveTrackToast: "\"{filename}\" enregistré pour {game}", clearedTrackToast: "Musique supprimée pour {game}", youtubeDownloadFailed: "Échec du téléchargement YouTube : {error}", youtubeSearchFailed: "Échec de la recherche YouTube : {error}",
        couldNotSaveVolume: "Impossible d'enregistrer le volume", couldNotSaveLoop: "Impossible d'enregistrer la répétition", couldNotSaveStart: "Impossible d'enregistrer le début de la piste", couldNotSaveGlobalVolume: "Impossible d'enregistrer le volume de la piste d'ambiance", couldNotSaveGlobalLoop: "Impossible d'enregistrer la répétition de la piste d'ambiance", couldNotSaveGlobalStart: "Impossible d'enregistrer le début de la piste d'ambiance", couldNotSaveStoreVolume: "Impossible d'enregistrer le volume de la piste Store", couldNotSaveStoreLoop: "Impossible d'enregistrer la répétition de la piste Store", couldNotSaveStoreStart: "Impossible d'enregistrer le début de la piste Store",
        failedRemoveGlobal: "Impossible de supprimer la piste d'ambiance", failedRemoveStore: "Impossible de supprimer la piste Store", failedLoadTracks: "Impossible de charger les pistes enregistrées", deleteDownloadedTracks: "Supprimer les pistes téléchargées", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Supprimer les fichiers audio téléchargés ?", yes: "Oui", no: "Non", deleting: "Suppression...", preparingDelete: "Préparation de la suppression...", deletedProgress: "{completed} sur {total} supprimés", close: "Fermer", deletedDownloadedTracks: "{files} fichiers supprimés et {tracks} affectations retirées.", failedDeleteDownloadedTracks: "Impossible de supprimer les pistes téléchargées",
        noGamesFound: "Aucun jeu trouvé dans la bibliothèque.", allGamesAssigned: "Tous les jeux de la bibliothèque ont déjà une musique.", ytdlpMissing: "yt-dlp n'est pas encore installé.", stoppingAfterCurrent: "Arrêt après l'opération en cours...", skippedAlreadyAssigned: "{game} ignoré (déjà affecté).", searchForGame: "Recherche YouTube pour {game} ({query})...", noEligibleResults: "Aucun résultat YouTube admissible pour {game}.", searchFailedForGame: "Échec de la recherche pour {game} : {error}", allDownloadAttemptsFailed: "Toutes les tentatives de téléchargement ont échoué pour {game} : {error}", stopMusicTimingAria: "Moment d'arrêt de la musique au lancement"
    },
    es: {
        normalizeAudioLabel: "Normalizar el audio descargado", normalizeAudioDesc: "Usa la normalización de volumen de FFmpeg después de las descargas de YouTube cuando FFmpeg está disponible.", normalizationAvailable: "FFmpeg detectado.", normalizationUnavailable: "FFmpeg no detectado. Las descargas funcionarán, pero se omitirá el procesamiento de audio.", normalizationSkipped: "La pista descargada se guardó, pero se omitió el procesamiento de FFmpeg: {error}",
        unableAddFile: "No se pudo añadir el archivo: {error}", unknownError: "Error desconocido", unknownUpdateError: "Error de actualización desconocido", ytdlpReady: "yt-dlp listo ({version})", failedInstallYtdlp: "No se pudo instalar yt-dlp: {error}", saveTrackToast: "Se guardó \"{filename}\" para {game}", clearedTrackToast: "Se eliminó la música de {game}", youtubeDownloadFailed: "Falló la descarga de YouTube: {error}", youtubeSearchFailed: "Falló la búsqueda de YouTube: {error}",
        couldNotSaveVolume: "No se pudo guardar el volumen", couldNotSaveLoop: "No se pudo guardar la repetición", couldNotSaveStart: "No se pudo guardar el inicio de la pista", couldNotSaveGlobalVolume: "No se pudo guardar el volumen de la pista ambiental", couldNotSaveGlobalLoop: "No se pudo guardar la repetición de la pista ambiental", couldNotSaveGlobalStart: "No se pudo guardar el inicio de la pista ambiental", couldNotSaveStoreVolume: "No se pudo guardar el volumen de la pista Store", couldNotSaveStoreLoop: "No se pudo guardar la repetición de la pista Store", couldNotSaveStoreStart: "No se pudo guardar el inicio de la pista Store",
        failedRemoveGlobal: "No se pudo eliminar la pista ambiental", failedRemoveStore: "No se pudo eliminar la pista Store", failedLoadTracks: "No se pudieron cargar las pistas guardadas", deleteDownloadedTracks: "Eliminar pistas descargadas", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "¿Eliminar los archivos de audio descargados?", yes: "Sí", no: "No", deleting: "Eliminando...", preparingDelete: "Preparando eliminación...", deletedProgress: "Eliminados {completed} de {total}", close: "Cerrar", deletedDownloadedTracks: "Se eliminaron {files} archivos y {tracks} asignaciones.", failedDeleteDownloadedTracks: "No se pudieron eliminar las pistas descargadas",
        noGamesFound: "No se encontraron juegos en la biblioteca.", allGamesAssigned: "Todos los juegos de la biblioteca ya tienen música asignada.", ytdlpMissing: "yt-dlp aún no está instalado.", stoppingAfterCurrent: "Se detendrá después de la operación actual...", skippedAlreadyAssigned: "Se omitió {game} (ya tiene una pista).", searchForGame: "Buscando en YouTube para {game} ({query})...", noEligibleResults: "No hay resultados de YouTube válidos para {game}.", searchFailedForGame: "Falló la búsqueda de {game}: {error}", allDownloadAttemptsFailed: "Todos los intentos de descarga fallaron para {game}: {error}", stopMusicTimingAria: "Momento de detener la música durante el inicio"
    },
    pt: {
        normalizeAudioLabel: "Normalizar áudio transferido", normalizeAudioDesc: "Usa a normalização de volume do FFmpeg após transferências do YouTube quando o FFmpeg está disponível.", normalizationAvailable: "FFmpeg detetado.", normalizationUnavailable: "FFmpeg não detetado. As transferências funcionarão, mas o processamento de áudio será ignorado.", normalizationSkipped: "A faixa transferida foi guardada, mas o processamento FFmpeg foi ignorado: {error}",
        unableAddFile: "Não foi possível adicionar o ficheiro: {error}", unknownError: "Erro desconhecido", unknownUpdateError: "Erro de atualização desconhecido", ytdlpReady: "yt-dlp pronto ({version})", failedInstallYtdlp: "Falha ao instalar o yt-dlp: {error}", saveTrackToast: "\"{filename}\" guardado para {game}", clearedTrackToast: "Música removida de {game}", youtubeDownloadFailed: "Falha na transferência do YouTube: {error}", youtubeSearchFailed: "Falha na pesquisa do YouTube: {error}",
        couldNotSaveVolume: "Não foi possível guardar o volume", couldNotSaveLoop: "Não foi possível guardar a repetição", couldNotSaveStart: "Não foi possível guardar o início da faixa", couldNotSaveGlobalVolume: "Não foi possível guardar o volume da faixa ambiente", couldNotSaveGlobalLoop: "Não foi possível guardar a repetição da faixa ambiente", couldNotSaveGlobalStart: "Não foi possível guardar o início da faixa ambiente", couldNotSaveStoreVolume: "Não foi possível guardar o volume da faixa Store", couldNotSaveStoreLoop: "Não foi possível guardar a repetição da faixa Store", couldNotSaveStoreStart: "Não foi possível guardar o início da faixa Store",
        failedRemoveGlobal: "Falha ao remover a faixa ambiente", failedRemoveStore: "Falha ao remover a faixa Store", failedLoadTracks: "Falha ao carregar as faixas guardadas", deleteDownloadedTracks: "Eliminar faixas transferidas", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Eliminar os ficheiros de áudio transferidos?", yes: "Sim", no: "Não", deleting: "A eliminar...", preparingDelete: "A preparar a eliminação...", deletedProgress: "Eliminados {completed} de {total}", close: "Fechar", deletedDownloadedTracks: "Eliminados {files} ficheiros e removidas {tracks} atribuições.", failedDeleteDownloadedTracks: "Falha ao eliminar as faixas transferidas",
        noGamesFound: "Nenhum jogo encontrado na biblioteca.", allGamesAssigned: "Todos os jogos da biblioteca já têm música atribuída.", ytdlpMissing: "O yt-dlp ainda não está instalado.", stoppingAfterCurrent: "A parar após a operação atual...", skippedAlreadyAssigned: "{game} ignorado (já atribuído).", searchForGame: "A pesquisar no YouTube por {game} ({query})...", noEligibleResults: "Nenhum resultado do YouTube elegível para {game}.", searchFailedForGame: "A pesquisa de {game} falhou: {error}", allDownloadAttemptsFailed: "Todas as tentativas de transferência falharam para {game}: {error}", stopMusicTimingAria: "Momento de parar a música no arranque"
    },
    "pt-br": {
        normalizeAudioLabel: "Normalizar áudio baixado", normalizeAudioDesc: "Usa a normalização de volume do FFmpeg após downloads do YouTube quando o FFmpeg está disponível.", normalizationAvailable: "FFmpeg detectado.", normalizationUnavailable: "FFmpeg não detectado. Os downloads funcionarão, mas o processamento de áudio será ignorado.", normalizationSkipped: "A faixa baixada foi salva, mas o processamento do FFmpeg foi ignorado: {error}",
        unableAddFile: "Não foi possível adicionar o arquivo: {error}", unknownError: "Erro desconhecido", unknownUpdateError: "Erro de atualização desconhecido", ytdlpReady: "yt-dlp pronto ({version})", failedInstallYtdlp: "Falha ao instalar o yt-dlp: {error}", saveTrackToast: "\"{filename}\" salvo para {game}", clearedTrackToast: "Música removida de {game}", youtubeDownloadFailed: "Falha no download do YouTube: {error}", youtubeSearchFailed: "Falha na pesquisa do YouTube: {error}",
        couldNotSaveVolume: "Não foi possível salvar o volume", couldNotSaveLoop: "Não foi possível salvar a repetição", couldNotSaveStart: "Não foi possível salvar o início da faixa", couldNotSaveGlobalVolume: "Não foi possível salvar o volume da faixa ambiente", couldNotSaveGlobalLoop: "Não foi possível salvar a repetição da faixa ambiente", couldNotSaveGlobalStart: "Não foi possível salvar o início da faixa ambiente", couldNotSaveStoreVolume: "Não foi possível salvar o volume da faixa Store", couldNotSaveStoreLoop: "Não foi possível salvar a repetição da faixa Store", couldNotSaveStoreStart: "Não foi possível salvar o início da faixa Store",
        failedRemoveGlobal: "Falha ao remover a faixa ambiente", failedRemoveStore: "Falha ao remover a faixa Store", failedLoadTracks: "Falha ao carregar as faixas salvas", deleteDownloadedTracks: "Excluir faixas baixadas", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Excluir os arquivos de áudio baixados?", yes: "Sim", no: "Não", deleting: "Excluindo...", preparingDelete: "Preparando exclusão...", deletedProgress: "Excluídos {completed} de {total}", close: "Fechar", deletedDownloadedTracks: "Excluídos {files} arquivos e removidas {tracks} atribuições.", failedDeleteDownloadedTracks: "Falha ao excluir as faixas baixadas",
        noGamesFound: "Nenhum jogo encontrado na biblioteca.", allGamesAssigned: "Todos os jogos da biblioteca já têm música atribuída.", ytdlpMissing: "O yt-dlp ainda não está instalado.", stoppingAfterCurrent: "Parando após a operação atual...", skippedAlreadyAssigned: "{game} ignorado (já atribuído).", searchForGame: "Pesquisando no YouTube por {game} ({query})...", noEligibleResults: "Nenhum resultado válido do YouTube para {game}.", searchFailedForGame: "A pesquisa de {game} falhou: {error}", allDownloadAttemptsFailed: "Todas as tentativas de download falharam para {game}: {error}", stopMusicTimingAria: "Momento de parar a música na inicialização"
    },
    de: {
        normalizeAudioLabel: "Heruntergeladenes Audio normalisieren", normalizeAudioDesc: "Verwendet die Lautheitsnormalisierung von FFmpeg nach YouTube-Downloads, wenn FFmpeg verfügbar ist.", normalizationAvailable: "FFmpeg erkannt.", normalizationUnavailable: "FFmpeg nicht erkannt. Downloads funktionieren weiterhin, die Audioverarbeitung wird jedoch übersprungen.", normalizationSkipped: "Die heruntergeladene Spur wurde gespeichert, aber die FFmpeg-Verarbeitung wurde übersprungen: {error}",
        unableAddFile: "Datei konnte nicht hinzugefügt werden: {error}", unknownError: "Unbekannter Fehler", unknownUpdateError: "Unbekannter Aktualisierungsfehler", ytdlpReady: "yt-dlp bereit ({version})", failedInstallYtdlp: "yt-dlp konnte nicht installiert werden: {error}", saveTrackToast: "\"{filename}\" für {game} gespeichert", clearedTrackToast: "Musik für {game} entfernt", youtubeDownloadFailed: "YouTube-Download fehlgeschlagen: {error}", youtubeSearchFailed: "YouTube-Suche fehlgeschlagen: {error}",
        couldNotSaveVolume: "Lautstärke konnte nicht gespeichert werden", couldNotSaveLoop: "Wiederholung konnte nicht gespeichert werden", couldNotSaveStart: "Spuranfang konnte nicht gespeichert werden", couldNotSaveGlobalVolume: "Lautstärke der Ambient-Spur konnte nicht gespeichert werden", couldNotSaveGlobalLoop: "Wiederholung der Ambient-Spur konnte nicht gespeichert werden", couldNotSaveGlobalStart: "Anfang der Ambient-Spur konnte nicht gespeichert werden", couldNotSaveStoreVolume: "Lautstärke der Store-Spur konnte nicht gespeichert werden", couldNotSaveStoreLoop: "Wiederholung der Store-Spur konnte nicht gespeichert werden", couldNotSaveStoreStart: "Anfang der Store-Spur konnte nicht gespeichert werden",
        failedRemoveGlobal: "Ambient-Spur konnte nicht entfernt werden", failedRemoveStore: "Store-Spur konnte nicht entfernt werden", failedLoadTracks: "Gespeicherte Spuren konnten nicht geladen werden", deleteDownloadedTracks: "Heruntergeladene Spuren löschen", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Heruntergeladene Audiodateien löschen?", yes: "Ja", no: "Nein", deleting: "Löschen...", preparingDelete: "Löschen wird vorbereitet...", deletedProgress: "{completed} von {total} gelöscht", close: "Schließen", deletedDownloadedTracks: "{files} Dateien gelöscht und {tracks} Zuweisungen entfernt.", failedDeleteDownloadedTracks: "Heruntergeladene Spuren konnten nicht gelöscht werden",
        noGamesFound: "Keine Spiele in der Bibliothek gefunden.", allGamesAssigned: "Allen Bibliotheksspielen ist bereits Musik zugewiesen.", ytdlpMissing: "yt-dlp ist noch nicht installiert.", stoppingAfterCurrent: "Stopp nach dem aktuellen Vorgang...", skippedAlreadyAssigned: "{game} übersprungen (bereits zugewiesen).", searchForGame: "YouTube-Suche für {game} ({query})...", noEligibleResults: "Keine geeigneten YouTube-Ergebnisse für {game}.", searchFailedForGame: "Suche für {game} fehlgeschlagen: {error}", allDownloadAttemptsFailed: "Alle Downloadversuche für {game} sind fehlgeschlagen: {error}", stopMusicTimingAria: "Zeitpunkt zum Stoppen der Musik beim Start"
    },
    nl: {
        normalizeAudioLabel: "Gedownloade audio normaliseren", normalizeAudioDesc: "Gebruikt FFmpeg-luidheidsnormalisatie na YouTube-downloads wanneer FFmpeg beschikbaar is.", normalizationAvailable: "FFmpeg gedetecteerd.", normalizationUnavailable: "FFmpeg niet gedetecteerd. Downloads werken wel, maar audioverwerking wordt overgeslagen.", normalizationSkipped: "De gedownloade track is opgeslagen, maar FFmpeg-verwerking is overgeslagen: {error}",
        unableAddFile: "Bestand kon niet worden toegevoegd: {error}", unknownError: "Onbekende fout", unknownUpdateError: "Onbekende updatefout", ytdlpReady: "yt-dlp gereed ({version})", failedInstallYtdlp: "Installatie van yt-dlp mislukt: {error}", saveTrackToast: "\"{filename}\" opgeslagen voor {game}", clearedTrackToast: "Muziek verwijderd voor {game}", youtubeDownloadFailed: "YouTube-download mislukt: {error}", youtubeSearchFailed: "YouTube-zoekopdracht mislukt: {error}",
        couldNotSaveVolume: "Volume kon niet worden opgeslagen", couldNotSaveLoop: "Herhalen kon niet worden opgeslagen", couldNotSaveStart: "Begin van track kon niet worden opgeslagen", couldNotSaveGlobalVolume: "Volume van ambient-track kon niet worden opgeslagen", couldNotSaveGlobalLoop: "Herhalen van ambient-track kon niet worden opgeslagen", couldNotSaveGlobalStart: "Begin van ambient-track kon niet worden opgeslagen", couldNotSaveStoreVolume: "Volume van Store-track kon niet worden opgeslagen", couldNotSaveStoreLoop: "Herhalen van Store-track kon niet worden opgeslagen", couldNotSaveStoreStart: "Begin van Store-track kon niet worden opgeslagen",
        failedRemoveGlobal: "Ambient-track kon niet worden verwijderd", failedRemoveStore: "Store-track kon niet worden verwijderd", failedLoadTracks: "Opgeslagen tracks konden niet worden geladen", deleteDownloadedTracks: "Gedownloade tracks verwijderen", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Gedownloade audiobestanden verwijderen?", yes: "Ja", no: "Nee", deleting: "Verwijderen...", preparingDelete: "Verwijderen voorbereiden...", deletedProgress: "{completed} van {total} verwijderd", close: "Sluiten", deletedDownloadedTracks: "{files} bestanden verwijderd en {tracks} toewijzingen gewist.", failedDeleteDownloadedTracks: "Gedownloade tracks konden niet worden verwijderd",
        noGamesFound: "Geen spellen gevonden in de bibliotheek.", allGamesAssigned: "Alle bibliotheekspellen hebben al muziek toegewezen.", ytdlpMissing: "yt-dlp is nog niet geïnstalleerd.", stoppingAfterCurrent: "Stoppen na de huidige bewerking...", skippedAlreadyAssigned: "{game} overgeslagen (al toegewezen).", searchForGame: "YouTube doorzoeken voor {game} ({query})...", noEligibleResults: "Geen geschikte YouTube-resultaten voor {game}.", searchFailedForGame: "Zoeken naar {game} mislukt: {error}", allDownloadAttemptsFailed: "Alle downloadpogingen voor {game} zijn mislukt: {error}", stopMusicTimingAria: "Moment waarop muziek bij het starten stopt"
    },
    uk: {
        normalizeAudioLabel: "Нормалізувати завантажене аудіо", normalizeAudioDesc: "Використовує нормалізацію гучності FFmpeg після завантажень із YouTube, якщо FFmpeg доступний.", normalizationAvailable: "FFmpeg виявлено.", normalizationUnavailable: "FFmpeg не виявлено. Завантаження працюватимуть, але обробку аудіо буде пропущено.", normalizationSkipped: "Завантажену доріжку збережено, але обробку FFmpeg пропущено: {error}",
        unableAddFile: "Не вдалося додати файл: {error}", unknownError: "Невідома помилка", unknownUpdateError: "Невідома помилка оновлення", ytdlpReady: "yt-dlp готовий ({version})", failedInstallYtdlp: "Не вдалося встановити yt-dlp: {error}", saveTrackToast: "\"{filename}\" збережено для {game}", clearedTrackToast: "Музику для {game} видалено", youtubeDownloadFailed: "Помилка завантаження з YouTube: {error}", youtubeSearchFailed: "Помилка пошуку YouTube: {error}",
        couldNotSaveVolume: "Не вдалося зберегти гучність", couldNotSaveLoop: "Не вдалося зберегти повтор", couldNotSaveStart: "Не вдалося зберегти початок доріжки", couldNotSaveGlobalVolume: "Не вдалося зберегти гучність фонової доріжки", couldNotSaveGlobalLoop: "Не вдалося зберегти повтор фонової доріжки", couldNotSaveGlobalStart: "Не вдалося зберегти початок фонової доріжки", couldNotSaveStoreVolume: "Не вдалося зберегти гучність доріжки Store", couldNotSaveStoreLoop: "Не вдалося зберегти повтор доріжки Store", couldNotSaveStoreStart: "Не вдалося зберегти початок доріжки Store",
        failedRemoveGlobal: "Не вдалося видалити фонову доріжку", failedRemoveStore: "Не вдалося видалити доріжку Store", failedLoadTracks: "Не вдалося завантажити збережені доріжки", deleteDownloadedTracks: "Видалити завантажені доріжки", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "Видалити завантажені аудіофайли?", yes: "Так", no: "Ні", deleting: "Видалення...", preparingDelete: "Підготовка видалення...", deletedProgress: "Видалено {completed} з {total}", close: "Закрити", deletedDownloadedTracks: "Видалено {files} файлів і {tracks} призначень.", failedDeleteDownloadedTracks: "Не вдалося видалити завантажені доріжки",
        noGamesFound: "Ігор у бібліотеці не знайдено.", allGamesAssigned: "Усім іграм бібліотеки вже призначено музику.", ytdlpMissing: "yt-dlp ще не встановлено.", stoppingAfterCurrent: "Зупинка після поточної операції...", skippedAlreadyAssigned: "{game} пропущено (вже призначено).", searchForGame: "Пошук на YouTube для {game} ({query})...", noEligibleResults: "Немає придатних результатів YouTube для {game}.", searchFailedForGame: "Помилка пошуку для {game}: {error}", allDownloadAttemptsFailed: "Усі спроби завантаження для {game} завершилися помилкою: {error}", stopMusicTimingAria: "Момент зупинки музики під час запуску"
    },
    zh: {
        normalizeAudioLabel: "标准化已下载的音频", normalizeAudioDesc: "当 FFmpeg 可用时，在 YouTube 下载后使用 FFmpeg 进行响度标准化。", normalizationAvailable: "已检测到 FFmpeg。", normalizationUnavailable: "未检测到 FFmpeg。下载仍可使用，但会跳过音频处理。", normalizationSkipped: "已保存下载的曲目，但跳过了 FFmpeg 处理：{error}",
        unableAddFile: "无法添加文件：{error}", unknownError: "未知错误", unknownUpdateError: "未知更新错误", ytdlpReady: "yt-dlp 已就绪（{version}）", failedInstallYtdlp: "无法安装 yt-dlp：{error}", saveTrackToast: "已为 {game} 保存“{filename}”", clearedTrackToast: "已清除 {game} 的音乐", youtubeDownloadFailed: "YouTube 下载失败：{error}", youtubeSearchFailed: "YouTube 搜索失败：{error}",
        couldNotSaveVolume: "无法保存音量", couldNotSaveLoop: "无法保存循环设置", couldNotSaveStart: "无法保存曲目起始位置", couldNotSaveGlobalVolume: "无法保存环境曲目的音量", couldNotSaveGlobalLoop: "无法保存环境曲目的循环设置", couldNotSaveGlobalStart: "无法保存环境曲目的起始位置", couldNotSaveStoreVolume: "无法保存商店曲目的音量", couldNotSaveStoreLoop: "无法保存商店曲目的循环设置", couldNotSaveStoreStart: "无法保存商店曲目的起始位置",
        failedRemoveGlobal: "无法移除环境曲目", failedRemoveStore: "无法移除商店曲目", failedLoadTracks: "无法加载已保存的曲目", deleteDownloadedTracks: "删除已下载的曲目", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "删除已下载的音频文件？", yes: "是", no: "否", deleting: "正在删除...", preparingDelete: "正在准备删除...", deletedProgress: "已删除 {completed}/{total}", close: "关闭", deletedDownloadedTracks: "已删除 {files} 个文件并移除 {tracks} 个分配。", failedDeleteDownloadedTracks: "无法删除已下载的曲目",
        noGamesFound: "资料库中未找到游戏。", allGamesAssigned: "资料库中的所有游戏都已分配音乐。", ytdlpMissing: "尚未安装 yt-dlp。", stoppingAfterCurrent: "将在当前操作完成后停止...", skippedAlreadyAssigned: "已跳过 {game}（已分配）。", searchForGame: "正在为 {game} 搜索 YouTube（{query}）...", noEligibleResults: "没有适用于 {game} 的 YouTube 结果。", searchFailedForGame: "搜索 {game} 失败：{error}", allDownloadAttemptsFailed: "{game} 的所有下载尝试均失败：{error}", stopMusicTimingAria: "启动时停止音乐的时机"
    },
    ja: {
        normalizeAudioLabel: "ダウンロードした音声を正規化", normalizeAudioDesc: "FFmpeg が利用可能な場合、YouTube からのダウンロード後に音量を正規化します。", normalizationAvailable: "FFmpeg を検出しました。", normalizationUnavailable: "FFmpeg が見つかりません。ダウンロードは動作しますが、音声処理はスキップされます。", normalizationSkipped: "ダウンロードしたトラックを保存しましたが、FFmpeg 処理はスキップされました：{error}",
        unableAddFile: "ファイルを追加できませんでした：{error}", unknownError: "不明なエラー", unknownUpdateError: "不明な更新エラー", ytdlpReady: "yt-dlp 準備完了（{version}）", failedInstallYtdlp: "yt-dlp をインストールできませんでした：{error}", saveTrackToast: "{game} に「{filename}」を保存しました", clearedTrackToast: "{game} の音楽を削除しました", youtubeDownloadFailed: "YouTube のダウンロードに失敗しました：{error}", youtubeSearchFailed: "YouTube の検索に失敗しました：{error}",
        couldNotSaveVolume: "音量を保存できませんでした", couldNotSaveLoop: "リピート設定を保存できませんでした", couldNotSaveStart: "トラックの開始位置を保存できませんでした", couldNotSaveGlobalVolume: "環境トラックの音量を保存できませんでした", couldNotSaveGlobalLoop: "環境トラックのリピート設定を保存できませんでした", couldNotSaveGlobalStart: "環境トラックの開始位置を保存できませんでした", couldNotSaveStoreVolume: "ストアトラックの音量を保存できませんでした", couldNotSaveStoreLoop: "ストアトラックのリピート設定を保存できませんでした", couldNotSaveStoreStart: "ストアトラックの開始位置を保存できませんでした",
        failedRemoveGlobal: "環境トラックを削除できませんでした", failedRemoveStore: "ストアトラックを削除できませんでした", failedLoadTracks: "保存済みトラックを読み込めませんでした", deleteDownloadedTracks: "ダウンロードしたトラックを削除", deleteDownloadedTracksDesc: "", deleteDownloadedTracksTitle: "ダウンロードした音声ファイルを削除しますか？", yes: "はい", no: "いいえ", deleting: "削除中...", preparingDelete: "削除を準備中...", deletedProgress: "{total} 件中 {completed} 件を削除", close: "閉じる", deletedDownloadedTracks: "{files} 個のファイルを削除し、{tracks} 件の割り当てを解除しました。", failedDeleteDownloadedTracks: "ダウンロードしたトラックを削除できませんでした",
        noGamesFound: "ライブラリにゲームが見つかりません。", allGamesAssigned: "ライブラリ内のすべてのゲームに音楽が割り当て済みです。", ytdlpMissing: "yt-dlp はまだインストールされていません。", stoppingAfterCurrent: "現在の処理後に停止します...", skippedAlreadyAssigned: "{game} をスキップしました（割り当て済み）。", searchForGame: "{game} を YouTube で検索中（{query}）...", noEligibleResults: "{game} に適した YouTube の結果がありません。", searchFailedForGame: "{game} の検索に失敗しました：{error}", allDownloadAttemptsFailed: "{game} のすべてのダウンロードに失敗しました：{error}", stopMusicTimingAria: "起動時に音楽を停止するタイミング"
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
        SECONDARY_TRANSLATIONS[ACTIVE_LOCALE]?.[key] ??
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
const formatAssignedTrackName = (filename) => String(filename || "")
    .replace(/\.[A-Za-z0-9]{2,5}$/, "")
    .replace(/\s*\[[A-Za-z0-9_-]{6,}\]$/, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const TrackSettingStepper = ({ label, value, suffix, min, max, step, onChange, }) => {
    const update = (next) => {
        const bounded = Math.min(max, Math.max(min, next));
        if (bounded !== value)
            void onChange(bounded);
    };
    return (window.SP_REACT.createElement(DFL.Focusable, { className: "tdCompactSetting", "flow-children": "horizontal" },
        window.SP_REACT.createElement("div", { className: "tdCompactSettingLabel" }, label),
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdStepperRow", "flow-children": "horizontal" },
            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdStepperButton", title: `${label} -`, disabled: value <= min, onClick: () => update(value - step) },
                window.SP_REACT.createElement(FaMinus, null)),
            window.SP_REACT.createElement("div", { className: "tdStepperValue" },
                value,
                suffix),
            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdStepperButton", title: `${label} +`, disabled: value >= max, onClick: () => update(value + step) },
                window.SP_REACT.createElement(FaPlus, null)))));
};
const SelectedTrackPanel = ({ track, loading, emptyText, isPlaying, onPreview, onRemove, onVolumeChange, onStartChange, onLoopChange, }) => (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
    window.SP_REACT.createElement("div", { className: "tdSelectedEyebrow" }, t("selected")),
    loading ? (window.SP_REACT.createElement("span", { className: "tdMiniSpinner", style: { marginTop: 16 } })) : track ? (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
        window.SP_REACT.createElement("div", { className: "tdSelectedTrackRow" },
            window.SP_REACT.createElement("div", { className: "tdSelectedTrackGlyph" },
                window.SP_REACT.createElement(FaMusic, null)),
            window.SP_REACT.createElement("div", { className: "tdSelectedTrackMeta" },
                window.SP_REACT.createElement("div", { className: "tdSelectedTrackName", title: track.filename }, formatAssignedTrackName(track.filename) || track.filename),
                window.SP_REACT.createElement("div", { className: "tdSelectedTrackPath", title: track.path }, track.path)),
            window.SP_REACT.createElement(DFL.Focusable, { className: "tdSelectedTrackActions", "flow-children": "horizontal" },
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdSelectedAction", title: isPlaying ? t("pause") : t("play"), onClick: onPreview }, isPlaying ? window.SP_REACT.createElement(FaPause, null) : window.SP_REACT.createElement(FaPlay, null)),
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdSelectedAction", title: t("removeTrack"), onClick: () => void onRemove() },
                    window.SP_REACT.createElement(FaTrash, null)))),
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdTrackControlStrip", "flow-children": "horizontal" },
            window.SP_REACT.createElement(TrackSettingStepper, { label: t("volume"), value: Math.round(track.volume * 100), suffix: "%", min: 0, max: 100, step: 5, onChange: onVolumeChange }),
            window.SP_REACT.createElement(TrackSettingStepper, { label: t("startSkip"), value: Math.round(track.startOffset), suffix: "s", min: 0, max: 30, step: 1, onChange: onStartChange }),
            window.SP_REACT.createElement(DFL.Focusable, { className: "tdCompactSetting", "flow-children": "horizontal" },
                window.SP_REACT.createElement("div", { className: "tdCompactSettingLabel" }, t("loopTrack")),
                window.SP_REACT.createElement(FocusableButton, { className: `DialogButton tdRepeatButton${track.loop ? " is-active" : ""}`, title: t("loopTrack"), "aria-pressed": track.loop, onClick: () => void onLoopChange(!track.loop) },
                    window.SP_REACT.createElement(FaRedo, null),
                    window.SP_REACT.createElement("span", { className: "tdRepeatStateDot" })))))) : (window.SP_REACT.createElement("div", { className: "tdSelectedEmpty" },
        window.SP_REACT.createElement(FaMusic, null),
        window.SP_REACT.createElement("span", null, emptyText)))));
const SELECTED_TRACK_PANEL_CSS = `
  .tdSelectedEyebrow{font-size:13px;opacity:.58;text-transform:uppercase;font-weight:700}
  .tdSelectedTrackRow{display:grid;grid-template-columns:50px minmax(0,1fr) auto;gap:13px;align-items:center;margin-top:10px}
  .tdSelectedTrackGlyph{width:50px;height:50px;display:grid;place-items:center;border-radius:6px;background:rgba(255,255,255,.075);color:rgba(255,255,255,.86);font-size:20px}
  .tdSelectedTrackMeta{min-width:0}
  .tdSelectedTrackName{font-size:19px;line-height:1.2;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tdSelectedTrackPath{margin-top:5px;font-size:12px;opacity:.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tdSelectedTrackActions{display:flex;gap:8px}
  .tdSelectedAction.DialogButton,.tdStepperButton.DialogButton{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:6px!important}
  .tdTrackControlStrip{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(150px,.72fr);margin-top:18px;padding-top:15px;border-top:1px solid rgba(255,255,255,.09)}
  .tdCompactSetting{display:grid;grid-template-rows:auto 42px;gap:8px;padding:0 16px;border-left:1px solid rgba(255,255,255,.08)}
  .tdCompactSetting:first-child{padding-left:0;border-left:0}
  .tdCompactSetting:last-child{padding-right:0}
  .tdCompactSettingLabel{font-size:12px;font-weight:650;opacity:.58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tdStepperRow{display:grid;grid-template-columns:42px minmax(58px,1fr) 42px;gap:8px;align-items:center}
  .tdStepperButton.DialogButton{background:rgba(255,255,255,.075)!important;color:#fff!important}
  .tdStepperButton.DialogButton:disabled{opacity:.32!important}
  .tdStepperValue{font-size:17px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums}
  .tdRepeatButton.DialogButton{width:100%!important;height:42px!important;min-height:42px!important;padding:0 13px!important;display:grid!important;grid-template-columns:18px minmax(0,1fr) 9px!important;gap:10px!important;align-items:center!important;color:#fff!important;background:rgba(255,255,255,.075)!important;border:1px solid transparent!important}
  .tdRepeatButton.DialogButton.is-active{background:rgba(240,180,41,.14)!important;border-color:rgba(240,180,41,.68)!important;color:#f6c64e!important}
  .tdRepeatStateDot{justify-self:end;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.25)}
  .tdRepeatButton.is-active .tdRepeatStateDot{background:#f0b429;box-shadow:0 0 0 3px rgba(240,180,41,.14)}
  .tdSelectedAction:focus,.tdSelectedAction.gpfocus,.tdStepperButton:focus,.tdStepperButton.gpfocus,.tdRepeatButton:focus,.tdRepeatButton.gpfocus{background:#f0b429!important;color:#151515!important;box-shadow:0 0 0 3px rgba(255,255,255,.9)!important}
  .tdSelectedEmpty{display:flex;align-items:center;gap:10px;margin-top:16px;min-height:50px;color:rgba(255,255,255,.58)}
  @media(max-width:1050px){.tdTrackControlStrip{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.tdCompactSetting:last-child{grid-column:1/-1;margin-top:14px;padding:14px 0 0;border-left:0;border-top:1px solid rgba(255,255,255,.08)}}
`;
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
let pluginDisposed = false;
let stopAutoPlaybackSubscription = null;
let autoPlaybackTrackRefreshInFlight = false;
let autoPlaybackRouteInterval = null;
let autoPlaybackStoreProbeInFlight = false;
let externalMediaPollInterval = null;
let externalMediaProbeInFlight = false;
let externalMediaActive = false;
let lastSteamCdpMediaProbeAt = 0;
let lastSteamCdpMediaActive = false;
let lastLegacyExternalMediaProbeAt = 0;
let lastLegacyExternalMediaActive = false;
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
let runningAppRefreshTimer = null;
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
    let sharedFromWindow = window.__themedeckSharedAudio;
    const existingGraph = getAudioGraph();
    if (existingGraph && existingGraph.version !== 2) {
        try {
            sharedFromWindow?.pause();
            sharedFromWindow?.removeAttribute("src");
            sharedFromWindow?.load();
        }
        catch (_ignored) {
            // Ignore cleanup errors from a graph created by an older bundle.
        }
        void existingGraph.context.close().catch(() => { });
        delete window.__themedeckAudioGraph;
        delete window.__themedeckSharedAudio;
        sharedFromWindow = undefined;
        sharedAudio = null;
    }
    if (sharedFromWindow && sharedAudio !== sharedFromWindow) {
        sharedAudio = sharedFromWindow;
    }
    if (!sharedAudio) {
        sharedAudio = new Audio();
        // The audio server is localhost while Steam UI runs on steamloopback.host.
        // WebAudio outputs silence for cross-origin media unless CORS is requested
        // before src is assigned; the backend already returns ACAO for audio/ranges.
        sharedAudio.crossOrigin = "anonymous";
        sharedAudio.loop = true;
        sharedAudio.preload = "auto";
        window.__themedeckSharedAudio = sharedAudio;
    }
    return sharedAudio;
};
let audioGraphSetupPromise = null;
const getAudioGraph = () => window.__themedeckAudioGraph ??
    null;
const applyAudioUpmixRouting = () => {
    const graph = getAudioGraph();
    if (!graph) {
        return;
    }
    const { context, source } = graph;
    try {
        source.disconnect();
    }
    catch (_ignored) {
        // not connected yet
    }
    for (const node of graph.nodes) {
        try {
            node.disconnect();
        }
        catch (_ignored) {
            // ignore
        }
    }
    graph.nodes = [];
    const destination = context.destination;
    const maxChannels = Number(destination.maxChannelCount || 2);
    if (readAudioUpmixSetting() && maxChannels >= 6) {
        const channels = Math.min(8, maxChannels);
        try {
            destination.channelCount = channels;
            destination.channelCountMode = "explicit";
            destination.channelInterpretation = "discrete";
        }
        catch (_ignored) {
            // device may reject an explicit layout
        }
        const splitter = context.createChannelSplitter(2);
        const merger = context.createChannelMerger(channels);
        source.connect(splitter);
        const route = (input, output, base) => {
            const gain = context.createGain();
            gain.gain.value = base;
            splitter.connect(gain, input, 0);
            gain.connect(merger, 0, output);
            graph.nodes.push(gain);
        };
        route(0, 0, 1); // Front Left  = L
        route(1, 1, 1); // Front Right = R
        route(0, 2, 0.5);
        route(1, 2, 0.5); // Center = (L + R) / 2
        route(0, 3, 0.35);
        route(1, 3, 0.35); // LFE = (L + R) attenuated
        route(0, 4, 0.9);
        route(1, 5, 0.9); // Side Left / Side Right
        if (channels >= 8) {
            route(0, 6, 0.75);
            route(1, 7, 0.75); // Back Left / Back Right
        }
        merger.connect(destination);
        graph.nodes.push(splitter, merger);
    }
    else {
        try {
            destination.channelCount = Math.min(2, maxChannels);
        }
        catch (_ignored) {
            // ignore
        }
        source.connect(destination);
    }
};
const resumeAudioGraph = async () => {
    const graph = getAudioGraph();
    if (!graph) {
        return false;
    }
    if (graph.context.state === "suspended") {
        try {
            await graph.context.resume();
        }
        catch (_ignored) {
            return false;
        }
    }
    return graph.context.state === "running";
};
const ensureAudioGraph = async (audio) => {
    if (!readAudioUpmixSetting()) {
        return false;
    }
    if (getAudioGraph()) {
        return resumeAudioGraph();
    }
    if (audioGraphSetupPromise) {
        return audioGraphSetupPromise;
    }
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioContextConstructor !== "function") {
        return false;
    }
    audioGraphSetupPromise = (async () => {
        let context = null;
        try {
            context = new AudioContextConstructor();
            const maxChannels = Number(context.destination.maxChannelCount || 2);
            if (maxChannels < 6) {
                await context.close().catch(() => { });
                return false;
            }
            if (context.state === "suspended") {
                await context.resume();
            }
            if (context.state !== "running") {
                await context.close().catch(() => { });
                return false;
            }
            // Only bind the media element after the context is known to be running.
            // Once createMediaElementSource succeeds the element no longer has a
            // direct output path, so binding it to a suspended context would mute all
            // ThemeDeck playback.
            const source = context.createMediaElementSource(audio);
            window.__themedeckAudioGraph = {
                version: 2,
                context,
                source,
                nodes: [],
            };
            applyAudioUpmixRouting();
            return true;
        }
        catch (error) {
            if (context && !getAudioGraph()) {
                await context.close().catch(() => { });
            }
            console.warn("[ThemeDeck] surround upmix graph unavailable", error);
            return false;
        }
        finally {
            audioGraphSetupPromise = null;
        }
    })();
    return audioGraphSetupPromise;
};
const bindAudioUpmixListener = () => {
    const previous = window.__themedeckUpmixListener;
    if (typeof previous === "function")
        window.removeEventListener(AUDIO_UPMIX_EVENT, previous);
    const handler = () => {
        if (pluginDisposed)
            return;
        const audio = ensureAudio();
        if (readAudioUpmixSetting())
            void ensureAudioGraph(audio);
        else if (getAudioGraph()) {
            applyAudioUpmixRouting();
            void resumeAudioGraph();
        }
    };
    window.__themedeckUpmixListener = handler;
    window.addEventListener(AUDIO_UPMIX_EVENT, handler);
    return () => {
        window.removeEventListener(AUDIO_UPMIX_EVENT, handler);
        if (window.__themedeckUpmixListener === handler) {
            delete window.__themedeckUpmixListener;
            delete window.__themedeckUpmixListenerBound;
        }
    };
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
const verifyStreamAudioUrl = async (url) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(url, {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
        });
        return response.ok;
    }
    catch {
        // A cached loopback port can become stale after a backend reload.
        return false;
    }
    finally {
        window.clearTimeout(timeout);
    }
};
const resolveAudioUrl = async (track) => {
    const cached = audioCache.get(track.path);
    if (cached && await verifyStreamAudioUrl(cached.url)) {
        cached.lastUsedAt = Date.now();
        cached.pinned = isPinnedAudioCachePath(track.path);
        return cached.url;
    }
    if (cached)
        revokeCacheEntry(track.path);
    const streamPayload = await getTrackAudioUrl(track.path);
    if (!streamPayload?.url) {
        throw new Error("ThemeDeck audio stream URL is unavailable");
    }
    if (!(await verifyStreamAudioUrl(streamPayload.url))) {
        throw new Error("ThemeDeck audio stream did not pass its health check");
    }
    audioCache.set(track.path, {
        url: streamPayload.url,
        mtime: streamPayload.mtime ?? 0,
        lastUsedAt: Date.now(),
        pinned: isPinnedAudioCachePath(track.path),
        revocable: false,
    });
    pruneAudioCache();
    return streamPayload.url;
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
    // Invalidate pending URL/seek work as well as the currently playing element.
    playInvocationCounter += 1;
    playInFlightSignature = null;
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
    if (pluginDisposed)
        return;
    stopPlaybackToken += 1;
    // Use the cached UI-mode value so playback is not delayed by an await; a
    // UI-mode subscription and a 2 s poll keep desktopModeActive current, and we
    // refresh in the background for the next call.
    void refreshDesktopModeState();
    if (desktopModeActive) {
        return;
    }
    if (runningGameAppId !== null) {
        return;
    }
    if (externalMediaActive) {
        return;
    }
    // Fast local-only check so playback is not delayed by the slow tab probes.
    // The 500 ms polling loop still catches audible media in other Steam tabs.
    if (detectAudibleSteamMediaLocal()) {
        setExternalMediaActive(true);
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
        if (invocationId !== playInvocationCounter || pluginDisposed || desktopModeActive)
            return;
        await audio.play();
        // Keep the element on its native stereo path until a running multichannel
        // AudioContext is available. This preserves playback if WebAudio is blocked.
        if (readAudioUpmixSetting()) {
            void ensureAudioGraph(audio);
        }
        else if (getAudioGraph()) {
            void resumeAudioGraph();
        }
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
        revokeCacheEntry(track.path);
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
    if (focusedAppId === appId) {
        return;
    }
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
    const stores = [window.SteamUIStore?.WindowStore, DFL.Router?.WindowStore];
    // Popups can be focused while the gamepad main window still owns the route.
    // Prefer that window, and fall back without assuming one store layout.
    const windows = stores.map((store) => store?.GamepadUIMainWindowInstance?.BrowserWindow);
    try {
        windows.push(window.SteamUIStore?.GetFocusedWindowInstance?.()?.BrowserWindow);
    }
    catch { /* Steam can dispose a focused popup during navigation. */ }
    windows.push(window);
    for (const browserWindow of windows) {
        try {
            const location = browserWindow?.location;
            const hashPath = String(location?.hash ?? "").replace(/^#/, "");
            const pathname = hashPath.startsWith("/") ? hashPath.split("?", 1)[0] : String(location?.pathname ?? "");
            if (pathname && pathname !== "/" && !/\.html$/i.test(pathname))
                return pathname;
        }
        catch { /* Ignore cross-origin or destroyed windows. */ }
    }
    return "";
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
        if (pluginDisposed || desktopModeActive || runningGameAppId !== null)
            return;
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
    for (let candidate of candidates) {
        if (candidate && typeof candidate === "object") {
            candidate = candidate.appid ?? candidate.app_id ?? candidate.unAppID ?? candidate.nAppID ?? candidate.id;
        }
        if (typeof candidate === "string") {
            if (!/^\d+$/.test(candidate.trim()))
                continue;
            candidate = Number(candidate);
        }
        if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate > 0 && candidate <= 0xffffffff) {
            return candidate;
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
    if (steamAppSubscriptions.length)
        return true;
    const apps = window?.SteamClient?.Apps;
    if (typeof apps?.RegisterForAppOverviewChanges !== "function") {
        if (!steamAppRetry) {
            steamAppRetry = window.setInterval(() => {
                if (startSteamAppWatchers()) {
                    window.clearInterval(steamAppRetry);
                    steamAppRetry = null;
                }
            }, 2000);
        }
        return false;
    }
    try {
        // RegisterForAppDetails requires (appId, callback), not just a callback.
        // Overview changes are global, but must NOT select an unrelated game.
        const token = apps.RegisterForAppOverviewChanges(() => {
            scheduleRunningGameRefresh();
            const visibleAppId = readAppIdFromLocation();
            if (visibleAppId) {
                markDetailRouteSeen(visibleAppId);
                notifyFocus(visibleAppId);
            }
        });
        steamAppSubscriptions.push(wrapUnsubscribe(token) ?? (() => { }));
        return true;
    }
    catch (error) {
        console.error("[ThemeDeck] steam app watcher failed", error);
        return false;
    }
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
        stateText === "active" ||
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
const scheduleRunningGameRefresh = (delay = 120) => {
    if (runningAppRefreshTimer !== null) {
        window.clearTimeout(runningAppRefreshTimer);
    }
    runningAppRefreshTimer = window.setTimeout(() => {
        runningAppRefreshTimer = null;
        void refreshRunningGameState();
    }, delay);
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
    const preferredRegisterMethods = [
        "RegisterForRunningAppsChanged",
        "RegisterForRunningAppChanges",
        "RegisterForAppRunningStateChanged",
        "RegisterForAppRunningStateChange",
        "RegisterForGameActionStart",
        "RegisterForGameActionEnd",
        "RegisterForGameLaunched",
        "RegisterForGameExited",
    ];
    const fallbackRegisterMethods = ["RegisterForAppOverviewChanges"];
    const preferredMethod = preferredRegisterMethods.find((method) => typeof apps?.[method] === "function");
    const fallbackMethod = fallbackRegisterMethods.find((method) => typeof apps?.[method] === "function");
    const registerMethods = preferredMethod
        ? preferredMethod === "RegisterForGameActionStart" && typeof apps.RegisterForGameActionEnd === "function"
            ? [preferredMethod, "RegisterForGameActionEnd"]
            : [preferredMethod]
        : fallbackMethod && !steamAppSubscriptions.length
            ? [fallbackMethod]
            : [];
    registerMethods.forEach((method) => {
        const register = apps?.[method];
        if (typeof register !== "function") {
            return;
        }
        try {
            const token = register.call(apps, () => scheduleRunningGameRefresh());
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
        scheduleRunningGameRefresh(0);
    }, RUNNING_APP_POLL_MS);
    scheduleRunningGameRefresh(0);
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
    if (runningAppRefreshTimer !== null) {
        window.clearTimeout(runningAppRefreshTimer);
        runningAppRefreshTimer = null;
    }
    runningAppRefreshInFlight = false;
    runningGameAppId = null;
    launchActivityAppId = null;
    launchingAppFirstSeenAtMs.clear();
};
const resolveLibraryContextMenu = () => {
    try {
        const module = DFL.findModuleByExport((exported) => typeof exported === "function" && /\.LibraryContextMenu\b/.test(exported.toString()));
        for (const candidate of Object.values(module ?? {})) {
            if (typeof candidate !== "function")
                continue;
            if (typeof candidate.prototype?.GetTargetApps === "function" &&
                typeof candidate.prototype?.render === "function")
                return candidate;
            // Steam's September 2026 wrapper passes navigator + window instance to
            // the library menu class. Never execute arbitrary exports or CSS modules.
            const source = candidate.toString();
            if (!/navigator\s*:/.test(source))
                continue;
            try {
                const rendered = DFL.fakeRenderComponent(candidate);
                const component = rendered?.type?.type ?? rendered?.type;
                if (typeof component?.prototype?.render === "function" &&
                    (typeof component.prototype.GetTargetApps === "function" ||
                        component.prototype.render.toString().includes("AppProperties")))
                    return component;
            }
            catch { /* Try the next recognized wrapper. */ }
        }
    }
    catch { /* A Steam chunk may not be loaded yet. */ }
    return null;
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
    for (let index = list.length - 1; index >= 0; index -= 1) {
        if (list[index]?.key === "themedeck-change-music")
            list.splice(index, 1);
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
        window.setTimeout(() => {
            dismissActiveContextMenu();
            navigateToThemeDeckEditor(`/themedeck/${latestAppId}`);
            window.setTimeout(dismissActiveContextMenu, 0);
            window.setTimeout(dismissActiveContextMenu, 120);
            window.setTimeout(dismissActiveContextMenu, 300);
        }, 40);
    };
    const menuItem = (window.SP_REACT.createElement(DFL.MenuItem, { key: "themedeck-change-music", onSelected: openThemeDeck }, "ThemeDeck"));
    if (propertiesIdx >= 0) {
        list.splice(propertiesIdx, 0, menuItem);
    }
    else {
        list.push(menuItem);
    }
};
const patchLibraryMenuTree = (node, appId) => {
    const holder = [];
    insertThemeDeckMenu(holder, appId);
    return holder[0] ? insertPluginSection(window.SP_REACT, node, holder[0]) : node;
};
const patchContextMenuFocus = () => {
    const stopFallback = installMenuSectionFallback(window.SP_REACT, DFL, patchLibraryMenuTree);
    const patches = [];
    let retry = null;
    let disposed = false;
    let attempts = 0;
    let activeInstance = null;
    const install = () => {
        if (disposed)
            return;
        const MenuComponent = resolveLibraryContextMenu();
        if (!MenuComponent?.prototype) {
            retry = window.setTimeout(install, ++attempts < 30 ? 2000 : 10000);
            return;
        }
        try {
            patches.push(DFL.afterPatch(MenuComponent.prototype, "render", function (_args, result) {
                if (disposed)
                    return result;
                try {
                    const targets = typeof this.GetTargetApps === "function" ? this.GetTargetApps() : null;
                    if (targets && targets.length !== 1)
                        return result;
                    const appId = extractAppId(this.props?.overview, targets?.[0], this.props?.app) ??
                        extractAppIdFromTree(result);
                    if (!appId)
                        return result;
                    const patched = patchLibraryMenuTree(result, appId);
                    activeInstance = this;
                    setContextMenuActiveAppId(appId);
                    activeContextMenuCloser = typeof this.HideMenu === "function" ? () => this.HideMenu() :
                        typeof this.props?.onCancel === "function" ? () => this.props.onCancel() : null;
                    return patched;
                }
                catch (error) {
                    console.warn("[ThemeDeck] context menu integration skipped", error);
                    return result;
                }
            }));
            if (typeof MenuComponent.prototype.componentWillUnmount === "function") {
                patches.push(DFL.afterPatch(MenuComponent.prototype, "componentWillUnmount", function () {
                    if (activeInstance === this) {
                        activeInstance = null;
                        setContextMenuActiveAppId(null);
                        activeContextMenuCloser = null;
                    }
                }));
            }
        }
        catch (error) {
            patches.splice(0).reverse().forEach((patch) => { try {
                patch.unpatch();
            }
            catch { } });
            console.warn("[ThemeDeck] context menu patch unavailable", error);
        }
    };
    install();
    return () => {
        disposed = true;
        if (retry !== null)
            window.clearTimeout(retry);
        patches.splice(0).reverse().forEach((patch) => { try {
            patch.unpatch();
        }
        catch { } });
        stopFallback();
        activeInstance = null;
        setContextMenuActiveAppId(null);
        activeContextMenuCloser = null;
    };
};
const injectBridgeIntoRoute = (routePattern) => {
    const renderPatches = [];
    const patchedProps = new WeakSet();
    let disposed = false;
    let routePatch;
    try {
        routePatch = routerHook.addPatch(routePattern, (tree) => {
            if (disposed)
                return tree;
            const routeProps = DFL.findInReactTree(tree, (node) => typeof node?.renderFunc === "function");
            if (!routeProps || patchedProps.has(routeProps))
                return tree;
            try {
                // Render alongside the route, not inside a CSS-class-dependent child.
                // A Fragment adds no layout nodes and never rewrites React element.type.
                const patch = DFL.afterPatch(routeProps, "renderFunc", (_args, result) => {
                    if (disposed || result == null)
                        return result;
                    return window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                        result,
                        window.SP_REACT.createElement(GameFocusBridge, { key: "themedeck-bridge" }));
                });
                renderPatches.push(patch);
                patchedProps.add(routeProps);
            }
            catch (error) {
                console.warn("[ThemeDeck] route bridge unavailable; location watcher remains active", error);
            }
            return tree;
        });
    }
    catch (error) {
        console.warn("[ThemeDeck] route registration unavailable; location watcher remains active", error);
    }
    return () => {
        disposed = true;
        renderPatches.splice(0).reverse().forEach((patch) => { try {
            patch.unpatch();
        }
        catch { } });
        if (routePatch !== undefined) {
            try {
                routerHook.removePatch(routePattern, routePatch);
            }
            catch (error) {
                console.warn("[ThemeDeck] remove route patch failed", error);
            }
        }
    };
};
const GameFocusBridge = () => {
    const params = DFL.useParams();
    const appId = extractAppId(params?.appid);
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
    const text = value.trim().toLowerCase();
    if (!text)
        return false;
    if (text.includes("/settings") ||
        text.includes("#/settings") ||
        text.includes("steamsettings") ||
        text.includes("settings?")) {
        return false;
    }
    // TrailerHero resolves official Steam movies through Store API/static asset
    // URLs. Those URLs are media resources, not proof that the user navigated to
    // the Store. Treating every string containing "/store" as a Store route made
    // the Store track replace the game-page context as soon as a trailer started.
    if (text.includes("/store_item_assets/") ||
        text.includes("%2fstore_item_assets%2f") ||
        text.includes("store.steampowered.com/api/") ||
        text.includes("store%2esteampowered%2ecom%2fapi%2f") ||
        /\.(?:mp4|webm|m3u8|mpd)(?:[?#]|$)/i.test(text)) {
        return false;
    }
    const hasStoreHost = /(?:^|[^a-z0-9.-])store\.steampowered\.com(?::\d+)?(?:[/?#]|$)/i.test(text) || text.includes("store%2esteampowered%2ecom");
    let hasStoreRoute = false;
    try {
        const parsed = new URL(text, "https://themedeck.invalid");
        const pathname = String(parsed.pathname || "").toLowerCase();
        const hash = String(parsed.hash || "").toLowerCase();
        hasStoreRoute =
            /^\/store(?:[/?#]|$)/.test(pathname) ||
                /^#\/store(?:[/?#]|$)/.test(hash) ||
                (parsed.protocol !== "http:" &&
                    parsed.protocol !== "https:" &&
                    parsed.hostname.toLowerCase() === "store");
    }
    catch {
        // Fall through to the route-text checks below.
    }
    return (hasStoreHost ||
        hasStoreRoute ||
        text.includes("storehome") ||
        /(?:^|#)\/store(?:[/?#]|$)/.test(text) ||
        /^store(?:[/?#]|$)/.test(text));
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
    const windowStore = DFL.Router?.WindowStore;
    const focusedCandidates = [
        window.SteamUIStore?.GetFocusedWindowInstance?.(),
        windowStore?.GetFocusedWindowInstance?.(),
        windowStore?.m_FocusedWindowInstance,
        windowStore?.m_FocusedWindow,
        windowStore?.GamepadUIMainWindowInstance,
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
                    /url|href|path|pathname|route|uri|location/i.test(key) &&
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
const hasActiveGameDetailContext = () => readAppIdFromLocation() !== null ||
    (activeDetailBridgeCount > 0 &&
        activeDetailRouteAppId !== null &&
        activeDetailRouteAppId > 0);
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
    const explicitStoreRoute = getStoreRouteCandidates().some((route) => isStoreRoute(route));
    if (explicitStoreRoute) {
        return true;
    }
    // A mounted game-details route is authoritative. TrailerHero can briefly
    // move Steam's focused browser/media object away from the library route, but
    // that must never promote the Store track while the game page is still open.
    if (hasActiveGameDetailContext()) {
        return false;
    }
    if (detectStoreFromWindowState()) {
        return true;
    }
    try {
        const hasStoreFrame = Array.from(document.querySelectorAll("iframe[src], webview[src]")).some((frame) => {
            if (frame.classList?.contains("trailerhero-video") ||
                frame.closest?.(".trailerhero-host")) {
                return false;
            }
            const source = frame.src || frame.getAttribute?.("src") || "";
            return isStoreRoute(String(source));
        });
        if (hasStoreFrame) {
            return true;
        }
    }
    catch {
        // ignore DOM probe failures
    }
    return false;
};
const isStorePath = () => {
    const explicitStoreRoute = getStoreRouteCandidates().some((route) => isStoreRoute(route));
    if (explicitStoreRoute) {
        return true;
    }
    if (hasActiveGameDetailContext()) {
        return false;
    }
    return storeContextActive || isStorePathSync();
};
const detectStoreFromTabs = async () => {
    const probeCode = `
    (() => {
      try {
        const isStoreRoute = (value) => {
          let text = String(value || '').trim().toLowerCase();
          if (!text) return false;
          try {
            const decoded = decodeURIComponent(text);
            if (decoded && decoded !== text) text = decoded.toLowerCase();
          } catch {}
          if (
            text.includes('/settings') ||
            text.includes('#/settings') ||
            text.includes('steamsettings') ||
            text.includes('/store_item_assets/') ||
            text.includes('store.steampowered.com/api/') ||
            /\\.(?:mp4|webm|m3u8|mpd)(?:[?#]|$)/i.test(text)
          ) {
            return false;
          }
          const hasStoreHost = /(?:^|[^a-z0-9.-])store\\.steampowered\\.com(?::\\d+)?(?:[/?#]|$)/i.test(text);
          let hasStoreRoute = false;
          try {
            const parsed = new URL(text, 'https://themedeck.invalid');
            const pathname = String(parsed.pathname || '').toLowerCase();
            const hash = String(parsed.hash || '').toLowerCase();
            hasStoreRoute = /^\\/store(?:[/?#]|$)/.test(pathname) || /^#\\/store(?:[/?#]|$)/.test(hash) || ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') && parsed.hostname.toLowerCase() === 'store');
          } catch {}
          return hasStoreHost || hasStoreRoute || text.includes('storehome') || /(?:^|#)\\/store(?:[/?#]|$)/.test(text) || /^store(?:[/?#]|$)/.test(text);
        };
        const href = String(window.location?.href || "").toLowerCase();
        const path = String(window.location?.pathname || "").toLowerCase();
        const hash = String(window.location?.hash || "").toLowerCase();
        const search = String(window.location?.search || "").toLowerCase();
        const full = href + " " + path + " " + hash + " " + search;
        if (
          /(?:^|[\\s#])\\/library\\/(?:app|details)\\/\\d+(?:[/?#]|$)/.test(full) ||
          /(?:^|[\\s#])\\/library\\/[^/?#]+\\/app\\/\\d+(?:[/?#]|$)/.test(full)
        ) {
          return false;
        }
        if ([href, path, hash, search].some(isStoreRoute)) {
          return true;
        }
        const hasStoreFrame = Array.from(document.querySelectorAll('iframe[src], webview[src]')).some((frame) => {
          if (frame.classList?.contains('trailerhero-video') || frame.closest?.('.trailerhero-host')) return false;
          return isStoreRoute(frame.src || frame.getAttribute?.('src') || '');
        });
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
            const result = await withTimeout(executeInTab(tab, true, probeCode), 1000);
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
let nowPlayingPluginApi;
const getNowPlayingPluginApi = () => {
    if (nowPlayingPluginApi)
        return nowPlayingPluginApi;
    try {
        const connection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
        nowPlayingPluginApi = connection?.connect?.(2, "Now Playing") ?? null;
    }
    catch {
        try {
            const connection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
            nowPlayingPluginApi = connection?.connect?.(1, "Now Playing") ?? null;
        }
        catch {
            nowPlayingPluginApi = null;
        }
    }
    return nowPlayingPluginApi;
};
const withTimeout = async (promise, timeoutMs) => {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((resolve) => {
                timer = window.setTimeout(() => resolve(null), timeoutMs);
            }),
        ]);
    }
    finally {
        if (timer !== undefined)
            window.clearTimeout(timer);
    }
};
const readPublishedNowPlayingState = () => {
    try {
        const signal = window[NOW_PLAYING_ACTIVITY_GLOBAL];
        const updatedAt = Number(signal?.updatedAt || 0);
        if (!signal || !updatedAt || Date.now() - updatedAt > NOW_PLAYING_ACTIVITY_MAX_AGE_MS) {
            return null;
        }
        const status = String(signal.status || "").toLowerCase();
        return {
            active: signal.active === true && status === "playing",
            player: String(signal.player || ""),
            source: "now-playing-signal",
        };
    }
    catch {
        return null;
    }
};
const readNowPlayingState = async () => {
    const published = readPublishedNowPlayingState();
    if (published)
        return published;
    const api = getNowPlayingPluginApi();
    if (!api?.call)
        return null;
    try {
        try {
            const activity = await withTimeout(Promise.resolve(api.call("get_playback_activity")), 800);
            if (activity && typeof activity === "object") {
                const status = String(activity.status || "").toLowerCase();
                return {
                    active: activity.active === true && status === "playing",
                    player: String(activity.player || ""),
                    source: "now-playing-activity",
                };
            }
        }
        catch {
            // Now Playing 2.2.0+ exposes the lightweight method. Older releases use
            // the snapshot compatibility path below.
        }
        const snapshot = await withTimeout(Promise.resolve(api.call("get_snapshot")), 1100);
        if (!snapshot)
            return null;
        const current = snapshot.selected ??
            (Array.isArray(snapshot.players) ? snapshot.players[0] : null);
        const playing = current && String(current.status || "").toLowerCase() === "playing"
            ? current
            : null;
        return {
            active: Boolean(playing),
            player: String(playing?.name || playing?.id || ""),
            source: "now-playing",
        };
    }
    catch (error) {
        console.debug("[ThemeDeck] Now Playing direct snapshot unavailable", error);
        return null;
    }
};
const collectKnownSteamDocuments = () => {
    const documents = [];
    const addDocument = (candidate) => {
        try {
            if (candidate?.documentElement && !documents.includes(candidate)) {
                documents.push(candidate);
            }
        }
        catch { }
    };
    const addWindowDocument = (candidate) => {
        if (!candidate)
            return;
        try {
            addDocument(candidate.document);
        }
        catch { }
        try {
            addDocument(candidate.window?.document);
        }
        catch { }
        try {
            addDocument(candidate.m_Window?.document);
        }
        catch { }
        try {
            addDocument(candidate.m_popup?.document);
        }
        catch { }
        try {
            addDocument(candidate.BrowserWindow?.document);
        }
        catch { }
        try {
            addDocument(candidate.GetWindow?.()?.document);
        }
        catch { }
    };
    addDocument(document);
    try {
        addDocument(window.top?.document);
    }
    catch { }
    try {
        addDocument(window.parent?.document);
    }
    catch { }
    try {
        addDocument(window.opener?.document);
    }
    catch { }
    const store = DFL.Router?.WindowStore;
    addWindowDocument(store?.GamepadUIMainWindowInstance);
    if (Array.isArray(store?.SteamUIWindows)) {
        store.SteamUIWindows.forEach(addWindowDocument);
    }
    return documents;
};
const collectSteamMediaElements = () => {
    const media = [];
    const addFromRoot = (root) => {
        if (!root)
            return;
        try {
            root.querySelectorAll("video, audio").forEach((node) => {
                if (!media.includes(node)) {
                    media.push(node);
                }
            });
            root.querySelectorAll("iframe").forEach((frame) => {
                try {
                    addFromRoot(frame.contentDocument);
                }
                catch { }
            });
        }
        catch { }
    };
    collectKnownSteamDocuments().forEach(addFromRoot);
    return media;
};
const isVisibleSteamMediaElement = (media) => {
    try {
        if (media.classList.contains("trailerhero-video") || media.closest(".trailerhero-host")) {
            return false;
        }
        const style = window.getComputedStyle(media);
        const rect = media.getBoundingClientRect();
        const hasSize = rect.width >= 24 ||
            rect.height >= 24 ||
            Number(media.videoWidth || 0) >= 24 ||
            Number(media.videoHeight || 0) >= 24;
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity || "1") > 0 &&
            hasSize);
    }
    catch {
        return false;
    }
};
const isPlayingSteamMediaElement = (media) => !media.paused && !media.ended && media.readyState >= 2;
const isAudibleSteamMediaElement = (media) => isVisibleSteamMediaElement(media) &&
    isPlayingSteamMediaElement(media) &&
    !media.muted &&
    media.volume > 0.01;
// Fast, synchronous local-only audible check (no cross-process tab RPC), so
// starting a track is not delayed by the ~650 ms tab probes. The polling loop
// (refreshExternalMediaState) still runs the full async probe to catch media in
// other Steam tabs shortly after.
const detectAudibleSteamMediaLocal = () => {
    try {
        return collectSteamMediaElements().some(isAudibleSteamMediaElement);
    }
    catch {
        return false;
    }
};
const audibleMediaProbeCode = `
  (() => {
    try {
      if (!window.__themedeckYouTubeProbeInstalled) {
        window.__themedeckYouTubeProbeInstalled = true;
        window.__themedeckYouTubePlaying = false;
        window.addEventListener('message', (event) => {
          try {
            const trailerHeroFrame = Array.from(document.querySelectorAll('iframe.trailerhero-video')).some((frame) => frame.contentWindow === event.source);
            if (trailerHeroFrame) return;
            const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            const info = payload && payload.info;
            const state = info && (info.playerState ?? info.player_state);
            if (state === 1) window.__themedeckYouTubePlaying = true;
            if (state === 0 || state === 2 || state === -1) window.__themedeckYouTubePlaying = false;
          } catch {}
        });
      }
      const isVisibleMedia = (media) => {
        if (media.classList?.contains('trailerhero-video') || media.closest?.('.trailerhero-host')) return false;
        const style = window.getComputedStyle(media);
        const rect = media.getBoundingClientRect?.();
        const hasSize = !rect || rect.width >= 24 || rect.height >= 24 || Number(media.videoWidth || 0) >= 24 || Number(media.videoHeight || 0) >= 24;
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && hasSize;
      };
      // Audio-aware only: a video counts as external media just when it is
      // playing AND not muted AND has volume. Muted store trailers and silent
      // SteamGridDB animated artwork must not pause the music.
      const nativePlaying = Array.from(document.querySelectorAll('video, audio')).some((node) => {
        const media = node;
        return isVisibleMedia(media) && !media.paused && !media.ended && !media.muted && Number(media.volume || 0) > 0.01 && media.readyState >= 2;
      });
      const youtubeFrames = Array.from(document.querySelectorAll('iframe')).filter((frame) => {
        if (frame.classList?.contains('trailerhero-video') || frame.closest?.('.trailerhero-host')) return false;
        return /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(String(frame.src || ''));
      });
      if (youtubeFrames.length === 0) window.__themedeckYouTubePlaying = false;
      return nativePlaying || (youtubeFrames.length > 0 && window.__themedeckYouTubePlaying === true);
    } catch {
      return false;
    }
  })();
`;
const detectAudibleSteamMedia = async () => {
    try {
        const localMedia = collectSteamMediaElements();
        // Only treat a Steam video as external media when it is actually AUDIBLE
        // (playing, not muted, volume > 0). Muted store trailers and silent
        // SteamGridDB animated artwork are videos too, and must NOT pause the music.
        if (localMedia.some(isAudibleSteamMediaElement)) {
            return true;
        }
    }
    catch {
        // Continue with Steam tab probes.
    }
    const results = await Promise.all(SP_TAB_CANDIDATES.map(async (tab) => {
        try {
            const result = await withTimeout(executeInTab(tab, true, audibleMediaProbeCode), 650);
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
        const tabStore = syncStore || hasActiveGameDetailContext()
            ? false
            : await detectStoreFromTabs();
        if (pluginDisposed)
            return;
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
    window.__themedeckExternalMediaState = {
        active,
        updatedAt: Date.now(),
    };
    if (externalMediaActive === active) {
        return;
    }
    externalMediaActive = active;
    scheduleAutoPlaybackFromContext();
};
const handleNowPlayingActivity = (event) => {
    const detail = event instanceof CustomEvent
        ? event.detail
        : undefined;
    const status = String(detail?.status || "").toLowerCase();
    const active = detail?.active === true && status === "playing";
    if (active) {
        setExternalMediaActive(true);
        return;
    }
    // A pause or stop must release ThemeDeck immediately. The asynchronous
    // probes below can still re-assert another genuinely audible Steam source.
    lastSteamCdpMediaActive = false;
    lastSteamCdpMediaProbeAt = 0;
    lastLegacyExternalMediaActive = false;
    setExternalMediaActive(detectAudibleSteamMediaLocal());
    void refreshExternalMediaState();
};
const refreshExternalMediaState = async () => {
    if (pluginDisposed || externalMediaProbeInFlight) {
        return;
    }
    // Media arbitration only matters when ThemeDeck can play a track. In desktop
    // mode, during a game, or on pages with no music, avoid scanning other Steam
    // renderers and opening CDP/WebSocket connections every few seconds.
    if (desktopModeActive || runningGameAppId !== null ||
        (playbackState.status !== "playing" && !resolveAutoTrackFromContext())) {
        lastSteamCdpMediaActive = false;
        lastLegacyExternalMediaActive = false;
        lastSteamCdpMediaProbeAt = 0;
        lastLegacyExternalMediaProbeAt = 0;
        setExternalMediaActive(false);
        return;
    }
    externalMediaProbeInFlight = true;
    try {
        const steamMediaActive = await detectAudibleSteamMedia();
        if (pluginDisposed)
            return;
        if (steamMediaActive) {
            setExternalMediaActive(true);
            return;
        }
        const nowPlayingState = await readNowPlayingState();
        if (pluginDisposed)
            return;
        if (nowPlayingState?.active) {
            setExternalMediaActive(true);
            return;
        }
        const now = Date.now();
        if (now - lastSteamCdpMediaProbeAt >= STEAM_CDP_MEDIA_POLL_MS) {
            lastSteamCdpMediaProbeAt = now;
            const steamCdpState = await getSteamMediaState().catch(() => ({
                active: false,
                player: "",
            }));
            lastSteamCdpMediaActive = Boolean(steamCdpState?.active);
        }
        if (lastSteamCdpMediaActive) {
            setExternalMediaActive(true);
            return;
        }
        // Compatibility with Now Playing 1.x and other Windows media sessions.
        if (!["now-playing-signal", "now-playing-activity"].includes(String(nowPlayingState?.source || "")) &&
            now - lastLegacyExternalMediaProbeAt >= LEGACY_EXTERNAL_MEDIA_POLL_MS) {
            lastLegacyExternalMediaProbeAt = now;
            const legacyState = await getExternalMediaState();
            lastLegacyExternalMediaActive = Boolean(legacyState?.active);
        }
        setExternalMediaActive(lastLegacyExternalMediaActive);
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
    // The active game page always wins over any incidental Store URL exposed by
    // trailer metadata, media assets, or background Steam objects.
    const inStore = !effectiveAppId && isStorePath();
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
    if (!autoPlaybackStarted || pluginDisposed)
        return;
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
    if (!autoPlaybackStarted || pluginDisposed)
        return;
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
    window.addEventListener(NOW_PLAYING_ACTIVITY_EVENT, handleNowPlayingActivity);
    refreshStoreContext();
    autoPlaybackRouteInterval = window.setInterval(() => {
        if (desktopModeActive || runningGameAppId !== null)
            return;
        scheduleAutoPlaybackFromContext();
        refreshStoreContext();
    }, STORE_CONTEXT_POLL_MS);
    externalMediaPollInterval = window.setInterval(() => {
        refreshExternalMediaState();
    }, EXTERNAL_MEDIA_POLL_MS);
};
const stopAutoPlaybackCoordinator = () => {
    if (!autoPlaybackStarted) {
        return;
    }
    autoPlaybackStarted = false;
    if (autoPlaybackTick !== null) {
        window.clearTimeout(autoPlaybackTick);
        autoPlaybackTick = null;
    }
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
    window.removeEventListener(NOW_PLAYING_ACTIVITY_EVENT, handleNowPlayingActivity);
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
    lastSteamCdpMediaProbeAt = 0;
    lastSteamCdpMediaActive = false;
    lastLegacyExternalMediaProbeAt = 0;
    lastLegacyExternalMediaActive = false;
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
const DownloadProgressBar = ({ progress }) => (window.SP_REACT.createElement("div", { className: "tdScopeDownloadProgress", role: "progressbar", "aria-label": t("downloading"), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(progress), style: { gridColumn: "1 / -1", width: "100%", height: 7, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,.15)" } },
    window.SP_REACT.createElement("div", { style: { width: `${Math.max(0, Math.min(100, progress))}%`, height: "100%", background: "#f0b429", transition: "width .25s linear" } })));
const YTDLP_CHECK_COPY = {
    en: ["Checking nightly release...", "Verifying download..."],
    it: ["Ricerca della versione nightly...", "Verifica del download..."],
    fr: ["Recherche de la version nightly...", "Vérification du téléchargement..."],
    es: ["Buscando la versión nightly...", "Verificando la descarga..."],
    pt: ["A procurar a versão nightly...", "A verificar a transferência..."],
    "pt-br": ["Buscando a versão nightly...", "Verificando o download..."],
    de: ["Nightly-Version wird gesucht...", "Download wird überprüft..."],
    nl: ["Nightly-versie zoeken...", "Download controleren..."],
    uk: ["Пошук nightly-версії...", "Перевірка завантаження..."],
    zh: ["正在检查 nightly 版本...", "正在验证下载..."],
    ja: ["nightly バージョンを確認中...", "ダウンロードを検証中..."],
};
const YtDlpUpdateModal = ({ closeModal, onUpdated, onClosed }) => {
    const [progress, setProgress] = SP_REACT.useState({ running: false, progress: 0, phase: "idle" });
    const [busy, setBusy] = SP_REACT.useState(false);
    const mounted = SP_REACT.useRef(true);
    const inFlight = SP_REACT.useRef(false);
    const follow = async (initial) => {
        let next = initial;
        const jobId = initial.jobId;
        while (mounted.current) {
            if (next.jobId !== jobId)
                throw new Error(t("unknownUpdateError"));
            setProgress(next);
            if (!next.running) {
                if (next.phase === "completed" && next.result)
                    onUpdated(next.result);
                return;
            }
            await new Promise(resolve => window.setTimeout(resolve, 500));
            if (!mounted.current)
                return;
            next = await getYtDlpUpdateProgress();
        }
    };
    const run = async (resume = false) => {
        if (inFlight.current)
            return;
        inFlight.current = true;
        setBusy(true);
        try {
            if (resume) {
                const current = await getYtDlpUpdateProgress();
                if (current.running)
                    await follow(current);
            }
            else {
                setProgress({ running: true, progress: 2, phase: "starting" });
                await follow(await startYtDlpUpdate());
            }
        }
        catch (error) {
            if (mounted.current)
                setProgress(current => ({ ...current, running: false, phase: "failed", error: getErrorMessage(error, t("unknownUpdateError")) }));
        }
        finally {
            inFlight.current = false;
            if (mounted.current)
                setBusy(false);
        }
    };
    SP_REACT.useEffect(() => { mounted.current = true; void run(true); return () => { mounted.current = false; onClosed?.(); }; }, []);
    const copy = YTDLP_CHECK_COPY[ACTIVE_LOCALE] || YTDLP_CHECK_COPY.en;
    const message = progress.phase === "completed" ? t("ytdlpReady", { version: progress.version || "" })
        : progress.phase === "failed" ? t("failedInstallYtdlp", { error: progress.error || t("unknownUpdateError") })
            : progress.phase === "checking" ? copy[0] : progress.phase === "verifying" ? copy[1]
                : progress.phase === "downloading" ? t("downloading") : progress.phase === "installing" ? t("installing")
                    : progress.phase === "idle" ? t("confirmUpdateYtdlp") : t("updating");
    return window.SP_REACT.createElement(DFL.ModalRoot, { closeModal: closeModal },
        window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 0 } },
            window.SP_REACT.createElement("div", { style: { fontSize: "1.15rem", fontWeight: 700 } }, t("updateYtdlp")),
            window.SP_REACT.createElement("div", { role: progress.phase === "failed" ? "alert" : "status", "aria-live": "polite", style: { fontSize: ".9rem", overflowWrap: "anywhere", color: progress.phase === "failed" ? "#ff8f8f" : undefined } }, message),
            progress.phase !== "idle" && window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                window.SP_REACT.createElement(DownloadProgressBar, { progress: progress.progress }),
                window.SP_REACT.createElement("div", null,
                    Math.round(progress.progress),
                    "%")),
            window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "horizontal", style: { display: "flex", gap: 12, justifyContent: "flex-end" } },
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: closeModal }, t("close")),
                !busy && progress.phase !== "completed" && window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => void run() }, t("updateYtdlp")))));
};
let ytDlpDialog = null;
const openYtDlpUpdate = () => {
    if (ytDlpDialog)
        return ytDlpDialog;
    ytDlpDialog = new Promise(resolve => {
        let updated;
        let modal;
        const settle = () => { ytDlpDialog = null; resolve(updated); };
        const close = () => { modal?.Close(); settle(); };
        modal = DFL.showModal(window.SP_REACT.createElement(YtDlpUpdateModal, { closeModal: close, onClosed: settle, onUpdated: status => { updated = status; } }));
    });
    return ytDlpDialog;
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
const readExcludedAutoAssignAppIds = () => {
    try {
        const raw = window.localStorage?.getItem(EXCLUDED_AUTO_ASSIGN_STORAGE_KEY);
        const values = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(values))
            return new Set();
        return new Set(values
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0));
    }
    catch {
        return new Set();
    }
};
const persistExcludedAutoAssignAppIds = (values) => {
    window.localStorage?.setItem(EXCLUDED_AUTO_ASSIGN_STORAGE_KEY, JSON.stringify(Array.from(values).sort((a, b) => a - b)));
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
const AutoAssignExclusionsModal = ({ games, initial, closeModal, onChange, }) => {
    const [selected, setSelected] = SP_REACT.useState(() => new Set(initial));
    const toggle = (appId) => {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(appId))
                next.delete(appId);
            else
                next.add(appId);
            persistExcludedAutoAssignAppIds(next);
            onChange(next);
            return next;
        });
    };
    return (window.SP_REACT.createElement(DFL.ModalRoot, { closeModal: closeModal },
        window.SP_REACT.createElement("div", { className: "tdExclusionModal", style: {
                width: "min(600px, calc(100vw - 48px))",
                maxWidth: "100%",
                height: "min(620px, calc(100vh - 96px))",
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
                overflow: "hidden",
            } },
            window.SP_REACT.createElement("style", null, `
          .tdExclusionModal * { box-sizing: border-box; min-width: 0; letter-spacing: 0; }
          .tdExclusionList { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.22) transparent; }
          .tdExclusionList::-webkit-scrollbar { width: 5px; }
          .tdExclusionList::-webkit-scrollbar-track { background: transparent; }
          .tdExclusionList::-webkit-scrollbar-thumb { background: rgba(255,255,255,.22); border-radius: 999px; }
          .tdExclusionList::-webkit-scrollbar-button { display:none; width:0; height:0; }
          .tdExclusionRow.DialogButton {
            width: 100% !important;
            min-height: 42px !important;
            height: 42px !important;
            padding: 0 10px !important;
            margin: 0 !important;
            border-radius: 5px !important;
            display: grid !important;
            grid-template-columns: 24px minmax(0, 1fr) !important;
            align-items: center !important;
            text-align: left !important;
            font-size: 14px !important;
            color: #fff !important;
            background: rgba(255,255,255,.065) !important;
            border: 1px solid rgba(255,255,255,.07) !important;
          }
          .tdExclusionRow:focus, .tdExclusionRow.gpfocus { color: #171717 !important; background: #f0b429 !important; border-color: #ffe09a !important; box-shadow: 0 0 0 2px rgba(255,255,255,.9) !important; }
          .tdExclusionCheck { width:18px; height:18px; border-radius:4px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.34); background:rgba(0,0,0,.22); color:#fff; }
          .tdExclusionCheck[data-checked="true"] { border-color:#f0b429; background:#f0b429; color:#171717; }
          .tdExclusionRow:focus .tdExclusionCheck,.tdExclusionRow.gpfocus .tdExclusionCheck { border-color:#171717; background:#171717; color:#f0b429; }
        `),
            window.SP_REACT.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, t("autoAssignExclusionsTitle")),
            window.SP_REACT.createElement("div", { style: { opacity: 0.72, fontSize: 13, lineHeight: 1.35 } }, t("autoAssignExclusionsDesc")),
            window.SP_REACT.createElement("div", { className: "tdExclusionList", style: { flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "3px 9px 3px 3px" } },
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, width: "100%" } }, games.map((game) => {
                    const checked = selected.has(game.appid);
                    return (window.SP_REACT.createElement(FocusableButton, { key: game.appid, className: "DialogButton tdExclusionRow", role: "checkbox", "aria-checked": checked, onClick: () => toggle(game.appid) },
                        window.SP_REACT.createElement("span", { className: "tdExclusionCheck", "data-checked": checked ? "true" : "false" }, checked ? window.SP_REACT.createElement(FaCheck, null) : null),
                        window.SP_REACT.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, game.name)));
                }))),
            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: closeModal, style: { alignSelf: "stretch", width: "100%", minWidth: 0, height: 40, minHeight: 40 } }, t("close")))));
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
    const [ytDlpUpdateProgress, setYtDlpUpdateProgress] = SP_REACT.useState({
        running: false,
        progress: 0,
        phase: "idle",
    });
    const [ytDlpUpdateFeedback, setYtDlpUpdateFeedback] = SP_REACT.useState("");
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
    const [excludedAutoAssignAppIds, setExcludedAutoAssignAppIds] = SP_REACT.useState(() => readExcludedAutoAssignAppIds());
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
    SP_REACT.useMemo(() => {
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
        if (!ytDlpBusy)
            return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const progress = await getYtDlpUpdateProgress();
                if (!cancelled)
                    setYtDlpUpdateProgress(progress);
            }
            catch (error) {
                console.error("[ThemeDeck] yt-dlp update progress failed", error);
            }
        };
        void refresh();
        const intervalId = window.setInterval(() => void refresh(), 200);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [ytDlpBusy]);
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
        setYtDlpUpdateFeedback("");
        setYtDlpUpdateProgress({ running: true, progress: 2, phase: "starting" });
        setYtDlpBusy(true);
        try {
            const status = await openYtDlpUpdate();
            if (!status)
                return;
            setYtDlpStatus(status);
            setYtDlpUpdateProgress({
                running: false,
                progress: 100,
                phase: "completed",
                version: status.version,
            });
            setYtDlpUpdateFeedback(t("ytdlpReady", { version: status.version || "latest" }));
            toaster.toast({
                title: "ThemeDeck",
                body: t("ytdlpReady", { version: status.version || "latest" }),
            });
        }
        catch (error) {
            setYtDlpUpdateFeedback("");
            console.error("[ThemeDeck] update yt-dlp failed", error);
            toaster.toast({
                title: "ThemeDeck",
                body: t("failedInstallYtdlp", { error: getErrorMessage(error, t("unknownUpdateError")) }),
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
    const handleDeleteUnusedDownloadedTracks = SP_REACT.useCallback(() => {
        let confirmModal = null;
        const closeConfirm = () => confirmModal?.Close();
        const runCleanup = async () => {
            closeConfirm();
            try {
                const result = await deleteUnusedTracks();
                clearAudioCache(undefined, { preservePinned: true });
                window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
                await refreshTracks();
                scheduleAutoPlaybackFromContext();
                const removedFiles = result.removed_files ?? result.removed ?? 0;
                const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
                toaster.toast({
                    title: "ThemeDeck",
                    body: result.ok === false || failedCount > 0
                        ? t("failedDeleteUnusedDownloadedTracks")
                        : t("deletedUnusedDownloadedTracks", { files: removedFiles }),
                });
            }
            catch (error) {
                console.error("[ThemeDeck] delete unused downloads failed", error);
                toaster.toast({
                    title: "ThemeDeck",
                    body: `${t("failedDeleteUnusedDownloadedTracks")}: ${getErrorMessage(error, t("unknownError"))}`,
                });
            }
        };
        confirmModal = DFL.showModal(window.SP_REACT.createElement(DFL.ConfirmModal, { strTitle: t("deleteUnusedDownloadedTracksTitle"), strDescription: t("confirmDeleteUnusedDownloadedTracks"), strOKButtonText: t("yes"), strCancelButtonText: t("no"), bDestructiveWarning: true, onOK: () => void runCleanup(), onCancel: closeConfirm, closeModal: closeConfirm }), undefined, { strTitle: t("deleteUnusedDownloadedTracksTitle") });
    }, [refreshTracks]);
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
    const handleOpenAutoAssignExclusions = SP_REACT.useCallback(() => {
        let modal = null;
        const closeModal = () => modal?.Close();
        modal = DFL.showModal(window.SP_REACT.createElement(AutoAssignExclusionsModal, { games: libraryGames, initial: excludedAutoAssignAppIds, closeModal: closeModal, onChange: setExcludedAutoAssignAppIds }), undefined, { strTitle: t("autoAssignExclusionsTitle") });
    }, [excludedAutoAssignAppIds, libraryGames]);
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
        const allMissingGames = libraryGames.filter((game) => !latestTracks[game.appid] && !excludedAutoAssignAppIds.has(game.appid));
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
        excludedAutoAssignAppIds,
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
    const qamIconButton = { width: 38, minWidth: 38, height: 38, minHeight: 38, padding: 0, display: "grid", placeItems: "center" };
    const qamChoice = (active) => ({
        width: "100%",
        minHeight: 36,
        display: "grid",
        gridTemplateColumns: "12px minmax(0,1fr)",
        alignItems: "center",
        gap: 9,
        padding: "0 10px",
        textAlign: "left",
        border: active ? "1px solid rgba(240,180,41,.72)" : "1px solid rgba(255,255,255,.075)",
        background: active ? "rgba(240,180,41,.11)" : "rgba(255,255,255,.035)",
    });
    const renderQamTrack = (kind) => {
        const currentTrack = kind === "ambient" ? globalTrack : storeTrack;
        const playingId = kind === "ambient" ? GLOBAL_AMBIENT_APP_ID : STORE_TRACK_APP_ID;
        const chooseLabel = kind === "ambient" ? t("chooseGlobal") : t("chooseStore");
        const emptyLabel = kind === "ambient" ? t("noGlobalTrackSelected") : t("noStoreOnlyTrackSelected");
        const title = kind === "ambient" ? t("globalAmbientPanelTitle") : t("storeOnlyPanelTitle");
        const preview = kind === "ambient" ? handleGlobalPreviewToggle : handleStorePreviewToggle;
        const remove = kind === "ambient" ? handleRemoveGlobalTrack : handleRemoveStoreTrack;
        const volume = kind === "ambient" ? handleGlobalVolumeChange : handleStoreVolumeChange;
        const offset = kind === "ambient" ? handleGlobalStartOffsetChange : handleStoreStartOffsetChange;
        const loop = kind === "ambient" ? handleGlobalLoopChange : handleStoreLoopChange;
        return (window.SP_REACT.createElement("section", { className: "tdQamCard" },
            window.SP_REACT.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "start" } },
                window.SP_REACT.createElement("div", { style: { minWidth: 0 } },
                    window.SP_REACT.createElement("h2", null, title),
                    window.SP_REACT.createElement("div", { className: "tdQamMeta" }, currentTrack?.filename || emptyLabel)),
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "horizontal", style: { display: "flex", gap: 7 } },
                    currentTrack ? window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdQamIconButton", title: playback.appId === playingId && playback.status === "playing" ? t("pausePreview") : t("previewTrack"), onClick: preview, style: qamIconButton }, playback.appId === playingId && playback.status === "playing" ? window.SP_REACT.createElement(FaPause, null) : window.SP_REACT.createElement(FaPlay, null)) : null,
                    currentTrack ? window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdQamIconButton", title: t("removeTrack"), onClick: remove, style: qamIconButton },
                        window.SP_REACT.createElement(FaTrash, null)) : null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdQamIconButton", title: chooseLabel, onClick: () => navigateToThemeDeckEditor(kind === "ambient" ? "/themedeck/global" : "/themedeck/store"), style: qamIconButton },
                        window.SP_REACT.createElement(FaChevronRight, null)))),
            currentTrack ? (window.SP_REACT.createElement("div", { className: "tdQamTrackControls" },
                window.SP_REACT.createElement(TrackSettingStepper, { label: t("volume"), value: Math.round(currentTrack.volume * 100), suffix: "%", min: 0, max: 100, step: 5, onChange: volume }),
                window.SP_REACT.createElement(TrackSettingStepper, { label: t("startSkip"), value: Math.round(currentTrack.startOffset), suffix: "s", min: 0, max: 30, step: 1, onChange: offset }),
                window.SP_REACT.createElement(DFL.ToggleField, { checked: currentTrack.loop, label: t("loopTrack"), description: t("loopTrackDesc"), onChange: loop }))) : null));
    };
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdQamRedesign", "flow-children": "vertical", style: { width: "100%", padding: "2px 12px 26px 4px", overflowX: "hidden" } },
            window.SP_REACT.createElement("style", null, `
          .tdQamRedesign,.tdQamRedesign *{box-sizing:border-box;min-width:0;letter-spacing:0}
          .tdQamRedesign .DialogButton{width:100%;min-height:36px!important;border-radius:5px!important;padding:0 10px!important;font-size:15px!important}
          .tdQamRedesign .DialogButton:hover,.tdQamRedesign .DialogButton:focus,.tdQamRedesign .DialogButton.gpfocus{background:rgba(240,180,41,.16)!important;color:#fff!important;border-color:rgba(240,180,41,.92)!important;box-shadow:0 0 0 2px rgba(240,180,41,.22)!important}
          .tdQamRedesign .DialogButton:hover *,.tdQamRedesign .DialogButton:focus *,.tdQamRedesign .DialogButton.gpfocus *{color:inherit!important}
          .tdQamRedesign .DialogButton:hover svg,.tdQamRedesign .DialogButton:focus svg,.tdQamRedesign .DialogButton.gpfocus svg{color:#fff!important;fill:currentColor!important}
          .tdQamRedesign .tdQamIconButton{width:38px!important;min-width:38px!important;height:38px!important;min-height:38px!important;padding:0!important}
          .tdQamRedesign .tdQamIconButton:focus,.tdQamRedesign .tdQamIconButton.gpfocus{background:rgba(240,180,41,.16)!important;color:#fff!important;border-color:rgba(240,180,41,.92)!important;box-shadow:0 0 0 2px rgba(240,180,41,.22)!important}
          .tdQamRedesign .tdQamIconButton:focus svg,.tdQamRedesign .tdQamIconButton.gpfocus svg{color:#fff!important;fill:currentColor!important}
          .tdQamCard{width:100%;margin:0 0 9px;padding:13px 12px;border:1px solid rgba(255,255,255,.085);border-radius:6px;background:rgba(255,255,255,.035);overflow:hidden}
          .tdQamCard h2{margin:0;font-size:16px;line-height:1.2;font-weight:700}
          .tdQamMeta{margin-top:4px;font-size:12px;line-height:1.3;opacity:.56;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .tdQamSectionLabel{margin:14px 4px 7px;font-size:12px;font-weight:800;text-transform:uppercase;opacity:.48}
          .tdQamTrackControls{display:grid;gap:7px;margin-top:11px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07)}
          .tdQamRedesign .tdCompactSetting{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:0;border:0}
          .tdQamRedesign .tdCompactSettingLabel{font-size:13px;font-weight:650;opacity:.68;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .tdQamRedesign .tdStepperRow{display:grid;grid-template-columns:36px minmax(48px,58px) 36px;gap:7px;align-items:center}
          .tdQamRedesign .tdStepperButton.DialogButton{width:36px!important;min-width:36px!important;height:36px!important;min-height:36px!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:5px!important;background:rgba(255,255,255,.075)!important;color:#fff!important}
          .tdQamRedesign .tdStepperButton.DialogButton:disabled{opacity:.32!important}
          .tdQamRedesign .tdStepperValue{font-size:15px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums}
          .tdQamList{max-height:190px;overflow-y:auto;margin-top:8px;padding:7px 9px;border-radius:5px;background:rgba(0,0,0,.16);font-size:.73rem;line-height:1.42}
          .tdQamRedesign [class*="PanelSectionRow"]{width:100%!important;max-width:100%!important}
        `),
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement("div", { className: "tdQamSectionLabel" }, "ThemeDeck"),
            window.SP_REACT.createElement("section", { className: "tdQamCard" },
                window.SP_REACT.createElement(DFL.ToggleField, { checked: autoPlay, label: t("autoPlayLabel"), description: t("autoPlayDesc"), onChange: setAutoPlay }),
                window.SP_REACT.createElement("div", { style: { marginTop: 8 } },
                    window.SP_REACT.createElement(TrackSettingStepper, { label: t("gameMusicVolumeLabel"), value: Math.round(gameTrackMasterVolume * 100), suffix: "%", min: 0, max: 100, step: 5, onChange: (value) => setGameTrackMasterVolume(clamp(value / 100)) })),
                window.SP_REACT.createElement("div", { style: { marginTop: 10, fontSize: ".76rem", fontWeight: 700 } }, t("stopMusicAfterPlay")),
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "grid", gap: 5, marginTop: 6 } }, [{ value: "launch_start", label: t("launchStart") }, { value: "game_started", label: t("launchFinish") }].map((option) => window.SP_REACT.createElement(FocusableButton, { key: option.value, className: "DialogButton", role: "radio", "aria-checked": launchStopMode === option.value, onClick: () => setLaunchStopMode(option.value), style: qamChoice(launchStopMode === option.value) },
                    window.SP_REACT.createElement("span", { style: { width: 8, height: 8, borderRadius: 8, background: launchStopMode === option.value ? "#f0b429" : "rgba(255,255,255,.24)" } }),
                    window.SP_REACT.createElement("span", null, option.label)))),
                window.SP_REACT.createElement("div", { style: { display: "grid", gap: 7, marginTop: 10, paddingTop: 9, borderTop: "1px solid rgba(255,255,255,.07)" } },
                    window.SP_REACT.createElement(DFL.ToggleField, { checked: globalAmbientEnabled, label: t("enableGlobalLabel"), description: t("enableGlobalDesc"), onChange: (value) => { setGlobalAmbientEnabled(value); scheduleAutoPlaybackFromContext(); } }),
                    window.SP_REACT.createElement(DFL.ToggleField, { checked: storeTrackEnabled, label: t("enableStoreLabel"), description: t("enableStoreDesc"), onChange: (value) => { setStoreTrackEnabled(value); scheduleAutoPlaybackFromContext(); } }),
                    window.SP_REACT.createElement(DFL.ToggleField, { checked: ambientDisableStore, label: t("disableGlobalStoreLabel"), description: t("disableGlobalStoreDesc"), onChange: (value) => { setAmbientDisableStore(value); scheduleAutoPlaybackFromContext(); } })),
                window.SP_REACT.createElement("div", { style: { marginTop: 10, fontSize: ".76rem", fontWeight: 700 } }, t("globalInterruptionLabel")),
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "grid", gap: 5, marginTop: 6 } }, [{ value: "stop", label: t("interruptStop") }, { value: "pause", label: t("interruptPause") }, { value: "mute", label: t("interruptMute") }].map((option) => window.SP_REACT.createElement(FocusableButton, { key: option.value, className: "DialogButton", role: "radio", "aria-checked": ambientInterruptionMode === option.value, onClick: () => setAmbientInterruptionMode(option.value), style: qamChoice(ambientInterruptionMode === option.value) },
                    window.SP_REACT.createElement("span", { style: { width: 8, height: 8, borderRadius: 8, background: ambientInterruptionMode === option.value ? "#f0b429" : "rgba(255,255,255,.24)" } }),
                    window.SP_REACT.createElement("span", null, option.label))))),
            window.SP_REACT.createElement("div", { className: "tdQamSectionLabel" }, t("globalAmbientPanelTitle")),
            renderQamTrack("ambient"),
            renderQamTrack("store"),
            window.SP_REACT.createElement("div", { className: "tdQamSectionLabel" }, t("autoAssignTitle")),
            window.SP_REACT.createElement("section", { className: "tdQamCard" },
                window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 9, alignItems: "baseline" } },
                    window.SP_REACT.createElement("h2", null, t("autoAssignTitle")),
                    window.SP_REACT.createElement("strong", { style: { fontSize: ".78rem" } }, unassignedLibraryGameCount)),
                window.SP_REACT.createElement("div", { className: "tdQamMeta" }, t("libraryCount", { count: libraryGames.length })),
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "grid", gap: 6, marginTop: 10 } },
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleAutoAssignMissingTracks, disabled: bulkAssign.running || ytDlpBusy || !ytDlpStatus.installed }, bulkAssign.running ? t("running") : t("autoAssignMissing")),
                    bulkAssign.running ? window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleStopBulkAssign }, t("stopButton")) : null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => setShowMissingGames((value) => !value) }, showMissingGames ? t("hideMissingGames") : t("showMissingGames")),
                    showMissingGames ? window.SP_REACT.createElement("div", { className: "tdQamList" }, missingGamesList.length ? missingGamesList.map((game) => window.SP_REACT.createElement("div", { key: game.appid }, game.name)) : t("noGamesMissingMusic")) : null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => setShowAssignedGames((value) => !value) }, showAssignedGames ? t("hideAssignedGames") : t("showAssignedGames")),
                    showAssignedGames ? window.SP_REACT.createElement("div", { className: "tdQamList" }, assignedGamesList.length ? assignedGamesList.map((game) => window.SP_REACT.createElement("div", { key: game.appid, style: { color: game.normalized ? "#f0b429" : "inherit" } }, game.name)) : t("noGamesWithMusic")) : null,
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleOpenAutoAssignExclusions, style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 14px", alignItems: "center", textAlign: "left" } },
                        window.SP_REACT.createElement("span", null, t("chooseAutoAssignExclusions")),
                        window.SP_REACT.createElement(FaChevronRight, { size: 12 }))),
                (bulkAssign.running || bulkAssign.message) ? window.SP_REACT.createElement("div", { style: { marginTop: 9, fontSize: ".71rem", opacity: .62 } }, bulkAssign.message || `${bulkAssign.completed}/${bulkAssign.total}`) : null),
            window.SP_REACT.createElement("div", { className: "tdQamSectionLabel" }, "Audio"),
            window.SP_REACT.createElement("section", { className: "tdQamCard" },
                window.SP_REACT.createElement(DFL.ToggleField, { checked: normalizeDownloadedAudio, label: t("normalizeAudioLabel"), description: t("normalizeAudioDesc"), onChange: setNormalizeDownloadedAudio }),
                window.SP_REACT.createElement("div", { style: { marginTop: 7 } },
                    window.SP_REACT.createElement(DFL.ToggleField, { checked: upmixDownloadedAudio, label: t("upmixAudioLabel"), description: t("upmixAudioDesc"), onChange: setUpmixDownloadedAudio })),
                window.SP_REACT.createElement("div", { className: "tdQamMeta", style: { color: audioNormalizationStatus.available ? "inherit" : "#ff9e9e" } }, audioNormalizationStatus.available ? t("normalizationAvailable") : t("normalizationUnavailable")),
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "grid", gap: 6, marginTop: 10 } },
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", disabled: ytDlpBusy, onClick: handleUpdateYtDlp }, ytDlpBusy ? t("updating") : t("updateYtdlp")),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleDeleteDownloadedTracks }, t("deleteDownloadedTracks")),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: handleDeleteUnusedDownloadedTracks }, t("deleteUnusedDownloadedTracks")))))));
};
const filePickerJoin = (base, child) => {
    const separator = base.includes("\\") ? "\\" : "/";
    return `${base.replace(/[\\/]+$/, "")}${separator}${child}`;
};
const filePickerParent = (path) => {
    const clean = path.replace(/[\\/]+$/, "");
    if (/^[A-Za-z]:$/.test(clean))
        return `${clean}\\`;
    const index = Math.max(clean.lastIndexOf("\\"), clean.lastIndexOf("/"));
    if (index < 0)
        return path;
    const parent = clean.slice(0, index);
    return /^[A-Za-z]:$/.test(parent) ? `${parent}\\` : parent || "/";
};
const THEMEDECK_EDITOR_ACTIVE_CLASS = "tdThemeDeckEditorActive";
const THEMEDECK_EDITOR_STYLE_ID = "td-themedeck-editor-chrome-style";
const THEMEDECK_EDITOR_CHROME_SELECTORS = [
    "#header",
    '[class*="BasicFooter"]',
    '[class*="FooterLegend"]',
    '[class*="QuickAccessFooter"]',
    '[class*="GamepadFooter"]',
    '[class*="GamepadHeader"]',
    '[class*="HeaderStatus"]',
    '[class*="StatusIcons"]',
    '[class*="TopBar"]',
];
const themeDeckEditorDocuments = () => {
    return collectKnownSteamDocuments();
};
const markThemeDeckEditorChrome = () => {
    themeDeckEditorDocuments().forEach((targetDocument) => {
        try {
            targetDocument.documentElement.classList.add(THEMEDECK_EDITOR_ACTIVE_CLASS);
            targetDocument.body?.classList.add(THEMEDECK_EDITOR_ACTIVE_CLASS);
            let style = targetDocument.getElementById(THEMEDECK_EDITOR_STYLE_ID);
            if (!style) {
                style = targetDocument.createElement("style");
                style.id = THEMEDECK_EDITOR_STYLE_ID;
                const htmlSelectors = THEMEDECK_EDITOR_CHROME_SELECTORS.map((selector) => `html.${THEMEDECK_EDITOR_ACTIVE_CLASS} ${selector}`);
                const bodySelectors = THEMEDECK_EDITOR_CHROME_SELECTORS.map((selector) => `body.${THEMEDECK_EDITOR_ACTIVE_CLASS} ${selector}`);
                style.textContent = `${[...htmlSelectors, ...bodySelectors].join(",")}{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:none!important;animation:none!important}`;
                targetDocument.head?.appendChild(style);
            }
        }
        catch { }
    });
};
const useThemeDeckEditorChromeSuppression = () => {
    SP_REACT.useEffect(() => {
        markThemeDeckEditorChrome();
        const followUps = [40, 120, 300, 700, 1200, 2000].map((delay) => window.setTimeout(markThemeDeckEditorChrome, delay));
        const steady = window.setInterval(markThemeDeckEditorChrome, 1800);
        return () => {
            window.clearInterval(steady);
            followUps.forEach((timer) => window.clearTimeout(timer));
            themeDeckEditorDocuments().forEach((targetDocument) => {
                try {
                    targetDocument.documentElement.classList.remove(THEMEDECK_EDITOR_ACTIVE_CLASS);
                    targetDocument.body?.classList.remove(THEMEDECK_EDITOR_ACTIVE_CLASS);
                }
                catch { }
            });
        };
    }, []);
};
const navigateToThemeDeckEditor = (path) => {
    markThemeDeckEditorChrome();
    DFL.Navigation.Navigate(path);
};
const ThemeDeckFilePickerModal = ({ initialPath, closeModal, onSelect, }) => {
    const [listing, setListing] = SP_REACT.useState({ path: initialPath, dirs: [], files: [] });
    const [manualPath, setManualPath] = SP_REACT.useState(initialPath);
    const [selectedPath, setSelectedPath] = SP_REACT.useState("");
    const [loading, setLoading] = SP_REACT.useState(true);
    const [saving, setSaving] = SP_REACT.useState(false);
    const load = SP_REACT.useCallback(async (path) => {
        setLoading(true);
        setSelectedPath("");
        try {
            const next = await listDirectory(path);
            setListing(next);
            setManualPath(next.path);
        }
        catch (error) {
            toaster.toast({ title: "ThemeDeck", body: getErrorMessage(error, t("unknownError")) });
        }
        finally {
            setLoading(false);
        }
    }, []);
    SP_REACT.useEffect(() => { void load(initialPath); }, [initialPath, load]);
    const audioFiles = listing.files.filter((file) => AUDIO_EXTENSIONS.some((extension) => file.toLocaleLowerCase().endsWith(`.${extension}`)));
    const confirm = async () => {
        if (!selectedPath || saving)
            return;
        setSaving(true);
        try {
            const validation = await validateAudioPath(selectedPath);
            if (!(validation?.valid ?? validation?.ok))
                throw new Error(validation?.error || validation?.message || "Unsupported audio file");
            await onSelect(String(validation?.path || selectedPath));
            closeModal?.();
        }
        catch (error) {
            toaster.toast({ title: "ThemeDeck", body: t("unableAddFile", { error: getErrorMessage(error, t("unknownError")) }) });
        }
        finally {
            setSaving(false);
        }
    };
    return (window.SP_REACT.createElement(DFL.ModalRoot, { closeModal: closeModal },
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdFilePicker", "flow-children": "vertical", style: { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 10000, width: "min(820px,calc(100vw - 72px))", height: "min(620px,calc(100vh - 72px))", display: "grid", gridTemplateRows: "auto minmax(0,1fr) auto", gap: 12, padding: 18, borderRadius: 8, border: "1px solid rgba(255,255,255,.16)", background: "rgba(16,17,18,.98)", boxShadow: "0 28px 90px rgba(0,0,0,.72)", overflow: "hidden" } },
            window.SP_REACT.createElement("style", null, `
          .tdFilePicker,.tdFilePicker *{box-sizing:border-box;min-width:0;letter-spacing:0}
          .tdFilePicker .DialogButton{color:#fff!important;border-radius:5px!important;font-size:14px!important}
          .tdFilePicker .DialogButton:focus,.tdFilePicker .DialogButton.gpfocus{background:#f0b429!important;color:#171717!important;box-shadow:0 0 0 2px rgba(255,255,255,.9)!important}
          .tdFilePickerList{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent}
          .tdFilePickerList::-webkit-scrollbar{width:8px}.tdFilePickerList::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border:2px solid transparent;background-clip:padding-box;border-radius:999px}
          .tdFilePickerSpinner{display:inline-block;width:20px;height:20px;border:2px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:tdFilePickerSpin .8s linear infinite}
          @keyframes tdFilePickerSpin{to{transform:rotate(360deg)}}
          .tdFilePickerEntry{width:100%!important;height:42px!important;min-height:42px!important;padding:0 12px!important;display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;gap:9px!important;align-items:center!important;text-align:left!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.06)!important}
          .tdFilePickerEntry[data-selected="true"]{border-color:#f0b429!important;background:rgba(240,180,41,.14)!important}
        `),
            window.SP_REACT.createElement("div", { style: { display: "grid", gridTemplateColumns: "42px minmax(0,1fr) 76px", gap: 8, alignItems: "center" } },
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", title: t("up"), onClick: () => void load(filePickerParent(listing.path)), style: { width: 42, minWidth: 42, height: 42, minHeight: 42, padding: 0, display: "grid", placeItems: "center" } },
                    window.SP_REACT.createElement(FaArrowLeft, null)),
                window.SP_REACT.createElement(DFL.TextField, { value: manualPath, onChange: (event) => setManualPath(event.target.value), style: { width: "100%", minWidth: 0 } }),
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", onClick: () => void load(manualPath), style: { width: 76, minWidth: 76, height: 42, minHeight: 42, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" } }, t("go"))),
            window.SP_REACT.createElement(DFL.Focusable, { className: "tdFilePickerList", "flow-children": "vertical", style: { minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "grid", alignContent: "start", gap: 6, padding: "2px 6px 2px 2px" } },
                loading ? window.SP_REACT.createElement("div", { style: { height: 54, display: "grid", placeItems: "center" } },
                    window.SP_REACT.createElement("span", { className: "tdFilePickerSpinner" })) : null,
                !loading && listing.dirs.map((directory) => (window.SP_REACT.createElement(FocusableButton, { key: `dir-${directory}`, className: "DialogButton tdFilePickerEntry", onClick: () => void load(filePickerJoin(listing.path, directory)) },
                    window.SP_REACT.createElement(FaFolder, null),
                    window.SP_REACT.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, directory)))),
                !loading && audioFiles.map((file) => {
                    const path = filePickerJoin(listing.path, file);
                    return window.SP_REACT.createElement(FocusableButton, { key: `file-${file}`, className: "DialogButton tdFilePickerEntry", "data-selected": selectedPath === path ? "true" : "false", onClick: () => setSelectedPath(path) },
                        window.SP_REACT.createElement(FaMusic, null),
                        window.SP_REACT.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, file));
                })),
            window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", disabled: !selectedPath || saving, onClick: () => void confirm(), style: { width: "100%", minWidth: 0, height: 46, minHeight: 46, background: selectedPath ? "#f0b429" : "rgba(255,255,255,.08)", color: selectedPath ? "#171717" : "rgba(255,255,255,.48)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 } },
                window.SP_REACT.createElement(FaCheck, null),
                saving ? t("loading") : t("chooseAudioFile")))));
};
const ChangeTheme = () => {
    useThemeDeckEditorChromeSuppression();
    const params = DFL.useParams();
    const appId = Number(params?.appid);
    const [track, setTrack] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const pickerStartPath = "C:\\";
    const [ytDlpStatus, setYtDlpStatus] = SP_REACT.useState({
        installed: false,
    });
    const [ytDlpBusy, setYtDlpBusy] = SP_REACT.useState(false);
    const [youtubeQuery, setYoutubeQuery] = SP_REACT.useState("");
    const [youtubeLoading, setYoutubeLoading] = SP_REACT.useState(false);
    const [youtubeResults, setYoutubeResults] = SP_REACT.useState([]);
    const [youtubeError, setYoutubeError] = SP_REACT.useState("");
    const [downloadingVideoId, setDownloadingVideoId] = SP_REACT.useState(null);
    const [gameDownloadProgress, setGameDownloadProgress] = SP_REACT.useState(0);
    const [routePathname, setRoutePathname] = SP_REACT.useState(window.location.pathname || "");
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
            const filename = fullPath.split(/[\\/]/).pop() || "track";
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
    const handleChooseAudioFile = async () => {
        let modal = null;
        const closeModal = () => modal?.Close();
        modal = DFL.showModal(window.SP_REACT.createElement(ThemeDeckFilePickerModal, { initialPath: pickerStartPath, closeModal: closeModal, onSelect: saveFromPath }), undefined, { strTitle: t("browseLocalTitle") });
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
            const response = await searchYouTube(query, 30);
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
            let preview = previewAudioRef.current;
            if (!preview) {
                preview = new Audio();
                preview.preload = "none";
                previewAudioRef.current = preview;
            }
            preview.onended = () => {
                setPreviewingVideoId(null);
            };
            preview.currentTime = 0;
            await playYouTubePreview(preview, response);
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
        if (!appId || downloadingVideoId)
            return;
        setDownloadingVideoId(result.id);
        setGameDownloadProgress(4);
        try {
            const started = await startGameDownload(appId, result.webpage_url, readAudioNormalizationSetting(), readAudioUpmixSetting());
            let current = started;
            while (current.running) {
                setGameDownloadProgress(value => Math.min(92, Math.max(value + 1, Number(current.progress || 0))));
                await new Promise(resolve => window.setTimeout(resolve, 300));
                current = await getDiscoverDownloadProgress(started.jobId);
            }
            if (current.status !== "completed" || !current.result)
                throw new Error(current.error || t("unknownError"));
            const response = current.result;
            setGameDownloadProgress(100);
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
            window.setTimeout(() => { setDownloadingVideoId(null); setGameDownloadProgress(0); }, 450);
            refreshYtDlpStatus(true);
        }
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
    const gameName = getDisplayName(appId);
    const compactIconButton = {
        width: 42,
        minWidth: 42,
        height: 42,
        minHeight: 42,
        padding: 0,
        display: "grid",
        placeItems: "center",
    };
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdGameEditor", "flow-children": "vertical", style: { position: "fixed", inset: 0, zIndex: 10, width: "100%", minHeight: "100vh", overflowY: "auto", overflowX: "hidden", padding: "30px max(36px,calc((100vw - 1460px)/2)) 110px", color: "#fff", background: "#080909" } },
            window.SP_REACT.createElement("style", null, `
          .tdGameEditor,.tdGameEditor *{box-sizing:border-box;letter-spacing:0}
          .tdGameEditor{background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 360px)}
          .tdGameEditor .DialogButton{border-radius:6px!important;min-height:42px!important}
          .tdGameEditor .tdGameIconButton:focus,.tdGameEditor .tdGameIconButton.gpfocus{background:#f0b429!important;color:#151515!important;box-shadow:0 0 0 3px rgba(255,255,255,.9)!important}
          .tdGameEditor .tdGameIconButton:focus svg,.tdGameEditor .tdGameIconButton.gpfocus svg{color:#151515!important;fill:currentColor!important}
          .tdGameEditorCard{width:100%;margin-top:16px;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(255,255,255,.045);overflow:hidden}
          .tdGameTopRow{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.65fr);gap:16px;align-items:stretch;margin-top:16px}
          .tdGameTopRow .tdGameEditorCard{height:100%;margin-top:0}
          .tdGameSearchRow{display:grid;grid-template-columns:minmax(0,1fr) 136px;gap:10px;margin-top:14px;align-items:stretch}
          .tdGameSearchRow .DialogButton{width:136px!important;min-width:136px!important;height:100%!important;min-height:0!important;padding:0 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
          .tdMiniSpinner{display:inline-block;width:17px;height:17px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:tdMiniSpin .8s linear infinite}
          @keyframes tdMiniSpin{to{transform:rotate(360deg)}}
          .tdGameEditorResult{display:grid;grid-template-columns:112px minmax(0,1fr) 42px 42px;gap:10px;align-items:center;min-height:72px;padding:7px;border-bottom:1px solid rgba(255,255,255,.075)}
          .tdGameEditorResult:last-child{border-bottom:0}
          ${SELECTED_TRACK_PANEL_CSS}
          @media(max-width:900px){.tdGameTopRow{grid-template-columns:minmax(0,1fr)}}
        `),
            window.SP_REACT.createElement("div", { ref: topFocusRef, tabIndex: -1, style: { position: "absolute", width: 0, height: 0, outline: "none" } }),
            window.SP_REACT.createElement("header", { style: { display: "grid", gridTemplateColumns: "42px minmax(0,1fr)", gap: 14, alignItems: "center" } },
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdGameIconButton", title: t("back"), onClick: () => DFL.Navigation.NavigateBack(), style: compactIconButton },
                    window.SP_REACT.createElement(FaArrowLeft, null)),
                window.SP_REACT.createElement("div", { style: { minWidth: 0 } },
                    window.SP_REACT.createElement("div", { style: { fontSize: 13, opacity: .56, textTransform: "uppercase", fontWeight: 700 } }, "ThemeDeck"),
                    window.SP_REACT.createElement("h1", { style: { margin: "4px 0 0", fontSize: 31, lineHeight: 1.08, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, gameName))),
            window.SP_REACT.createElement(DFL.Focusable, { className: "tdGameTopRow", "flow-children": "horizontal" },
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdGameEditorCard", "flow-children": "vertical" },
                    window.SP_REACT.createElement(SelectedTrackPanel, { track: track, loading: loading, emptyText: t("noMusicSelected"), isPlaying: playback.appId === appId && playback.status === "playing", onPreview: handleTrackPreviewToggle, onRemove: handleRemove, onVolumeChange: handleTrackVolumeChange, onStartChange: handleTrackStartOffsetChange, onLoopChange: handleTrackLoopChange })),
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdGameEditorCard", "flow-children": "vertical", style: { display: "flex", flexDirection: "column", justifyContent: "space-between" } },
                    window.SP_REACT.createElement("div", null,
                        window.SP_REACT.createElement("h2", { style: { margin: 0, fontSize: 19 } }, t("browseLocalTitle")),
                        window.SP_REACT.createElement("div", { style: { marginTop: 5, fontSize: 13, opacity: .55 } }, t("chooseAudioFile"))),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", title: t("chooseAudioFile"), onClick: () => void handleChooseAudioFile(), style: { width: "100%", minWidth: 0, height: 44, minHeight: 44, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 } },
                        window.SP_REACT.createElement(FaFolder, null),
                        window.SP_REACT.createElement("span", null, t("chooseAudioFile"))))),
            window.SP_REACT.createElement("section", { className: "tdGameEditorCard" },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 } },
                    window.SP_REACT.createElement("div", null,
                        window.SP_REACT.createElement("h2", { style: { margin: 0, fontSize: 21 } }, t("youtubeSearchTitle")),
                        window.SP_REACT.createElement("div", { style: { marginTop: 4, fontSize: 13, opacity: .58 } }, t("searchYoutubeDesc"))),
                    window.SP_REACT.createElement("div", { style: { fontSize: 12, opacity: ytDlpStatus.installed ? .52 : 1, color: ytDlpStatus.installed ? "inherit" : "#ff9e9e" } }, ytDlpStatus.installed ? `yt-dlp ${ytDlpStatus.version || ""}`.trim() : t("ytdlpNotInstalled"))),
                !ytDlpStatus.installed ? (window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", disabled: ytDlpBusy, onClick: async () => {
                        setYtDlpBusy(true);
                        try {
                            const status = await openYtDlpUpdate();
                            if (status)
                                setYtDlpStatus(status);
                        }
                        catch (error) {
                            toaster.toast({ title: "ThemeDeck", body: getErrorMessage(error, t("unknownUpdateError")) });
                        }
                        finally {
                            setYtDlpBusy(false);
                            void refreshYtDlpStatus(true);
                        }
                    }, style: { marginTop: 12 } }, ytDlpBusy ? t("installing") : t("installYtdlp"))) : null,
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdGameSearchRow", "flow-children": "horizontal" },
                    window.SP_REACT.createElement(DFL.TextField, { value: youtubeQuery, onChange: (event) => setYoutubeQuery(event.target.value), style: { width: "100%", minWidth: 0 } }),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton", title: youtubeLoading ? t("searching") : t("search"), onClick: handleYouTubeSearch, disabled: youtubeLoading || ytDlpBusy }, youtubeLoading ? window.SP_REACT.createElement("span", { className: "tdMiniSpinner" }) : t("search"))),
                youtubeError ? window.SP_REACT.createElement("div", { style: { marginTop: 10, color: "#ffb6b6", fontSize: 13 } }, youtubeError) : null,
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { marginTop: youtubeResults.length ? 14 : 0 } }, youtubeResults.map((result) => {
                    const assigned = Boolean(assignedVideoId && assignedVideoId === result.id);
                    return (window.SP_REACT.createElement(DFL.Focusable, { key: result.id, className: "tdGameEditorResult", "flow-children": "horizontal", style: { background: assigned ? "rgba(80,190,90,.09)" : "transparent" } },
                        window.SP_REACT.createElement("img", { src: `https://i.ytimg.com/vi/${encodeURIComponent(result.id)}/hqdefault.jpg`, alt: "", style: { width: 112, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 4 } }),
                        window.SP_REACT.createElement("div", { style: { minWidth: 0 } },
                            window.SP_REACT.createElement("div", { style: { fontSize: 14, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, result.title),
                            window.SP_REACT.createElement("div", { style: { marginTop: 3, fontSize: 12, opacity: .55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, [result.uploader || "YouTube", formatDuration(result.duration)].filter(Boolean).join(" · "))),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdGameIconButton", title: previewingVideoId === result.id ? t("stopPreview") : t("playPreview"), onClick: () => void handleYouTubePreview(result), disabled: previewLoadingVideoId !== null || downloadingVideoId !== null, style: compactIconButton }, previewLoadingVideoId === result.id ? window.SP_REACT.createElement(DFL.Spinner, null) : previewingVideoId === result.id ? window.SP_REACT.createElement(FaPause, null) : window.SP_REACT.createElement(FaPlay, null)),
                        window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdGameIconButton", title: t("downloadAssign"), onClick: () => void handleYouTubeDownload(result), disabled: downloadingVideoId !== null, style: compactIconButton }, downloadingVideoId === result.id ? window.SP_REACT.createElement(DFL.Spinner, null) : window.SP_REACT.createElement(FaDownload, null)),
                        downloadingVideoId === result.id && window.SP_REACT.createElement(DownloadProgressBar, { progress: gameDownloadProgress })));
                }))))));
};
const ScopedThemeEditor = ({ target }) => {
    useThemeDeckEditorChromeSuppression();
    const [track, setTrack] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [query, setQuery] = SP_REACT.useState("");
    const [searching, setSearching] = SP_REACT.useState(false);
    const [results, setResults] = SP_REACT.useState([]);
    const [error, setError] = SP_REACT.useState("");
    const [previewingId, setPreviewingId] = SP_REACT.useState(null);
    const [downloadingId, setDownloadingId] = SP_REACT.useState(null);
    const [downloadProgress, setDownloadProgress] = SP_REACT.useState(0);
    const audioRef = SP_REACT.useRef(null);
    const isAmbient = target === "ambient";
    const scopedPlayback = usePlaybackStateValue();
    const loadTrack = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const value = isAmbient ? await fetchGlobalTrack() : await fetchStoreTrack();
            setTrack(normalizeGlobalTrack(value));
        }
        finally {
            setLoading(false);
        }
    }, [isAmbient]);
    SP_REACT.useEffect(() => { void loadTrack(); }, [loadTrack]);
    SP_REACT.useEffect(() => () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.src = "";
        }
    }, []);
    const saveFromPath = async (path) => {
        const validation = await validateAudioPath(path);
        if (!validation?.valid)
            throw new Error(validation?.error || "Unsupported audio file");
        const resolved = validation.path || path;
        const filename = resolved.split(/[\\/]/).pop() || "track";
        if (isAmbient)
            await assignGlobalTrack(resolved, filename);
        else
            await assignStoreTrack(resolved, filename);
        window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
        await loadTrack();
        toaster.toast({ title: "ThemeDeck", body: isAmbient ? t("savedGlobal") : t("savedStore") });
    };
    const chooseLocal = () => {
        let modal = null;
        const closeModal = () => modal?.Close();
        modal = DFL.showModal(window.SP_REACT.createElement(ThemeDeckFilePickerModal, { initialPath: "C:\\\\", closeModal: closeModal, onSelect: saveFromPath }), undefined, { strTitle: t("browseLocalTitle") });
    };
    const runSearch = async () => {
        const clean = query.trim();
        if (!clean)
            return;
        setSearching(true);
        setError("");
        try {
            const response = await searchYouTube(clean, 30);
            setResults(response?.results || []);
        }
        catch (searchError) {
            setError(getErrorMessage(searchError, t("unknownError")));
        }
        finally {
            setSearching(false);
        }
    };
    const togglePreview = async (result) => {
        const audio = audioRef.current;
        if (previewingId === result.id && audio) {
            audio.pause();
            setPreviewingId(null);
            return;
        }
        try {
            const stream = await getYouTubePreviewStream(result.webpage_url);
            const nextAudio = audio || new Audio();
            audioRef.current = nextAudio;
            nextAudio.onended = () => setPreviewingId(null);
            await playYouTubePreview(nextAudio, stream);
            setPreviewingId(result.id);
        }
        catch (previewError) {
            toaster.toast({ title: "ThemeDeck", body: getErrorMessage(previewError, t("unknownError")) });
        }
    };
    const download = async (result) => {
        if (downloadingId)
            return;
        setDownloadingId(result.id);
        setDownloadProgress(4);
        try {
            const started = await startDiscoverDownload(target, result.webpage_url, readAudioNormalizationSetting(), readAudioUpmixSetting());
            let current = started;
            while (current.running) {
                setDownloadProgress((value) => Math.min(92, Math.max(value + 1, Number(current.progress || 0))));
                await new Promise((resolve) => window.setTimeout(resolve, 300));
                current = await getDiscoverDownloadProgress(started.jobId);
            }
            if (current.status !== "completed")
                throw new Error(current.error || t("unknownError"));
            setDownloadProgress(100);
            window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
            await loadTrack();
            toaster.toast({ title: "ThemeDeck", body: isAmbient ? t("savedGlobal") : t("savedStore") });
        }
        catch (downloadError) {
            toaster.toast({ title: "ThemeDeck", body: getErrorMessage(downloadError, t("unknownError")) });
        }
        finally {
            window.setTimeout(() => {
                setDownloadingId(null);
                setDownloadProgress(0);
            }, 450);
        }
    };
    const remove = async () => {
        if (isAmbient)
            await deleteGlobalTrack();
        else
            await deleteStoreTrack();
        setTrack(null);
        window.dispatchEvent(new Event(TRACKS_UPDATED_EVENT));
    };
    const updateVolume = async (value) => {
        if (!track)
            return;
        const normalized = clamp(value / 100);
        setTrack({ ...track, volume: normalized });
        const updated = isAmbient ? await updateGlobalVolume(normalized) : await updateStoreVolume(normalized);
        setTrack(normalizeGlobalTrack(updated));
    };
    const updateStart = async (value) => {
        if (!track)
            return;
        const normalized = clamp(value, 0, 30);
        setTrack({ ...track, startOffset: normalized });
        const updated = isAmbient ? await updateGlobalStartOffset(normalized) : await updateStoreStartOffset(normalized);
        setTrack(normalizeGlobalTrack(updated));
    };
    const updateLoop = async (value) => {
        if (!track)
            return;
        setTrack({ ...track, loop: value });
        const updated = isAmbient ? await updateGlobalLoop(value) : await updateStoreLoop(value);
        setTrack(normalizeGlobalTrack(updated));
    };
    const previewTrack = () => {
        if (!track)
            return;
        const appId = isAmbient ? GLOBAL_AMBIENT_APP_ID : STORE_TRACK_APP_ID;
        if (playbackState.appId === appId && playbackState.status === "playing")
            stopPlayback();
        else
            playTrack({ appId, ...track }, "manual");
    };
    return (window.SP_REACT.createElement(DFL.ScrollPanel, null,
        window.SP_REACT.createElement(DFL.Focusable, { className: "tdScopedEditor", "flow-children": "vertical", style: { position: "fixed", inset: 0, zIndex: 10, minHeight: "100vh", padding: "30px max(36px,calc((100vw - 1460px)/2)) 110px", boxSizing: "border-box", overflowY: "auto", overflowX: "hidden", color: "#fff", background: "#080909" } },
            window.SP_REACT.createElement("style", null, `
          .tdScopedEditor *{box-sizing:border-box;letter-spacing:0;min-width:0}
          .tdScopedEditor .DialogButton{color:#fff!important;border-radius:6px!important;min-height:42px!important}
          .tdScopedHeader{display:grid;grid-template-columns:42px minmax(0,1fr);gap:14px;align-items:center}
          .tdScopedCard{width:100%;height:auto;margin-top:0;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(255,255,255,.045);overflow:hidden}
          .tdScopedTopRow{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.65fr);gap:16px;align-items:stretch;margin-top:16px}
          .tdScopedTopRow .tdScopedCard{height:100%}
          .tdScopedSearchCard{margin-top:16px}
          .tdScopedSearchRow{display:grid;grid-template-columns:minmax(0,1fr) 136px;gap:10px;margin-top:14px;align-items:stretch}
          .tdScopedSearchRow .DialogButton{width:136px!important;min-width:136px!important;height:100%!important;min-height:0!important;padding:0 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
          .tdScopedEditor .tdScopedTextButton:focus,.tdScopedEditor .tdScopedTextButton.gpfocus{background:#f0b429!important;color:#151515!important;box-shadow:0 0 0 3px rgba(255,255,255,.9)!important}
          .tdScopedEditor .tdScopedTextButton:focus *,.tdScopedEditor .tdScopedTextButton.gpfocus *{color:inherit!important}
          .tdScopedEditor .tdScopeResult{display:grid;grid-template-columns:132px minmax(0,1fr) 40px 40px;align-items:center;gap:10px;min-height:82px;padding:7px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.045);border-radius:6px}
          .tdScopeDownloadProgress{grid-column:1/-1;height:7px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.15)}
          .tdScopedEditor .tdScopeIcon{width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;display:grid!important;place-items:center!important}
          .tdScopedEditor .tdScopeIcon:focus,.tdScopedEditor .tdScopeIcon.gpfocus{background:#f0b429!important;color:#151515!important;box-shadow:0 0 0 3px rgba(255,255,255,.9)!important}
          .tdScopedEditor .tdScopeIcon:focus svg,.tdScopedEditor .tdScopeIcon.gpfocus svg{color:#151515!important;fill:currentColor!important}
          .tdMiniSpinner{display:inline-block;width:17px;height:17px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:tdMiniSpin .8s linear infinite}
          @keyframes tdMiniSpin{to{transform:rotate(360deg)}}
          ${SELECTED_TRACK_PANEL_CSS}
          @media(max-width:900px){.tdScopedTopRow{grid-template-columns:minmax(0,1fr)}}
        `),
            window.SP_REACT.createElement("header", { className: "tdScopedHeader" },
                window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdScopeIcon", title: t("back"), onClick: () => DFL.Navigation.NavigateBack() },
                    window.SP_REACT.createElement(FaArrowLeft, null)),
                window.SP_REACT.createElement("div", null,
                    window.SP_REACT.createElement("div", { style: { fontSize: 13, opacity: .56, textTransform: "uppercase", fontWeight: 700 } }, "ThemeDeck"),
                    window.SP_REACT.createElement("h1", { style: { margin: "4px 0 0", fontSize: 31, lineHeight: 1.08 } }, isAmbient ? t("globalTrackTitle") : t("storeTrackTitle")))),
            window.SP_REACT.createElement(DFL.Focusable, { className: "tdScopedTopRow", "flow-children": "horizontal" },
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdScopedCard", "flow-children": "vertical" },
                    window.SP_REACT.createElement(SelectedTrackPanel, { track: track, loading: loading, emptyText: isAmbient ? t("noGlobalTrack") : t("noStoreTrack"), isPlaying: scopedPlayback.appId === (isAmbient ? GLOBAL_AMBIENT_APP_ID : STORE_TRACK_APP_ID) && scopedPlayback.status === "playing", onPreview: previewTrack, onRemove: remove, onVolumeChange: updateVolume, onStartChange: updateStart, onLoopChange: updateLoop })),
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdScopedCard", "flow-children": "vertical", style: { display: "flex", flexDirection: "column", justifyContent: "space-between" } },
                    window.SP_REACT.createElement("div", null,
                        window.SP_REACT.createElement("h2", { style: { margin: 0, fontSize: 19 } }, t("browseLocalTitle")),
                        window.SP_REACT.createElement("div", { style: { marginTop: 5, fontSize: 13, opacity: .55 } }, t("chooseAudioFile"))),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdScopedTextButton", style: { width: "100%", minWidth: 0, height: 44, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => void chooseLocal() },
                        window.SP_REACT.createElement(FaFolder, null),
                        t("chooseAudioFile")))),
            window.SP_REACT.createElement("section", { className: "tdScopedCard tdScopedSearchCard" },
                window.SP_REACT.createElement("h2", { style: { margin: 0, fontSize: 20 } }, t("youtubeSearchTitle")),
                window.SP_REACT.createElement(DFL.Focusable, { className: "tdScopedSearchRow", "flow-children": "horizontal" },
                    window.SP_REACT.createElement(DFL.TextField, { value: query, onChange: (event) => setQuery(event.target.value), style: { width: "100%", minWidth: 0 } }),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdScopedTextButton", title: searching ? t("searching") : t("search"), onClick: () => void runSearch(), disabled: searching }, searching ? window.SP_REACT.createElement("span", { className: "tdMiniSpinner" }) : t("search"))),
                error ? window.SP_REACT.createElement("div", { style: { color: "#ffb7b7", fontSize: 13, marginTop: 7 } }, error) : null,
                window.SP_REACT.createElement(DFL.Focusable, { "flow-children": "vertical", style: { display: "flex", flexDirection: "column", gap: 7, marginTop: results.length ? 10 : 0 } }, results.map((result) => (window.SP_REACT.createElement(DFL.Focusable, { key: result.id, className: "tdScopeResult", "flow-children": "horizontal" },
                    window.SP_REACT.createElement("img", { src: `https://i.ytimg.com/vi/${encodeURIComponent(result.id)}/hqdefault.jpg`, alt: "", style: { width: 132, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 4 } }),
                    window.SP_REACT.createElement("div", null,
                        window.SP_REACT.createElement("div", { style: { fontWeight: 650, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, result.title),
                        window.SP_REACT.createElement("div", { style: { opacity: .62, fontSize: 12, marginTop: 4 } }, [result.uploader || "YouTube", formatDuration(result.duration)].filter(Boolean).join(" · "))),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdScopeIcon", title: previewingId === result.id ? t("stopPreview") : t("playPreview"), onClick: () => void togglePreview(result) }, previewingId === result.id ? window.SP_REACT.createElement(FaPause, null) : window.SP_REACT.createElement(FaPlay, null)),
                    window.SP_REACT.createElement(FocusableButton, { className: "DialogButton tdScopeIcon", title: t("downloadAssign"), disabled: Boolean(downloadingId), onClick: () => void download(result) }, downloadingId === result.id ? window.SP_REACT.createElement(DFL.Spinner, null) : window.SP_REACT.createElement(FaDownload, null)),
                    downloadingId === result.id ? window.SP_REACT.createElement(DownloadProgressBar, { progress: downloadProgress }) : null))))))));
};
var index = definePlugin(() => {
    pluginDisposed = false;
    const unbindAudioUpmix = bindAudioUpmixListener();
    startLocationWatcher();
    startSteamAppWatchers();
    startAutoPlaybackCoordinator();
    const gamePatches = GAME_DETAIL_ROUTES.map((path) => injectBridgeIntoRoute(path));
    const contextMenuUnpatch = patchContextMenuFocus();
    routerHook.addRoute("/themedeck/global", () => window.SP_REACT.createElement(ScopedThemeEditor, { target: "ambient" }), { exact: true });
    routerHook.addRoute("/themedeck/store", () => window.SP_REACT.createElement(ScopedThemeEditor, { target: "store" }), { exact: true });
    routerHook.addRoute("/themedeck/:appid", () => window.SP_REACT.createElement(ChangeTheme, null), { exact: true });
    return {
        name: "ThemeDeck",
        titleView: (window.SP_REACT.createElement("div", { className: DFL.staticClasses.Title, style: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.45rem", width: "100%", marginLeft: "auto", paddingRight: 8 } },
            window.SP_REACT.createElement(FaCompactDisc, { size: 19 }),
            window.SP_REACT.createElement("span", null, "ThemeDeck"))),
        icon: window.SP_REACT.createElement(FaCompactDisc, null),
        content: window.SP_REACT.createElement(Content, null),
        onDismount() {
            pluginDisposed = true;
            unbindAudioUpmix();
            stopLocationWatcher();
            stopSteamAppWatchers();
            stopAutoPlaybackCoordinator();
            stopPlayback();
            clearAudioCache();
            contextMenuUnpatch?.();
            gamePatches.forEach((dispose) => dispose());
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
