# Building the InEgypt website (Plan 47)

The new site is built with Eleventy from `src/` into `_site/`, in English and Arabic. **Nothing here is live yet**:
GitHub Pages still serves the hand-written `index.html`, `ar/`, `privacy.html`, `terms.html`, `support.html` at the
repo root until the relaunch (phase 8). `materials/` stays out of git (`.git/info/exclude`).

```sh
npm install            # once; exact versions are pinned in package.json
npm run sync           # copy privacy/terms + published knowledge atoms from the app repo (~/Desktop/InEgyptUI)
npm run images         # grade photos and size screens from materials/ → src/assets/img/ (slow: ~1.5 min)
npm run share          # rebuild the two link-preview images (src/assets/share/)
npm run build          # icons + fonts + Eleventy → _site/
npm run check          # contrast, banned claims, legal byte-equality, logical CSS, links/anchors/hreflang
npm run serve          # preview at http://localhost:8080/inegypt-pages/
```

## Where things are

| Where | What |
|---|---|
| `src/_data/facts.json` | The signed fact sheet. Every count, price and on/off switch comes from here (Arabic Siri phrases: `iphoneFeatures.siriPhrases.valueAr`) |
| `src/_data/factsAr.json` | Arabic for the English values in `facts.json` (languages, modes, dates…), keyed by the English text |
| `src/_data/atoms.json` | Published knowledge atoms from the app (`npm run sync`), with English and Arabic text; every price on the site comes from here |
| `src/_data/home/`, `features/`, `support.json`, `strings/` | Page copy, one file per language (`en`, `ar`) or an `ar` block inside |
| `src/_data/images.json` | Sizes of the built images (`npm run images`) |
| `src/_data/qr.js` | QR codes for every `web_…_qr` campaign found in the templates |
| `src/_includes/css/` | `tokens.css` (colours, type, space; every text pair is contrast-checked), `base.css`, `components.css`, `home.css`. Bundled and minified into `/assets/css/site.css` |
| `src/_includes/components/` | Nunjucks macros: `picture`/`device`/`ribbon`, `ticket`/`appbox`/`related`, `sign`, calls (badge, QR, share), guide helpers |
| `src/_includes/pages/` | Templates shared by the English and Arabic page (home, features, support, what's new) |
| `src/ar/` | The Arabic pages. Prose pages (about, press, guides) are separate files; keep them in step with the English one |
| `src/legal-pages.11ty.js` | `/privacy.html`, `/terms.html` = the app's bundled files byte for byte + footer (English only, on purpose) |
| `src/sitemap.njk`, `src/robots.njk` | `sitemap.xml` with hreflang alternates, `robots.txt` |
| `scripts/` | sync, icons, fonts, images, share cards and the five checks |
| `.github/workflows/pages.yml` | Build + check + publish, manual only until the relaunch |

## Two languages

Every page that exists in both languages declares the pair in its front matter: `altUrls: { en: "/x/", ar: "/ar/x/" }`.
That one line makes the hreflang tags, the sitemap alternates, the language switch, and the `localUrl` filter:
`{{ "/features/" | localUrl(lang) | url }}` goes to the Arabic page when it exists, otherwise to the English one.
Never hand-write `"/ar/…" if lang == "ar"` in shared templates. `npm run check` fails if a pair does not point both ways.

## Images

`picture(key, alt, sizes, load)`: `load` is `"lazy"` (default, below the fold), `"eager"` (above the fold) or `"high"`
(the one LCP image per page, normally the hero photo).

## Rules the checks enforce

- **Contrast** (`check-contrast`): every text/background token pair ≥ 4.5:1, UI shapes ≥ 3:1. Add new colours to `tokens.css`, not as hex in a component.
- **Claims** (`check-claims`): no feature the app does not have (live tracking, Android, Trip Pass…), in English and Arabic.
- **Legal** (`check-legal`): privacy and terms equal the app's bundled files.
- **Logical CSS** (`check-css-logical`): no left/right properties, so the Arabic page mirrors by itself.
- **Links** (`check-links`): every internal link and `#anchor` resolves, every hreflang pair is reciprocal, and no Arabic link is marked "(بالإنجليزية)" while pointing to an Arabic page.

The address lives in `facts.json` (`site.url` + `site.pathPrefix`); a domain later is a two-value change (§9.5).
App Store links go through the `appLink` filter; `pt` is added automatically once `app.campaignProviderId_pt` is set.
CSS and JS URLs carry `?v=<hash>` of their sources, so browsers can cache them for long.
