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
})
