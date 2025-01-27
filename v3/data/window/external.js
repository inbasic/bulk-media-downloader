/* Copyright (C) 2014-2025 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: https://webextension.org/listing/bulk-media-downloader.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/
 */

/* global persist, visible, $ */
'use strict';
{
  const os = navigator.userAgent.includes('Firefox') ? 'firefox' : (
    navigator.userAgent.includes('OPR') ? 'opera' : (
      navigator.userAgent.includes('Edg/') ? 'edge' : 'chrome'
    )
  );
  const id = {
    chrome: 'bifmfjgpgndemajpeeoiopbeilbaifdo',
    edge: 'icfhhpfimihpdgglmdlnmpaadfeaacbk',
    opera: 'enemdfoackoekaedijjmjlckkleokhih',
    firefox: '{65b77238-bb05-470a-a445-ec0efe1d66c4}'
  };
  const urls = {
    edge: 'https://microsoftedge.microsoft.com/addons/detail/icfhhpfimihpdgglmdlnmpaadfeaacbk',
    chrome: 'https://chrome.google.com/webstore/detail/bifmfjgpgndemajpeeoiopbeilbaifdo',
    opera: 'https://addons.opera.com/extensions/details/external-application-button/',
    firefox: 'https://addons.mozilla.org/firefox/addon/external-application/'
  };

  const map = {
    'wget': {
      path: 'wget',
      args: '[HREF]'
    },
    'idm': {
      path: '%ProgramFiles(x86)%\\Internet Download Manager\\IDMan.exe',
      args: '/d "[URL]"'
    },
    'fdm': {
      path: '%ProgramFiles%\\FreeDownloadManager.ORG\\Free Download Manager\\fdm.exe',
      args: '"[HREF]"'
    },
    'cus1': {
      path: 'application I path',
      args: '[HREF]'
    },
    'cus2': {
      path: 'application II path',
      args: '[HREF]'
    },
    'cus3': {
      path: 'application III path',
      args: '[HREF]'
    }
  };
  const {path, args, select, save, actions} = $.external;
  select.addEventListener('change', ({target}) => {
    chrome.storage.local.get({
      [target.value]: map[target.value] || ''
    }, prefs => {
      args.value = prefs[target.value].args;
      path.value = prefs[target.value].path;
      path.dispatchEvent(new Event('input'));
    });
  });
  path.addEventListener('input', ({target}) => {
    save.disabled = target.value === '';
  });

  const send = ({url, referrer, filename}, callback) => {
    chrome.runtime.sendMessage(id[os], {
      app: {
        args: args.value,
        quotes: $.external.quotes.checked,
        path: path.value,
        filename,
        referrer
      },
      tab: {
        url
      },
      selectionText: 'Sent by Bulk Media Downloader'
    }, resp => {
      if (resp === false) {
        window.alert('External Application Button rejected this execution!');
      }
      else if (resp === true) {
        callback();
      }
      else {
        window.alert('To run native commands, please install the "External Application Button" extension');
        chrome.tabs.create({
          url: urls[os]
        });
      }
    });
  };

  actions.addEventListener('click', ({target}) => {
    const cmd = target.dataset.cmd;
    if (cmd === 'save') {
      persist.save(select.value, {
        path: path.value,
        args: args.value
      });
    }
    else if (cmd === 'run') {
      target.disabled = true;
      const items = [...$.links.querySelectorAll(':checked')]
        .filter(item => visible(item));
      if (items.length > 10) {
        if (!window.confirm('Are you sure you want to run external command ' + items.length + ' times?')) {
          target.disabled = false;
          return;
        }
      }
      const objs = items.map(e => e.closest('tr'))
        .map(tr => ({
          url: tr.dataset.url,
          referrer: tr.dataset.referrer,
          filename: tr.dataset.filename
        }));
      const one = () => {
        const obj = objs.shift();
        if (obj) {
          send(obj, one);
        }
        else {
          target.disabled = false;
        }
      };
      one();
    }
  });
}
