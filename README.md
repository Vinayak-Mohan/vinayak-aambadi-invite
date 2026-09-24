# Vinayak & Aambadi wedding invitation

Wedding invitation for 11 February 2027. The website lives in `docs/` and includes an image-tracked AR experience anchored to the printed card front.

- Planned invitation URL: `https://vinayak-mohan.github.io/vinayak-aambadi-invite/`
- AR URL encoded in the card QR: `https://vinayak-mohan.github.io/vinayak-aambadi-invite/ar.html`
- Printable card: `Vinayak-Aambadi-print-card.pdf` (two pages, 5 × 7 inches)

**Publication hold:** Keep this repository private and GitHub Pages disabled until Vinayak explicitly asks to make it public again. The planned URLs and printed QR currently lead to a 404 page; do not print a production batch while the site is offline.

All couple artwork in `docs/` is generated illustration; the original reference photos are not included in this repository or its history. The earlier working repository also remains private.

To review locally, serve `docs/` on localhost with `python -m http.server 8765 --directory docs`, then open `/index.html` and `/ar.html`. Camera access requires localhost or HTTPS. Test a physical printed card with Android Chrome and iPhone Safari before bulk printing; the AR tracker is compiled from the exact image in `docs/assets/card-front.png`.
