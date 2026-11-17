/* Wedding countdown. Event timezone: Damascus (UTC+3, no DST since 2022), set explicitly in the ISO offset. */
(function () {
  var TARGET = new Date('2026-11-23T19:00:00+03:00').getTime();
  var els = { d: document.getElementById('cd-d'), h: document.getElementById('cd-h'), m: document.getElementById('cd-m'), s: document.getElementById('cd-s') };
  var box = document.getElementById('countdown'), done = document.getElementById('arrived');
  var last = {};
  function pad(n) { return String(n).padStart(2, '0'); }
  function set(k, v) { var t = pad(v); if (last[k] !== t) { els[k].textContent = t; last[k] = t; els[k].classList.remove('tick'); void els[k].offsetWidth; els[k].classList.add('tick'); } }
  function update() {
    var diff = TARGET - Date.now();
    if (diff <= 0) { box.hidden = true; done.hidden = false; clearInterval(timer); return; }
    var s = Math.floor(diff / 1000);
    set('d', Math.floor(s / 86400)); set('h', Math.floor(s % 86400 / 3600)); set('m', Math.floor(s % 3600 / 60)); set('s', s % 60);
  }
  var timer = setInterval(update, 1000);
  update();
})();
