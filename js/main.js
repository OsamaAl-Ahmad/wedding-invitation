(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body, env = document.getElementById('envelope'), stage = document.getElementById('stage');
  var btn = document.getElementById('openBtn'), invite = document.getElementById('invite');
  var musicBtn = document.getElementById('musicBtn');

  function open() {
    btn.disabled = true;
    env.classList.add('open');
    setTimeout(function () {
      stage.classList.add('gone');
      body.classList.remove('is-sealed');
      invite.removeAttribute('aria-hidden');
      window.scrollTo(0, 0);
      startReveal();
    }, reduce ? 50 : 2300);
    setTimeout(function () { stage.style.display = 'none'; }, reduce ? 100 : 3500);
  }
  btn.addEventListener('click', open);

  function startReveal() {
    var items = invite.querySelectorAll('.card > *, .band > *, .closing > *');
    items.forEach(function (el) { el.classList.add('reveal'); });
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Music: a soft generative score built with Web Audio, so no audio file is required.
     If assets/music/music.mp3 exists it is used instead. Never autoplays; starts only on a tap. */
  var Music = (function () {
    var file = null, ctx, master, timer, susp, nextT = 0, step = 0, playing = false;
    var CHORDS = [[48, 55, 59, 64], [45, 55, 60, 64], [41, 53, 60, 64], [43, 55, 59, 62]], BAR = 6;
    fetch('assets/music/music.mp3', { method: 'HEAD' }).then(function (r) {
      if (r.ok) { file = new Audio('assets/music/music.mp3'); file.loop = true; }
    }).catch(function () {});
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function init() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      var dl = ctx.createDelay(1); dl.delayTime.value = .42;
      var fb = ctx.createGain(); fb.gain.value = .38; var wet = ctx.createGain(); wet.gain.value = .5;
      master.connect(lp); lp.connect(ctx.destination);
      master.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(lp);
      return true;
    }
    function tone(type, f, t, att, len, vol, det) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = det || 0;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .1);
    }
    function bar(t) {
      var c = CHORDS[step++ % CHORDS.length];
      c.forEach(function (m) { tone('triangle', hz(m), t, 2, BAR + 1.5, .05, -4); tone('sine', hz(m), t, 2, BAR + 1.5, .05, 5); });
      for (var i = 0; i < 8; i++) tone('sine', hz(c[(i * 3 + 1) % 4] + 24), t + i * .75, .01, 2.2, .07);
    }
    function schedule() { while (nextT < ctx.currentTime + 3) { bar(nextT); nextT += BAR; } }
    function fade(to, secs) {
      var t = ctx.currentTime; master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(to, t + secs);
    }
    function play() {
      if (file) { file.play().catch(function () {}); return playing = true; }
      if (!ctx && !init()) return false;
      clearTimeout(susp); ctx.resume();
      if (nextT < ctx.currentTime) nextT = ctx.currentTime + .1;
      schedule(); timer = setInterval(schedule, 1000); fade(.9, 1.5);
      return playing = true;
    }
    function pause() {
      playing = false;
      if (file) { file.pause(); return; }
      if (!ctx) return;
      clearInterval(timer); fade(0, .4);
      susp = setTimeout(function () { ctx.suspend(); }, 500);
    }
    return { toggle: function () { playing ? pause() : play(); return playing; } };
  })();
  musicBtn.addEventListener('click', function () {
    var on = Music.toggle();
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? 'إيقاف الموسيقى / Pause music' : 'تشغيل الموسيقى / Play music');
  });

  /* Gold particles + petals */
  if (reduce) return;
  var cv = document.getElementById('particles'), ctx = cv.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 2);
  function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  var N = W < 600 ? 22 : 40, ps = [];
  for (var i = 0; i < N; i++) ps.push(mk(true));
  function mk(init) {
    var petal = Math.random() < .3;
    return { x: Math.random() * W, y: init ? Math.random() * H : -10, r: petal ? 4 + Math.random() * 3 : .8 + Math.random() * 1.6,
      vy: .15 + Math.random() * .35, vx: (Math.random() - .5) * .25, a: Math.random() * 6.28, va: (Math.random() - .5) * .02, petal: petal, o: .25 + Math.random() * .45 };
  }
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) draw(); });
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    ps.forEach(function (p, i) {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y / 60 + i) * .15; p.a += p.va;
      if (p.y > H + 10) ps[i] = mk(false);
      ctx.globalAlpha = p.o;
      if (p.petal) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = '#E9DFCE'; ctx.strokeStyle = '#C6A15B'; ctx.lineWidth = .5;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.restore();
      } else { ctx.fillStyle = '#C6A15B'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
