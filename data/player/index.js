import playlist from './playlist.js';
import drag from './drag.js';
import boost from './boost.js';
import storage from './storage.js';
import keyboard from './keyboard.js';

const args = new URLSearchParams(location.search);

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

if (args.has('src')) {
  playlist.loadVideo([{
    src: args.get('src')
  }]);
}
