# The Neural Network: Year Programme 2026-27 (applicant submission)

A plain HTML, CSS and JavaScript website for my Round 2 recruitment submission to The Neural Network, the AI club at IIM Sirmaur. It has no build step, no framework, no tracking, no external fonts or scripts and no forms.

**Status:** applicant, Round 2 recruitment. I am not a member of the club. This is not an official club site.

## Folders

```
index.html            Home
curation/             Curation & Research pages (overview, roadmap, calendar, sessions, research, rationale, implementation)
outreach/             Outreach & External Relations pages (strategy, first wave, partners, templates, research, implementation)
about/                About and Sources
assets/css/style.css  One stylesheet for the whole site
assets/js/main.js     Builds each page from the JSON files, runs the search and filters, and the copy buttons
data/                 All content, in JSON (see below)
tools/make_pages.py   Optional: rewrites the shared header, navigation and footer of every page
```

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `neural-network-submission`) and upload everything in this folder to its root. The file `index.html` must be at the top level.
2. Open the repository, then **Settings**, then **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**, then **Save**.
5. Wait a minute or two. The site appears at `https://<your-username>.github.io/<repository-name>/`.

All links are relative, so the site works on a project page without any change.

## Look at it on your own computer

The pages read their content from `data/*.json`. Browsers block that when a page is opened straight from a folder, so serve the folder instead:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## How to edit the content

Everything you read on the site is in `data/`. Edit the JSON, save, and reload the page. Keep the quotation marks and commas as they are. If a file stops loading, paste it into any JSON checker.

| File | What it holds |
| --- | --- |
| `site.json` | Status bar and footer text, home page text, About page (reported facts, my view, open items, limits), Curation overview and rationale, research notes, Outreach strategy text, counts, and the shared plan tables (objectives, principles, risks, dashboard) |
| `sessions.json` | The 4 terms, all 24 sessions, the five full session pages (`runsheets`), the roadmap, points and levels, resources, indicators, and the 16 Curation initiatives |
| `partners.json` | Access tiers, all 44 partner rows, first-wave details, the ladder, the first 30 days, value exchange, the template library, the interlock table, roles, and the 15 Outreach initiatives |
| `templates.json` | The five email templates (subject, body, follow-up) and the "do not send yet" warning |
| `sources.json` | Every source, with a `url` |

### Fill in a gap

Wherever a field is empty (`null`), the page shows **Not yet loaded from my workbook**. To fill it, put a value in.

- **A link for a source:** in `sources.json`, change `"url": null` to `"url": "https://..."`.
- **A partner's details:** in `partners.json`, each partner has `website`, `description`, `contactPerson`, `email`, `phone`, `contactPage` and `sources`. Set only what a workbook or the organisation's own page shows. Use the exact words `form only`, `phone only` or `none found` where those apply. Never guess an email. A value that starts with `http` becomes a link.
- **A session's missing field:** in `sessions.json`, open `runsheets`, then the session number, and set `objective` or `budget`. For the calendar, edit `target` or `buildsOn` on the session itself.
- **Add or change a partner:** copy one object in the `partners` list. Keep `id` unique and in order. `tierNum` is the digit of `tier`; `firstWave` is `true` only for Tier 1.

### Change the navigation or footer

The shared header, navigation and footer are written into each HTML page. To change them, edit the lists at the top of `tools/make_pages.py` (or the footer text in `data/site.json`) and run:

```
python3 tools/make_pages.py
```

## Rules this site follows

- Content comes only from my project document. Nothing from any other applicant.
- A missing field is shown as missing. Nothing is invented: no partners, contacts, statistics, achievements, testimonials or dates.
- Contact details appear only as a workbook or the organisation shows them. No email is guessed.
- Nobody has been contacted. No relationship with any organisation is claimed.
- "Reported" facts and "my view or assumption" are kept apart. Targets and budgets are my estimates.
- Do not send any email template until my role in the club is confirmed and a faculty advisor agrees.
