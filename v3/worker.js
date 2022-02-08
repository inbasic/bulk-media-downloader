/* Copyright (C) 2014-2022 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: http://add0n.com/media-tools.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/ */

'use strict';

chrome.action.onClicked.addListener(tab => {
  chrome.runtime.sendMessage({
    cmd: 'bring-to-front'
  }, async resp => {
    chrome.runtime.lastError;
    if (resp === true) {
      chrome.tabs.sendMessage(tab.id, {
        cmd: 'update-id',
        id: tab.id
      });
    }
    else {
      const win = await chrome.windows.getCurrent();

      chrome.storage.local.get({
        width: 800,
        height: 600,
        left: win.left + Math.round((win.width - 800) / 2),
        top: win.top + Math.round((win.height - 600) / 2)
      }, prefs => {
        chrome.windows.create({
          url: 'data/window/index.html?tabId=' + tab.id,
          width: prefs.width,
          height: prefs.height,
          left: prefs.left,
          top: prefs.top,
          type: 'popup'
        });
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.cmd === 'focus') {
    chrome.tabs.update(sender.tab.id, {
      highlighted: true
    });
    chrome.windows.update(sender.tab.windowId, {
      focused: true
    });
  }
});

// Image Downloader (Open modified @belaviyo's image downloader UI [with developer's permission])
{
  const once = () => {
    chrome.contextMenus.create({
      title: 'Download all Images',
      contexts: ['action'],
      documentUrlPatterns: ['*://*/*'],
      id: 'save-images'
    });
    chrome.contextMenus.create({
      title: 'Download Live Streams',
      contexts: ['action'],
      documentUrlPatterns: ['*://*/*'],
      id: 'hls-downloader'
    });
  };
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'save-images') {
    chrome.tabs.create({
      url: 'https://add0n.com/save-images.html'
    });
  }
  else if (info.menuItemId === 'hls-downloader') {
    chrome.tabs.create({
      url: 'https://add0n.com/hls-downloader.html'
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
