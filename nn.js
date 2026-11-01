/* The Neural Network: applicant submission. Plain JavaScript, no dependencies, no tracking.
   Everything on the page is built from the JSON files next to it. Missing fields are shown as missing. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MISS = 'Not yet loaded from my workbook';
  function miss() { return '<span class="missing">' + esc(MISS) + '</span>'; }
  function linkify(v) {
    if (Array.isArray(v)) return v.map(linkify).join('<br>');
    v = String(v);
    return /^https?:\/\//.test(v) ? '<a href="' + esc(v) + '" rel="noopener">' + esc(v) + '</a>' : esc(v);
  }
  function val(v) { return (v && (!Array.isArray(v) || v.length)) ? linkify(v) : miss(); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function items(list) {
    var out = '', open = false;
    list.forEach(function (x) {
      if (x.li) { if (!open) { out += '<ul>'; open = true; } out += '<li>' + esc(x.t) + '</li>'; }
      else { if (open) { out += '</ul>'; open = false; } out += '<p>' + esc(x.t) + '</p>'; }
    });
    return out + (open ? '</ul>' : '');
  }
  function ul(a) { return '<ul>' + a.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'; }
  function ol(a) { return '<ol>' + a.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>'; }
  function table(cols, rows) {
    return '<div style="overflow-x:auto"><table class="tbl"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function acc(title, body, open) { return '<details class="acc"' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="body">' + body + '</div></details>'; }
  function shortTitle(t) { return t.split(':')[0]; }
  function lvl(l) { return /^Explorer to Builder/.test(l) ? 1.5 : /^Explorer/.test(l) ? 1 : /^Builder to Maker/.test(l) ? 2.5 : /^Builder/.test(l) ? 2 : 3; }
  function lvlName(l) { return l.replace(/\s*\(.*\)/, ''); }
  function hexRgb(h) {
    h = (h || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return isNaN(n) ? '15,140,128' : ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function cssv(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }

  var D = {}, state = { v: 'curation', tier: '', deck: '1' };

  /* ---------- ambient: living network, cursor glow, progress ---------- */
  var netCol = '15,140,128';
  function netColor() { netCol = hexRgb(cssv('--a1')); }
  function startNet() {
    var c = $('#net');
    if (!c || reduce) return;
    var ctx = c.getContext('2d'), W = 0, H = 0, pts = [], mx = -999, my = -999, raf = 0;
    function size() {
      var r = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight; c.width = W * r; c.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
      var n = Math.round(Math.min(95, (W * H) / 15000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32, r: Math.random() * 1.4 + .6 });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var paper = root.dataset.theme === 'paper', base = paper ? .3 : .5, i, j, p, q, dx, dy, d, a;
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20; if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        ctx.fillStyle = 'rgba(' + netCol + ',' + (base + .2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
          if (d < 16900) { a = (1 - d / 16900) * base * .55; ctx.strokeStyle = 'rgba(' + netCol + ',' + a + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        dx = p.x - mx; dy = p.y - my; d = dx * dx + dy * dy;
        if (d < 32400) { a = (1 - d / 32400) * base * 1.2; ctx.strokeStyle = 'rgba(' + netCol + ',' + a + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke(); p.x -= dx * .0008; p.y -= dy * .0008; }
      }
      raf = requestAnimationFrame(frame);
    }
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else { cancelAnimationFrame(raf); frame(); } });
    size(); frame();
  }
  function startGlow() {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (card) { var r = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
  }
  var scrollTick = false;
  function onScroll() {
    if (scrollTick) return; scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      document.querySelector('.progress').style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
      var ln = $('.lanes');
      if (ln) { var r = ln.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .75 - r.top) / r.height)); ln.style.setProperty('--lp', p.toFixed(3)); }
      fxTick(); planetTick();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal and counters ---------- */
  var io;
  function countTo(el) {
    var end = parseFloat(el.dataset.count), t0 = null, dur = 1400;
    if (reduce) { el.textContent = end; return; }
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function observe(scope) {
    if (!io) {
      io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target; el.classList.add('in');
          $$('[data-count]', el).forEach(countTo);
          if (el.hasAttribute('data-count')) countTo(el);
          if (el.classList.contains('bridge')) drawBridge();
          io.unobserve(el);
        });
      }, { threshold: .1, rootMargin: '0px 0px -8% 0px' });
    }
    $$('.reveal,[data-io],.split,.vh', scope || document).forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* ---------- drawer, tooltip, toast ---------- */
  var lastFocus = null;
  function openDrawer(label, html) {
    lastFocus = document.activeElement; hideTip();
    $('#dlabel').textContent = label; $('#dbody').innerHTML = html;
    $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false');
    $('#drawer').scrollTop = 0; setTimeout(function () { $('#dclose').focus(); }, 350);
    $$('#dbody [data-deck]').forEach(function (b) { b.addEventListener('click', function () { closeDrawer(); gotoDeck(b.dataset.deck); }); });
  }
  function closeDrawer() {
    $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true');
    $$('.node.sel,.pn.sel').forEach(function (n) { n.classList.remove('sel'); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  var tip;
  function showTip(html, x, y) {
    tip = tip || $('#tip'); tip.innerHTML = html; tip.classList.add('on');
    var w = tip.offsetWidth, h = tip.offsetHeight, nx = Math.min(innerWidth - w - 10, x + 16), ny = y + 18 + h > innerHeight ? y - h - 12 : y + 18;
    tip.style.left = Math.max(8, nx) + 'px'; tip.style.top = ny + 'px';
  }
  function hideTip() { (tip || $('#tip')).classList.remove('on'); }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 1800); }
  function sparks(x, y) {
    if (reduce) return;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('i'), a = Math.random() * 6.283, d = 30 + Math.random() * 60;
      s.className = 'spark'; s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.background = i % 3 ? 'var(--a1)' : 'var(--a2)';
      document.body.appendChild(s); setTimeout(function (el) { el.remove(); }.bind(null, s), 950);
    }
  }
  function copyText(text, btn) {
    function done() {
      toast('Copied to clipboard');
      var r = btn.getBoundingClientRect(); sparks(r.left + r.width / 2, r.top + r.height / 2);
      var old = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fb(); done(); });
    else { fb(); done(); }
    function fb() { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } t.remove(); }
  }
  /* tooltip delegation for svg nodes */
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (t) showTip(t.getAttribute('data-tip'), e.clientX, e.clientY); else if (tip && tip.classList.contains('on')) hideTip();
  }, { passive: true });
  /* ============ calm motion: word reveal, rail ============ */
  function splitWords(el, cls) {
    if (!el) return;
    el.dataset.split = '1'; el.classList.add(cls || 'split');
    var wi = 0, label = el.textContent;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), s = document.createElement('span');
            w.className = 'w'; w.setAttribute('aria-hidden', 'true'); s.textContent = tok; s.style.setProperty('--wi', wi++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    }
    walk(el); el.setAttribute('aria-label', label);
  }
  function railTick() {
    var cur = '';
    $$('.rail a').forEach(function (a) { var s = $(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight * .45) cur = a.getAttribute('href'); });
    $$('.rail a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === cur); });
  }
  function fxTick() { railTick(); }
  function fxText(scope) {
    $$('.h2', scope).forEach(function (h) { if (!h.dataset.split) splitWords(h); });
  }
  function typePrompt() {
    var el = $('#typed'); if (!el) return;
    var lines = ['Curation & Research: 24 sessions, from zero to shipped.', 'Outreach & External Relations: 44 reachable partners, asked honestly.', 'One programme. Two verticals. Nobody contacted yet.'];
    if (reduce) { el.textContent = lines[0]; return; }
    var li = 0, ci = 0, dir = 1;
    (function tick() {
      var t = lines[li];
      if (dir > 0) { ci++; el.textContent = t.slice(0, ci); if (ci >= t.length) { dir = -1; return setTimeout(tick, 2200); } }
      else { ci -= 2; if (ci <= 0) { ci = 0; dir = 1; li = (li + 1) % lines.length; el.textContent = ''; return setTimeout(tick, 350); } el.textContent = t.slice(0, ci); }
      setTimeout(tick, dir > 0 ? 28 : 12);
    })();
  }
  /* ---------- planet: sits in the hero, then docks to the right edge and rides the scroll like a dial ---------- */
  function planetTick() {
    var pl = $('#planet'), slot = $('#slot'); if (!pl || !slot) return;
    var S = 320, vw = innerWidth, vh = innerHeight, small = vw < 820;
    var r = slot.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2, ss = r.width / S * 1.0;
    var t = Math.min(1, Math.max(0, scrollY / (vh * .55))), e = 1 - Math.pow(1 - t, 3);
    var ds = (small ? 44 : 64) / S, dx = vw - (small ? 26 : 46), maxS = Math.max(1, document.documentElement.scrollHeight - vh);
    var top = small ? 150 : 130, span = vh - top - (small ? 80 : 110), dy = top + (scrollY / maxS) * span;
    var x = sx + (dx - sx) * e, y = sy + (dy - sy) * e, s = ss + (ds - ss) * e;
    pl.style.transform = 'translate(' + (x - S / 2).toFixed(1) + 'px,' + (y - S / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ') rotate(' + (scrollY * .08).toFixed(1) + 'deg)';
    pl.style.zIndex = t > .5 ? 55 : 5;
    var dl = $('.dockline'); if (dl) { dl.classList.toggle('on', t > .9); dl.style.right = (vw - dx) + 'px'; dl.style.top = top + 'px'; dl.style.bottom = (vh - top - span) + 'px'; }
  }

  /* ===================================================== CURATION ===================================================== */
  function sessionTip(s) {
    return esc('<b>Session ' + s.n + ': ' + shortTitle(s.title) + '</b>' + s.type + (s.funKind ? ' (' + s.funKind + ')' : '') + ' · ' + lvlName(s.level) + ' · Month ' + s.month);
  }
  function constellation() {
    var S = D.sessions, W = 1200, H = 470, x0 = 100, x1 = 1150, top = 70, bot = 380;
    function X(i) { return x0 + (i - 1) * (x1 - x0) / 23; }
    function Y(l) { return bot - (l - 1) * (bot - top) / 2; }
    var pts = S.map(function (s) { return [X(s.n), Y(lvl(s.level))]; });
    var d = 'M' + pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' L');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Constellation of the 24 sessions: each dot is a session, placed by level, grouped by term. Six play sessions glow yellow."><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="var(--a1)"/><stop offset="1" stop-color="var(--a2)"/></linearGradient></defs>';
    D.sessionsData.terms.forEach(function (t, k) {
      var a = X(t.sessions[0]) - 22, b = X(t.sessions[1]) + 22;
      svg += '<rect class="band" x="' + a + '" y="30" width="' + (b - a) + '" height="395" rx="22"/><text class="tl" x="' + (a + 16) + '" y="56">' + t.id + ' · MONTHS ' + t.months[0] + ' TO ' + t.months[1] + '</text><text class="tn" x="' + (a + 16) + '" y="412">' + esc(t.name) + '</text>';
    });
    svg += '<g class="grid">';
    [[1, 'EXPLORER'], [2, 'BUILDER'], [3, 'ALL LEVELS']].forEach(function (g) { svg += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(g[0]) + '" y2="' + Y(g[0]) + '"/><text class="tl" x="6" y="' + (Y(g[0]) + 4) + '" style="font-size:10px">' + g[1] + '</text>'; });
    svg += '</g><path class="route" d="' + d + '"/>';
    S.forEach(function (s, k) {
      svg += '<g transform="translate(' + pts[k][0] + ' ' + pts[k][1] + ')"><g class="node' + (s.fun ? ' play' : '') + '" style="--i:' + k + '" tabindex="0" role="button" data-n="' + s.n + '" data-tip="' + sessionTip(s) + '" aria-label="Session ' + s.n + ': ' + esc(s.title) + '">' +
        (s.fun ? '<circle class="pr" r="12"/>' : '') + '<circle class="c" r="' + (s.fun ? 14 : 11) + '"/><text>' + s.n + '</text></g></g>';
    });
    return svg + '</svg>';
  }
  function curNums() {
    var N = [[24, 'Sessions', 'Two a month, for twelve months. Every session stands alone.'], [4, 'Terms of six', 'Start from Zero, Work like an Analyst, Know the Rules and Automate, Build and Ship.'], [6, 'Play sessions', 'Three learning sessions, then one play session: 4, 8, 12, 16, 20, 24.'], [12, 'In the protected fallback', 'If the calendar will not hold 24, these twelve are kept. The switch is announced, not silent.']];
    return '<div class="nums">' + N.map(function (n, i) {
      return '<div class="card num reveal" style="--d:' + i + '"><b data-count="' + n[0] + '">0</b><span>' + n[1] + '</span><p>' + n[2] + '</p></div>';
    }).join('') + '</div>';
  }
  function monthsHtml() {
    var S = D.sessions, h = '<div class="months reveal">';
    for (var m = 1; m <= 12; m++) {
      var ss = S.filter(function (x) { return x.month === m; });
      h += '<div class="month"><h4>Month ' + m + '</h4><div class="term">' + esc(ss[0].term + ' ' + ss[0].termName) + '</div>' +
        ss.map(function (x) { return '<button type="button" class="sess' + (x.fun ? ' play' : '') + '" data-n="' + x.n + '"><b>S' + x.n + '</b>' + esc(shortTitle(x.title)) + (x.fun ? ' ✦' : '') + '</button>'; }).join('') + '</div>';
    }
    return h + '</div>';
  }
  function calendarShell() {
    return '<div class="filters"><input type="search" id="cq" placeholder="Search title, activity or tool" aria-label="Search sessions">' +
      '<div class="chips" id="cterm" role="group" aria-label="Filter by term">' + D.sessionsData.terms.map(function (t) { return '<button type="button" class="chip" aria-pressed="false" data-term="' + t.id + '">' + t.id + ' ' + esc(t.name) + '</button>'; }).join('') + '</div>' +
      '<div class="chips" id="ctype" role="group" aria-label="Filter by type">' + ['Learn', 'Hands-on', 'Build'].map(function (t) { return '<button type="button" class="chip" aria-pressed="false" data-type="' + t + '">' + t + '</button>'; }).join('') + '<button type="button" class="chip pl" aria-pressed="false" data-type="Play">Play sessions ✦</button></div></div>' +
      '<p class="count" id="ccount" aria-live="polite"></p><div class="cal" id="calgrid"></div><p class="small muted" style="margin-top:1rem">' + esc(D.sessionsData.buildsNote || '') + '</p>';
  }
  function calendarInit() {
    var fq = '', fterm = '', ftype = '';
    function draw() {
      var rows = D.sessions.filter(function (s) {
        if (fterm && s.term !== fterm) return false;
        if (ftype && s.type !== ftype) return false;
        if (fq && (s.title + ' ' + s.what + ' ' + s.walkaway + ' ' + s.tools + ' ' + s.level).toLowerCase().indexOf(fq) < 0) return false;
        return true;
      });
      $('#ccount').textContent = 'Showing ' + rows.length + ' of 24 sessions';
      $('#calgrid').innerHTML = rows.map(function (s, i) {
        return '<button type="button" class="card srow' + (s.fun ? ' play' : '') + '" data-n="' + s.n + '"><span class="n">' + s.n + '</span><h4>' + esc(s.title) + '</h4><div class="meta"><span class="badge' + (s.fun ? ' play' : '') + '">' + esc(s.type + (s.funKind ? ' · ' + s.funKind : '')) + '</span><span class="badge">' + esc(lvlName(s.level)) + '</span><span class="badge">Month ' + s.month + '</span></div><p>' + esc(s.what) + '</p><span class="more">Open details →</span></button>';
      }).join('') || '<p class="muted">No session matches. Clear a filter.</p>';
    }
    $('#cq').addEventListener('input', function (e) { fq = e.target.value.trim().toLowerCase(); draw(); });
    function chipGroup(id, key, set) {
      $$('#' + id + ' .chip').forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') === 'true';
          $$('#' + id + ' .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          if (!on) b.setAttribute('aria-pressed', 'true');
          set(on ? '' : b.dataset[key]); draw();
        });
      });
    }
    chipGroup('cterm', 'term', function (v) { fterm = v; });
    chipGroup('ctype', 'type', function (v) { ftype = v; });
    draw();
  }
  function sessionDrawer(n) {
    var s = D.sessions[n - 1];
    var h = '<span class="badge' + (s.fun ? ' play' : '') + '">' + esc(s.type + (s.funKind ? ' · ' + s.funKind : '')) + '</span> <span class="badge">' + esc(s.term + ' ' + s.termName) + '</span> <span class="badge">Month ' + s.month + '</span> <span class="badge">' + esc(s.level) + '</span>';
    h += '<h3>Session ' + s.n + ': ' + esc(s.title) + '</h3><dl>' +
      '<dt>What happens</dt><dd>' + esc(s.what) + '</dd><dt>What members keep</dt><dd>' + esc(s.walkaway) + '</dd><dt>Tools</dt><dd>' + esc(s.tools) + '</dd>' +
      '<dt>Measurable outcome (target)</dt><dd>' + (s.target ? esc(s.target) : miss()) + '</dd><dt>Builds on</dt><dd>' + (s.buildsOn ? esc(s.buildsOn) : miss()) + '</dd></dl>';
    if (s.runsheet) h += '<p style="margin-top:1.4rem"><button type="button" class="btn" data-deck="' + s.runsheet + '">Open the full session deck <span class="arrow">→</span></button></p>';
    else h += '<p class="muted small" style="margin-top:1.4rem">The document holds a full run-sheet for five sessions only (1, 4, 12, 17, 23). This session appears here as its calendar row.</p>';
    return h;
  }
  function parseMin(t) {
    var m = String(t).match(/(\d+)\D+(\d+)/); if (m) return Math.max(1, +m[2] - +m[1]);
    m = String(t).match(/(\d+)/); return m ? +m[1] : 0;
  }
  function deckHtml(id) {
    var r = D.sessionsData.runsheets[id], s = D.sessions[+id - 1];
    function f(label, v, wide) { return '<div class="field' + (wide ? ' wide' : '') + '"><h5>' + label + '</h5><p>' + (v ? esc(v) : miss()) + '</p></div>'; }
    var mins = r.timed.map(function (t) { return parseMin(t.time); }), known = mins.every(function (m) { return m > 0; }), n = r.timed.length;
    var h = '<div class="deck card reveal" data-io><span class="badge' + (s.fun ? ' play' : '') + '">' + esc(s.type + (s.funKind ? ' · ' + s.funKind : '')) + '</span> <span class="badge">' + esc(r.level) + '</span> <span class="badge">Month ' + s.month + '</span>' +
      '<h3>Session ' + r.n + ': ' + esc(r.title) + '</h3><p class="sub2">' + esc(r.fullTitle) + '</p>';
    h += '<div class="bar" role="img" aria-label="Timed structure of the session, to scale where the document gives minutes">' + r.timed.map(function (t, i) {
      return '<div class="seg" style="--w:' + (known ? mins[i] : 1) + ';--i:' + i + ';--k:' + (i / Math.max(1, n - 1)).toFixed(2) + '" data-tip="' + esc('<b>' + t.segment + '</b>' + t.time) + '">' + (known && mins[i] >= 8 ? esc(t.time.replace(' min', '').replace(/\s*min$/, '')) : '') + '</div>';
    }).join('') + '</div><p class="small muted">' + (known ? 'Bar drawn to scale from the minutes in the run-sheet.' : 'The document gives the order of steps for this session, not minutes, so the bar shows order only.') + '</p>';
    h += '<ol class="timeline">' + r.timed.map(function (t) { return '<li><b>' + esc(t.time) + '</b><strong>' + esc(t.segment) + '</strong><p>' + esc(t.what) + '</p></li>'; }).join('') + '</ol>';
    h += '<div class="fields">' + f('Objective', r.objective) + f('Target audience', r.audience) + f('Difficulty level', r.level) + f('Duration', r.duration) + f('AI tools required', r.tools) + f('What participants learn and keep', r.learn) +
      f('Activities and demos', r.activities, true) + f('Resources', r.resources) + f('Expected outcomes (measurable)', r.outcomes, true) + f('How to keep it engaging', r.engage) +
      '<div class="field"><h5>Estimated budget</h5><p>' + (r.budget ? esc(r.budget) : miss()) + '</p><p class="small muted" style="margin-top:.4rem">The document says a zero-cost core is possible and gives no amounts.</p></div>' +
      f('Preparation', r.prep) + f('Risks and fallbacks', r.risks) + f('Roles', r.roles) + '</div></div>';
    return h;
  }
  function decks() {
    var ids = Object.keys(D.sessionsData.runsheets).map(Number).sort(function (a, b) { return a - b; });
    return '<div class="tabs" role="tablist" aria-label="Five full session decks">' + ids.map(function (id) {
      var s = D.sessions[id - 1]; return '<button type="button" class="tab" role="tab" data-deck="' + id + '" aria-selected="' + (String(id) === state.deck) + '">S' + id + ' ' + esc(shortTitle(s.title).slice(0, 26)) + '<small>' + esc(s.type + (s.funKind ? ' · ' + s.funKind : '')).toUpperCase() + '</small></button>';
    }).join('') + '</div><div id="deckbox">' + deckHtml(state.deck) + '</div>';
  }
  function gotoDeck(id) {
    state.deck = String(id);
    if (state.v !== 'curation') setV('curation', {});
    $$('#decktabs .tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.deck === state.deck)); });
    $('#deckbox').innerHTML = deckHtml(state.deck); observe($('#deckbox'));
    setTimeout(function () { $('#decks').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 60);
  }
  function playground() {
    var P = D.sessionsData.points, L = D.sessionsData.levels;
    var h = '<div class="play2"><div class="card widget reveal"><span class="eyebrow">Try the season league</span><h3>How far does one good night go?</h3><p class="small muted">Points are for effort, not expertise, so a beginner can top the board. This is a toy calculator built from the points table in the document. It is not a forecast.</p><div id="league">';
    P.forEach(function (p, i) { h += '<div class="row2"><span>' + esc(p[0]) + ' <span class="muted">· ' + p[1] + ' pts</span></span><span class="step"><button type="button" aria-label="Less ' + esc(p[0]) + '" data-i="' + i + '" data-d="-1">−</button><output id="lv' + i + '">0</output><button type="button" aria-label="More ' + esc(p[0]) + '" data-i="' + i + '" data-d="1">+</button></span></div>'; });
    h += '</div><div class="row2"><span>Nights like this attended</span><input type="range" id="nights" min="1" max="24" value="12" aria-label="Number of nights attended"><output id="nv">12</output></div>' +
      '<div class="meter"><i id="meter"></i></div><div class="row2" style="border:0"><span>One night (capped at 40)</span><b class="big2" id="night">0</b></div><div class="row2" style="border:0"><span>Season total</span><b class="big2" id="season">0</b></div><div class="lvls" id="lvls">' + L.map(function (l) { return '<span data-t="' + l[1] + '">' + esc(l[0]) + ' · ' + l[1] + '+</span>'; }).join('') + '</div></div>';
    h += '<div class="card widget reveal" style="--d:1"><span class="eyebrow">Try the prompt recipe</span><h3>Context, Role, Task, Format, Tweak</h3><p class="small muted">The club recipe from Session 2. Type into the fields. Nothing leaves this page.</p>' +
      ['Context', 'Role', 'Task', 'Format', 'Tweak'].map(function (k) { return '<div class="fieldrow"><label for="pr' + k + '">' + k + '</label><textarea id="pr' + k + '" rows="2" placeholder="' + { Context: 'Who you are and the situation', Role: 'Who the tool should act as', Task: 'The one thing to do', Format: 'How the answer should look', Tweak: 'What to change after the first answer' }[k] + '"></textarea></div>'; }).join('') +
      '<div class="out" id="prout" aria-live="polite">Your prompt appears here.</div><p style="margin-top:.8rem"><button type="button" class="btn small" id="prcopy">Copy prompt</button></p></div></div>';
    return h;
  }
  function playInit() {
    var P = D.sessionsData.points, L = D.sessionsData.levels, cnt = P.map(function () { return 0; });
    function calc() {
      var raw = 0; cnt.forEach(function (c, i) { raw += c * P[i][1]; $('#lv' + i).textContent = c; });
      var night = Math.min(40, raw), n = +$('#nights').value, season = night * n, cur = 0;
      $('#nv').textContent = n; $('#night').textContent = night; $('#meter').style.width = (night / 40 * 100) + '%';
      $('#season').textContent = season; L.forEach(function (l, i) { if (season >= l[1]) cur = i; });
      $$('#lvls span').forEach(function (s, i) { s.classList.toggle('on', i === cur); });
    }
    $$('#league .step button').forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.i; cnt[i] = Math.max(0, Math.min(9, cnt[i] + +b.dataset.d)); calc(); }); });
    $('#nights').addEventListener('input', calc); calc();
    function compose() {
      var parts = ['Context', 'Role', 'Task', 'Format', 'Tweak'].map(function (k) { var v = $('#pr' + k).value.trim(); return v ? k + ': ' + v : ''; }).filter(Boolean);
      $('#prout').textContent = parts.length ? parts.join('\n') : 'Your prompt appears here.';
    }
    ['Context', 'Role', 'Task', 'Format', 'Tweak'].forEach(function (k) { $('#pr' + k).addEventListener('input', compose); });
    $('#prcopy').addEventListener('click', function () { var t = $('#prout').textContent; if (t && t !== 'Your prompt appears here.') copyText(t, $('#prcopy')); else toast('Type into a field first'); });
  }
  function principles() {
    return '<div class="grid g4">' + D.site.curationOverview.principles.map(function (p, i) {
      return '<div class="card prin reveal" style="--d:' + (i % 4) + '"><b>' + esc(p.id) + '</b><h4>' + esc(p.principle) + '</h4><p>' + esc(p.means) + '</p></div>';
    }).join('') + '</div>';
  }
  function initiativeBlock(x) {
    var h = '';
    if (x.rating) h += '<div class="rating"><span class="badge">Impact: ' + esc(x.rating.impact) + '</span><span class="badge">Feasibility: ' + esc(x.rating.feasibility) + '</span><span class="badge">Effort: ' + esc(x.rating.effort) + '</span><span class="badge acc">Priority: ' + esc(x.rating.priority) + '</span> <span class="small muted">my judgement, Section 4.4</span></div>';
    h += '<dl>' + x.fields.map(function (f) { return '<dt>' + esc(f.label) + '</dt><dd>' + items(f.items) + '</dd>'; }).join('') + '</dl>';
    return acc('<span><span class="mono" style="color:var(--a1);font-size:.8rem;margin-right:.7rem">' + esc(x.id) + '</span>' + esc(x.title) + '</span>', h);
  }
  function curDetails() {
    var S = D.sessionsData, P = D.site.plan, h = '';
    h += '<h3 class="h2" style="font-size:1.8rem;margin-top:2rem">Initiatives V1-01 to V1-16</h3><p class="small muted">Each follows the document\'s eleven-point template. Impact, feasibility and effort are my judgements.</p>' + S.initiatives.map(initiativeBlock).join('');
    h += '<h3 class="h2" style="font-size:1.8rem;margin-top:2.4rem">The numbers behind it</h3>';
    h += acc('Resources and requirements', table(['Category', 'Requirement', 'Notes'], S.resources.map(function (x) { return [esc(x.category), esc(x.requirement), esc(x.notes)]; })));
    h += acc('Timelines by period', table(['When', 'Curation and Research milestone'], S.timelines.map(function (x) { return [esc(x.when), esc(x.milestone)]; })));
    h += acc('Performance indicators', table(['Indicator', 'Target', 'How tracked'], S.indicators.map(function (x) { return [esc(x.indicator), esc(x.target), esc(x.tracked)]; })));
    h += acc('Objectives and first-year targets (my estimates, review after Session 12)', table(['#', 'Objective', 'Target'], D.site.curationOverview.objectives.map(function (x) { return [esc(x.id), esc(x.objective), esc(x.target)]; })));
    h += acc('Roles and responsibilities (functions, not headcount; I hold none)', table(['Role', 'Vertical', 'Main responsibilities', 'Initiatives'], D.partnersData.roles.filter(function (x) { return x.vertical !== '2'; }).map(function (x) { return [esc(x.role), esc(x.vertical), esc(x.duty), esc(x.initiatives)]; })) +
      '<h4 style="margin:1rem 0 .3rem;font-family:var(--serif)">Responsibility matrix (R responsible, A accountable, C consulted, I informed)</h4>' + table(D.partnersData.matrix[0], D.partnersData.matrix.slice(1).map(function (r) { return r.map(esc); })));
    h += acc('Monitoring and the ten-measure dashboard', table(['Cadence', 'What is reviewed', 'Who', 'Decision it feeds'], P.monitoring.map(function (x) { return [esc(x.cadence), esc(x.reviewed), esc(x.who), esc(x.decision)]; })) + table(['Measure', 'Healthy sign'], P.dashboard.map(function (x) { return [esc(x.measure), esc(x.healthy)]; })) + P.decision.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join(''));
    h += acc('Challenges and planned responses', table(['Challenge', 'Why it may happen', 'Planned response'], P.challenges.map(function (x) { return [esc(x.challenge), esc(x.why), esc(x.response)]; })));
    h += acc('Cadence, calendar rules and the 12-session fallback', ul(S.cadence));
    h += acc('Long-term sustainability', ul(P.sustain));
    h += acc('Research notes: what I read, what I took, limits', table(['What I read', 'What I took from it', 'Link'], D.site.research.read.map(function (x) { return [esc(x.what), esc(x.took), x.link ? linkify(x.link) : miss()]; })) + '<p>' + esc(D.site.research.proposal) + '</p>' + ul(D.site.research.limits));
    h += acc('Programme rationale and checklist against the assignment', '<h4 style="font-family:var(--serif)">Why this approach</h4>' + ul(D.site.rationale.why) + '<h4 style="font-family:var(--serif)">Mission</h4>' + ul(D.site.rationale.mission) + '<p class="small muted">I did not have the assignment text when I built this. The checklist follows the structure my document says it was written to.</p>' + table(['Item', 'Status', 'Note'], D.site.rationale.checklist.map(function (c) { return [esc(c.item), '<span class="badge' + (c.status === 'Partial' ? ' play' : c.status === 'Done' ? ' first' : '') + '">' + esc(c.status) + '</span>', esc(c.note)]; })));
    return h;
  }
  function curationPanel() {
    var S = D.sessionsData;
    var h = '<nav class="sub" aria-label="Curation sections"><ul>' + [['c-year', 'Year'], ['c-const', 'Constellation'], ['c-months', 'Months'], ['c-cal', 'Calendar'], ['decks', 'Five decks'], ['c-play', 'Try it'], ['c-prin', 'Principles'], ['c-det', 'Full detail']].map(function (a) { return '<li><a href="#' + a[0] + '" data-sec="' + a[0] + '">' + a[1] + '</a></li>'; }).join('') + '</ul></nav>';
    h += '<section class="sec tight" id="c-year"><span class="eyebrow">What the vertical owns</span><h2 class="h2">Make AI <em>accessible</em> to someone who has never touched it.</h2><p class="lead reveal">' + esc(D.site.curationOverview.lead) + ' The design principle is simple: start from a problem the student already has, put something in their hands within ten to fifteen minutes, and teach them to check the output.</p>' + curNums() + '</section>';
    h += '<section class="sec tight" id="c-const"><span class="eyebrow">The constellation</span><h2 class="h2">Twenty four sessions, <em>one climb</em>.</h2><p class="lead reveal">Each dot is a session, placed by the level the document gives it and grouped by term. Yellow dots are the six play sessions. Hover for a summary, click for the details.</p><div class="card const reveal" data-io id="const">' + constellation() + '<div class="legend"><span><i></i>Learning or build session</span><span><i class="p"></i>Play session</span><span>Builder to Maker sits between the lines</span><span>Click or press Enter on a dot</span></div></div></section>';
    h += '<section class="sec tight" id="c-months"><span class="eyebrow">The roadmap</span><h2 class="h2">Twelve months, <em>four terms</em>.</h2><p class="lead reveal">Two flagship sessions a month. Between them a light weekly layer keeps momentum: a one-page takeaway, a three-question recall quiz and a weekly "Did you know?". A set-up period of four weeks comes first, and a mid-year review follows Session 12.</p>' + monthsHtml() + '</section>';
    h += '<section class="sec tight" id="c-cal"><span class="eyebrow">The calendar</span><h2 class="h2">Find a <em>session</em>.</h2>' + calendarShell() + '</section>';
    h += '<section class="sec tight" id="decks"><span class="eyebrow">Five sessions in full</span><h2 class="h2">Sessions <em>1, 4, 12, 17 and 23</em>.</h2><p class="lead reveal">The four flagship run-sheets in my document plus Capstone Build Day. Each shows all thirteen fields. Where my document does not hold a field, it says so instead of guessing. Two of the five (4 and 12) are play sessions.</p><div id="decktabs">' + decks() + '</div></section>';
    h += '<section class="sec tight" id="c-play"><span class="eyebrow">Play with the system</span><h2 class="h2">Two small <em>toys</em> from the programme.</h2>' + playground() + '</section>';
    h += '<section class="sec tight" id="c-prin"><span class="eyebrow">Design principles</span><h2 class="h2">Twelve rules every <em>session</em> obeys.</h2>' + principles() + '</section>';
    h += '<section class="sec tight" id="c-det"><span class="eyebrow">Full detail</span><h2 class="h2">Everything in the <em>document</em>.</h2><p class="lead">All sixteen initiatives and the tables behind the programme. Open what you need.</p>' + curDetails() + '</section>';
    return h;
  }
  function curationInit(panel) {
    $$('.node', panel).forEach(function (nd) {
      nd.addEventListener('click', function () { $$('.node.sel', panel).forEach(function (x) { x.classList.remove('sel'); }); nd.classList.add('sel'); openDrawer('Session ' + nd.dataset.n, sessionDrawer(+nd.dataset.n)); });
      nd.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nd.dispatchEvent(new Event('click')); } });
    });
    var route = $('.route', panel); if (route) { var len = route.getTotalLength ? route.getTotalLength() : 3000; route.style.setProperty('--len', len); }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('.sess,.srow'); if (b && b.dataset.n) openDrawer('Session ' + b.dataset.n, sessionDrawer(+b.dataset.n));
      var t = e.target.closest('#decktabs .tab'); if (t) gotoDeckTab(t.dataset.deck);
    });
    calendarInit(); playInit();
  }
  function gotoDeckTab(id) {
    state.deck = String(id);
    $$('#decktabs .tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.deck === state.deck)); });
    $('#deckbox').innerHTML = deckHtml(state.deck); observe($('#deckbox'));
  }

  /* ===================================================== OUTREACH ===================================================== */
  function partnerById(id) { return D.partners.filter(function (p) { return p.id === id; })[0]; }
  function mailify(s) {
    return esc(s).replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');
  }
  function urls(v) {
    if (!v || v === 'none found') return v ? esc(v) : miss();
    var arr = Array.isArray(v) ? v : String(v).split(/\s*;\s*/);
    return arr.map(linkify).join('<br>');
  }
  function txtOrMiss(v) { return v ? esc(v) : miss(); }
  function statusBadge(p) {
    var s = p.contactStatus; if (!s) return '';
    return '<span class="badge' + (/email/.test(s) ? ' mail' : '') + '">Contact: ' + esc(s) + '</span>';
  }
  function partnerDrawer(id) {
    var p = partnerById(id), PD = D.partnersData;
    var tier = PD.tiers.filter(function (t) { return t.tier === String(p.tierNum); })[0];
    var vr = PD.value.filter(function (v) { return v.purpose === p.valueRow; })[0];
    function f(k, v) { return '<dt>' + k + '</dt><dd class="contact">' + v + '</dd>'; }
    var offer = vr ? '<p>' + esc(vr.offer) + '</p><p class="small muted">From the "' + esc(vr.purpose) + '" row of the value exchange table. I mapped this partner to that row.</p>' : '<p>Credit the body in the recap; invite its members to Build Day and Demo Day; ask what it wants from the club (V2-07).</p>';
    var h = (p.firstWave ? '<span class="badge first">First wave</span> ' : '') + '<span class="badge">Tier ' + esc(p.tier) + (tier ? ' · ' + esc(tier.name) : '') + '</span> <span class="badge">Template: ' + esc(p.template) + '</span> ' + statusBadge(p);
    h += '<h3>' + esc(p.name) + '</h3><p class="muted">Partner ' + p.id + ' of 44 · ' + esc(p.type) + '</p>';
    if (p.disclose) h += '<div class="warn small"><b>Disclose.</b> I report a personal connection to this body. It must be stated in the first line of any email. The body has no relationship with the club today.</div>';
    if (p.flag) h += '<p class="small muted">' + esc(p.flag) + '</p>';
    h += '<dl>' + f('1. Name', esc(p.name)) + f('2. Website', urls(p.website)) + f('3. Description', '<p>' + (p.description ? esc(p.description) : esc(p.type) + '.') + '</p>') +
      f('4. Why relevant (my view)', p.viewNote ? '<p>' + esc(p.viewNote) + '</p>' : '<p>' + miss() + '</p>') + f('5. Proposed collaboration', '<p>' + esc(p.purpose) + '</p>') +
      f('6. Partnership category', '<p>' + esc(p.type) + '. Access tier ' + esc(p.tier) + (tier ? ' (' + esc(tier.name) + '): ' + esc(tier.meaning) : '') + '. Template: ' + esc(p.template) + '.</p>') +
      f('7. What they could contribute', '<p>' + esc(p.purpose) + '</p>') + f('8. What the club could offer', offer) + f('9. Contact person (if public)', txtOrMiss(p.contactPerson)) +
      f('10. Verified email or phone', '<p>' + (p.email ? mailify(p.email) : miss()) + '</p><p>' + (p.phone ? esc(p.phone) : '') + '</p>') + f('11. LinkedIn or official contact page', urls(p.contactPage)) + f('12. Source links', urls(p.sources)) + '</dl>';
    var where = (p.named && p.named.length) ? 'Named in ' + p.named.join(', ') : (p.categoryInitiative ? 'Fits the category covered by ' + p.categoryInitiative + '; the document does not name this partner there' : 'No initiative names this partner');
    h += '<p class="small muted" style="margin-top:1.4rem">Where it sits in the plan: ' + esc(where) + '.</p><p class="small muted">Contact details were copied on ' + esc(p.researchedOn || '1 November 2026') + ' from the pages in Source links. I did not contact this organisation and I claim no relationship with it. Re-check the person\'s role and the route on the organisation\'s own page before any message.</p>';
    return h;
  }
  function tierCounts() { var c = {}; D.partners.forEach(function (p) { c[p.tierNum] = (c[p.tierNum] || 0) + 1; }); return c; }
  function ladderHtml() {
    var c = tierCounts(), hs = [210, 250, 290, 330, 370];
    return '<div class="ladder" data-io id="tladder">' + D.partnersData.tiers.map(function (t, i) {
      return '<button type="button" class="rung' + (t.tier === '1' ? ' t1' : '') + '" style="--i:' + i + ';--h:' + hs[i] + 'px" data-tier="' + t.tier + '" aria-pressed="false"><div><span>Tier ' + t.tier + '</span><b>' + (c[t.tier] || 0) + '</b></div><div><strong>' + esc(t.name) + '</strong><p>' + esc(t.order) + '</p></div></button>';
    }).join('') + '</div><p class="small muted">Tiers rank how quickly a target is likely to answer. They are not a promise of a reply. Tap a tier to light it up on the orbit map below.</p>';
  }
  function orbit() {
    var cx = 600, cy = 330, R = [104, 156, 208, 258, 308], by = {};
    D.partners.forEach(function (p) { (by[p.tierNum] = by[p.tierNum] || []).push(p); });
    var svg = '<svg viewBox="0 0 1200 660" role="img" aria-label="Orbit map of 44 partner rows. Tier 1 sits closest to the club, Tier 5 furthest."><defs><radialGradient id="cg"><stop offset="0" stop-color="var(--a1)" stop-opacity=".9"/><stop offset="1" stop-color="var(--a2)" stop-opacity=".0"/></radialGradient><linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="var(--a1)" stop-opacity=".0"/><stop offset="1" stop-color="var(--a1)" stop-opacity=".55"/></linearGradient></defs>';
    R.forEach(function (r, i) { svg += '<circle class="ring spin r' + (i + 1) + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><text class="ringlab" x="' + (cx + r * .707 + 4) + '" y="' + (cy - r * .707 - 4) + '">TIER ' + (i + 1) + '</text>'; });
    svg += '<g class="sweepg"><path class="sweep" d="M' + cx + ',' + cy + ' L' + (cx + 320) + ',' + cy + ' A320,320 0 0,0 ' + (cx + 320 * Math.cos(-.5)) + ',' + (cy + 320 * Math.sin(-.5)) + ' Z" fill="url(#sw)"/></g>';
    svg += '<circle class="core" cx="' + cx + '" cy="' + cy + '" r="48"/><text class="coret" x="' + cx + '" y="' + (cy + 2) + '">The Club</text><text class="ringlab" x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" style="font-size:8px">0 CONTACTED</text>';
    Object.keys(by).forEach(function (t) {
      var list = by[t], r = R[t - 1], off = (t * 0.7);
      list.forEach(function (p, i) {
        var a = off + i * 6.283 / list.length, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        svg += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><g class="pn' + (p.firstWave ? ' f' : '') + ' t' + t + '" tabindex="0" role="button" data-p="' + p.id + '" data-tier="' + t + '" style="animation-delay:' + (-(i * 0.9)).toFixed(1) + 's" data-tip="' + esc('<b>' + p.name + '</b>Tier ' + p.tier + ' · ' + p.type) + '" aria-label="' + esc(p.name + ', tier ' + p.tier) + '"><circle r="' + (p.firstWave ? 15 : 12) + '"/><text>' + p.id + '</text></g></g>';
      });
    });
    return svg + '</svg>';
  }
  function filterTier(t) {
    state.tier = (state.tier === t) ? '' : t;
    $$('.rung').forEach(function (r) { r.setAttribute('aria-pressed', String(r.dataset.tier === state.tier)); });
    $$('.pn').forEach(function (n) { n.classList.toggle('dim', !!state.tier && n.dataset.tier !== state.tier); });
    var chip = $('#ptier'); if (chip) { $$('#ptier .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.tier === state.tier)); }); }
    if (window.__pdraw) window.__pdraw();
  }
  function partnerGridShell() {
    return '<div class="filters"><input type="search" id="pq" placeholder="Search name, type or purpose" aria-label="Search partners"><div class="chips" id="ptier" role="group" aria-label="Filter by tier">' + D.partnersData.tiers.map(function (t) { return '<button type="button" class="chip" aria-pressed="false" data-tier="' + t.tier + '">Tier ' + t.tier + '</button>'; }).join('') + '<button type="button" class="chip fw" id="pfirst" aria-pressed="false">First wave only</button></div><div class="chips" id="pcontact" role="group" aria-label="Filter by contact status">' + [['email', 'Email published'], ['form only', 'Form only'], ['phone only', 'Phone only'], ['none found', 'None found']].map(function (c) { return '<button type="button" class="chip" aria-pressed="false" data-c="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div></div><p class="count" id="pcount" aria-live="polite"></p><div class="pgrid" id="pgrid"></div>' +
      '<p class="small muted">Entries are as reported in my working notes and were not independently re-verified. Contact details and links were copied from official pages on 1 November 2026. I did not contact anyone. \"None found\" means I could not find a public route.</p>';
  }
  function partnersInit() {
    var q = '', first = false, cstat = '';
    window.__pdraw = function () {
      var rows = D.partners.filter(function (p) {
        if (state.tier && String(p.tierNum) !== state.tier) return false;
        if (first && !p.firstWave) return false;
        if (cstat && !(cstat === 'email' ? /email/.test(p.contactStatus || '') : p.contactStatus === cstat)) return false;
        if (q && (p.name + ' ' + p.type + ' ' + p.purpose + ' ' + p.template).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      $('#pcount').textContent = 'Showing ' + rows.length + ' of 44 partner rows';
      $('#pgrid').innerHTML = rows.map(function (p) {
        return '<button type="button" class="card pcard tilt' + (p.firstWave ? ' f' : '') + '" data-p="' + p.id + '"><span><span class="badge' + (p.firstWave ? ' first' : '') + '">' + (p.firstWave ? 'First wave · ' : '') + 'Tier ' + esc(p.tier) + '</span> <span class="badge">' + esc(p.template) + '</span> ' + statusBadge(p) + '</span><h4>' + p.id + '. ' + esc(p.name) + '</h4><p class="muted small">' + esc(p.type) + '</p><p>' + esc(p.purpose) + '</p></button>';
      }).join('') || '<p class="muted">No partner matches. Clear a filter.</p>';
    };
    $('#pq').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); window.__pdraw(); });
    $$('#ptier .chip[data-tier]').forEach(function (b) { b.addEventListener('click', function () { filterTier(b.dataset.tier); }); });
    $$('#pcontact .chip').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') === 'true'; $$('#pcontact .chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); if (!on) b.setAttribute('aria-pressed', 'true'); cstat = on ? '' : b.dataset.c; window.__pdraw(); }); });
    $('#pfirst').addEventListener('click', function (e) { first = !first; e.currentTarget.setAttribute('aria-pressed', String(first)); window.__pdraw(); });
    window.__pdraw();
  }
  function firstWave() {
    var FW = D.partnersData.firstWave;
    var h = '<div class="warn small reveal"><b>Nobody has been contacted.</b> Every step needs the faculty advisor\'s approval first. The document does not name a "first ten": it says the advisor approves the first ten targets in Week 0. I treat all twelve Tier 1 partners as the first wave. GDG Chandigarh is Tier 2 (Week 2), not Tier 1.</div><div class="grid g3" style="margin-top:1.2rem">';
    h += D.partners.filter(function (p) { return p.firstWave; }).map(function (p, i) {
      var w = FW[p.id];
      return '<article class="card fw tilt reveal" style="--d:' + (i % 3) + '"><span class="badge first">First wave · Tier ' + esc(p.tier) + '</span><h4>' + p.id + '. ' + esc(p.name) + '</h4><p><b>Why:</b> ' + esc(w.why) + '</p><p><b>What I would propose:</b> ' + esc(w.propose) + '</p><p><b>Next step:</b> ' + esc(w.next) + '</p><p><b>Timing:</b> ' + esc(w.timing) + '</p>' + (p.disclose ? '<p class="small"><b>Disclose my personal connection in the first line.</b></p>' : '') + '<button type="button" class="chip" data-p="' + p.id + '">Open profile</button></article>';
    }).join('') + '</div>';
    h += '<h3 class="h2" style="font-size:1.8rem;margin-top:2.4rem">The first 30 days</h3><div class="steps4">' + D.partnersData.first30.map(function (w, i) { return '<div class="card reveal" style="--d:' + i + '"><h4>' + esc(w.week) + '</h4><p>' + esc(w.actions) + '</p><p class="small"><b>Output:</b> ' + esc(w.output) + '</p></div>'; }).join('') + '</div>';
    return h;
  }
  function templatesHtml() {
    var T = D.templates;
    var h = '<div class="warn reveal" role="alert"><b>Do not send yet.</b> ' + esc(T.warning) + '</div><div class="tabs" role="tablist" id="ttabs">' + T.items.map(function (t, i) { return '<button type="button" class="tab" role="tab" data-t="' + t.id + '" aria-selected="' + (i === 0) + '">' + esc(t.name) + '<small>' + (/^Skeleton/.test(t.source) ? 'FROM THE DOCUMENT' : 'DRAFTED BY ME') + '</small></button>'; }).join('') + '</div><div id="tplbox"></div>';
    h += '<div class="grid g2" style="margin-top:1.2rem"><div class="card pad"><h4 style="font-family:var(--serif);font-size:1.2rem">Rules for every letter</h4>' + ul(T.rules) + '</div><div class="card pad"><h4 style="font-family:var(--serif);font-size:1.2rem">The placeholder is kept on purpose</h4><p>The line <span class="mono">[your confirmed role in the club]</span> stays in every template. I am an applicant and hold no role.</p></div></div>';
    return h;
  }
  function tplShow(id) {
    var t = D.templates.items.filter(function (x) { return x.id === id; })[0];
    var full = 'Subject: ' + t.subject + '\n\n' + t.body;
    $('#tplbox').innerHTML = '<div class="card tpl fadeswap"><h3 style="font-family:var(--serif-display);font-size:2rem">' + esc(t.name) + '</h3><p class="small muted"><b>Use for:</b> ' + esc(t.useFor) + ' · <b>Route:</b> ' + esc(t.route) + ' · <b>One thing to get right:</b> ' + esc(t.getRight) + '</p><p class="small muted">' + esc(t.source) + '</p>' +
      '<h4 class="mono" style="color:var(--a1);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase">Subject and body</h4><div class="mail" id="tm">' + esc(full) + '</div><button type="button" class="btn small" id="tcopy">Copy email</button>' +
      '<h4 class="mono" style="color:var(--a1);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;margin-top:1.4rem">One follow-up, after four to seven working days, then stop</h4><div class="mail" id="tf">' + esc(t.followUp) + '</div><button type="button" class="btn ghost small" id="tfcopy">Copy follow-up</button></div>';
    $('#tcopy').addEventListener('click', function (e) { copyText(full, e.currentTarget); });
    $('#tfcopy').addEventListener('click', function (e) { copyText(t.followUp, e.currentTarget); });
    $$('#ttabs .tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.t === id)); });
  }
  function outDetails() {
    var PD = D.partnersData, P = D.site.plan, h = '';
    h += '<h3 class="h2" style="font-size:1.8rem;margin-top:2rem">Initiatives V2-01 to V2-15</h3><p class="small muted">Each follows the document\'s twelve-point template. Priority ratings are my judgement.</p>' + PD.initiatives.map(initiativeBlock).join('');
    h += '<h3 class="h2" style="font-size:1.8rem;margin-top:2.4rem">The tables behind it</h3>';
    h += acc('Value exchange by purpose', table(['Purpose', 'What leads the message', 'What the club offers', 'The ask'], PD.value.map(function (x) { return [esc(x.purpose), esc(x.leads), esc(x.offer), esc(x.ask)]; })));
    h += acc('Template library named in the document (13)', table(['Template', 'Use for', 'Route', 'One thing to get right'], PD.templateLibrary.map(function (x) { return [esc(x.template), esc(x.use), esc(x.route), esc(x.getRight)]; })));
    h += acc('Access tiers in full', table(['Tier', 'Meaning', 'Order of approach'], PD.tiers.map(function (x) { return [esc(x.tier + ' ' + x.name), esc(x.meaning), esc(x.order)]; })) + '<p class="small muted">Tier 1* marks routes where I report a personal connection to the body. It must be disclosed in the first line of any email.</p>');
    h += acc('Quarterly rhythm (added in synthesis: my own arrangement)', ul(PD.quarterly));
    h += acc('Expected outcomes', ul(PD.outcomes));
    h += acc('Performance indicators', table(['Indicator', 'Target', 'How tracked'], PD.indicators.map(function (x) { return [esc(x.indicator), esc(x.target), esc(x.tracked)]; })));
    h += acc('Roles (functions, not headcount; I hold none)', table(['Role', 'Vertical', 'Main responsibilities', 'Initiatives'], PD.roles.filter(function (x) { return x.vertical === '2' || x.vertical === 'Both'; }).map(function (x) { return [esc(x.role), esc(x.vertical), esc(x.duty), esc(x.initiatives)]; })));
    h += acc('Objectives of the vertical', ul(PD.objectives));
    h += acc('Research and verification: what is NOT verified', '<div class="warn">' + ul(D.site.outreach.notVerified) + '</div><h4 style="font-family:var(--serif);margin-top:1rem">Checks before any message goes out</h4>' + ol(['Use the faculty advisor\'s approval for the target, the event and the wording.', 'Re-check the person\'s current role and the programme\'s current terms on the organisation\'s own page.', 'Use only a published contact route. Never guess an email. Sales, technical support and hiring addresses are not partnership contacts.', 'Disclose any personal connection in the first line.', 'Promise nothing the club cannot evidence: no attendee data, exclusivity, internships, funding or fixed audience numbers.', 'Any company approach for Neural Fest goes through the Industrial Relations and Sponsorship Committee first.']));
    return h;
  }
  function outreachPanel() {
    var PD = D.partnersData, O = D.site.outreach;
    var h = '<nav class="sub" aria-label="Outreach sections"><ul>' + [['o-idea', 'The idea'], ['o-tiers', 'Tiers'], ['o-orbit', 'Orbit map'], ['o-first', 'First wave'], ['o-list', 'All 44'], ['o-mail', 'Email templates'], ['o-lad', 'Ladder'], ['o-det', 'Full detail']].map(function (a) { return '<li><a href="#' + a[0] + '" data-sec="' + a[0] + '">' + a[1] + '</a></li>'; }).join('') + '</ul></nav>';
    h += '<section class="sec tight" id="o-idea"><span class="eyebrow">What the vertical owns</span><h2 class="h2">Bring the outside <em>in</em>.</h2><p class="quote reveal">' + esc(PD.central[0]).replace(/^The central idea\.\s*/, '').replace('Earn the right to ask for recurring support only after the pilot works.', '<em>Earn the right to ask for recurring support only after the pilot works.</em>') + '</p><div class="grid g2" style="margin-top:1.6rem"><div class="card pad reveal"><h3 style="font-family:var(--serif);font-size:1.3rem">Why reachable partners, not famous ones</h3>' + ul(O.whyReachable) + '</div><div class="card pad reveal" style="--d:1"><h3 style="font-family:var(--serif);font-size:1.3rem">What the club can offer</h3>' + ul(O.offer) + '<h4 style="font-family:var(--serif);margin-top:1rem">What the club will not offer</h4><p>' + O.wontOffer.map(function (w) { return '<span class="badge">' + esc(w.replace(/\.$/, '')) + '</span> '; }).join('') + '</p></div></div></section>';
    h += '<section class="sec tight" id="o-tiers"><span class="eyebrow">The access ladder</span><h2 class="h2">Order by <em>speed of reply</em>, not prestige.</h2>' + ladderHtml() + '</section>';
    h += '<section class="sec tight" id="o-orbit"><span class="eyebrow">The orbit map</span><h2 class="h2">Forty four rows around <em>one club</em>.</h2><p class="lead reveal">Closest ring is Tier 1, furthest is Tier 5. Green rings are the first wave. Hover to read, click to open a profile.</p><div class="card orbitwrap reveal">' + orbit() + '<div class="legend"><span><i></i>Partner row</span><span><i class="f"></i>First wave (Tier 1)</span><span>The sweep is decoration</span></div></div></section>';
    h += '<section class="sec tight" id="o-first"><span class="eyebrow">First wave</span><h2 class="h2">Start where the doors are <em>already open</em>.</h2>' + firstWave() + '</section>';
    h += '<section class="sec tight" id="o-list"><span class="eyebrow">Partner shortlist</span><h2 class="h2">All <em>forty four</em> rows.</h2>' + partnerGridShell() + '</section>';
    h += '<section class="sec tight" id="o-mail"><span class="eyebrow">Cold email templates</span><h2 class="h2">Five letters, <em>five purposes</em>.</h2><p class="lead reveal">A request for money and a request for time are not the same letter. Each template has a subject, a body, a follow-up and a copy button.</p>' + templatesHtml() + '</section>';
    h += '<section class="sec tight" id="o-lad"><span class="eyebrow">The partnership ladder</span><h2 class="h2">Pilot first. <em>Then</em> earn more.</h2><div class="steps4">' + PD.ladder.map(function (s, i) { return '<div class="card reveal" style="--d:' + i + '"><h4>' + esc(s.stage) + '</h4><p>' + esc(s.looks) + '</p><p class="small"><b>Entry:</b> ' + esc(s.entry) + '</p></div>'; }).join('') + '</div></section>';
    h += '<section class="sec tight" id="o-det"><span class="eyebrow">Full detail</span><h2 class="h2">Everything in the <em>document</em>.</h2><p class="lead">All fifteen initiatives and the tables behind the outreach plan.</p>' + outDetails() + '</section>';
    return h;
  }
  function outreachInit(panel) {
    panel.addEventListener('click', function (e) {
      var pn = e.target.closest('.pn,.pcard,[data-p]'); if (pn && pn.dataset.p) { $$('.pn.sel', panel).forEach(function (x) { x.classList.remove('sel'); }); if (pn.classList.contains('pn')) pn.classList.add('sel'); openDrawer('Partner ' + pn.dataset.p, partnerDrawer(+pn.dataset.p)); return; }
      var r = e.target.closest('.rung'); if (r) filterTier(r.dataset.tier);
      var t = e.target.closest('#ttabs .tab'); if (t) tplShow(t.dataset.t);
    });
    $$('.pn', panel).forEach(function (n) { n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }); });
    partnersInit(); tplShow(D.templates.items[0].id);
  }

  /* ===================================================== SHARED ===================================================== */
  function codes(s, pre) { return (s.match(new RegExp(pre + '-\\d\\d', 'g')) || []).join(', '); }
  function bridgeHtml() {
    var I = D.partnersData.interlock;
    var h = '<div class="shead"><span class="num">III</span><span class="eyebrow">Where the two meet</span><h2 class="h2" id="bridgeh">Every session has a <em>partner</em> behind it.</h2><p class="lead reveal">Curation needs outside judges, mentors, problem statements and prizes that only Outreach can obtain. Outreach needs recaps, demos and proof of delivery that only Curation creates. The interlock below is my own arrangement ("added in synthesis"). The independence rule holds: the core 24 sessions never depend on an outside partner. If a partner declines, the session runs as written.</p></div>';
    h += '<div class="bcols" id="bcols"><svg class="bsvg" id="bsvg" aria-hidden="true"><defs><linearGradient id="bg2" x1="0" x2="1"><stop offset="0" stop-color="#0F8C80"/><stop offset="1" stop-color="#B4232A"/></linearGradient></defs></svg><div class="bcol l"><h3>Curation moment</h3></div><div class="bcol r"><h3>Outreach contribution</h3></div>';
    I.forEach(function (r, i) {
      h += '<div class="bi l reveal" data-r="' + i + '" style="--d:' + (i % 3) + '"><small>CURATION · ' + esc(codes(r.initiatives, 'V1') || 'V1') + '</small>' + esc(r.need) + '</div>' +
        '<div class="bi r reveal" data-r="' + i + '" style="--d:' + (i % 3) + '"><small>OUTREACH · ' + esc(codes(r.initiatives, 'V2') || 'V2') + ' · lead time ' + esc(r.lead) + '</small>' + esc(r.contribution) + '</div>';
    });
    return h + '</div><p class="small muted" style="margin-top:1.2rem">Hover an item to light up its connection.</p>';
  }
  function drawBridge() {
    var box = $('#bcols'), svg = $('#bsvg'); if (!box || !svg || getComputedStyle(svg).display === 'none') return;
    var bb = box.getBoundingClientRect(), L = $$('.bi.l', box), Rr = $$('.bi.r', box);
    svg.setAttribute('viewBox', '0 0 ' + bb.width + ' ' + bb.height);
    var gr = svg.querySelector('linearGradient'); gr.setAttribute('gradientUnits', 'userSpaceOnUse'); gr.setAttribute('x1', 0); gr.setAttribute('x2', bb.width); gr.setAttribute('y1', 0); gr.setAttribute('y2', 0);
    $$('path,circle', svg).forEach(function (p) { p.remove(); });
    L.forEach(function (l, i) {
      var a = l.getBoundingClientRect(), b = Rr[i].getBoundingClientRect();
      var x1 = a.right - bb.left, y1 = a.top + a.height / 2 - bb.top, x2 = b.left - bb.left, y2 = b.top + b.height / 2 - bb.top, mx = (x1 + x2) / 2;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2); p.dataset.r = i; p.id = 'bp' + i; svg.appendChild(p);
      if (!reduce) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 3.4); c.setAttribute('fill', i % 2 ? '#B4232A' : '#0F8C80'); c.setAttribute('opacity', '.9');
        var am = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion'); am.setAttribute('dur', (5 + (i % 4)) + 's'); am.setAttribute('repeatCount', 'indefinite'); am.setAttribute('begin', (i * .4) + 's');
        var mp = document.createElementNS('http://www.w3.org/2000/svg', 'mpath'); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#bp' + i); mp.setAttribute('href', '#bp' + i);
        am.appendChild(mp); c.appendChild(am); svg.appendChild(c);
      }
      p.style.setProperty('--len', p.getTotalLength()); p.style.transitionDelay = (i * 90) + 'ms';
    });
  }
  function bridgeInit() {
    var box = $('#bcols'); if (!box) return;
    box.addEventListener('pointerover', function (e) {
      var it = e.target.closest('.bi'); $$('.bi.hot,.bsvg path.hot', box).forEach(function (x) { x.classList.remove('hot'); });
      if (!it) return; $$('.bi[data-r="' + it.dataset.r + '"],path[data-r="' + it.dataset.r + '"]', box).forEach(function (x) { x.classList.add('hot'); });
    });
    box.addEventListener('pointerleave', function () { $$('.hot', box).forEach(function (x) { x.classList.remove('hot'); }); });
    var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { drawBridge(); $('#bridge').classList.add('in'); }, 150); });
  }
  function lanesHtml() {
    var R = D.sessionsData.roadmap;
    var h = '<div class="shead"><span class="num">IV</span><span class="eyebrow">One clock</span><h2 class="h2" id="clockh">Month by month: <em>two verticals, one calendar</em>.</h2><p class="lead reveal">The same twelve months, read both ways. Curation on the left, Outreach on the right, and the joint milestones between them.</p></div><div class="lanes">';
    R.forEach(function (r, i) {
      var lab = /^Set-up/.test(r.period) ? 'SET' : 'M' + r.period.replace(/\D+/g, '');
      h += '<div class="lane reveal"><div class="box card cb"><b>Curation and Research</b>' + esc(r.curation) + '</div><div class="mid"><span>' + lab + '</span></div><div class="box card ob"><b>Outreach and External Relations</b>' + esc(r.outreach) + '</div>' + (r.joint && !/^[-—–]+$/.test(r.joint.trim()) ? '<div class="jt">Joint: ' + esc(r.joint) + '</div>' : '') + '</div>';
    });
    return h + '</div>';
  }
  function aboutHtml() {
    var A = D.site.about;
    var h = '<div class="shead"><span class="num">V</span><span class="eyebrow">About this submission</span><h2 class="h2" id="abouth">Who I am, and <em>what to trust</em>.</h2></div>';
    h += '<div class="facts"><div class="card reveal"><h3>Who I am</h3><p>' + esc(A.who) + '</p><p><span class="badge acc">Status</span> <b>' + esc(A.status) + '</b></p></div>';
    h += '<div class="card reveal" style="--d:1"><h3>Reported, not re-verified</h3>' + ul(A.reported) + '</div><div class="card reveal" style="--d:2"><h3>My view or assumption</h3>' + ul(A.mine) + '</div></div>';
    h += '<div class="grid g2" style="margin-top:1.1rem"><div class="limits reveal"><h3>Open items</h3>' + ul(A.open) + '</div><div class="limits reveal" style="--d:1"><h3>Limits of this site</h3>' + ul(D.site.home.limits.concat(A.limits)) + '</div></div>';
    h += '<h3 class="h2" style="font-size:1.6rem;margin-top:2rem">Counts as loaded</h3><div class="grid g4">' + D.site.counts.map(function (c, i) { return '<div class="card pad reveal" style="--d:' + (i % 4) + '"><span class="mono small muted">' + esc(c[0]) + '</span><p style="margin:.2rem 0 0;font-family:var(--serif);font-size:1.15rem">' + esc(c[1]) + '</p></div>'; }).join('') + '</div>';
    h += '<p class="small muted" style="margin-top:1.4rem">Source document: The Neural Network Year Programme 2026-27, consolidated project proposal, dated ' + esc(D.site.docDate) + ', status "Proposal for review". This site is a companion to my workbooks and my project document. It is not a replacement for them.</p>';
    return h;
  }
  function sourcesHtml() {
    var h = '<div class="shead"><span class="num">VI</span><span class="eyebrow">Sources</span><h2 class="h2" id="sourcesh">Everything the document <em>names</em>.</h2></div><div class="warn small">' + esc(D.sources.note) + '</div>';
    D.sources.groups.forEach(function (g, i) {
      h += acc(esc(g.name), table(['Source', 'What I took from it', 'Link'], g.items.map(function (x) { return [esc(x.title), esc(x.used), x.url ? linkify(x.url) : miss()]; })), i === 0);
    });
    return h;
  }

  /* ---------- hero, ticker, fork ---------- */
  function heroInit() {
    var dn = $('[data-go-fork]'); if (dn) dn.addEventListener('click', function () { $('#fork').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
    var i = 0, h = $('#hname');
    $$('.row', h).forEach(function (row) {
      var txt = row.textContent; row.textContent = ''; row.setAttribute('aria-hidden', 'true');
      txt.split('').forEach(function (ch) {
        var s = document.createElement('span');
        if (ch === ' ') { s.className = 'sp'; } else { s.className = 'l'; s.style.setProperty('--i', i); s.textContent = ch; }
        i++; row.appendChild(s);
      });
    });
    h.setAttribute('aria-label', 'The Neural Network');
    var T = [['24', 'sessions'], ['4', 'terms'], ['6', 'play sessions', 'g'], ['44', 'partner rows'], ['5', 'access tiers'], ['12', 'first wave partners'], ['31', 'initiatives'], ['0', 'organisations contacted'], ['0', 'emails guessed']];
    var one = T.map(function (t) { return '<span class="' + (t[2] || '') + '"><b>' + t[0] + '</b>' + t[1] + '</span>'; }).join('');
    $('#ticker').innerHTML = one + one;
  }
  function forkInit() {
    var S = D.sessions.length, P = D.partners.length, ini = D.sessionsData.initiatives.length, ini2 = D.partnersData.initiatives.length;
    $('#forkgrid').innerHTML =
      '<button type="button" class="pane c" data-go="curation"><div><span class="no">Vertical 01</span><h3><span>Curation</span><br>&amp; Research</h3><p>What members learn and make: a 24-session year that starts from zero and ends with something shipped.</p></div><div><div class="stats"><div><b>' + S + '</b><small>sessions</small></div><div><b>6</b><small>play sessions</small></div><div><b>' + ini + '</b><small>initiatives</small></div></div><span class="enter">Enter this side <i>→</i></span></div></button>' +
      '<button type="button" class="pane o" data-go="outreach"><div><span class="no">Vertical 02</span><h3><span>Outreach</span><br>&amp; External Relations</h3><p>Who the club works with and how it asks: reachable partners, honest pitches, pilots before promises.</p></div><div><div class="stats"><div><b>' + P + '</b><small>partner rows</small></div><div><b>5</b><small>access tiers</small></div><div><b>' + ini2 + '</b><small>initiatives</small></div></div><span class="enter">Enter this side <i>→</i></span></div></button>';
  }

  /* ---------- vertical switching ---------- */
  var HEAD = {
    curation: ['Vertical 1 · Curation and Research', 'Curation <em>&amp; Research</em>', 'Building AI knowledge, skill and a research culture, one problem at a time.'],
    outreach: ['Vertical 2 · Outreach and External Relations', 'Outreach <em>&amp; External Relations</em>', 'Building the club\'s partners, speakers, collaborators and public presence.']
  };
  function setV(v, o) {
    o = o || {};
    if (v === state.v && !o.force) { if (o.scroll) $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    function apply() {
      state.v = v; root.dataset.v = v;
      $$('.vpanel').forEach(function (p) { p.hidden = p.dataset.v !== v; });
      $$('.switch button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); });
      $('#veyebrow').textContent = HEAD[v][0]; var vt = $('#vtitle'); vt.classList.remove('in', 'vh'); vt.dataset.split = ''; vt.innerHTML = HEAD[v][1]; splitWords(vt, 'vh'); requestAnimationFrame(function () { requestAnimationFrame(function () { vt.classList.add('in'); }); });
      $('#vlead').textContent = HEAD[v][2];
      var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = cssv('--bg');
      setTimeout(netColor, 80); fxText($('#vp-' + v)); observe($('#vp-' + v));
      try { history.replaceState(null, '', '#' + v); } catch (e) { /* ignore */ }
    }
    if (document.startViewTransition && !reduce && !o.noanim) {
      root.style.setProperty('--vx', (o.x != null ? o.x : innerWidth / 2) + 'px'); root.style.setProperty('--vy', (o.y != null ? o.y : 80) + 'px');
      var tr = document.startViewTransition(apply);
      tr.finished.then(function () { if (o.scroll) $('#stage').scrollIntoView({ behavior: 'smooth' }); });
    } else {
      apply(); var st = $('#vpanels'); st.classList.remove('fadeswap'); void st.offsetWidth; st.classList.add('fadeswap');
      if (o.scroll) $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function updateSub() {
    var panel = $('#vp-' + state.v); if (!panel) return;
    var cur = null;
    $$('section[id]', panel).forEach(function (s) { if (s.getBoundingClientRect().top < 190) cur = s.id; });
    $$('.sub a', panel).forEach(function (a) { a.classList.toggle('on', a.dataset.sec === cur); });
  }

  /* ===================================================== BOOT ===================================================== */
  function applyTheme(t, animate) {
    root.dataset.theme = t; store('nn-theme', t);
    $$('.themes button').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.t === t)); });
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = cssv('--bg');
    setTimeout(netColor, 60);
  }
  function boot(d) {
    D.site = d[0]; D.sessionsData = d[1]; D.sessions = d[1].sessions; D.partnersData = d[2]; D.partners = d[2].partners; D.templates = d[3]; D.sources = d[4];
    MISS = D.site.missing || MISS;
    $('#footTxt').textContent = D.site.footer;
    heroInit(); forkInit();
    $('#vpanels').innerHTML = '<div class="vpanel" id="vp-curation" data-v="curation">' + curationPanel() + '</div><div class="vpanel" id="vp-outreach" data-v="outreach" hidden>' + outreachPanel() + '</div>';
    $('#bridge').innerHTML = bridgeHtml(); $('#clock').innerHTML = lanesHtml(); $('#about').innerHTML = aboutHtml(); $('#sources').innerHTML = sourcesHtml();
    $('#bridge').classList.add('bridge');
    curationInit($('#vp-curation')); outreachInit($('#vp-outreach')); bridgeInit();

    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function (e) { setV(b.dataset.go, { x: e.clientX, y: e.clientY, scroll: true, force: false }); }); });
    $$('.switch button').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var far = scrollY < $('#stage').offsetTop - 300;
        setV(b.dataset.v, { x: e.clientX, y: e.clientY, scroll: far });
      });
    });
    $$('.themes button').forEach(function (b) { b.addEventListener('click', function () { applyTheme(b.dataset.t, true); }); });
    $('#dclose').addEventListener('click', closeDrawer); $('#scrim').addEventListener('click', closeDrawer);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href').slice(1); if (id === 'curation' || id === 'outreach') { e.preventDefault(); setV(id, { scroll: true }); }
    });
    addEventListener('scroll', function () { requestAnimationFrame(updateSub); }, { passive: true });
    addEventListener('resize', function () { drawBridge(); });

    var saved = store('nn-theme'); if (/^(paper|midnight|aurora)$/.test(saved || '')) applyTheme(saved);
    var h = location.hash.replace('#', '');
    if (h === 'outreach') setV('outreach', { force: true, noanim: true });
    else { fxText($('#vp-curation')); observe($('#vp-curation')); }
    var vt0 = $('#vtitle'); splitWords(vt0, 'vh'); requestAnimationFrame(function () { vt0.classList.add('in'); });
    fxText($('#bridge')); fxText($('#clock')); fxText($('#about')); fxText($('#sources')); fxText($('#fork'));
    observe(document); netColor(); startNet(); startGlow(); onScroll(); planetTick(); addEventListener('resize', planetTick); var pb = $('#planet'); pb.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }); updateSub(); typePrompt();
    document.body.classList.add('ready');
    window.__nn = { ready: true };
  }
  Promise.all(['site', 'sessions', 'partners', 'templates', 'sources'].map(function (n) {
    return fetch(n + '.json').then(function (r) { if (!r.ok) throw new Error('Could not load ' + n + '.json'); return r.json(); });
  })).then(boot).catch(function (e) {
    document.body.insertAdjacentHTML('afterbegin', '<div style="padding:2rem;text-align:center;font-family:sans-serif;color:#fff;background:#400">This page could not load its data: ' + esc(e.message || e) + '. If you opened the file from a folder, use the GitHub Pages address or run <code>python3 -m http.server</code> in the folder.</div>');
  });
})();
