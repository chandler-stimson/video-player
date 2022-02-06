import playlist from './playlist.js';
import drag from './drag.js';
import './context.js';
import './boost.js';
import './capture.js';
import './storage.js';
import './keyboard.js';

const args = new URLSearchParams(location.search);

drag.onDrag(files => playlist.loadVideo(files));

if (args.has('src')) {
  playlist.loadVideo([{
    src: args.get('src')
  }]);
}

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'open') {
    response(true);
    chrome.runtime.sendMessage({
      method: 'focus'
    });

    if (request.src) {
      playlist.loadVideo([{
        src: request.src
      }]);
    }
  }
});

// show/hide buttons
{
  const update = () => chrome.storage.local.get({
    'repeat-button': true,
    'capture-button': true,
    'speed-button': true,
    'boost-button': true
  }, prefs => {
    for (const [name, value] of Object.entries(prefs)) {
      document.getElementById(name.replace('-button', '')).classList[value ? 'remove' : 'add']('hidden');
    }
  });
  update();
  chrome.storage.onChanged.addListener(ps => {
    if (ps['repeat-button'] || ps['capture-button'] || ps['speed-button'] || ps['boost-button']) {
      update();
    }
  });
}
