'use strict';

var os = 'chrome';
if (window.navigator.userAgent.indexOf('OPR') !== -1) {
  os = 'opera';
}
if (window.navigator.userAgent.indexOf('Firefox') !== -1) {
  os = 'firefox';
}

var win = {
  id: chrome.windows.WINDOW_ID_NONE
};

var stats = {
  total: 0,
  media: 0
};

var config = {
  urls: {
    chrome: {
      app: 'https://chrome.google.com/webstore/detail/turbo-download-manager/kemfccojgjoilhfmcblgimbggikekjip'
    },
    opera: {
      app: 'https://addons.opera.com/extensions/details/turbo-download-manager/'
    },
    firefox: {
      app: 'https://addons.mozilla.org/firefox/addon/turbo-download-manager/'
    }
  }
};

var monitor = {
  _objs: [],
  _num: 0,
  process: (o) => {
    if (o) {
      monitor._objs.push(o);
    }
    if (monitor._num > 5) {
      return;
    }
    let obj = monitor._objs.shift();
    if (obj) {
      monitor._num += 1;
      let req = new XMLHttpRequest();
      req.open('HEAD', obj.url, true);
      req.onload = () => {
        chrome.tabs.get(obj.tabId, (tab) => chrome.runtime.sendMessage({
          cmd: 'extend',
          id: obj.id,
          title: obj.tabId + ' - ' + tab.title,
          url: tab.url,
          length: req.getResponseHeader('Content-Length'),
          disposition: req.getResponseHeader('Content-Disposition')
        }));
        monitor._num -= 1;
        monitor.process();
      };
      req.onerror = (e) => {
        chrome.runtime.sendMessage({
          cmd: 'error',
          msg: e.message,
          id: obj.id
        });
        monitor._num -= 1;
        monitor.process();
      };
      req.send();
    }
  },
  observe: (d) => {
    if (d.tabId === -1) {
      return;
    }
    // prevent YouTube video link detection
    if (os === 'chrome' && d.url.indexOf('googlevideo.') !== -1) {
      return;
    }
    let type = d.responseHeaders.filter(o => o.name === 'content-type' || o.name === 'Content-Type');
    if (type.length) {
      stats.total += 1;
      type = type[0].value;
      if (type.startsWith('image') || type.startsWith('video') || type.startsWith('audio')) {
        stats.media += 1;
        chrome.runtime.sendMessage({
          cmd: 'append',
          id: d.requestId,
          url: d.url,
          otype: d.type,
          tabId: d.tabId,
          timeStamp: d.timeStamp,
          methd: d.method,
          type,
          stats
        });
        monitor.process({
          id: d.requestId,
          tabId: d.tabId,
          url: d.url
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

chrome.browserAction.onClicked.addListener(() => {
  let screenWidth = screen.availWidth;
  let screenHeight = screen.availHeight;
  let width = 700;
  let height = 500;

  function create () {
    chrome.windows.create({
      url: chrome.extension.getURL('data/window/index.html'),
      width: width,
      height: height,
      left: Math.round((screenWidth-width) / 2),
      top: Math.round((screenHeight-height) / 2),
      type: 'popup'
    }, w => win = w);
    monitor.activate();
  }
  if (win.id === chrome.windows.WINDOW_ID_NONE) {
    create();
  }
  else {
    chrome.windows.get(win.id, w => {
      if (w) {
        chrome.windows.update(win.id, {focused: true});
      }
      else {
        create();
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'pause') {
    monitor.deactivate();
  }
  else if (message === 'resume') {
    monitor.activate();
  }
  else if (message.cmd === 'download-browser') {
    let options = {
      url: message.url
    };
    if (message.filename) {
      options.filename = message.filename;
    }
    chrome.downloads.download(options);
  }
  else if (message.cmd === 'download-tdm') {
    let id = 'kemfccojgjoilhfmcblgimbggikekjip';
    chrome.management.get(id,
      (result) => {
        if (result) {
          chrome.management.launchApp(id, () => {
            chrome.runtime.sendMessage(id, {
              'cmd': 'download',
              'url': message.url,
              'referrer': message.referrer
            });
          });
        }
        else {
          chrome.tabs.create({
            url: config.urls[os].app,
            active: true
          });
          chrome.notifications.create(null, {
            type: 'basic',
            iconUrl: './data/icons/48.png',
            title: 'Bulk Media Downloader',
            message: 'Please install "Turbo Download Manager" extension first'
          });
        }
      }
    );
  }
});
// faqs
chrome.storage.local.get('version', (obj) => {
  let version = chrome.runtime.getManifest().version;
  if (obj.version !== version) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/media-tools.html?from=flash&version=' + version + '&type=' + (obj.version ? ('upgrade&p=' + obj.version) : 'install')
      });
    });
  }
});
