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
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener(info => {
  if (ports.length) {
    chrome.windows.update(ports[0].sender.tab.windowId, {
      focused: true
    });
    ports[0].postMessage({
      method: 'play',
      src: info.srcUrl
    });
  }
  else {
    api.player.open({
      src: info.srcUrl
    });
  }
});
