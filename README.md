# Nynorsk-omsetjar

A simple, Google Translate-inspired web UI for translating between Norwegian **Bokmål** and **Nynorsk**, powered by the open-source [Apertium](https://apertium.org) machine-translation platform.

Built as a promotional tool for [sanderwestnes.com](https://sanderwestnes.com) — professional human translation services.

## Features

- Clean two-panel UI with automatic, debounced translation as you type
- One-click language swap
- Copy-to-clipboard, character counter, `Ctrl/Cmd + Enter` to translate immediately
- Dark mode (follows system preference)
- Fully responsive
- No build step, no backend — pure static HTML/CSS/JS

## How it works

The page calls the public [Apertium APY](https://wiki.apertium.org/wiki/Apertium-apy) endpoint
`https://beta.apertium.org/apy/translate` directly from the browser, using the
`nob|nno` and `nno|nob` language pairs.

No user data is stored or proxied — requests go straight from the visitor's browser to the Apertium API.

## Running locally

No build step required. Just open `index.html` in a browser, or serve the folder:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages → Build and deployment → Source: `Deploy from a branch` → `main` / `/ (root)`**.
3. Your site will be live at `https://<username>.github.io/<repo>/` within a minute.

To use a custom subdomain (e.g. `translate.sanderwestnes.com`):
- Add a `CNAME` file at the repo root containing the subdomain.
- Add a `CNAME` DNS record on `sanderwestnes.com` pointing `translate` to `<username>.github.io`.

## Credits

- Translation engine: [Apertium](https://apertium.org) (GNU GPL)
- Not officially affiliated with the Apertium project.

## License

MIT — see [LICENSE](LICENSE).
