# Changelog

Notable changes of Klaarheid Icons. Version numbers are chosen by the author; until the first release,
everything gathers under *Unreleased*.

## Unreleased

### Added

- 345 icons in 17 categories on a 24 grid with a 2 px line, in two flavours: `svg/fill` — the precise outline as
  one filled path, and `svg/stroke` — centerlines with `stroke-width="2"`.
- The source of the icons (`src/icons.mjs`), the geometry kernel (`src/geom.mjs`) and the catalog with categories,
  Russian names and search keywords (`src/meta.mjs`).
- Tools: `build` (SVG from the source), `check` (geometry; `--pixels` also compares with Chrome), `site`.
- The site on GitHub Pages: Russian by default and English, categories in a sidebar, search, color and size, the
  nodes-and-handles view, SVG and PNG downloads, the whole pack as a ZIP; fonts Onest and Source Code Pro are
  served with the site (SIL Open Font License 1.1).
- License: MIT No Attribution (MIT-0) — free to use, no conditions, no credit required.
