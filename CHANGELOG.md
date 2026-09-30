# Changelog

Notable changes of Klaarheid Icons. Version numbers are chosen by the author; until the first release,
everything gathers under *Unreleased*.

## Unreleased

### Added

- 553 icons in 18 categories on a 24 grid with a 2 px line, in two flavours: `svg/fill` — the precise outline as
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
  `bell-ring`, `phone-call`, `mail-open`, `newspaper`, `languages`, `headset`; off states: `video` and `video-off`,
  `headphones-off`, `camera-off`, `monitor-off`, `phone-off`, `message-off`, `message-circle-off`, `smartphone-off`,
  `keyboard-off`, `server-off`, `cloud-off`, `map-pin-off`, `navigation-off`, `pencil-off`, `link-off`, `funnel-off`,
  `search-off`, `bookmark-off`, `flag-off`, `star-off`, `heart-off`, `shield-off`, `key-off`, `lightning-off`, `bulb-off`,
  `robot-off`, `image-off`, `calendar-off`, `stopwatch-off`; levels: `wifi-low`, `wifi-medium`, `signal`, `signal-high`,
  `signal-medium`, `signal-low`, `volume-low`, `progress-0`, `progress-25`, `progress-50`, `progress-75`, `progress-100`,
  `circle-quarter`, `circle-half`, `circle-three-quarters`, `hourglass-top`, `hourglass-half`, `hourglass-bottom`,
  `sun-dim`, `sun-medium`; statuses and news: `circle`, `circle-dashed`, `bell-dot`, `mail-dot`, `message-dot`,
  `message-circle-dot`, `phone-incoming`, `phone-outgoing`, `phone-missed`, `cloud-check`, `cloud-upload`,
  `cloud-download`; open and active: `package-open`, `door`, `door-open`, `panel-left-open`, `panel-left-close`,
  `panel-right-open`, `panel-right-close`, `bookmark-fill`, `flag-fill`, `pin-fill`, `thumbs-up-fill`,
  `thumbs-down-fill`, `bell-fill`; faces, dice and shields: `meh`, `laugh`, `dice-1` … `dice-6`, `shield-alert`,
  `shield-x`; weather: `cloud-sun`, `cloud-moon`, `cloud-fog`, `cloud-drizzle`, `cloud-hail`; filled with the mark cut
  out: `map-pin-fill`, `circle-check-fill`, `circle-x-fill`, `circle-alert-fill`, `circle-info-fill`,
  `circle-question-fill`, `circle-plus-fill`, `circle-minus-fill`, `circle-play-fill`, `circle-pause-fill`,
  `circle-stop-fill`, `square-check-fill`, `square-minus-fill`, `square-plus-fill`, `square-x-fill`, `badge-check-fill`,
  `shield-check-fill`, `shield-alert-fill`, `shield-x-fill`, `lock-fill`, `lock-open-fill`, `eye-fill`,
  `message-dots-fill`, `toggle-on-fill`; with a sign: `file-check`, `file-minus`, `file-search`, `folder-check`,
  `folder-minus`, `folder-x`, `folder-search`, `calendar-plus`, `calendar-check`, `calendar-x`, `calendar-minus`,
  `bookmark-plus`, `bookmark-check`, `bookmark-x`, `bookmark-minus`, `map-pin-plus`, `map-pin-check`, `map-pin-x`,
  `map-pin-minus`, `mail-plus`, `mail-check`, `mail-x`.
- Cut-outs in fills: `{ solid: path, holes: [parts] }` in the source cuts marks out of a filled shape. In `svg/fill` the
  outline gets holes; in `svg/stroke` the fill is one path with `fill-rule="evenodd"` and the exact edge of the holes,
  and the line around it is a second path.
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
- `progress` is drawn like the new `progress-0` … `progress-100`: a track with rounded corners and a solid bar,
  filled to two thirds.
