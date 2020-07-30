'use strict';

const api = window.api = {
  storage: {
    get(prefs) {
      return new Promise(resolve => chrome.storage.local.get(prefs, resolve));
    }
  },
  player: {
    async open(args) {
      const prefs = await api.storage.get({
        width: 800,
        height: 500,
        top: -1,
        left: -1
      });
      const {availLeft, availWidth, availTop, availHeight} = screen;
      const left = prefs.left < 0 ? availLeft + Math.round((availWidth - prefs.width) / 2) : prefs.left;
      const top = prefs.top < 0 ? availTop + Math.round((availHeight - prefs.height) / 2) : prefs.top;

      let url = 'data/player/index.html';
      if (args) {
        url += '?' + Object.entries(args).map(([key, value]) => key + '=' + encodeURIComponent(value)).join('&');
      }

      chrome.windows.create({
        url,
        type: 'popup',
        width: prefs.width,
        height: prefs.height,
        left,
        top
      });
    }
  }
};
