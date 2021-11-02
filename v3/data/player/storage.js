import notify from './notify.js';
const storage = {};

storage.set = prefs => new Promise(resolve => chrome.storage.local.set(prefs, resolve));
storage.get = prefs => new Promise(resolve => chrome.storage.local.get(prefs, resolve));

const video = document.querySelector('video');

// persist
storage.get({
  'repeat': 'no-repeat',
  'volume': 0.8,
  'speed': 1
}).then(prefs => {
  document.getElementById('repeat').dataset.mode = prefs.repeat;
  document.getElementById('speed').dataset.mode = prefs.speed + 'x';
  video.volume = prefs.volume;
  video.playbackRate = prefs.speed;
});
document.getElementById('repeat').addEventListener('click', e => chrome.storage.local.set({
  'repeat': e.target.dataset.mode
}));
document.getElementById('speed').addEventListener('click', e => chrome.storage.local.set({
  'speed': parseInt(e.target.dataset.mode)
}, () => notify.display('Speed: ' + e.target.dataset.mode.toUpperCase())));
video.addEventListener('volumechange', e => {
  chrome.storage.local.set({
    'volume': e.target.volume
  });
});
video.addEventListener('boostchange', () => {
  notify.display('Boost: ' + video.boost + 'B');
});


export default storage;
