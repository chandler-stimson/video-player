import playlist from './playlist.js';
import drag from './drag.js';
import './context.js';
import './boost.js';
import './storage.js';
import './keyboard.js';

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
