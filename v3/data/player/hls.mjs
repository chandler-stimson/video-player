/* global Hls */

const BASE = 'https://local.hls.invalid/';
const PLAYLIST_RE = /\.m3u8?$/i;
const SEGMENT_RE = /\.(ts|m4s|m4v|aac|vtt|webvtt|key)$/i;
const NATIVE_TYPE = 'application/vnd.apple.mpegurl';

const supported = src => {
  try {
    return PLAYLIST_RE.test(new URL(src).pathname);
  }
  catch (e) {
    return false;
  }
};

const isPlaylist = name => PLAYLIST_RE.test(name || '');
const isSegment = name => SEGMENT_RE.test(name || '');

const toKey = url => {
  try {
    return decodeURIComponent(new URL(url).pathname.slice(1));
  }
  catch (e) {
    return url;
  }
};

const encode = rel => rel.split('/').map(encodeURIComponent).join('/');

const createLoader = respond => class Loader {
  constructor(config) {
    this.config = config;
    this.aborted = {v: false};
  }
  load(context, config, callbacks) {
    this.aborted = {v: false};
    const aborted = this.aborted;
    const now = performance.now();
    const stats = {
      loading: {start: now, first: now, end: 0},
      parsing: {start: 0, end: 0},
      buffering: {start: 0, first: 0, end: 0},
      total: 0,
      loaded: 0
    };
    const done = data => {
      if (aborted.v) {
        return;
      }
      stats.loading.end = performance.now();
      stats.total = stats.loaded = data.byteLength || data.length || 0;
      callbacks.onSuccess({url: context.url, data, code: 200}, stats, context, null);
    };
    const fail = err => {
      if (aborted.v) {
        return;
      }
      callbacks.onError(err, context, null, stats);
    };
    respond(context, done, fail);
  }
  abort() {
    this.aborted.v = true;
  }
  destroy() {
    this.abort();
  }
  getCacheAge() {
    return 0;
  }
};

const localLoaders = fileMap => {
  const lookup = url => {
    const k = toKey(url);
    return fileMap.get(k) || fileMap.get(k.split('/').pop());
  };
  const slice = (buffer, context) => {
    if (context.rangeStart === undefined) {
      return buffer;
    }
    return buffer.slice(context.rangeStart, context.rangeEnd || buffer.byteLength);
  };

  const textRespond = (context, done, fail) => {
    const file = lookup(context.url);
    if (file) {
      file.text().then(done, e => fail({code: 0, text: String(e)}));
    }
    else if (/^https?:/i.test(context.url)) {
      fetch(context.url).then(r => r.text()).then(done, () => fail({code: 0, text: 'network error'}));
    }
    else {
      fail({code: 0, text: 'local file not found: ' + toKey(context.url)});
    }
  };

  const binaryRespond = (context, done, fail) => {
    const file = lookup(context.url);
    if (file) {
      file.arrayBuffer().then(b => done(slice(b, context)), e => fail({code: 0, text: String(e)}));
    }
    else if (/^https?:/i.test(context.url)) {
      const headers = {};
      if (context.rangeStart !== undefined && context.rangeEnd !== undefined) {
        headers.Range = 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1);
      }
      fetch(context.url, {headers}).then(r => r.arrayBuffer()).then(b => done(slice(b, context)), () => fail({code: 0, text: 'network error'}));
    }
    else {
      fail({code: 0, text: 'local file not found: ' + toKey(context.url)});
    }
  };

  return {
    pLoader: createLoader(textRespond),
    fLoader: createLoader(binaryRespond)
  };
};

let instance = null;

const detach = () => {
  if (instance) {
    instance.destroy();
    instance = null;
  }
};

const attach = (video, source, {
  startTime = 0,
  onError = () => {}
} = {}) => {
  detach();
  const local = typeof source !== 'string';
  if (video.canPlayType(NATIVE_TYPE) || !self.Hls || !Hls.isSupported()) {
    return 'native';
  }

  const hls = new Hls(local ? localLoaders(source.fileMap) : {});
  instance = hls;
  hls.on(Hls.Events.ERROR, (event, data) => {
    if (!data.fatal) {
      return;
    }
    detach();
    onError({
      message: data.details || 'HLS error',
      url: data.url,
      needsPermission: !local && data.type === Hls.ErrorTypes.NETWORK_ERROR && !data.response
    });
  });
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    hls.startLoad(startTime > 0 ? startTime : -1);
    video.play().catch(() => {});
  });
  if (local) {
    const rel = source.file.path || source.file.name;
    hls.loadSource(BASE + encode(rel));
  }
  else {
    hls.loadSource(source);
  }
  hls.attachMedia(video);
  return 'hls';
};

export default {
  supported,
  isPlaylist,
  isSegment,
  attach,
  detach,
  localLoaders
};
