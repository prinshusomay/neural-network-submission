/* The Neural Network: applicant submission site. Plain JavaScript, no dependencies, no tracking. */
(function () {
  'use strict';
  var ROOT = document.body.getAttribute('data-root') || '';
  var app = document.getElementById('app');
  if (!app) return;
  var PAGE = app.getAttribute('data-page');
  var cache = {};
  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(name + '.json').then(function (r) {
        if (!r.ok) throw new Error('Could not load ' + name + '.json');
        return r.json();
      });
    }
    return cache[name];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var MISSING = 'Not yet loaded from my workbook';
  function miss() { return '<span class="missing">' + esc(MISSING) + '</span>'; }
  function linkify(v) {
    if (Array.isArray(v)) return v.map(linkify).join('<br>');
    v = String(v);
    return /^https?:\/\//.test(v) ? '<a href="' + esc(v) + '" rel="noopener">' + esc(v) + '</a>' : esc(v);
  }
  function val(v) { return (v && (!Array.isArray(v) || v.length)) ? linkify(v) : miss(); }
  function contactCell(p) {
    var parts = [p.email, p.phone, p.contactPage].filter(Boolean);
    return parts.length ? parts.map(linkify).join('<br>') : miss();
  }
  function flat(p) {
    var h = '', i = p.search(/[#?]/);
    if (i >= 0) { h = p.slice(i); p = p.slice(0, i); }
    var m = p.match(/^(curation|outreach|about)\/(.+)$/);
    if (!m) return p + h;
    var sec = m[1], name = m[2];
    if (name === 'index.html') return (sec === 'about' ? 'about' : sec) + '.html' + h;
    return ({ curation: 'cur-', outreach: 'out-', about: 'about-' })[sec] + name + h;
  }
  function href(p) { return flat(p); }
  function a(p, text) { return '<a href="' + href(p) + '">' + esc(text) + '</a>'; }
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'; }
  function ol(items) { return '<ol>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>'; }
  function para(t) { return '<p>' + esc(t) + '</p>'; }
  function head(title, lead, crumbs) {
    return '<div class="pagehead">' + (crumbs || '') + '<h1 id="top">' + esc(title) + '</h1>' + (lead ? '<p class="lead">' + esc(lead) + '</p>' : '') + '</div>';
  }
  function table(cols, rows, opts) {
    opts = opts || {};
    var h = '<div class="tablewrap"><table class="responsive ' + (opts.cls || '') + '">';
    if (opts.caption) h += '<caption>' + esc(opts.caption) + '</caption>';
    h += '<thead><tr>' + cols.map(function (c, i) {
      var w = opts.widths && opts.widths[i] ? ' style="width:' + opts.widths[i] + '"' : '';
      return '<th scope="col"' + w + '>' + esc(c) + '</th>';
    }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var cells = r.cells || r, cls = r.cls ? ' class="' + r.cls + '"' : '';
      h += '<tr' + cls + '>' + cells.map(function (c, i) {
        return '<td data-label="' + esc(cols[i]) + '">' + c + '</td>';
      }).join('') + '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  function items(list) {
    var out = '', open = false;
    list.forEach(function (x) {
      if (x.li) { if (!open) { out += '<ul>'; open = true; } out += '<li>' + esc(x.t) + '</li>'; }
      else { if (open) { out += '</ul>'; open = false; } out += '<p>' + esc(x.t) + '</p>'; }
    });
    if (open) out += '</ul>';
    return out;
  }
  function initiativeBlock(x, noteLabel) {
    var h = '<details id="' + esc(x.id) + '"><summary>' + esc(x.id) + '  ' + esc(x.title) + '</summary><div class="inner">';
    if (x.rating) {
      h += '<p class="small"><span class="badge">Impact: ' + esc(x.rating.impact) + '</span><span class="badge">Feasibility: ' + esc(x.rating.feasibility) + '</span><span class="badge">Effort: ' + esc(x.rating.effort) + '</span><span class="badge solid">Priority: ' + esc(x.rating.priority) + '</span> <span class="muted">(my judgement, Section 4.4)</span></p>';
    }
    h += '<dl class="fields">' + x.fields.map(function (f) {
      return '<dt>' + esc(f.label) + '</dt><dd>' + items(f.items) + '</dd>';
    }).join('') + '</dl></div></details>';
    return h;
  }
  function shortTitle(t) { return t.split(':')[0]; }
  function monthLabel(n) { return 'Month ' + n; }
  function showError(e) {
    app.innerHTML = '<div class="box warn"><h2>This page could not load its data</h2><p>' + esc(e.message || e) + '</p><p>If you opened the file straight from a folder, serve the folder instead (for example, run <code>python3 -m http.server</code> in it) or view the GitHub Pages address.</p></div>';
  }
  function setTitle() {
    var h = app.querySelector('h1');
    if (h) document.title = h.textContent + ' | The Neural Network (applicant submission)';
  }
  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.left = '-9999px';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(t);
  }
  function wireCopy() {
    var live = document.getElementById('copystatus');
    app.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = document.getElementById(btn.getAttribute('data-copy'));
        var text = src ? src.textContent : '';
        var done = function () {
          var old = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', old);
          btn.textContent = 'Copied';
          if (live) live.textContent = 'Copied to clipboard';
          setTimeout(function () { btn.textContent = old; if (live) live.textContent = ''; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
      });
    });
  }
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
  });

  /* ---------------- renderers ---------------- */
  var R = {};

  R.home = function (site) {
    var h = site.home;
    return head(site.title, site.subtitle) +
      '<p>' + esc(h.purpose) + '</p>' +
      '<h2>Who I am</h2><p>' + esc(h.who) + '</p>' +
      '<p><span class="badge solid">Status</span> <strong>' + esc(h.status) + '</strong></p>' +
      '<div class="btnrow"><a class="btn" href="' + href('curation/index.html') + '">Explore Curation &amp; Research</a>' +
      '<a class="btn" href="' + href('outreach/index.html') + '">Explore Outreach &amp; External Relations</a></div>' +
      '<div class="box warn" role="note"><h2>Limits of this site</h2>' + ul(h.limits) + '<p class="small">See the ' + a('about/index.html', 'About page') + ' for what is reported, what is my view, and what is still open.</p></div>';
  };

  R.curOverview = function (site, S) {
    var o = site.curationOverview, h = head('Curation and Research: overview', o.lead);
    h += '<h2>The year in numbers</h2><div class="grid three">' +
      '<div class="card"><strong>24 sessions</strong><br>Two a month, for twelve months.</div>' +
      '<div class="card"><strong>4 terms of 6</strong><br>Start from Zero; Work like an Analyst; Know the Rules and Automate; Build and Ship.</div>' +
      '<div class="card fun"><strong>6 play sessions</strong><br>Sessions 4, 8, 12, 16, 20 and 24. Three learning sessions, then one play session.</div></div>';
    h += '<h2>Ground rules</h2>' + ul(o.rules);
    h += '<h2>The season league and points system</h2><p>Members earn points for effort, not for expertise, so a beginner can top the board. Points are confirmed by a partner or host and kept in a shared sheet.</p>';
    h += '<div class="grid two">' + table(['Action', 'Points'], S.points.map(function (p) { return [esc(p[0]), String(p[1])]; }), { caption: 'Points per action (cap: 40 per member per session)', cls: 'compact' }) +
      table(['Level', 'Points needed'], S.levels.map(function (p) { return [esc(p[0]), String(p[1])]; }), { caption: 'Levels', cls: 'compact' }) + '</div>';
    h += '<p class="small">' + esc(o.leagueNote) + '</p>';
    h += '<h2>The three levels and four terms</h2>' + table(['Term', 'Months', 'Sessions', 'What it covers'], S.terms.map(function (t) {
      return [esc(t.id + ' ' + t.name), t.months[0] + ' to ' + t.months[1], t.sessions[0] + ' to ' + t.sessions[1], esc(t.blurb)];
    }), { cls: 'compact' });
    h += '<h2>Objectives and first-year targets</h2><p class="small">These are starting values drawn from the success measures proposed for the programme. They are my estimates and should be reviewed after Session 12.</p>' +
      table(['#', 'Objective', 'Target (first year)'], o.objectives.map(function (x) { return [esc(x.id), esc(x.objective), esc(x.target)]; }), { cls: 'compact', widths: ['5%', '30%', '65%'] });
    h += '<h2>Sub-verticals</h2>' + table(['Code', 'Sub-vertical', 'Scope', 'Initiatives'], site.plan.subV1.map(function (x) { return [esc(x.code), esc(x.name), esc(x.scope), esc(x.initiatives)]; }), { cls: 'compact' });
    h += '<h2>Where to go next</h2><ul><li>' + a('curation/roadmap.html', 'Roadmap') + ': months 1 to 12 and the four terms.</li><li>' + a('curation/calendar.html', 'Session calendar') + ': all 24 sessions with search and filters.</li><li>' + a('curation/sessions.html', 'Full session pages') + ': five sessions in detail.</li><li>' + a('outreach/index.html', 'Outreach and External Relations') + ': who supplies the judges, speakers and mentors this programme uses.</li></ul>';
    return h;
  };

  R.curRoadmap = function (site, S) {
    var h = head('Roadmap: months 1 to 12', 'Four terms of six sessions, a set-up period before Session 1, and a mid-year review after Session 12.');
    h += '<h2>Months 1 to 12</h2><div class="termband" aria-hidden="true">' + S.terms.map(function (t, i) { return '<div class="t' + (i + 1) + '">' + esc(t.id + ' ' + t.name) + '<br><span class="small">Months ' + t.months[0] + ' to ' + t.months[1] + '</span></div>'; }).join('') + '</div>';
    h += '<ol class="strip">';
    for (var m = 1; m <= 12; m++) {
      h += '<li><b>' + monthLabel(m) + '</b>';
      S.sessions.filter(function (s) { return s.month === m; }).forEach(function (s) {
        h += '<span class="s' + (s.fun ? ' fun' : '') + '">S' + s.n + ' ' + esc(shortTitle(s.title)) + (s.fun ? ' (play)' : '') + '</span>';
      });
      h += '</li>';
    }
    h += '</ol><p class="small"><span class="badge fun">Yellow</span> marks the six play sessions. The mid-year review happens within two weeks of Session 12 (end of Month 6). Sessions are not held for roughly ten days around mid-sems and end-sems; the document swaps heavy sessions for chill or 45-minute ones in exam months.</p>';
    h += '<h2>The four terms</h2>' + table(['Term', 'Months', 'Sessions', 'Count', 'Play sessions', 'What it covers'], S.terms.map(function (t) {
      var ss = S.sessions.filter(function (s) { return s.term === t.id; });
      var fun = ss.filter(function (s) { return s.fun; }).map(function (s) { return s.n; });
      return [esc(t.id + ' ' + t.name), t.months[0] + ' to ' + t.months[1], t.sessions[0] + ' to ' + t.sessions[1], String(ss.length), fun.join(', ') + ' (' + fun.length + ')', esc(t.blurb)];
    }), { cls: 'compact' });
    h += '<p class="small">Total: 24 sessions and 6 play sessions. Sessions 14, 17, 19, 22 and 23 are the ones that take a member past where they started. None is reachable in week one, which is why none is in Term 1.</p>';
    h += '<h2>The 12-session fallback</h2>' + para(S.cadence[3] || '');
    h += '<h2>Period by period (Curation column)</h2><p class="small">The Outreach column and the joint column for each period are on the ' + a('outreach/implementation.html#roadmap', 'Outreach implementation page') + '.</p>' +
      table(['Period', 'Curation and Research', 'Joint'], S.roadmap.map(function (r) { return [esc(r.period), esc(r.curation), esc(r.joint)]; }), { cls: 'compact', widths: ['14%', '56%', '30%'] });
    h += '<h2>Cadence and calendar rules</h2>' + ul(S.cadence);
    return h;
  };

  R.curCalendar = function (site, S) {
    var h = head('Session calendar', 'All 24 sessions. Search or filter by phase (term), type or play sessions.');
    h += '<form class="filters" role="search" aria-label="Filter sessions" onsubmit="return false">' +
      '<label>Search<input type="search" id="q" placeholder="Title, activity, tool"></label>' +
      '<label>Phase<select id="f-term"><option value="">All terms</option>' + S.terms.map(function (t) { return '<option value="' + t.id + '">' + esc(t.id + ' ' + t.name) + '</option>'; }).join('') + '</select></label>' +
      '<label>Type<select id="f-type"><option value="">All types</option><option>Learn</option><option>Hands-on</option><option>Play</option><option>Build</option></select></label>' +
      '<label class="check"><input type="checkbox" id="f-fun"> Play sessions only</label>' +
      '<button type="button" class="btn alt small" id="f-reset">Reset</button></form>';
    h += '<p class="count" id="count" aria-live="polite"></p>';
    h += '<div id="caltable"></div>';
    h += '<p class="small">Play sessions are softly highlighted. "Month" follows two sessions a month. "Measurable outcome" shows what each member keeps, then the target where the document gives one. Programme-wide targets: 80% of exit slips state the key idea, and 90% agree "I learned a use I did not know". "Builds on" is shown only where the document states it or the 3 + 1 rhythm implies it.</p>';
    return h;
  };
  function calendarInit(S) {
    var q = document.getElementById('q'), ft = document.getElementById('f-term'), fy = document.getElementById('f-type'), ff = document.getElementById('f-fun');
    function draw() {
      var term = ft.value, type = fy.value, fun = ff.checked, text = q.value.trim().toLowerCase();
      var rows = S.sessions.filter(function (s) {
        if (term && s.term !== term) return false;
        if (type && s.type !== type) return false;
        if (fun && !s.fun) return false;
        if (text) {
          var hay = (s.title + ' ' + s.what + ' ' + s.walkaway + ' ' + s.tools + ' ' + s.type + ' ' + s.level + ' ' + s.termName).toLowerCase();
          if (hay.indexOf(text) < 0) return false;
        }
        return true;
      });
      document.getElementById('count').textContent = 'Showing ' + rows.length + ' of ' + S.sessions.length + ' sessions';
      var out = rows.map(function (s) {
        var title = s.runsheet ? a('curation/session-' + s.n + '.html', s.title) : esc(s.title);
        var typeTxt = esc(s.type) + (s.funKind ? ' (' + esc(s.funKind) + ')' : '') + '<br><span class="small muted">' + esc(s.level) + '</span>';
        var outcome = '<strong>Keeps:</strong> ' + esc(s.walkaway) + '<br><span class="small">' + (s.target ? '<strong>Target:</strong> ' + esc(s.target) : '<strong>Target:</strong> ' + miss()) + '</span>';
        var builds = s.buildsOn ? esc(s.buildsOn) : miss();
        return { cls: s.fun ? 'fun' : '', cells: [String(s.n), title + (s.runsheet ? '<br><span class="small">Full session page</span>' : ''), monthLabel(s.month), esc(s.term + ' ' + s.termName), typeTxt, esc(s.what), outcome, builds] };
      });
      document.getElementById('caltable').innerHTML = rows.length ? table(['#', 'Title', 'Month', 'Phase', 'Type', 'What happens', 'Measurable outcome (target)', 'Builds on'], out, { cls: 'compact fixed', widths: ['3.5%', '12%', '5.5%', '8%', '7.5%', '27%', '22%', '14%'], caption: 'The 24 sessions' }) : '<p>No session matches. Reset the filters.</p>';
    }
    [q, ft, fy, ff].forEach(function (el) { el.addEventListener('input', draw); el.addEventListener('change', draw); });
    document.getElementById('f-reset').addEventListener('click', function () { q.value = ''; ft.value = ''; fy.value = ''; ff.checked = false; draw(); q.focus(); });
    draw();
  }

  R.curSessions = function (site, S) {
    var ids = Object.keys(S.runsheets).map(Number).sort(function (x, y) { return x - y; });
    var h = head('Full session pages', 'Five sessions in full: the four flagship run-sheets in the document (Sessions 1, 4, 12 and 17) and the Capstone Build Day (Session 23).');
    h += '<div class="grid two">' + ids.map(function (n) {
      var r = S.runsheets[n], s = S.sessions[n - 1];
      return '<div class="card' + (s.fun ? ' fun' : '') + '"><h2 style="margin-top:0;border:0;font-size:1.15rem">' + a('curation/session-' + n + '.html', 'Session ' + n + ': ' + r.title) + '</h2><p>' +
        '<span class="badge">' + esc(s.type) + (s.funKind ? ' (' + esc(s.funKind) + ')' : '') + '</span><span class="badge">' + esc(r.level) + '</span></p><p class="small">' + esc(r.duration) + '</p></div>';
    }).join('') + '</div>';
    h += '<div class="box"><h2>Each page shows 13 fields</h2><p>Title, objective, target audience, difficulty level, duration, timed structure, activities and demos, AI tools required, what participants learn, resources, expected outcomes (measurable), how to keep it engaging, and estimated budget. Each page adds preparation, risks and fallbacks, and roles.</p><p>Where my document does not hold a field, the page says <span class="missing">' + esc(MISSING) + '</span>. I did not fill the gap. Where a field is taken from the programme-wide plan rather than from the session itself, the text says so.</p></div>';
    h += '<p>The other 19 sessions appear in the ' + a('curation/calendar.html', 'session calendar') + ' with what happens, what members keep and which tools they use.</p>';
    return h;
  };

  R.curSession = function (site, S) {
    var n = app.getAttribute('data-session'), r = S.runsheets[n], s = S.sessions[Number(n) - 1];
    if (!r) return head('Session not found', '');
    var ids = Object.keys(S.runsheets).map(Number).sort(function (x, y) { return x - y; });
    var i = ids.indexOf(Number(n));
    var h = head('Session ' + n + ': ' + r.title, s.title, '<p class="crumbs">' + a('curation/sessions.html', 'Full session pages') + ' / Session ' + n + '</p>');
    h += '<p><span class="badge' + (s.fun ? ' fun' : '') + '">' + esc(s.type) + (s.funKind ? ' (' + esc(s.funKind) + ')' : '') + '</span><span class="badge">' + esc(s.term + ' ' + s.termName) + '</span><span class="badge">' + monthLabel(s.month) + '</span></p>';
    function f(label, v) { return '<dt>' + esc(label) + '</dt><dd>' + (v ? '<p>' + esc(v) + '</p>' : '<p>' + miss() + '</p>') + '</dd>'; }
    h += '<dl class="fields">' + f('1. Title', r.fullTitle) + f('2. Objective', r.objective) + f('3. Target audience', r.audience) + f('4. Difficulty level', r.level) + f('5. Duration', r.duration) + '</dl>';
    h += '<h2>6. Timed structure</h2>' + table(['Time', 'Segment', 'What happens'], r.timed.map(function (t) { return [esc(t.time), esc(t.segment), esc(t.what)]; }), { cls: 'compact', widths: ['12%', '24%', '64%'] });
    h += '<dl class="fields">' + f('7. Activities and demos', r.activities) + f('8. AI tools required', r.tools) + f('9. What participants learn and keep', r.learn) + f('10. Resources', r.resources) + f('11. Expected outcomes (measurable)', r.outcomes) + f('12. How to keep it engaging', r.engage) +
      '<dt>13. Estimated budget</dt><dd><p>' + (r.budget ? esc(r.budget) + ' <span class="muted">(my estimate)</span>' : miss()) + '</p><p class="small">The document says a zero-cost core is possible and gives no amounts. Any amount is for the committee to set. Sponsors may cover prizes (an assumption).</p></dd></dl>';
    h += '<h2>Preparation, risks and roles</h2><dl class="fields">' + f('Preparation', r.prep) + f('Risks and fallbacks', r.risks) + f('Roles', r.roles) + '</dl>';
    h += '<p class="small">Programme-wide measures also apply: 80% of exit slips state the key idea, and 90% agree "I learned a use I did not know".</p>';
    h += '<div class="pager">' + (i > 0 ? '<a href="' + href('curation/session-' + ids[i - 1] + '.html') + '">&larr; Session ' + ids[i - 1] + '</a>' : '<span></span>') + a('curation/calendar.html', 'All 24 sessions') + (i < ids.length - 1 ? '<a href="' + href('curation/session-' + ids[i + 1] + '.html') + '">Session ' + ids[i + 1] + ' &rarr;</a>' : '<span></span>') + '</div>';
    return h;
  };

  function sourceList(src, onlyFirst) {
    var g = src.groups.slice(0, onlyFirst || src.groups.length);
    return g.map(function (grp) {
      return '<h3>' + esc(grp.name) + '</h3>' + table(['Source', 'What I took from it', 'Link'], grp.items.map(function (x) {
        return [esc(x.title), esc(x.used), x.url ? '<a href="' + esc(x.url) + '" rel="noopener">' + esc(x.url) + '</a>' : miss()];
      }), { cls: 'compact', widths: ['32%', '46%', '22%'] });
    }).join('');
  }

  R.curResearch = function (site, S, src) {
    var rs = site.research, v7 = S.initiatives.filter(function (x) { return x.id === 'V1-07'; })[0];
    var h = head('Research notes', 'What I read, what I took from it, my own proposal, and the limits.');
    h += '<h2>Pages I read</h2>' + table(['What I read', 'What I took from it', 'Link'], rs.read.map(function (x) { return [esc(x.what), esc(x.took), x.link ? '<a href="' + esc(x.link) + '">link</a>' : miss()]; }), { cls: 'compact', widths: ['30%', '50%', '20%'] });
    h += '<h2>The research standard the programme would use (V1-07)</h2>';
    v7.fields.forEach(function (fld) { if (fld.label === 'Proposed activities' || fld.label === 'Why the club should do it') h += '<h3>' + esc(fld.label) + '</h3>' + items(fld.items); });
    h += '<h2>Evidence base named in the document</h2><p>The document names these studies behind its format choices. It gives no links, so none is shown.</p>' + sourceList(src, 1).replace(/<h3>.*?<\/h3>/, '');
    h += '<h2>My own proposal</h2>' + para(rs.proposal);
    h += '<h2>Limits</h2>' + ul(rs.limits);
    h += '<p>All sources, with links once they are loaded, are on the ' + a('about/sources.html', 'Sources page') + '.</p>';
    return h;
  };

  R.curRationale = function (site, S) {
    var r = site.rationale, h = head('Programme rationale', 'Why I chose this approach, and a checklist against the assignment.');
    h += '<h2>Why this approach</h2>' + ul(r.why);
    h += '<h2>Mission</h2>' + ul(r.mission);
    h += '<h2>Twelve design principles</h2>' + table(['#', 'Principle', 'What it means in practice'], site.curationOverview.principles.map(function (x) { return [esc(x.id), esc(x.principle), esc(x.means)]; }), { cls: 'compact', widths: ['6%', '24%', '70%'] });
    h += '<h2>Checklist against the assignment</h2><p class="small">I did not have the assignment text when I built this site. The checklist follows the structure my document says it was written to: an eleven-point initiative template for Curation, a twelve-point template for Outreach, and the sections listed below.</p>';
    h += table(['Item', 'Status', 'Where', 'Note'], r.checklist.map(function (c) {
      var cls = c.status === 'Done' ? 'badge first' : (c.status === 'Partial' ? 'badge fun' : 'badge');
      return [esc(c.item), '<span class="' + cls + '">' + esc(c.status) + '</span>', a(c.where, c.where.replace('.html', '')), esc(c.note)];
    }), { cls: 'compact', widths: ['32%', '10%', '18%', '40%'] });
    return h;
  };

  R.curImpl = function (site, S) {
    var P = site.plan, h = head('Implementation details', 'All 16 Curation initiatives, resources, timelines, outcomes, indicators, roles, risks and sustainability.');
    h += '<p class="small"><a href="#initiatives">Initiatives</a> | <a href="#resources">Resources</a> | <a href="#timelines">Timelines</a> | <a href="#indicators">Indicators</a> | <a href="#roles">Roles</a> | <a href="#monitoring">Monitoring</a> | <a href="#risks">Risks</a> | <a href="#sustain">Sustainability</a></p>';
    h += '<h2 id="initiatives">Detailed initiatives V1-01 to V1-16</h2><p>Each initiative follows the document\'s eleven-point template (identifier plus ten fields). Open one to read it. Impact, feasibility and effort are my judgements.</p>' + S.initiatives.map(function (x) { return initiativeBlock(x); }).join('');
    h += '<h2 id="resources">Resources and requirements</h2>' + table(['Category', 'Requirement', 'Notes'], S.resources.map(function (x) { return [esc(x.category), esc(x.requirement), esc(x.notes)]; }), { cls: 'compact', widths: ['14%', '56%', '30%'] });
    h += '<h2 id="timelines">Timelines</h2>' + table(['When', 'Curation and Research milestone'], S.timelines.map(function (x) { return [esc(x.when), esc(x.milestone)]; }), { cls: 'compact', widths: ['18%', '82%'] });
    h += '<h2>Expected outcomes</h2>' + ul(S.outcomes);
    h += '<h2 id="indicators">Performance indicators</h2>' + table(['Indicator', 'Target', 'How tracked'], S.indicators.map(function (x) { return [esc(x.indicator), esc(x.target), esc(x.tracked)]; }), { cls: 'compact', widths: ['20%', '55%', '25%'] });
    h += '<h2 id="roles">Roles and responsibilities</h2><p class="small">Roles are functions, not headcount. The document does not say how many volunteers the club will have. A workable minimum is four roles (my assumption). I hold none of these roles.</p>' +
      table(['Role', 'Vertical', 'Main responsibilities', 'Initiatives'], (site.plan.roles || []).map(function (x) { return [esc(x.role), esc(x.vertical), esc(x.duty), esc(x.initiatives)]; }), { cls: 'compact' });
    h += '<h3>Responsibility matrix</h3><p class="small">R = responsible, A = accountable, C = consulted, I = informed.</p>' + table(site.plan.matrixHead, site.plan.matrixRows.map(function (r) { return r.map(esc); }), { cls: 'compact' });
    h += '<h2 id="monitoring">Monitoring and evaluation</h2>' + table(['Cadence', 'What is reviewed', 'Who', 'Decision it feeds'], P.monitoring.map(function (x) { return [esc(x.cadence), esc(x.reviewed), esc(x.who), esc(x.decision)]; }), { cls: 'compact' });
    h += '<h3>Dashboard: ten measures</h3>' + table(['Measure', 'Healthy sign'], P.dashboard.map(function (x) { return [esc(x.measure), esc(x.healthy)]; }), { cls: 'compact' });
    h += P.decision.map(para).join('');
    h += '<h2 id="risks">Potential challenges and planned responses</h2>' + table(['Challenge', 'Why it may happen', 'Planned response'], P.challenges.map(function (x) { return [esc(x.challenge), esc(x.why), esc(x.response)]; }), { cls: 'compact', widths: ['22%', '28%', '50%'] });
    h += '<h2 id="sustain">Long-term sustainability</h2>' + ul(P.sustain);
    h += '<p>The partner side of the same plan is on the ' + a('outreach/implementation.html', 'Outreach implementation page') + '.</p>';
    return h;
  };

  /* ---------------- Outreach ---------------- */
  R.outStrategy = function (site, S, src, Pt, T) {
    var o = site.outreach, h = head('Outreach and External Relations: strategy', 'Why ten-to-forty reachable partners instead of famous companies, and what the club can offer a partner.');
    h += '<div class="box"><h2>The central idea</h2>' + Pt.central.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>';
    h += '<h2>Why reachable partners, not famous companies</h2>' + ul(o.whyReachable);
    h += '<p class="small">The document lists 44 rows (about forty partners, groups and named individuals) in five access tiers. The earliest outreach is planned around Tier 1 only. See the ' + a('outreach/partners.html', 'partner shortlist') + '.</p>';
    h += '<h2>What the club can offer a partner</h2>' + ul(o.offer);
    h += '<h3>What the club will not offer</h3>' + ul(o.wontOffer);
    h += '<h2>Value exchange by purpose</h2>' + table(['Purpose', 'What leads the message', 'What the club offers', 'The ask'], Pt.value.map(function (x) { return [esc(x.purpose), esc(x.leads), esc(x.offer), esc(x.ask)]; }), { cls: 'compact' });
    h += '<h2>Access tiers</h2>' + table(['Tier', 'Meaning', 'Order of approach'], Pt.tiers.map(function (x) { return { cls: x.tier === '1' ? 'first' : '', cells: [esc(x.tier + ' ' + x.name), esc(x.meaning), esc(x.order)] }; }), { cls: 'compact', widths: ['14%', '50%', '36%'] });
    h += '<p class="small">Tier 1* marks routes where I report a personal connection to the body. It must be disclosed in the first line of any email. Neither body has a relationship with the club today.</p>';
    h += '<h2>Where to go next</h2><ul><li>' + a('outreach/first-wave.html', 'First wave') + ': the Tier 1 partners.</li><li>' + a('outreach/partners.html', 'Partner shortlist') + ': all 44 rows, filterable.</li><li>' + a('outreach/templates.html', 'Email templates') + ': five drafts with a copy button.</li><li>' + a('curation/index.html', 'Curation and Research') + ': the sessions these partners would support (see the interlock table on the ' + a('outreach/implementation.html#interlock', 'implementation page') + ').</li></ul>';
    return h;
  };

  function partnerRows(list) {
    return list.map(function (p) {
      return { cls: p.firstWave ? 'first' : '', cells: [String(p.id), a('outreach/partner.html?id=' + p.id, p.name) + (p.disclose ? '<br><span class="small">Disclose personal connection</span>' : ''), esc(p.type), esc(p.purpose), esc(p.tier) + (p.firstWave ? '<br><span class="badge first">First wave</span>' : ''), esc(p.template), contactCell(p)] };
    });
  }

  R.outFirst = function (site, S, src, Pt) {
    var h = head('First wave', 'The twelve Tier 1 partners: open routes inside the institute and professional bodies reached through a disclosed introduction.');
    h += '<div class="box warn"><p><strong>Nobody has been contacted.</strong> Every step below needs the faculty advisor\'s approval first. The document does not name a "first ten": it says the faculty advisor approves the first ten targets in Week 0. I have treated all of Tier 1 as the first wave. GDG Chandigarh is Tier 2 (Week 2), not Tier 1.</p></div>';
    h += '<div class="grid two">' + Pt.partners.filter(function (p) { return p.firstWave; }).map(function (p) {
      var w = Pt.firstWave[p.id];
      return '<article class="card first"><h2 style="margin-top:0;border:0;font-size:1.1rem">' + p.id + '. ' + a('outreach/partner.html?id=' + p.id, p.name) + '</h2><p><span class="badge">' + esc(p.type) + '</span><span class="badge">Tier ' + esc(p.tier) + '</span></p>' +
        '<p><strong>Why:</strong> ' + esc(w.why) + '</p><p><strong>What I would propose:</strong> ' + esc(w.propose) + '</p><p><strong>Next step:</strong> ' + esc(w.next) + '</p><p><strong>Timing:</strong> ' + esc(w.timing) + '</p>' + (p.disclose ? '<p class="small"><strong>Disclose my personal connection in the first line.</strong></p>' : '') + '</article>';
    }).join('') + '</div>';
    h += '<h2>The first 30 days</h2>' + table(['Week', 'Actions', 'Output'], Pt.first30.map(function (x) { return [esc(x.week), esc(x.actions), esc(x.output)]; }), { cls: 'compact', widths: ['12%', '68%', '20%'] });
    return h;
  };

  R.outPartners = function (site, S, src, Pt) {
    var types = {}, templ = {}, rows = Pt.partners;
    rows.forEach(function (p) { types[p.type] = 1; templ[p.template] = 1; });
    function opts(o) { return Object.keys(o).sort().map(function (k) { return '<option>' + esc(k) + '</option>'; }).join(''); }
    var h = head('Partner shortlist', 'All 44 rows from the document. The twelve Tier 1 partners are shaded green and marked first wave.');
    h += '<div class="box warn"><p>Entries are as reported in my working notes and were not independently re-verified. Contact routes are not in my document, so no email, phone or form is shown anywhere. Where a partner row groups several named people, the document groups them too.</p></div>';
    h += '<form class="filters" role="search" aria-label="Filter partners" onsubmit="return false"><label>Search<input type="search" id="pq" placeholder="Name, purpose, type"></label>' +
      '<label>Purpose (template)<select id="pf-t"><option value="">All purposes</option>' + opts(templ) + '</select></label>' +
      '<label>Realism (access tier)<select id="pf-tier"><option value="">All tiers</option>' + Pt.tiers.map(function (t) { return '<option value="' + esc(t.tier) + '">Tier ' + esc(t.tier) + ': ' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
      '<label>Type<select id="pf-type"><option value="">All types</option>' + opts(types) + '</select></label>' +
      '<label>Contact status<select id="pf-c"><option value="">All</option><option value="none">' + esc(MISSING) + '</option></select></label>' +
      '<label class="check"><input type="checkbox" id="pf-first"> First wave only</label><button type="button" class="btn alt small" id="pf-reset">Reset</button></form>';
    h += '<p class="count" id="pcount" aria-live="polite"></p><div id="ptable"></div>';
    h += '<p class="small">Tier meaning: ' + Pt.tiers.map(function (t) { return esc(t.tier + ' = ' + t.name); }).join('; ') + '. Tier is the document\'s measure of how quickly a target is likely to answer. It is not a promise of a reply.</p>';
    return h;
  };
  function partnersInit(Pt) {
    var q = document.getElementById('pq'), ft = document.getElementById('pf-t'), fr = document.getElementById('pf-tier'), fy = document.getElementById('pf-type'), fc = document.getElementById('pf-c'), ff = document.getElementById('pf-first');
    function draw() {
      var text = q.value.trim().toLowerCase();
      var rows = Pt.partners.filter(function (p) {
        if (ft.value && p.template !== ft.value) return false;
        if (fr.value && String(p.tierNum) !== fr.value) return false;
        if (fy.value && p.type !== fy.value) return false;
        if (ff.checked && !p.firstWave) return false;
        if (fc.value === 'none' && (p.email || p.phone || p.contactPage)) return false;
        if (text && (p.name + ' ' + p.type + ' ' + p.purpose + ' ' + p.template).toLowerCase().indexOf(text) < 0) return false;
        return true;
      });
      document.getElementById('pcount').textContent = 'Showing ' + rows.length + ' of ' + Pt.partners.length + ' partner rows';
      document.getElementById('ptable').innerHTML = rows.length ? table(['#', 'Partner', 'Type', 'Best-fit purpose and first ask', 'Tier', 'Template', 'Contact'], partnerRows(rows), { cls: 'compact fixed', widths: ['4%', '17%', '11%', '31%', '8%', '11%', '18%'], caption: 'Partner shortlist' }) : '<p>No partner matches. Reset the filters.</p>';
    }
    [q, ft, fr, fy, fc, ff].forEach(function (el) { el.addEventListener('input', draw); el.addEventListener('change', draw); });
    document.getElementById('pf-reset').addEventListener('click', function () { q.value = ''; ft.value = ''; fr.value = ''; fy.value = ''; fc.value = ''; ff.checked = false; draw(); q.focus(); });
    draw();
  }

  R.outPartner = function (site, S, src, Pt) {
    var id = Number((new URLSearchParams(location.search)).get('id'));
    var p = Pt.partners.filter(function (x) { return x.id === id; })[0];
    if (!p) return head('Partner not found', 'Choose a partner from the shortlist.', '') + '<p>' + a('outreach/partners.html', 'Back to the partner shortlist') + '</p>';
    var tier = Pt.tiers.filter(function (t) { return t.tier === String(p.tierNum); })[0];
    var vr = Pt.value.filter(function (v) { return v.purpose === p.valueRow; })[0];
    var offer;
    if (vr) offer = '<p>' + esc(vr.offer) + '</p><p class="small muted">From the "' + esc(vr.purpose) + '" row of the value-exchange table. I mapped this partner to that row.</p>';
    else offer = '<p>Credit the body in the recap; invite its members to Build Day and Demo Day; ask what it wants from the club (V2-07).</p>';
    function f(label, v) { return '<dt>' + esc(label) + '</dt><dd>' + v + '</dd>'; }
    var h = head(p.name, 'Partner ' + p.id + ' of 44. ' + p.type + '.', '<p class="crumbs">' + a('outreach/partners.html', 'Partner shortlist') + ' / ' + esc(p.name) + '</p>');
    h += '<p>' + (p.firstWave ? '<span class="badge first">First wave</span>' : '') + '<span class="badge">Tier ' + esc(p.tier) + '</span><span class="badge">Template: ' + esc(p.template) + '</span></p>';
    if (p.disclose) h += '<div class="box warn"><p><strong>Disclose.</strong> I report a personal connection to this body. It must be stated in the first line of any email. The body has no relationship with the club today.</p></div>';
    if (p.flag) h += '<p class="small">' + esc(p.flag) + '</p>';
    h += '<dl class="fields">' +
      f('1. Name', esc(p.name)) +
      f('2. Website', val(p.website)) +
      f('3. Description', '<p>' + esc(p.type) + '. The document gives no longer description.</p>') +
      f('4. Why relevant (my view)', p.viewNote ? '<p>' + esc(p.viewNote) + '</p>' : '<p>' + miss() + '</p>') +
      f('5. Proposed collaboration', '<p>' + esc(p.purpose) + '</p>') +
      f('6. Partnership category', '<p>' + esc(p.type) + '. Access tier ' + esc(p.tier) + (tier ? ' (' + esc(tier.name) + '): ' + esc(tier.meaning) : '') + '. Template: ' + esc(p.template) + '.</p>') +
      f('7. What they could contribute', '<p>' + esc(p.purpose) + '</p>') +
      f('8. What the club could offer', offer) +
      f('9. Contact person (if public)', val(p.contactPerson)) +
      f('10. Verified email or phone', val([p.email, p.phone].filter(Boolean))) +
      f('11. LinkedIn or official contact page', val(p.contactPage)) +
      f('12. Source links', val(p.sources)) + '</dl>';
    var init = (p.named && p.named.length) ? 'Named in ' + p.named.join(', ') : (p.categoryInitiative ? 'Fits the category covered by ' + p.categoryInitiative + '; the document does not name this partner there' : 'No initiative names this partner');
    h += '<p class="small">Where it sits in the plan: ' + esc(init) + '. See the ' + a('outreach/implementation.html', 'implementation page') + '.</p>';
    h += '<p class="small">Nobody has been contacted. I claim no relationship with this organisation. Re-check the person\'s role and the route on the organisation\'s own page before any message.</p>';
    var idx = Pt.partners.indexOf(p);
    h += '<div class="pager">' + (idx > 0 ? '<a href="' + href('outreach/partner.html?id=' + Pt.partners[idx - 1].id) + '">&larr; ' + esc(Pt.partners[idx - 1].name) + '</a>' : '<span></span>') + (idx < Pt.partners.length - 1 ? '<a href="' + href('outreach/partner.html?id=' + Pt.partners[idx + 1].id) + '">' + esc(Pt.partners[idx + 1].name) + ' &rarr;</a>' : '<span></span>') + '</div>';
    return h;
  };

  R.outTemplates = function (site, S, src, Pt, T) {
    var h = head('Cold-email templates', 'Five drafts with a subject, body, follow-up and a copy button.');
    h += '<div class="box warn" role="alert"><h2>Do not send yet</h2><p><strong>' + esc(T.warning) + '</strong></p></div>';
    h += '<h2>Rules that apply to every template</h2>' + ul(T.rules);
    h += '<p class="small">The placeholder <code>[your confirmed role in the club]</code> is kept on purpose. I am an applicant and do not hold a role.</p><p id="copystatus" class="small" aria-live="polite"></p>';
    T.items.forEach(function (t, i) {
      var full = 'Subject: ' + t.subject + '\n\n' + t.body;
      h += '<article class="card" style="margin:1.2rem 0" id="' + esc(t.id) + '"><h2 style="margin-top:0;border:0">' + (i + 1) + '. ' + esc(t.name) + '</h2>' +
        '<p class="small"><strong>Use for:</strong> ' + esc(t.useFor) + ' | <strong>Route:</strong> ' + esc(t.route) + ' | <strong>One thing to get right:</strong> ' + esc(t.getRight) + '</p>' +
        '<p class="small muted">' + esc(t.source) + '</p>' +
        '<h3>Subject and body</h3><div class="mail" id="mail-' + t.id + '">' + esc(full) + '</div><p><button type="button" class="btn small" data-copy="mail-' + t.id + '">Copy email</button></p>' +
        '<h3>One follow-up (after four to seven working days, then stop)</h3><div class="mail" id="fu-' + t.id + '">' + esc(t.followUp) + '</div><p><button type="button" class="btn alt small" data-copy="fu-' + t.id + '">Copy follow-up</button></p></article>';
    });
    h += '<h2>The full template library named in the document</h2><p class="small">The document names these thirteen templates. Only the five above are drafted here.</p>' + table(['Template', 'Use for', 'Route', 'One thing to get right'], Pt.templateLibrary.map(function (x) { return [esc(x.template), esc(x.use), esc(x.route), esc(x.getRight)]; }), { cls: 'compact' });
    h += '<p class="small">Every template keeps a "before sending" caution: only send after the club can evidence the claim; use the official route; do not imply what has not been agreed; re-check the person\'s current role.</p>';
    return h;
  };

  R.outResearch = function (site, S, src) {
    var o = site.outreach, h = head('Research and verification', 'What I used, where it is from, and what is not verified.');
    h += '<h2>What this is based on</h2><ul><li>Working notes, plans and reference material gathered for the club. Partner facts are reproduced as reported.</li><li>Contact research dated 31 October 2026 and a read of the institute\'s clubs and committees pages on 1 November 2026, as the document records. I have not re-run either for this site.</li></ul>';
    h += '<h2>Sources named</h2>' + sourceList(src).replace(/<h3>[^<]*Evidence base[^<]*<\/h3>.*?<\/table><\/div>/, '');
    h += '<p>All sources are collected on the ' + a('about/sources.html', 'Sources page') + '.</p>';
    h += '<h2>Not verified</h2><div class="box warn">' + ul(o.notVerified) + '</div>';
    h += '<h2>Checks before any message goes out</h2>' + ol(['Use the faculty advisor\'s approval for the target, the event and the wording.', 'Re-check the person\'s current role and the programme\'s current terms on the organisation\'s own page.', 'Use only a published contact route. Never guess an email. Sales, technical support and hiring addresses are not partnership contacts.', 'Disclose any personal connection in the first line.', 'Promise nothing the club cannot evidence: no attendee data, exclusivity, internships, funding or fixed audience numbers.', 'Any company approach for Neural Fest goes through the Industrial Relations and Sponsorship Committee first.']);
    return h;
  };

  R.outImpl = function (site, S, src, Pt) {
    var h = head('Partnership implementation strategy', 'All 15 Outreach initiatives, the ladder, the first 30 days, the quarterly rhythm and how the two verticals interlock.');
    h += '<p class="small"><a href="#initiatives">Initiatives</a> | <a href="#ladder">Ladder</a> | <a href="#first30">First 30 days</a> | <a href="#quarterly">Quarterly rhythm</a> | <a href="#interlock">Interlock</a> | <a href="#roadmap">Roadmap</a> | <a href="#indicators">Indicators</a> | <a href="#roles">Roles</a></p>';
    h += '<h2 id="initiatives">Detailed initiatives V2-01 to V2-15</h2><p>Each follows the document\'s twelve-point template (identifier plus eleven fields). Priority ratings are my judgement.</p>' + Pt.initiatives.map(function (x) { return initiativeBlock(x); }).join('');
    h += '<h2 id="ladder">The partnership ladder</h2>' + table(['Stage', 'What it looks like', 'Entry condition'], Pt.ladder.map(function (x) { return [esc(x.stage), esc(x.looks), esc(x.entry)]; }), { cls: 'compact' });
    h += '<h2 id="first30">First 30 days</h2>' + table(['Week', 'Actions', 'Output'], Pt.first30.map(function (x) { return [esc(x.week), esc(x.actions), esc(x.output)]; }), { cls: 'compact', widths: ['12%', '68%', '20%'] });
    h += '<h2 id="quarterly">Quarterly rhythm</h2><p class="small">Added in synthesis: this is my own arrangement.</p>' + ul(Pt.quarterly);
    h += '<h2>Expected outcomes</h2>' + ul(Pt.outcomes);
    h += '<h2 id="indicators">Performance indicators</h2>' + table(['Indicator', 'Target', 'How tracked'], Pt.indicators.map(function (x) { return [esc(x.indicator), esc(x.target), esc(x.tracked)]; }), { cls: 'compact', widths: ['20%', '55%', '25%'] });
    h += '<h2 id="interlock">How Curation and Outreach interlock</h2><p class="small">Added in synthesis. Curation needs outside judges, mentors and problem statements. Outreach needs recaps and demonstrations that only Curation creates. The independence rule: the core 24 sessions never depend on an external partner.</p>' + table(['Curation event or need', 'Outreach contribution', 'Initiatives', 'Lead time'], Pt.interlock.map(function (x) { return [esc(x.need), esc(x.contribution), esc(x.initiatives), esc(x.lead)]; }), { cls: 'compact', widths: ['26%', '44%', '16%', '14%'] });
    h += '<h3>Coordination mechanisms</h3>' + ul(Pt.coordination);
    h += '<h2 id="roadmap">Roadmap: Outreach column</h2>' + table(['Period', 'Outreach and External Relations', 'Joint'], S.roadmap.map(function (r) { return [esc(r.period), esc(r.outreach), esc(r.joint)]; }), { cls: 'compact', widths: ['14%', '56%', '30%'] });
    h += '<h2 id="roles">Roles</h2><p class="small">Roles are functions, not headcount. I hold none of them.</p>' + table(['Role', 'Vertical', 'Main responsibilities', 'Initiatives'], Pt.roles.filter(function (x) { return x.vertical === '2' || x.vertical === 'Both'; }).map(function (x) { return [esc(x.role), esc(x.vertical), esc(x.duty), esc(x.initiatives)]; }), { cls: 'compact' });
    h += '<p>The Curation side is on the ' + a('curation/implementation.html', 'Curation implementation page') + '.</p>';
    return h;
  };

  R.about = function (site) {
    var A = site.about, h = head('About', 'Who I am, my status, what is reported and what is my view, and what is still open.');
    h += '<h2>Who I am</h2>' + para(A.who);
    h += '<h2>Applicant status</h2><div class="box"><p><strong>' + esc(A.status) + '</strong></p></div>';
    h += '<h2>Reported facts and my own judgement</h2><div class="grid two"><div class="card"><h3 style="margin-top:0">Reported, not independently re-verified</h3>' + ul(A.reported) + '</div><div class="card"><h3 style="margin-top:0">My view or assumption</h3>' + ul(A.mine) + '</div></div>';
    h += '<p class="small">The document labels the second list "Added in synthesis" or "assumption". Targets and budgets are my estimates.</p>';
    h += '<h2>Open items</h2><div class="box warn">' + ul(A.open) + '</div>';
    h += '<h2>Submission limitations</h2>' + ul(A.limits);
    h += '<h2>Counts as loaded on this site</h2>' + table(['Item', 'Count'], site.counts.map(function (c) { return [esc(c[0]), esc(c[1])]; }), { cls: 'compact', widths: ['40%', '60%'] });
    h += '<p>Document: The Neural Network Year Programme 2026-27, consolidated project proposal, dated ' + esc(site.docDate) + ', status "Proposal for review". Sources are on the ' + a('about/sources.html', 'Sources page') + '.</p>';
    return h;
  };

  R.sources = function (site, S, src) {
    var h = head('Sources', 'Every source the document names, in one place.');
    h += '<div class="box warn"><p>' + esc(src.note) + '</p></div>' + sourceList(src);
    return h;
  };

  /* ---------------- boot ---------------- */
  var NEED = {
    home: ['site'], curOverview: ['site', 'sessions'], curRoadmap: ['site', 'sessions'], curCalendar: ['site', 'sessions'],
    curSessions: ['site', 'sessions'], curSession: ['site', 'sessions'], curResearch: ['site', 'sessions', 'sources'],
    curRationale: ['site', 'sessions'], curImpl: ['site', 'sessions', 'partners'],
    outStrategy: ['site', 'sessions', 'partners'], outFirst: ['site', 'sessions', 'partners'],
    outPartners: ['site', 'sessions', 'partners'], outPartner: ['site', 'sessions', 'partners'],
    outTemplates: ['site', 'sessions', 'partners', 'templates'], outResearch: ['site', 'sessions', 'sources'],
    outImpl: ['site', 'sessions', 'partners'], about: ['site'], sources: ['site', 'sessions', 'sources']
  };
  var want = NEED[PAGE];
  if (!want || !R[PAGE]) { return; }
  Promise.all(want.map(load)).then(function (d) {
    var idx = {};
    want.forEach(function (n, i) { idx[n] = d[i]; });
    var site = idx.site, S = idx.sessions, src = idx.sources, Pt = idx.partners, T = idx.templates;
    MISSING = site.missing || MISSING;
    if (PAGE === 'curImpl') {
      site.plan.roles = Pt.roles.filter(function (x) { return x.vertical !== '2'; });
      site.plan.matrixHead = Pt.matrix[0];
      site.plan.matrixRows = Pt.matrix.slice(1);
    }
    app.innerHTML = R[PAGE](site, S, src, Pt, T);
    setTitle();
    if (PAGE === 'curCalendar') calendarInit(S);
    if (PAGE === 'outPartners') partnersInit(Pt);
    if (PAGE === 'outTemplates') wireCopy();
    var id = location.hash ? location.hash.slice(1) : '';
    var t = id ? document.getElementById(id) : null;
    if (t) { if (t.tagName === 'DETAILS') t.setAttribute('open', ''); t.scrollIntoView(); }
  }).catch(showError);
})();
