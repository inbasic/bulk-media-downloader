/* Copyright (C) 2014-2017 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: http://add0n.com/media-tools.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/ */

'use strict';

var persist = {};

chrome.storage.local.get({
  'external': 'idm',
  'details-header': true,
  'details-external': true,
  'quotes': false
}, prefs => {
  $.external.select.value = prefs.external;
  $.external.select.dispatchEvent(new Event('change'));
  $.header.details.open = prefs['details-header'];
  $.external.details.open = prefs['details-external'];
  $.external.quotes.checked = prefs.quotes;
});

$.header.summary.addEventListener('click', () => {
  persist.save('details-header', !$.header.details.open);
});
$.external.summary.addEventListener('click', () => {
  persist.save('details-external', !$.external.details.open);
});
$.external.quotes.addEventListener('change', ({target}) => {
  persist.save('quotes', target.checked);
});

$.external.select.addEventListener('change', ({target}) => {
  persist.save('external', target.value);
});

persist.save = (id, value) => chrome.storage.local.set({
  [id]: value
});
