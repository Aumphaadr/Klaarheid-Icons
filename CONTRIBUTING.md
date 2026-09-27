# Contributing

Thank you for looking into Klaarheid Icons. The set is small and built by hand-written rules, so the most useful
contribution is usually an **icon request**: [open an issue](https://github.com/Aumphaadr/Klaarheid-Icons/issues/new?template=icon-request.md)
saying what the icon should mean, where it will be used, and which icons of other sets come close.

Contributions are accepted under the project license, [MIT-0](LICENSE).

## Adding or changing an icon

1. **Describe it in [`src/icons.mjs`](src/icons.mjs).** An icon is a list of parts on the 24 × 24 grid; paths are
   made with the kernel helpers from [`src/geom.mjs`](src/geom.mjs) — `line`, `polyline` (with fillets), `arc`,
   `circle`, `rect`, `chainPath`:
   - `{ stroke: path }` — a line of the main weight (2);
   - `{ stroke: path, thin: true }` — a thin line (1.5) for small marks in tight spaces;
   - `{ solid: path }` — a filled shape with the line around it;
   - `{ fill: path }` — a pure fill, no line;
   - `{ disk: [center, r] }`, `{ dot: center }` — filled circles;
   - `{ capsule: [a, b, r] }` — a thick line of constant width 2r.

   Angles follow SVG: 0° points right, 90° points down, a positive sweep runs clockwise on screen.
2. **Add it to the catalog [`src/meta.mjs`](src/meta.mjs)** — a category, a Russian name and a few keywords in
   English and Russian. The site build fails if an icon is missing from the catalog or listed twice.
3. **Build and check:**

   ```sh
   npm run build && npm run check && npm run site
   ```

   The check must report no issues. If Chrome is installed, `npm run check:pixels` also compares the outline with
   the line the browser draws.
4. **Look at it.** Open `docs/index.html` (or run `npm run serve`), find the icon and view it at 16, 20, 24 and
   32 px and in the *Nodes & handles* view. A clean check does not prove that an icon reads well.
5. **Commit the sources together with the generated files** — `svg/`, `docs/` and `assets/`. CI rebuilds everything
   and fails when the committed files are stale.

## Construction rules

- Grid 24 × 24; the drawing keeps a 1-unit margin.
- Main line 2 with round caps and joins; thin line 1.5 only for small marks inside tight shapes.
- Horizontals and verticals on whole coordinates.
- A clearance of 2 between separate parts (1.5 around thin marks). Parts that meet end on the centerline of their
  neighbour.
- Fillets are either sharp (0) or at least 1.25; a sharp acute corner stays sharp rather than getting a fillet that
  eats its sides.
- Circles are canonical; arcs are split at the axes and should not end closer than 5° to an axis.
- Names describe the picture, in kebab-case (`map-pin`, `file-plus`); filled variants end with `-fill`, crossed-out
  ones with `-off`.
