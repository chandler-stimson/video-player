/* global MediaMetadata, muxjs */
import notify from './notify.mjs';
import stream from './stream.mjs';

const root = document.getElementById('playlist');
const video = document.querySelector('video');
const next = document.getElementById('next');
const previous = document.getElementById('previous');
const repeat = document.getElementById('repeat');
const speed = document.getElementById('speed');
const boost = document.getElementById('boost');
const capture = document.getElementById('capture');

video.addEventListener('blur', () => video.focus());
video.addEventListener('canplay', () => {
  try {
    document.body.dataset.type = video.captureStream().getTracks().some(t => t.kind === 'video') ? 'video' : 'audio';
  }
  catch (e) {
    console.log(e);
  }
});

const scrollIntoView = e => {
  const rect = e.getBoundingClientRect();

  if (rect.top < 0 || rect.bottom > root.clientHeight) {
    e.scrollIntoView();
  }
};

const stats = new WeakMap();
let delayId;

let state = -1; // current playing state
const playlist = {
  PlayerState: {
    'UNSTARTED': -1,
    'ENDED': 0,
    'PLAYING': 1,
    'PAUSED': 2,
    'BUFFERING': 3,
    'CUED': 5
  },
  configs: {
    delay: 1500
  },
  entries: [],
  index: -1, // current playlist index
  get state() {
    return state;
  },
  set state(s) {
    state = s;
    document.body.dataset.state = s;
    for (const c of playlist.onStateChange.cs) {
      c(s);
    }
  },
  open() {
    document.body.dataset.mode = 'expand';
    const active = document.querySelector('li.active');
    if (active) {
      scrollIntoView(active);
    }
  },
  close() {
    document.body.dataset.mode = 'collapse';
  },
  play(index = playlist.index, delay = 0) {
    clearTimeout(delayId);
    if (delay) {
      delayId = setTimeout(() => playlist.play(index, 0), delay);
      return;
    }
    if (video.src) {
      URL.revokeObjectURL(video.src);
    }

    playlist.index = index === -1 ? 0 : (index % playlist.entries.length);
    if (playlist.index + 1 === playlist.entries.length) {
      next.classList.add('disabled');
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }
    else {
      next.classList.remove('disabled');
      navigator.mediaSession.setActionHandler('nexttrack', () => next.click());
    }
    if (playlist.index === 0) {
      previous.classList.add('disabled');
      navigator.mediaSession.setActionHandler('previoustrack', null);
    }
    else {
      previous.classList.remove('disabled');
      navigator.mediaSession.setActionHandler('previoustrack', () => previous.click());
    }
    if (playlist.entries.length) {
      document.getElementById('p-button-view').classList.remove('disabled');
      document.getElementById('shuffle').classList.remove('disabled');
    }
    else {
      document.getElementById('shuffle').classList.add('disabled');
    }

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      video.currentTime -= 10;
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      video.currentTime += 10;
    });

    const s = playlist.entries[playlist.index];

    if (s.name) {
      const u = URL.createObjectURL(s);
      video.src = u;
    }
    else {
      video.src = s.src;
    }
    video.playbackRate = parseInt(speed.dataset.mode);
    document.title = (s.name || s.src) + ' :: ' + chrome.runtime.getManifest().name;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: document.title
    });

    // active entry
    for (const e of [...document.querySelectorAll('li.active')]) {
      e.classList.remove('active');
    }
    s.e.classList.add('active');
    scrollIntoView(s.e);
    const currentTime = stats.get(s);
    if (currentTime !== undefined) {
      video.currentTime = currentTime;
    }
    video.origin = s;
    video.play().catch(e => {
      const src = video.src;
      notify.display(e.message + ' Fallback Decoding...', 10000);


      const mediaSource = new MediaSource();
      video.src = URL.createObjectURL(mediaSource);
      video.play().catch(e => notify.display(e.message, 10000));

      let sourceBuf;
      let done = false;
      const push = buffer => {
        if (push.once !== true) {
          notify.clear();
          // create a buffer using the correct mime type
          const tracks = muxjs.mp4.probe.tracks(buffer);

          const mime = `video/mp4; codecs="${tracks.map(t => t.codec).join(',')}"`;
          sourceBuf = mediaSource.addSourceBuffer(mime);
          sourceBuf.addEventListener('updateend', () => {
            if (done) {
              mediaSource.endOfStream();
            }
          });

          mediaSource.duration = 5;
          sourceBuf.timestampOffset = 0;
          sourceBuf.appendBuffer(buffer);
          push.once = true;
        }
        else {
          mediaSource.duration += 5;
          sourceBuf.timestampOffset += 5;
          sourceBuf.appendBuffer(buffer.buffer);
        }
      };

      stream(src, push, () => done = true);
    });
    window.setTimeout(() => video.focus(), 100);
  },
  stopVideo() {
    video.pause();
    video.currentTime = 0;
  },
  loadVideo(files) {
    const index = playlist.entries.length;
    playlist.cueVideo(files);
    this.play(index);
  },
  cueVideo(files) {
    playlist.entries.push(...files);
    const f = document.createDocumentFragment();
    for (const file of files) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.dataset.id = 'name';
      name.textContent = file.name || file.src;
      const duration = document.createElement('span');
      duration.dataset.id = 'duration';
      duration.textContent = '--:--';
      li.appendChild(name);
      li.appendChild(duration);
      file.e = li;
      li.file = file;
      f.appendChild(li);
    }
    root.appendChild(f);
  },
  onStateChange(c) {
    playlist.onStateChange.cs.push(c);
  }
};
playlist.onStateChange.cs = [];

video.addEventListener('timeupdate', () => {
  stats.set(video.origin, video.currentTime);
});
video.addEventListener('abort', () => playlist.state = 0);
video.addEventListener('error', () => playlist.state = 0);
video.addEventListener('emptied', () => playlist.state = 0);
video.addEventListener('ended', () => {
  stats.set(video.origin, 0);
  playlist.state = 0;
  navigator.mediaSession.setActionHandler('seekbackward', null);
  navigator.mediaSession.setActionHandler('seekforward', null);

  capture.classList.add('disabled');

  if (playlist.index + 1 !== playlist.entries.length) {
    playlist.play(playlist.index + 1, playlist.configs.delay);
  }
  else {
    if (repeat.dataset.mode === 'repeat-all') {
      playlist.play(0, playlist.configs.delay);
    }
    else if (repeat.dataset.mode === 'repeat-one') {
      playlist.play(playlist.index, playlist.configs.delay);
    }
  }
});
video.addEventListener('play', () => {
  playlist.state = 1;
  capture.classList.remove('disabled');
});
video.addEventListener('playing', () => playlist.state = 1);
video.addEventListener('pause', () => playlist.state = 2);
video.addEventListener('waiting', () => playlist.state = 3);
video.addEventListener('loadstart', () => playlist.state = 3);
video.addEventListener('loadedmetadata', () => {
  const d = video.duration;
  const h = Math.floor(d / 3600);
  const m = Math.floor(d % 3600 / 60);
  const s = Math.floor(d % 3600 % 60);

  video.origin.e.querySelector('span[data-id=duration]').textContent =
    ('0' + h).substr(-2) + ':' + ('0' + m).substr(-2) + ':' + ('0' + s).substr(-2);
});

document.getElementById('p-button').addEventListener('change', e => {
  playlist[e.target.checked ? 'open' : 'close']();
});

root.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (li) {
    const index = playlist.entries.indexOf(li.file);
    if (index !== playlist.index) {
      playlist.play(index);
    }
  }
});
previous.addEventListener('click', () => playlist.play(playlist.index - 1));
next.addEventListener('click', () => playlist.play(playlist.index + 1));

repeat.addEventListener('click', e => {
  const modes = ['no-repeat', 'repeat-all', 'repeat-one'];
  const index = (modes.indexOf(e.target.dataset.mode) + 1) % 3;
  repeat.dataset.mode = modes[index];
});
speed.addEventListener('click', e => {
  const modes = ['1x', '2x', '4x', '8x'];
  const index = (modes.indexOf(e.target.dataset.mode) + 1) % 4;
  speed.dataset.mode = modes[index];
  video.playbackRate = parseInt(modes[index]);
});
boost.addEventListener('click', e => {
  const modes = ['1b', '2b', '4b'];
  const index = (modes.indexOf(e.target.dataset.mode) + 1) % 3;
  boost.dataset.mode = modes[index];
  setTimeout(() => {
    video.boost = parseInt(modes[index]);
  }, 100);
});
capture.addEventListener('click', e => {
  video.capture();
});

export default playlist;
