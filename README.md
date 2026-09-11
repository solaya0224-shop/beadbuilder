# swallowbirdcircle — Design Your Own Charm

A one-page, no-login tool for swallowbirdcircle customers: pick bead colors from
the shop's actual palette photo, fill in a front-wing charm template bead-by-bead
(row by row, matching the real bead counts), then download the finished design
as a picture to send in with an Etsy order. There's also a "random colors" button
next to the palette, just for fun/inspiration if someone's stuck.

Built plain — just HTML, CSS, and JavaScript. No build step, no framework,
no paid hosting required.

## What's in this folder

```
swallowbirdcircle-site/
├── index.html          the whole page (logo + bead photo are baked in directly)
├── style.css            all styling (checkered banner, pixel-style type, etc.)
├── script.js             the interactive logic (color picking, grid, confetti, sound)
├── assets/
│   ├── bead_palette.jpg  source copy of the bead tray photo (kept for reference)
│   └── logo_small.jpg    source copy of the shop logo (kept for reference)
└── README.md              this file
```

**Important:** the live site does not actually load `assets/bead_palette.jpg`
or `assets/logo_small.jpg` from disk — both images are baked directly into
`index.html` as data (this is what fixed the "photo not showing" issue, which
was caused by the browser not finding the image file at that path once
hosted). The copies in `assets/` are kept only as originals you can go back
to if you want to swap either image later — see below.

## Hosting it for free on GitHub Pages

1. Create a new **public** repository on your GitHub account (e.g. `swallowbirdcircle-design-tool`).
2. Upload every file in this folder into the repository, keeping the `assets` folder as a folder (don't flatten it).
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to "Deploy from a branch."
5. Set **Branch** to `main` and the folder to `/ (root)`, then **Save**.
6. GitHub will give you a live link, usually:
   `https://<your-username>.github.io/<repo-name>/`
   It can take a minute or two to go live the first time.
7. That link is what you'll put in your Etsy listing (see `ETSY_LISTING_TEXT.md`).

You don't need to touch any code to host it — steps 1–6 are all done through
GitHub's website.

## Updating an existing repo with new files (what you'll do most often)

Once your repo already exists and is hosted, updating it just means replacing
files with new versions:

1. Go to your repository on github.com.
2. Click into the file you want to replace (e.g. `index.html`).
3. Click the pencil/edit icon, delete the old content, paste in the new
   content, then scroll down and click **Commit changes**.
   — or —
   From the repo's main page, click **Add file → Upload files**, drag the
   new version of the file in (it will overwrite the old one by name), and
   click **Commit changes**.
4. GitHub Pages automatically redeploys within a minute or two of any commit
   — no separate "publish" step.

For this update, just re-upload `index.html`, `style.css`, and `script.js`
(all three changed). You don't need to touch `README.md`, `ETSY_LISTING_TEXT.md`,
or the `assets` folder unless you want to.

## Swapping in a different logo or bead photo later

Since both images are baked into `index.html` as data rather than loaded as
separate files, swapping them means regenerating that data. The easiest way:
save your new image, then ask me (Claude) to re-embed it for you and give you
an updated `index.html` — just re-upload the one file afterward. If you'd
rather do it yourself: convert the image to "base64" (there are free online
converters — search "image to base64"), then in `index.html` find the
`src="data:image/jpeg;base64,...."` for the logo or bead photo and replace
everything between the quotes with your new base64 text.

## Changing the front wing layout

The bead layout is defined near the top of `script.js` as `WING_ROWS` — a
list of rows from top to bottom, each with a bead `count`, how many fixed
`wheels` sit on either side (0 or 2), and a `label` shown next to that row.
To change the shape, add/remove rows or change these numbers — no other code
needs to change.

## A note on the font

The site uses **Bitcount Grid Double**, a free pixel-style font from Google
Fonts, for headings and buttons — it's loaded straight from Google's font
CDN in `index.html`, so there's nothing to install. Body text uses your
system's regular font for easier reading at small sizes.

## Browser support

Built with plain, modern JavaScript (no build tools). Works in current
Chrome, Safari, Firefox, and Edge, on both desktop and mobile. The
confetti and sound effects are generated in-browser (canvas + Web Audio),
so there are no external assets to break or go missing.
