# Vinayak & Aambadi wedding invitation

Wedding invitation for 11 February 2027. The website lives in `docs/` and includes an image-tracked AR experience anchored to the printed card front.

- Public invitation: `https://vinayak-mohan.github.io/vinayak-aambadi-invite/`
- AR page encoded in the card QR: `https://vinayak-mohan.github.io/vinayak-aambadi-invite/ar.html`
- Printable card: `Vinayak-Aambadi-print-card.pdf` (two pages, 5 × 7 inches)

The repository is private. The website and its files under `docs/` are publicly served if GitHub Pages is enabled. All couple artwork in `docs/` is generated illustration; the original reference photos are not included in this repository or its history.

To review locally, serve `docs/` on localhost with `python -m http.server 8765 --directory docs`, then open `/index.html` and `/ar.html`. Camera access requires localhost or HTTPS. Test a physical printed card with Android Chrome and iPhone Safari before bulk printing; the AR tracker is compiled from the exact image in `docs/assets/card-front.png`.
