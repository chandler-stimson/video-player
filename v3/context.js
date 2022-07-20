/* global player */

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

    chrome.contextMenus.create({
      id: 'buttons',
      title: 'Show/Hide Player Buttons',
      contexts: ['action']
    });

    chrome.storage.local.get({
      'repeat-button': true,
      'capture-button': true,
      'speed-button': true,
      'boost-button': true,
      'add-button': true
    }, prefs => {
      chrome.contextMenus.create({
        id: 'add-button',
        title: 'Add Button',
        type: 'checkbox',
        parentId: 'buttons',
        contexts: ['action'],
        checked: prefs['add-button']
      });
      chrome.contextMenus.create({
        id: 'repeat-button',
        title: 'Repeat Button',
        type: 'checkbox',
        parentId: 'buttons',
        contexts: ['action'],
        checked: prefs['repeat-button']
      });
      chrome.contextMenus.create({
        id: 'capture-button',
        title: 'Screenshot Button',
        type: 'checkbox',
        parentId: 'buttons',
        contexts: ['action'],
        checked: prefs['capture-button']
      });
      chrome.contextMenus.create({
        id: 'speed-button',
        title: 'Speed Button',
        type: 'checkbox',
        parentId: 'buttons',
        contexts: ['action'],
        checked: prefs['speed-button']
      });
      chrome.contextMenus.create({
        id: 'boost-button',
        title: 'Boost Button',
        type: 'checkbox',
        parentId: 'buttons',
        contexts: ['action'],
        checked: prefs['boost-button']
      });
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId.endsWith('-button')) {
    chrome.storage.local.set({
      [info.menuItemId]: info.checked
    });
  }
  else {
    const src = info.srcUrl || info.linkUrl;

    chrome.runtime.sendMessage({
      method: 'open',
      src
    }, r => {
      chrome.runtime.lastError;
      if (r !== true) {
        player.open({
          src
        });
      }
    });
  }
});
