# swallowbirdcircle — Design Your Own Charm
🌐 Live site at: https://solaya0224-shop.github.io/beadbuilder/

A one-page, no-login tool for swallowbirdcircle customers: pick bead colors from
the shop's actual palette photo, fill in a front-wing charm template bead-by-bead
(row by row, matching the real bead counts), then download the finished design
as a picture to send in with an Etsy order. There's also a "random colors" button
next to the palette, just for fun/inspiration if someone's stuck.

Built plain — just HTML, CSS, and JavaScript.
The site uses **Bitcount Grid Double**, a free pixel-style font from Google
Fonts. 

What's in this folder

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

Browser support

Built with plain, modern JavaScript (no build tools). Works in current
Chrome, Safari, Firefox, and Edge, on both desktop and mobile. The
confetti and sound effects are generated in-browser (canvas + Web Audio),
so there are no external assets to break or go missing.
