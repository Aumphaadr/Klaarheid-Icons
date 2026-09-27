<p align="center">
  <img src="docs/favicon.svg" width="64" height="64" alt="">
</p>

<h1 align="center">Klaarheid Icons</h1>

<p align="center">
  Precise open-source icons — <b>constructed, not traced</b>.<br>
  <!--count-->345<!--/count--> icons on a 24 grid with a 2&nbsp;px line, as filled outlines and as strokes.
</p>

<p align="center">
  <a href="https://aumphaadr.github.io/Klaarheid-Icons/"><b>Browse and download</b></a> ·
  <a href="#get-the-icons">Get the icons</a> ·
  <a href="#how-the-icons-are-built">How they are built</a> ·
  <a href="README.ru.md">По-русски</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT-0" src="https://img.shields.io/badge/license-MIT--0-275f9e"></a>
  <a href="https://github.com/Aumphaadr/Klaarheid-Icons/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Aumphaadr/Klaarheid-Icons/actions/workflows/ci.yml/badge.svg"></a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/icons-dark.svg">
  <img alt="All icons of the set" src="assets/icons-light.svg" width="100%">
</picture>

## Why “precise”

*Klaarheid* is Dutch for *clarity*. Every icon here is written down as geometry and computed, so nothing is
approximately right:

- **Constructed from primitives.** An icon is described in code as centerlines made of line segments and circular
  arcs on a 24 × 24 grid ([`src/icons.mjs`](src/icons.mjs)). The filled outline is computed from them — offset by ±1
  with round caps and joins, the parts merged — instead of being drawn by hand or traced from a picture.
- **Canonical curves.** A circle has four nodes on its axes with handles of 0.5523·r. Arcs are split at the axes.
  A line end is a true semicircle of three nodes. Horizontal and vertical edges sit on whole coordinates, so at
  24 px they land on pixels.
- **Symmetry that holds.** Icons meant to be symmetric match their mirror image to the sixth decimal place.
- **Checked on every build.** [`tools/check.mjs`](tools/check.mjs) finds curved “straight” lines, kinks, stray
  segments, non-canonical circles and uneven line ends; with Chrome at hand it also compares each outline with
  the line the browser draws from the stroke version.

## Get the icons

- **Site** — [aumphaadr.github.io/Klaarheid-Icons](https://aumphaadr.github.io/Klaarheid-Icons/): search in English
  and Russian, recolor, resize, inspect nodes and handles, download a single icon as SVG or PNG, or the whole pack
  as a ZIP (SVG, or PNG in any size and color).
- **Repository** — the files are in [`svg/fill`](svg/fill) and [`svg/stroke`](svg/stroke); copy them into your
  project.

### Two flavours

| | `svg/fill` — outline | `svg/stroke` — line |
|---|---|---|
| What is inside | one filled `<path>`: the precise outline | centerlines: `stroke-width="2"`, round caps and joins |
| Color | `fill="currentColor"` | `stroke="currentColor"` |
| Take it when | you need the exact shape: sprites, icon fonts, design tools | you like to style strokes with CSS, as with Lucide or Feather |

Both flavours render the same picture: the outline is computed from the line.

## Usage

```html
<!-- inline: the icon takes the color of the surrounding text -->
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" d="…"/>
</svg>

<!-- as an image -->
<img src="svg/fill/house.svg" width="24" height="24" alt="Home">
```

```css
/* as a mask, colored with background-color */
.icon-house {
  width: 24px;
  height: 24px;
  background-color: currentColor;
  mask: url(svg/fill/house.svg) center / contain no-repeat;
}
```

## How the icons are built

| Rule | Value |
|---|---|
| Grid | 24 × 24, the drawing keeps a 1-unit margin |
| Line | 2, round caps and joins; a thin 1.5 line only for small marks in tight spaces |
| Clearance | 2 between separate parts (1.5 around thin marks); parts that meet end on the neighbour’s centerline |
| Circles | 4 nodes on the axes, handles 0.5523·r |
| Arcs | split at the axes; a line end is two equal quarters; joins and fillets are equal pieces of up to 90° |
| Coordinates | horizontals and verticals on whole numbers |

The pipeline:

```
src/icons.mjs ──tools/build.mjs──▶ svg/stroke, svg/fill ──tools/check.mjs──▶ report
   (parts)       (src/geom.mjs)                          ──tools/site.mjs──▶ docs/ (site), assets/
```

## Development

Node.js 20 or newer; there are no dependencies.

```sh
npm run build          # svg/fill and svg/stroke from src/icons.mjs
npm run check          # geometry check, about a minute and a half
npm run check:pixels   # the same plus a pixel comparison in headless Chrome
npm run site           # docs/ (GitHub Pages) and the images in assets/
npm run serve          # preview docs/ at http://localhost:8080
```

| Path | What |
|---|---|
| `src/icons.mjs` | icon definitions — the single source |
| `src/geom.mjs` | geometry kernel: offsets of segments and arcs, joins, union, cutouts, canonical cubics |
| `src/meta.mjs` | catalog for the site: categories, Russian names, keywords |
| `svg/` | built icons (generated) |
| `tools/` | build, check, site and preview scripts |
| `site/` | the site page: `index.html`, `app.css`, `app.js`, fonts |
| `docs/` | the published site (generated) |

Adding or changing an icon is described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Requests

Missing an icon? [Open an issue](https://github.com/Aumphaadr/Klaarheid-Icons/issues/new?template=icon-request.md)
with what it should mean and where it will be used.

## Acknowledgements

The first icons were made for the author’s projects [Idyllium](https://github.com/Aumphaadr/Idyllium),
[SignoreBot](https://github.com/Aumphaadr/SignoreBot) and OOM. Compositions of many general-purpose icons follow the conventions of [Lucide](https://lucide.dev) and
[Feather](https://feathericons.com); no outlines were copied — each icon is constructed anew from primitives.

The site is set in [Onest](https://github.com/simpals/onest) and
[Source Code Pro](https://github.com/adobe-fonts/source-code-pro), both under the SIL Open Font License 1.1;
the font files and their licenses are in [`site/fonts`](site/fonts).

The geometry kernel and the icon definitions were written with Claude, an AI assistant by Anthropic, under the
author’s direction; every icon was reviewed by the author.

## License

[MIT No Attribution (MIT-0)](LICENSE) © 2026 Nathaniel Larsson — the MIT License without its only condition.
In short:

- free in personal and commercial, open and closed projects;
- no permission and no credit needed — not in your interface, on your site or in the credits;
- no conditions at all: you do not even have to ship the license text with the files;
- change the icons as you like, put them into your own sets and fonts;
- clean rights: every icon is constructed from scratch, no outlines were copied from other sets.

An unofficial Russian translation: [LICENSE_RU.md](LICENSE_RU.md).
