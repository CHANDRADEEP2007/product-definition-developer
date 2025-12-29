# product-definition-developer

## GitHub Pages deployment

This repo ships a static UI. Enable GitHub Pages to publish the default branch
(`main` or `work`):

1. In GitHub, open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or `work` (or run the workflow manually) to deploy the UI.

The workflow is defined in `.github/workflows/pages.yml` and publishes the root
directory so `index.html`, `styles.css`, and `app.js` are served as the showcase.
