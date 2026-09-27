# Changelog

Notable changes of Klaarheid Icons. Version numbers are chosen by the author; until the first release,
everything gathers under *Unreleased*.

## Unreleased

### Added

- 407 icons in 18 categories on a 24 grid with a 2 px line, in two flavours: `svg/fill` — the precise outline as
  one filled path, and `svg/stroke` — centerlines with `stroke-width="2"`. Added after the first publication:
  `grip-horizontal`; `mouse`, `mouse-left`, `mouse-right`, `mouse-middle`; `sailboat`, `ship`, `submarine`;
  `euro-sign`, `pound-sign`, `yen-sign`, `ruble-sign`, `rupee-sign`; `user-off`; `file-video`; `divide`;
  text and layout: `bold`, `italic`, `underline`, `strikethrough`, `list`, `list-checks`, `quote`, `code`, `grid`,
  `layout`, `columns`, `rows`, `sliders`; the new category «Погода и природа» (Weather & nature, `sun` and `moon`
  moved there, «Предметы и природа» became «Предметы» / Objects): `cloud`, `cloud-rain`, `cloud-snow`,
  `cloud-lightning`, `wind`, `snowflake`, `droplet`, `umbrella`, `thermometer`, `sunrise`, `sunset`, `flame`,
  `leaf`, `tree`, `tree-pine`, `paw-print`; devices: `wifi`, `wifi-off`, `bluetooth`, `cast`, `laptop`, `tablet`,
  `smartphone`, `watch`, `keyboard`, `speaker`, `cpu`, `hard-drive`, `battery`, `battery-low`, `battery-medium`,
  `battery-full`, `battery-charging`.
- The source of the icons (`src/icons.mjs`), the geometry kernel (`src/geom.mjs`) and the catalog with categories,
  Russian names and search keywords (`src/meta.mjs`).
- Tools: `build` (SVG from the source), `check` (geometry; `--pixels` also compares with Chrome), `site`.
- The site on GitHub Pages: Russian by default and English, categories in a sidebar, search, color and size, the
  nodes-and-handles view, SVG and PNG downloads, the whole pack as a ZIP; fonts Onest and Source Code Pro are
  served with the site (SIL Open Font License 1.1).
- License: MIT No Attribution (MIT-0) — free to use, no conditions, no credit required.
- A footnote to the license: a comparison with every icon of Lucide and Tabler Icons found icons whose drawings
  coincide with theirs (mostly elementary signs such as a plus, chevrons and arrows). They are listed in
  `src/third-party.mjs` and `THIRD-PARTY-NOTICES.md` together with the Lucide license (ISC) and the Tabler license (MIT),
  which cover them as well; the site marks them on their cards, and the pack archive carries the notice.
