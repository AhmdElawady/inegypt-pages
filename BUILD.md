# Building the InEgypt website (Plan 47, phase 1)

The new site is built with Eleventy from `src/` into `_site/`. **Nothing here is live yet**: GitHub Pages still
serves the hand-written `index.html`, `ar/`, `privacy.html`, `terms.html`, `support.html` at the repo root until the
relaunch (phase 8). Do not commit `src/`, `scripts/` or the workflow before the owner decides how phase 1 is stored
(see the hand-off note); `materials/` stays out of git (`.git/info/exclude`).

```sh
npm install            # once; exact versions are pinned in package.json
npm run sync           # copy privacy/terms + published knowledge atoms from the app repo (~/Desktop/InEgyptUI)
npm run images         # grade photos and size screens from materials/ → src/assets/img/ (slow: ~1.5 min)
npm run build          # icons + fonts + Eleventy → _site/
npm run check          # contrast, banned claims, legal byte-equality, logical CSS
npx @11ty/eleventy --serve   # preview at http://localhost:8080/inegypt-pages/dev/
```

| Where | What |
|---|---|
| `src/_data/facts.json` | The signed fact sheet (v1). Every count, price and on/off switch comes from here |
| `src/_data/atoms.json` | Published knowledge atoms from the app (`npm run sync`); every price on the site comes from here |
| `src/_data/images.json` | Sizes of the built images (`npm run images`) |
| `src/_includes/css/` | `tokens.css` (§8.1–8.3), `base.css`, `components.css` |
| `src/_includes/components/` | Nunjucks macros for every §8.5 component |
| `src/dev/` | `/dev/type.html` (font specimen, owner gate D20), `/dev/components.html` and `-ar.html` (owner gate) |
| `src/legal-pages.11ty.js` | `/privacy.html`, `/terms.html` = the app's bundled files byte for byte + footer |
| `scripts/` | sync, icons, fonts, images and the four checks |
| `.github/workflows/pages.yml` | Build + publish, manual only until the relaunch |

The address lives in `facts.json` (`site.url` + `site.pathPrefix`); a domain later is a two-value change (§9.5).
App Store links go through the `appLink` filter; `pt` is added automatically once `app.campaignProviderId_pt` is set.
