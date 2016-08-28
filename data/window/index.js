'use strict';

var os = 'chrome';
if (window.navigator.userAgent.indexOf('OPR') !== -1) {
  os = 'opera';
}
if (window.navigator.userAgent.indexOf('Firefox') !== -1) {
  os = 'firefox';
}
document.body.dataset.os = os;

var elements = {
  stats: document.getElementById('stats'),
  head: document.getElementById('links-head'),
  links: document.getElementById('links'),
  tools: document.getElementById('tools'),
  tr: document.querySelector('#tr tr'),
  tbody: document.querySelector('#links tbody'),
  filter: document.querySelector('[data-cmd="filter-toggle"] span'),
  pause: document.querySelector('[data-cmd="pause"]')
};

var urls = [];

var config = {
  _filter: 'all',
  _monitor: true
};
Object.defineProperty(config, 'filter', {
  enumerable: true,
  configurable: true,
  get () {
    return config._filter;
  },
  set (val) {
    config._filter = val;
    document.body.dataset.filterVideo = val === 'video' || val === 'all' || val === 'media' ? true : false;
    document.body.dataset.filterAudio = val === 'audio' || val === 'all' || val === 'media' ? true : false;
    document.body.dataset.filterImage = val === 'image' || val === 'all' ? true : false;
    elements.filter.textContent = `Type (${val})`;
  }
});
Object.defineProperty(config, 'monitor', {
  enumerable: true,
  configurable: true,
  get () {
    return config._monitor;
  },
  set (val) {
    config._monitor = val;
    chrome.runtime.sendMessage(val ? 'resume' : 'pause');
    document.body.dataset.active =val;
    elements.pause.dataset.cmd = val ? 'pause' : 'resume';
    elements.pause.value = val ? 'Pause' : 'Resume';
    document.title = `Bulk Media Downloader (${val ? 'active' : 'paused'})`;
  }
});

function bytesToSize(bytes) {
  if (bytes === 0) {
    return '0 Byte';
  }
  let k = 1024;
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(i ? 1 : 0) + ' ' + sizes[i];
}

// menu
document.addEventListener('click', (e) => {
  let target = e.target;
  let cmd = target.dataset.cmd;
  if (cmd === 'select-toggle') {
    elements.head.dataset.select = elements.links.dataset.select === 'true' ? false : true;
  }
  else if (cmd === 'filter-toggle') {
    elements.head.dataset.filter = elements.links.dataset.filter === 'true' ? false : true;
  }
  else if (cmd === 'pause') {
    config.monitor = false;
  }
  else if (cmd === 'resume') {
    config.monitor = true;
  }
  else if (cmd === 'clear') {
    elements.tbody.textContent = '';
    urls = [];
  }
  else if (cmd === 'select-all') {
    Array.from(elements.links.querySelectorAll('[type=checkbox]'))
      .forEach(e => e.checked = true);
  }
  else if (cmd === 'select-none') {
    Array.from(elements.links.querySelectorAll('[type=checkbox]'))
      .forEach(e => e.checked = false);
  }
  else if (cmd === 'select-videos') {
    let bol = ['all', 'video', 'media'].indexOf(config.filter) !== -1;
    Array.from(elements.links.querySelectorAll('[type=checkbox]'))
      .forEach(e => e.checked = bol && e.closest('tr').dataset.type === 'video');
  }
  else if (cmd === 'select-audios') {
    let bol = ['all', 'audio', 'media'].indexOf(config.filter) !== -1;
    Array.from(elements.links.querySelectorAll('[type=checkbox]'))
      .forEach(e => e.checked = bol && e.closest('tr').dataset.type === 'audio');
  }
  else if (cmd === 'select-images') {
    let bol = ['all', 'image'].indexOf(config.filter) !== -1;
    Array.from(elements.links.querySelectorAll('[type=checkbox]'))
      .forEach(e => e.checked = bol && e.closest('tr').dataset.type === 'image');
  }
  else if (cmd === 'filter-all') {
    config.filter = 'all';
  }
  else if (cmd === 'filter-medias') {
    config.filter = 'media';
  }
  else if (cmd === 'filter-videos') {
    config.filter = 'video';
  }
  else if (cmd === 'filter-audios') {
    config.filter = 'audio';
  }
  else if (cmd === 'filter-images') {
    config.filter = 'image';
  }
  else if (cmd === 'download-browser' || cmd === 'download-tdm') {
    Array.from(elements.links.querySelectorAll(':checked'))
      .map(e => e.closest('tr'))
      .forEach(tr => chrome.runtime.sendMessage({
        cmd,
        url: tr.dataset.url,
        referrer: tr.dataset.referrer,
        filename: tr.dataset.filename
      }));
  }
  // select
  let tr = target.closest('tr');
  if (tr && target.localName !== 'input' && tr.closest('#links')) {
    let input = tr.querySelector('[type=checkbox]');
    input.checked = !input.checked;
  }
  // select by click
  if (e.target.dataset.cmd !== 'select-toggle') {
    elements.head.dataset.select = false;
  }
  if (e.target.dataset.cmd !== 'filter-toggle') {
    elements.head.dataset.filter = false;
  }
  // buttons
  let disabled = !Array.from(elements.links.querySelectorAll('[type=checkbox]')).reduce((p, c) => p || c.checked, false);
  Array.from(elements.tools.querySelectorAll('[type=button]'))
    .filter(e => e.dataset.cmd.startsWith('download-'))
    .forEach(e => e.disabled = disabled);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.cmd === 'append') {
    if (urls.indexOf(message.url) !== -1) {
      return;
    }
    let tr = elements.tr.cloneNode(true);
    let tds = tr.querySelectorAll('td');
    tds[1].title = tds[1].textContent = message.type;
    tds[2].title = tds[2].textContent = message.url;
    tds[4].title = tds[4].textContent = (new Date()).toLocaleString();
    tds[6].textContent = message.tabId;
    tr.dataset.id = message.id;
    tr.dataset.url = message.url;
    tr.dataset.type = message.type.split('/')[0];
    elements.tbody.appendChild(tr);
    elements.stats.textContent = message.stats.media + '/' + message.stats.total;
    urls.push(message.url);
  }
  else if (message.cmd === 'extend') {
    let tr = document.querySelector(`[data-id="${message.id}"]`);
    if (tr) {
      let tds = tr.querySelectorAll('td');
      tds[3].textContent = message.length ? bytesToSize(message.length) : 'NA';
      tds[6].textContent = message.title;
      tr.dataset.referrer = message.url;
      if (message.disposition) {
        let tmp = /filename\=([^\;]*)/.exec(message.disposition);
        if (tmp && tmp.length) {
          tr.dataset.filename = tds[5].textContent = tmp[1].replace(/[\"\']$/, '').replace(/^[\"\']/, '');
        }
      }
    }
  }
  else if (message.cmd === 'error') {
    let tr = document.querySelector(`[data-id="${message.id}"]`);
    if (tr) {
      tr.dataset.error = true;
      let tds = tr.querySelectorAll('td');
      tds[5].textContent = message.msg;
    }
  }
});

// unload
var background;
chrome.runtime.getBackgroundPage(b => background = b);
window.addEventListener('beforeunload', () => background.monitor.deactivate());
