'use strict';

function save() {
  chrome.storage.local.set({
    notify: document.getElementById('notify').checked,
    faqs: document.getElementById('faqs').checked
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

function restore() {
  chrome.storage.local.get({
    notify: true,
    faqs: true
  }, prefs => {
    document.getElementById('notify').checked = prefs.notify;
    document.getElementById('faqs').checked = prefs.faqs;
  });
}
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
