# Changelog

Notable changes of Klaarheid Icons. Version numbers are chosen by the author; until the first release,
everything gathers under *Unreleased*.

## Unreleased

### Added

- 417 icons in 18 categories on a 24 grid with a 2 px line, in two flavours: `svg/fill` — the precise outline as
  one filled path, and `svg/stroke` — centerlines with `stroke-width="2"`. Added after the first publication:
  `grip-horizontal`; `mouse`, `mouse-left`, `mouse-right`, `mouse-middle`; `sailboat`, `ship`, `submarine`;
  `euro-sign`, `pound-sign`, `yen-sign`, `ruble-sign`, `rupee-sign`; `user-off`; `file-video`; `divide`;
  text and layout: `bold`, `italic`, `underline`, `strikethrough`, `list`, `list-checks`, `quote`, `code`, `grid`,
  `layout`, `columns`, `rows`, `sliders`; the new category «Погода и природа» (Weather & nature, `sun` and `moon`
  moved there, «Предметы и природа» became «Предметы» / Objects): `cloud`, `cloud-rain`, `cloud-snow`,
  `cloud-lightning`, `wind`, `snowflake`, `droplet`, `umbrella`, `thermometer`, `sunrise`, `sunset`, `flame`,
  `leaf`, `tree`, `tree-pine`, `paw-print`; devices: `wifi`, `wifi-off`, `bluetooth`, `cast`, `laptop`, `tablet`,
  `smartphone`, `watch`, `keyboard`, `speaker`, `cpu`, `hard-drive`, `battery`, `battery-low`, `battery-medium`,
  `battery-full`, `battery-charging`; people and communication: `user-cog`, `contact`, `hand`, `accessibility`,
  `bell-ring`, `phone-call`, `mail-open`, `newspaper`, `languages`, `headset`.
- The source of the icons (`src/icons.mjs`), the geometry kernel (`src/geom.mjs`) and the catalog with categories,
  Russian names and search keywords (`src/meta.mjs`).
- Tools: `build` (SVG from the source), `check` (geometry; `--pixels` also compares with Chrome), `site`.
- The site on GitHub Pages: Russian by default and English, categories in a sidebar, search, color and size, the
  nodes-and-handles view, SVG and PNG downloads, the whole pack as a ZIP; fonts Onest and Source Code Pro are
  served with the site (SIL Open Font License 1.1).
- License: MIT No Attribution (MIT-0) — free to use, no conditions, no credit required.

### Changed

- Redrawn after the first publication: 121 icons got new drawings of their own — `activity`, `aperture`, `archive`,
  `arrow-down-to-line`, `arrow-left-right`, `arrow-up-down`, `at-sign`, `banknote`, `book`, `bookmark`, `book-open`,
  `building`, `calculator`, `circle-user`, `clipboard`, `clipboard-image`, `clipboard-list`, `clipboard-paste`,
  `clock`, `coffee`, `columns`, `command`, `compass`, `corner-down-left`, `corner-down-right`, `credit-card`, `crop`,
  `crosshair`, `cube`, `database`, `dollar-sign`, `download`, `expand`, `eye`, `eye-off`, `file`, `file-archive`,
  `file-code`, `file-database`, `file-font`, `file-image`, `file-info`, `file-json`, `file-music`, `file-plus`,
  `files`, `file-spreadsheet`, `file-text`, `file-video`, `file-x`, `folder`, `folder-down`, `folder-open`,
  `folder-plus`, `forward`, `frown`, `git-branch`, `git-merge`, `globe`, `grid`, `headphones`, `heart`, `heart-fill`,
  `heart-half`, `history`, `layers`, `layout`, `life-buoy`, `log-in`, `log-out`, `magnet`, `mail`, `map`, `map-pin`,
  `mic`, `mic-off`, `monitor`, `moon`, `move`, `music`, `navigation`, `panel-left`, `panel-right`, `paperclip`,
  `phone`, `piggy-bank`, `printer`, `puzzle`, `radio`, `redo`, `repeat`, `reply`, `rotate-ccw`, `rotate-cw`, `rows`,
  `rss`, `rupee-sign`, `save`, `scan`, `send`, `share`, `smile`, `snowflake`, `square-function`, `square-number`,
  `sun`, `tag`, `target`, `textarea`, `thumbs-down`, `thumbs-up`, `ticket`, `toggle-off`, `toggle-on`,
  `trending-down`, `trending-up`, `truck`, `turtle`, `undo`, `upload`, `window`. Every icon is covered by MIT-0 only;
  the notice about icons that coincided with other sets is gone.
