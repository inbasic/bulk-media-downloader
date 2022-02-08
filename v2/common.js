/* Copyright (C) 2014-2017 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: http://add0n.com/media-tools.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/ */

'use strict';

const os = navigator.userAgent.indexOf('Firefox') !== -1 ? 'firefox' : (
  navigator.userAgent.indexOf('OPR') === -1 ? 'chrome' : 'opera'
);

const ports = [];
chrome.runtime.onConnect.addListener(port => {
  ports.push(port);
  port.onMessage.addListener(request => {
    if (request.method === 'resize') {
      chrome.storage.local.set({
        left: request.left,
        top: request.top,
        width: request.width,
        height: request.height
      });
    }
  });
  port.onDisconnect.addListener(() => {
    const n = ports.indexOf(port);
    ports.splice(n, 1);
    monitor.deactivate();
  });
});

const stats = {
  total: 0,
  media: 0
};

const notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
});

const monitor = {
  observe: d => {
    if (d.tabId === -1) {
      return;
    }
    // prevent YouTube video link detection
    if (os === 'chrome' && d.url.indexOf('googlevideo.') !== -1) {
      return;
    }
    let type = d.responseHeaders.filter(o => o.name === 'content-type' || o.name === 'Content-Type');

    // remove range from stream URL if possible;
    d.url = d.url.replace(/&range=\d+-\d+/, '');

    if (type.length) {
      stats.total += 1;
      type = type[0].value;

      const length = d.responseHeaders
        .filter(o => o.name === 'content-length' || o.name === 'Content-Length')
        .map(l => l.value).shift();

      if (
        type.startsWith('image') ||
        type.startsWith('video') ||
        type.startsWith('audio') ||
        (type.startsWith('application') && type.indexOf('javascript') === -1)
      ) {
        stats.media += 1;
        chrome.runtime.sendMessage({
          cmd: 'append',
          id: d.requestId,
          url: d.url,
          otype: d.type,
          tabId: d.tabId,
          timeStamp: d.timeStamp,
          methd: d.method,
          length,
          disposition: d.responseHeaders
            .filter(o => o.name === 'content-disposition' || o.name === 'Content-Disposition')
            .map(o => o.value)
            .shift(),
          type,
          stats
        });
      }
    }
  },
  activate: () => {
    chrome.webRequest.onHeadersReceived.addListener(monitor.observe,
      {urls: ['<all_urls>']},
      ['responseHeaders']
    );
    chrome.browserAction.setBadgeText({text: 'R'});
  },
  deactivate: () => {
    chrome.webRequest.onHeadersReceived.removeListener(monitor.observe);
    chrome.browserAction.setBadgeText({text: ''});
  }
};

chrome.browserAction.onClicked.addListener(tab => {
  function create() {
    chrome.storage.local.get({
      width: 750,
      height: 600,
      left: screen.availLeft + Math.round((screen.availWidth - 700) / 2),
      top: screen.availTop + Math.round((screen.availHeight - 600) / 2)
    }, prefs => {
      chrome.windows.create({
        url: chrome.extension.getURL('data/window/index.html?tabId=' + tab.id),
        width: prefs.width,
        height: prefs.height,
        left: prefs.left,
        top: prefs.top,
        type: 'popup'
      }, () => monitor.activate());
    });
  }
  if (ports.length) {
    const tab = ports[0].sender.tab;
    chrome.windows.update(tab.windowId, {
      focused: true
    });
    chrome.tabs.sendMessage(tab.id, {
      cmd: 'update-id',
      id: tab.id
    });
  }
  else {
    create();
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message === 'pause') {
    monitor.deactivate();
  }
  else if (message === 'resume') {
    monitor.activate();
  }
  else if (message.cmd === 'download-browser') {
    const options = {
      url: message.url
    };
    if (message.filename && message.filename !== '-') {
      options.filename = message.filename
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",<>{}[\]\\/]/gi, '');
    }

    chrome.downloads.download(options, () => {
      if (chrome.runtime.lastError) {
        const a = document.createElement('a');
        a.href = options.url;
        a.setAttribute('download', options.filename || 'unknown_name');
        a.dispatchEvent(new MouseEvent('click'));
      }
    });
  }
});

// Image Downloader (Open modified @belaviyo's image downloader UI [with developer's permission])
chrome.contextMenus.create({
  title: 'Download all Images',
  contexts: ['browser_action'],
  documentUrlPatterns: ['*://*/*'],
  onclick() {
    chrome.tabs.create({
      url: 'https://add0n.com/save-images.html'
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
