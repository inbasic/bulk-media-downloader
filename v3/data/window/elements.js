/* Copyright (C) 2014-2025 InBasic
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 * Home: https://webextension.org/listing/bulk-media-downloader.html
 * GitHub: https://github.com/inbasic/bulk-media-downloader/
 */

'use strict';

// eslint-disable-next-line no-var
var $ = {
  stats: document.getElementById('stats'),
  head: document.getElementById('links-head'),
  links: document.getElementById('links'),
  tools: document.getElementById('tools'),
  tr: document.querySelector('#tr tr'),
  tbody: document.querySelector('#links tbody'),
  filter: document.querySelector('[data-cmd="toggle-filter"] span'),
  size: document.querySelector('[data-cmd="toggle-size"] span'),
  pause: document.querySelector('[data-cmd="pause"]')
};

$.header = {
  details: document.querySelector('details'),
  summary: document.querySelector('summary')
};

$.filters = {
  parent: document.getElementById('filters'),
  all: document.querySelector('#filters [value="all_files"]'),
  images: document.querySelector('#filters [value="images"]'),
  videos: document.querySelector('#filters [value="videos"]'),
  audios: document.querySelector('#filters [value="audios"]'),
  applications: document.querySelector('#filters [value="applications"]'),
  documents: document.querySelector('#filters [value="documents"]'),
  tab: document.querySelector('#filters [value="tab"]'),
  archives: document.querySelector('#filters [value="archives"]'),
  regexp: document.querySelector('#filters [type=text]')
};

$.buttons = {
  browser: document.querySelector('[data-cmd="download-browser"]'),
  links: document.querySelector('[data-cmd="copy-links"]')
};

$.external = {
  summary: document.querySelector(('#external summary')),
  details: document.querySelector(('#external details')),
  quotes: document.getElementById('quotes'),
  path: document.getElementById('external-path'),
  args: document.getElementById('external-args'),
  select: document.querySelector('#external select'),
  run: document.querySelector('#external [data-cmd=run]'),
  save: document.querySelector('#external [data-cmd=save]'),
  actions: document.getElementById('external-actions')
};
