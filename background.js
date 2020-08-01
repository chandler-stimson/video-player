/* global api */
'use strict';


const ports = [];
chrome.runtime.onConnect.addListener(port => {
  port.onDisconnect.addListener(() => {
    const index = ports.indexOf(port);
    ports.splice(index, 1);
  });
  ports.push(port);
});

chrome.browserAction.onClicked.addListener(() => {
  if (ports.length) {
    chrome.windows.update(ports[0].sender.tab.windowId, {
      focused: true
    });
  }
  else {
    api.player.open();
  }
});

{
  const startup = () => {
    chrome.contextMenus.create({
      id: 'play-media',
      title: 'Play with Video Player',
      contexts: ['audio', 'video']
    });
    chrome.contextMenus.create({
      title: 'Play with Video Player',
      id: 'play-link',
      contexts: ['link'],
      targetUrlPatterns: [
        'avi', 'mp4', 'webm', 'flv', 'mov', 'ogv', '3gp', 'mpg', 'wmv', 'swf', 'mkv',
        'pcm', 'wav', 'aac', 'ogg', 'wma', 'flac', 'mid', 'mka', 'm4a', 'voc'
      ].map(a => '*://*/*.' + a)
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener(info => {
  const src = info.srcUrl || info.linkUrl;
  if (ports.length) {
    chrome.windows.update(ports[0].sender.tab.windowId, {
      focused: true
    });
    ports[0].postMessage({
      method: 'play',
      src
    });
  }
  else {
    api.player.open({
      src
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
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
