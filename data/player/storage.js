import notify from './notify.js';
const storage = {};

storage.set = prefs => new Promise(resolve => chrome.storage.local.set(prefs, resolve));
storage.get = prefs => new Promise(resolve => chrome.storage.local.get(prefs, resolve));

// persist
storage.get({
  'repeat': 'no-repeat',
  'volume': 0.8,
  'boost': 1, // volume boost
  'speed': 1
}).then(prefs => {
  document.getElementById('repeat').dataset.mode = prefs.repeat;
  document.getElementById('speed').dataset.mode = prefs.speed + 'x';
  document.querySelector('video').volume = prefs.volume;
  document.querySelector('video').boost = prefs.boost;
  document.getElementById('boost').dataset.mode = prefs.boost + 'b';
  document.querySelector('video').playbackRate = prefs.speed;
});
document.getElementById('repeat').addEventListener('click', e => chrome.storage.local.set({
  'repeat': e.target.dataset.mode
}));
document.getElementById('speed').addEventListener('click', e => chrome.storage.local.set({
  'speed': parseInt(e.target.dataset.mode)
}, () => notify.display('Speed: ' + e.target.dataset.mode.toUpperCase())));
document.querySelector('video').addEventListener('volumechange', e => {
  chrome.storage.local.set({
    'volume': e.target.volume
  });
});
document.querySelector('video').addEventListener('boostchange', e => {
  chrome.storage.local.set({
    'boost': e.target.boost
  }, () => notify.display('Boost: ' + e.target.boost + 'X'));
});

export default storage;
