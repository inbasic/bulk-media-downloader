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
