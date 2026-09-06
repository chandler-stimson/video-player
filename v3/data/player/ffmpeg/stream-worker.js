/* global createFFmpegCore */

const OUTPUT = '/out.mp4';
const CORE_URL = new URL('ffmpeg-core.js', self.location.href).href;
const WASM_URL = new URL('ffmpeg-core.wasm', self.location.href).href;

let core = null;
let pos = 0;
let running = false;

const post = (message, transfer) => self.postMessage(message, transfer || []);

const clearFS = () => {
  for (const name of core.FS.readdir('/')) {
    if (name !== '.' && name !== '..') {
      try {
        if (core.FS.stat('/' + name).isDirectory() === false) {
          core.FS.unlink('/' + name);
        }
      }
      catch (e) {}
    }
  }
};

// ffmpeg's log lines re-enter this handler while exec() blocks the worker;
// each call delivers whatever new output bytes were flushed since the last one
const trigger = () => {
  if (running === false) {
    return;
  }
  try {
    const size = core.FS.stat(OUTPUT).size;
    if (size > pos) {
      const stream = core.FS.open(OUTPUT, 'r');
      const data = new Uint8Array(size - pos);
      core.FS.read(stream, data, 0, data.length, pos);
      core.FS.close(stream);
      pos = size;
      post({type: 'chunk', data}, [data.buffer]);
    }
  }
  catch (e) {}
};

self.onmessage = async ({data}) => {
  if (data.type !== 'run') {
    return;
  }
  try {
    if (core === null) {
      self.importScripts('ffmpeg-core.js');
      core = await createFFmpegCore({
        mainScriptUrlOrBlob: CORE_URL + '#' + btoa(JSON.stringify({wasmURL: WASM_URL}))
      });
      post({type: 'ready'});
    }
    clearFS();
    pos = 0;
    core.FS.writeFile(data.name, new Uint8Array(data.buffer));

    // detect stream types to pick the per-frame log filters that drive progressive reads
    const types = {video: false, audio: false};
    core.setLogger(({message}) => {
      types.video = types.video || /Stream #.*Video:/.test(message);
      types.audio = types.audio || /Stream #.*Audio:/.test(message);
    });
    try {
      core.ffprobe(data.name);
    }
    catch (e) {}

    const filters = [];
    if (types.video) {
      filters.push('-vf', 'showinfo');
    }
    if (types.audio) {
      filters.push('-af', 'ashowinfo');
    }

    core.setLogger(trigger);
    running = true;
    const ret = core.exec(
      '-i',
      data.name,
      ...filters,
      '-flush_packets', '1',
      '-frag_duration', '250000',
      '-min_frag_duration', '100000',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-f', 'mp4',
      OUTPUT
    );
    trigger();
    running = false;
    clearFS();
    post({type: 'done', ret});
  }
  catch (e) {
    running = false;
    post({type: 'error', message: e.message || String(e)});
  }
};
