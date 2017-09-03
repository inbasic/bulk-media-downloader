/*******************************************************************************
    Bulk Media Downloader - Grab and download media (image and video) sources by monitoring network (like FlashGot)

    Copyright (C) 2014-2017 InBasic

    This program is free software: you can redistribute it and/or modify
    it under the terms of the Mozilla Public License as published by
    the Mozilla Foundation, either version 2 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    Mozilla Public License for more details.
    You should have received a copy of the Mozilla Public License
    along with this program.  If not, see {https://www.mozilla.org/en-US/MPL/}.

    Home: http://add0n.com/media-tools.html
    GitHub: https://github.com/inbasic/bulk-media-downloader/
*/

'use strict';

var $ = {
  stats: document.getElementById('stats'),
  head: document.getElementById('links-head'),
  links: document.getElementById('links'),
  tools: document.getElementById('tools'),
  tr: document.querySelector('#tr tr'),
  tbody: document.querySelector('#links tbody'),
  filter: document.querySelector('[data-cmd="toggle-filter"] span'),
  size: document.querySelector('[data-cmd="toggle-size"] span'),
  pause: document.querySelector('[data-cmd="pause"]'),
};

$.filters = {
  parent: document.getElementById('filters'),
  all: document.querySelector('#filters [value="all_files"]'),
  images: document.querySelector('#filters [value="images"]'),
  videos: document.querySelector('#filters [value="videos"]'),
  audios: document.querySelector('#filters [value="audios"]'),
  applications: document.querySelector('#filters [value="applications"]'),
  documents: document.querySelector('#filters [value="documents"]'),
  archives: document.querySelector('#filters [value="archives"]'),
  regexp: document.querySelector('#filters [type=text]')
};

$.buttons = {
  tdm: document.querySelector('[data-cmd="download-tdm"]'),
  browser: document.querySelector('[data-cmd="download-browser"]'),
  links: document.querySelector('[data-cmd="copy-links"]')
};
