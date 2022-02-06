'use strict';

self.importScripts('context.js');

const storage = {
  get(prefs) {
    return new Promise(resolve => chrome.storage.local.get(prefs, resolve));
  }
};

const player = {
  async open(args) {
    const prefs = await storage.get({
      width: 800,
      height: 500,
      top: -1,
      left: -1
    });

    const win = await chrome.windows.getCurrent();
    const left = prefs.left < 0 ? win.left + Math.round((win.width - prefs.width) / 2) : prefs.left;
    const top = prefs.top < 0 ? win.top + Math.round((win.height - prefs.height) / 2) : prefs.top;

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
};

chrome.action.onClicked.addListener(() => {
  chrome.runtime.sendMessage({
    method: 'open'
  }, r => {
    chrome.runtime.lastError;
    if (r !== true) {
      player.open();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'focus') {
    chrome.windows.update(sender.tab.windowId, {
      focused: true
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
