/* Copyright (C) 2014-2017 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: http://add0n.com/media-tools.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/ */

/* globals $, persist */
'use strict';

document.body.dataset.os = navigator.userAgent.indexOf('Firefox') !== -1 ? 'firefox' : (
  navigator.userAgent.indexOf('OPR') === -1 ? 'chrome' : 'opera'
);
if (window.location.search) {
  document.body.dataset.tabId = window.location.search.replace('?tabId=', '');
}

var update = (function(callback) {
  $.filters.parent.addEventListener('change', callback);
  $.filters.parent.addEventListener('keyup', callback);

  return () => callback();
})(function() {
  [...$.tbody.querySelectorAll('tr')]
    .forEach(tr => tr.querySelector('[type=checkbox]').checked = isChecked(tr));
  state();
});

var is = {
  application: tr => tr.dataset.type === 'application',
  document: tr => tr.dataset.type === 'document' || /\.(txt|docm|xps|odc|otc|odb|odf|odft|odg|otg|odi|oti|odp|otp|ods|ots|odt|odm|ott|oth|pptx|sldx|ppsx|potx|xlsx|xltx|docx|dotx)$/.test(tr.dataset.url),
  video: tr => tr.dataset.type === 'video' || /\.(3gp|3g2|h261|h263|h264|jpgv|jpm|jpgm|mj2|mjp2|ts|mp4|mp4v|mpg4|mpeg|mpg|mpe|m1v|m2v|ogv|qt|mov|uvh|uvvh|uvm|uvvm|uvp|uvvp|uvs|uvvs|uvv|uvvv|dvb|fvt|mxu|m4u|pyv|uvu|uvvu|viv|webm|f4v|fli|flv|m4v|mkv|mk3d|mks|mng|asf|asx|vob|wm|wmv|wmx|wvx|avi|movie|smv)$/.test(tr.dataset.url),
  audio: tr => tr.dataset.type === 'audio' || /\.(adp|au|snd|mid|midi|kar|rmi|m4a|mp3|mpga|mp2|mp2a|m2a|m3a|oga|ogg|spx|s3m|sil|uva|uvva|eol|dra|dts|dtshd|lvp|pya|rip|weba|aac|aif|aiff|aifc|caf|flac|mka|m3u|wax|wma|ra|rmp|wav)$/.test(tr.dataset.url),
  archive: tr => tr.dataset.type === 'archive' || /\.(zip|rar|jar|apk|xpi|crx|joda|tao)$/.test(tr.dataset.url),
  image: tr => tr.dataset.type === 'image' || /\.(bmp|cgm|g3|gif|ief|jpeg|jpg|jpe|ktx|png|btif|sgi|svg|svgz|tiff|tif|psd|uvi|uvvi|uvg|uvvg|djv|sub|dwg|dxf|fbs|fpx|fst|mmr|rlc|mdi|wdp|npx|wbmp|xif|webp|3ds|ras|cmx|fh|fhc|fh4|fh5|fh7|ico|sid|pcx|pic|pct|pnm|pbm|pgm|ppm|rgb|tga|xbm|xpm|xwd)$/.test(tr.dataset.url),
  tab: tr => tr.dataset.tabId === document.body.dataset.tabId
};

var urls = [];

var config = {
  _filter: 'all',
  _monitor: true,
  _size: 'all' // 'all', '100k', '1m', '10m'
};
Object.defineProperty(config, 'filter', {
  enumerable: true,
  configurable: true,
  get() {
    return config._filter;
  },
  set(val) {
    config._filter = val;
    document.body.dataset.filterVideo = val === 'video' || val === 'all' || val === 'media';
    document.body.dataset.filterAudio = val === 'audio' || val === 'all' || val === 'media';
    document.body.dataset.filterImage = val === 'image' || val === 'all';
    document.body.dataset.filterApp = val === 'application' || val === 'all';
    $.filter.textContent = `Type (${val})`;
    persist.save('filter', val);
  }
});
Object.defineProperty(config, 'monitor', {
  enumerable: true,
  configurable: true,
  get() {
    return config._monitor;
  },
  set(val) {
    config._monitor = val;
    chrome.runtime.sendMessage(val ? 'resume' : 'pause');
    document.body.dataset.active = val;
    $.pause.dataset.cmd = val ? 'pause' : 'resume';
    $.pause.value = val ? 'Pause' : 'Resume';
    document.title = `Bulk Media Downloader (${val ? 'active' : 'paused'})`;
  }
});
Object.defineProperty(config, 'size', {
  enumerable: true,
  configurable: true,
  get() {
    return config._size;
  },
  set(val) {
    config._size = val;
    document.body.dataset.size = val;
    $.size.textContent = `Size (${val})`;
    persist.save('size', val);
  }
});

function notify(message) {
  chrome.storage.local.get({
    notify: true
  }, prefs => prefs.notify && chrome.notifications.create(null, {
    type: 'basic',
    iconUrl: '/data/icons/48.png',
    title: 'Bulk Media Downloader',
    message
  }));
}
function visible(e) {
  return Boolean(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

function state() {
  const disabled = [...$.links.querySelectorAll('[type=checkbox]:checked')].filter(visible).length === 0;
  $.buttons.tdm.disabled =
  $.buttons.browser.disabled =
  $.buttons.links.disabled =
  $.external.run.disabled =
    disabled;
}

function isChecked(tr) {
  let checked = false;
  if ($.filters.all.checked) {
    checked = true;
  }
  else {
    if ($.filters.applications.checked) {
      checked = checked || (tr.dataset.type === 'application' || /\.(exe|xpi)/.test(tr.dataset.url));
    }
    if ($.filters.images.checked) {
      checked = checked || is.image(tr);
    }
    if ($.filters.videos.checked) {
      checked = checked || is.video(tr);
    }
    if ($.filters.audios.checked) {
      checked = checked || is.audio(tr);
    }
    if ($.filters.archives.checked) {
      checked = checked || is.archive(tr);
    }
    if ($.filters.documents.checked) {
      checked = checked || is.document(tr);
    }
    if ($.filters.tab.checked) {
      checked = checked || is.tab(tr);
    }
    if ($.filters.regexp.value) {
      try {
        const r = new RegExp($.filters.regexp.value);
        checked = checked || r.test(tr.dataset.url);
        if (tr.dataset.filename && tr.dataset.filename !== '-') {
          checked = checked || r.test(tr.dataset.filename);
        }
      }
      catch (e) {}
    }
  }
  return checked;
}

function bytesToSize(bytes) {
  if (bytes === 0 || bytes === '0') {
    return '0 Byte';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(i ? 1 : 0) + ' ' + sizes[i];
}
// display or hide a top menu
document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;
  $.head.dataset.select = cmd === 'toggle-select';
  $.head.dataset.filter = cmd === 'toggle-filter';
  $.head.dataset.size = cmd === 'toggle-size';
});

// toggle item's selection on click
document.addEventListener('click', e => {
  const target = e.target;
  const tr = target.closest('tr');
  if (tr && tr.closest('#links')) {
    if (target.localName !== 'input') {
      const input = tr.querySelector('[type=checkbox]');
      input.checked = !input.checked;
    }
    state();
  }
});

// commands
document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;
  if (cmd === 'pause' || cmd === 'resume') {
    config.monitor = cmd === 'resume';
  }
  else if (cmd === 'clear') {
    $.tbody.textContent = '';
    urls = [];
    state();
  }
  else if (cmd === 'download-browser' || cmd === 'download-tdm') {
    const items = [...$.links.querySelectorAll(':checked')]
      .filter(item => visible(item));
    if (items.length > 10) {
      if (!window.confirm('Are you sure you want to download ' + items.length + ' items at once?')) {
        return;
      }
    }
    items.map(e => e.closest('tr'))
      .forEach(tr => chrome.runtime.sendMessage({
        cmd,
        url: tr.dataset.url,
        referrer: tr.dataset.referrer,
        filename: tr.dataset.filename
      }));
    if (cmd === 'download-browser') {
      notify(items.length + ' link' + (items.length > 1 ? 's are' : ' is') + ' being downloaded');
    }
  }
  else if (cmd === 'copy-links') {
    const links = [...$.links.querySelectorAll(':checked')]
      .filter(item => visible(item))
      .map(e => e.closest('tr'))
      .map(tr => tr.dataset.url);
    document.oncopy = e => {
      e.clipboardData.setData('text/plain', links.join('\n'));
      e.preventDefault();
    };
    window.focus();
    document.execCommand('Copy', false, null);
    notify(links.length + ' link' + (links.length > 1 ? 's are' : ' is') + ' copied to the clipboard');
  }
});
// top menu selection or filter changes
document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;

  if (cmd && cmd.startsWith('select-')) {
    [...$.links.querySelectorAll('[type=checkbox]')]
      .forEach(e => {
        if (cmd === 'select-all' || cmd === 'select-none') {
          e.checked = cmd === 'select-all';
        }
        else {
          e.checked = is[cmd.replace('select-', '')](e.closest('tr'));
        }
      });
    state();
  }
  else if (cmd && cmd.startsWith('filter-')) {
    config.filter = cmd.replace('filter-', '');
    state();
  }
  else if (cmd && cmd.startsWith('size-')) {
    config.size = cmd.replace('size-', '');
    state();
  }
});

function findTitle(message) {
  if (message.disposition) {
    if (message.disposition.indexOf('inline') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(message.disposition);
      if (matches && matches.length) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    else {
      const matches = /filename=([^;]*)/.exec(message.disposition);
      if (matches && matches.length) {
        return matches[1].replace(/["']$/, '').replace(/^["']/, '');
      }
    }
  }
  let name = message.url.split('/').pop().split('?').shift();
  let extension = /\.([^.]+)$/.exec(name);
  if (extension && extension.length) {
    extension = extension[1];
    name = name.replace('.' + extension, '');
  }
  else {
    extension = message.type.split('/').pop().split('+').shift().split(';').shift();
  }
  return name + '.' + extension;
}

var referrer = (() => {
  const cache = {};

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      cache[tabId] = changeInfo.url;
    }
  });

  return (id, tr) => {
    if (cache[id]) {
      tr.dataset.referrer = cache[id];
    }
    else {
      chrome.tabs.get(id, t => {
        cache[id] = t.url;
        tr.dataset.referrer = cache[id];
      });
    }
  };
})();

chrome.runtime.onMessage.addListener(message => {
  if (message.cmd === 'append') {
    if (urls.indexOf(message.url) !== -1) {
      return;
    }
    const tr = $.tr.cloneNode(true);
    const tds = tr.querySelectorAll('td');
    tds[1].title = tds[1].textContent = message.type.split(';').shift();
    tds[2].textContent = isNaN(message.length) ? 'N/A' : bytesToSize(message.length);
    tds[3].title = tds[3].textContent = message.url;
    tds[4].title = tds[4].textContent = (new Date()).toLocaleTimeString();
    tds[6].title = tds[6].textContent = message.tabId;

    Object.assign(tr.dataset, {
      id: message.id,
      url: message.url,
      type: message.type.split('/')[0],
      size: isNaN(message.length) || message.length > 10 * 1024 * 1024 ? 'iii' : (
        message.length > 1 * 1024 * 1024 ? 'ii' : (
          message.length > 100 * 1024 ? 'i' : ''
        )
      )
    });
    referrer(message.tabId, tr);

    tr.dataset.filename = tds[5].title = tds[5].textContent = findTitle(message);

    tr.dataset.tabId = message.tabId;

    const shouldScroll = $.links.scrollHeight - $.links.clientHeight === $.links.scrollTop;
    $.tbody.appendChild(tr);
    if (shouldScroll) {
      $.links.scrollTop = $.links.scrollHeight - $.links.clientHeight;
    }
    tr.querySelector('input').checked = isChecked(tr);
    state();
    $.stats.textContent = message.stats.media + '/' + message.stats.total;
    urls.push(message.url);
  }
  else if (message.cmd === 'error') {
    const tr = document.querySelector(`[data-id="${message.id}"]`);
    if (tr) {
      tr.dataset.error = true;
      const tds = tr.querySelectorAll('td');
      tds[5].textContent = message.msg;
    }
  }
  else if (message.cmd === 'update-id') {
    document.body.dataset.tabId = message.id;
    update();
  }
});
// load
chrome.storage.local.get({
  filter: 'media',
  size: 'all'
}, prefs => {
  config = Object.assign(config, prefs);
});
// unload
window.addEventListener('beforeunload', () => {
  const background = chrome.extension.getBackgroundPage();
  background.monitor.deactivate();
  background.position({
    left: window.screenX,
    top: window.screenY,
    width: Math.max(window.outerWidth, 100),
    height: Math.max(window.outerHeight, 100)
  });
});
