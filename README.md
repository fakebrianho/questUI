# Quest UI Generator

Make game-style UI panels (quest journals, progression updates, item tooltips and more), edit every bit of text, and download them as transparent PNGs for video overlays.

## Run it

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

To build a static version you can host anywhere: `npm run build` (output goes to `dist/`).

## What's in it

**Layouts:** Quest journal, Quest complete, Quest progression, Item tooltip, Achievement toast, Level up

**Styles:** Old wood, Parchment, 8-bit, Arcane, Sci-fi HUD, Clean. Every layout works with every style.

**Editing**
- All text is editable. Use `**double stars**` to highlight words and `*single stars*` for italics.
- Lists: tick the box to mark a requirement done (green) or leave it unticked (red). Press Enter in a line to add a new one below it; reorder with the arrows.
- Icons: type an emoji, or upload your own image.
- Look: width, text size, accent colour and opacity.

**Exporting**
- Download PNG at 1x to 4x. Use 2x or higher for 1080p/4K video.
- Background: transparent (best for overlays), green screen, or black.
- Copy puts the image straight on your clipboard (Chrome/Edge).
- The preview backgrounds (Transparent, Dark, Light, Green screen, Sample video) are only for previewing; they don't affect the export.

**Presets:** Save preset downloads a .json of the current panel; Load preset brings it back. Your work also autosaves in the browser.

## Adding your own

- New layout: add an entry to `templates` in `src/templates.js` (a list of fields and a `render()` that returns HTML using the shared `ui-*` classes).
- New style: add a `.theme-yourname { ... }` block in `src/themes.css` (set the CSS variables at the top of any existing theme) and list it in `themes` in `src/templates.js`.
