# Cadence

This repository contains the Cadence music-discovery web app and its Android Trusted Web Activity (TWA) packaging configuration.

## Current state

- The app source is a single-file HTML app at `index.html`.
- A PWA manifest and service worker are included to enable installability and best-effort shell caching.
- Android packaging uses Bubblewrap and GitHub Actions.
- Website code updates go live when the site is redeployed; native wrapper changes require a new Android build.

## Setup

1. Deploy the repository to `https://cadence.edgeone.dev` (or update the host and icon URLs in `twa-manifest.json` for your chosen domain).
2. Verify these paths are reachable over HTTPS: `/`, `/manifest.webmanifest`, `/sw.js`, and `/icons/icon-512.png`.
3. Generate an Android signing keystore and keep an encrypted backup. Never commit it.
4. Add repository Actions secrets `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, and `KEY_PASSWORD`.
5. Run **Actions → Build Android (TWA) → Run workflow**.
6. Download the `cadence-android` artifact and test the APK on a physical Android device.
7. Update `.well-known/assetlinks.json` with the correct SHA-256 certificate fingerprint before expecting full-screen TWA verification. For Google Play installs, the Play app-signing certificate is normally the relevant fingerprint.

## Security and release notes

- No signing key or password belongs in git, build logs, or this README.
- The included Digital Asset Links file intentionally contains no fingerprint yet. Until the correct certificate is added, Android may show a Chrome Custom Tab toolbar.
- The first release is not considered production-verified until the live site, OAuth callback, install/update path, offline behavior, and GitHub Actions build are tested end to end.
- Do not change `packageId` after publishing to Google Play. Increment `appVersionCode` and `appVersion` for future native wrapper releases.

## Local preview

Serve the site through HTTP rather than opening it as a `file://` URL. For example, run `python -m http.server 8000` in the project folder and open `http://127.0.0.1:8000/`. Spotify authentication needs an exact registered redirect URI and should be validated on the deployed HTTPS origin.
