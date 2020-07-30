import playlist from './playlist.js';
import drag from './drag.js';
import boost from './boost.js';
import storage from './storage.js';
import keyboard from './keyboard.js';


drag.onDrag(files => playlist.loadVideo(files));

const port = chrome.runtime.connect({
  name: 'player'
});
port.onMessage.addListener(request => {
  if (request.method === 'play') {
    playlist.loadVideo([{
      src: request.src
    }]);
  }
});
