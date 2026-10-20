# Cadence v0.3 — TWA build and deployment notes

The repository's web app is hosted at **https://cadence.edgeone.dev/** through the existing EdgeOne Pages Git integration. The Android workflow builds a **Trusted Web Activity (TWA)** around that website; it does not build the separate Kotlin/Jetpack Compose project from Google AI Studio.

## v0.3 changes

- Launch splash and smoother in-app transitions.
- Reused/preloaded card artwork to reduce flicker while swiping.
- Credential-free taste export and complete local reset.
- Standalone/TWA mode separated from touch-mode behavior; viewport zoom stays enabled.
- Spotify refresh is single-flight, updates rotated refresh tokens, handles invalid refresh tokens, and has bounded 429 retries.
- Spotify OAuth callbacks fail closed if the stored state is missing, returned state is missing/mismatched, or the PKCE verifier is absent.
- Open Graph/Twitter preview images use absolute URLs.
- Service-worker cache version is `cadence-v11`.

## Deploy the website

EdgeOne Pages should remain connected to this repository. Its build command can copy the root files into `dist`:

```sh
mkdir -p dist && cp index.html manifest.webmanifest sw.js dist/ && cp -R icons .well-known dist/
```

Do not manually overwrite the live `/.well-known/assetlinks.json` with `assetlinks.example.json`. The live file is configured for package `dev.edgeone.cadence` and your actual signing certificate SHA-256 fingerprint.

After pushing to `main`, wait for EdgeOne to finish deploying the commit. Open https://cadence.edgeone.dev/ and test onboarding, swiping, preview playback, all five navigation screens, export/reset, and Spotify reconnect before running the Android workflow.

## Build the Android TWA

1. Confirm the GitHub Actions repository secrets exist: `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, and `KEY_PASSWORD`.
2. Open **Actions → Build Android (TWA) → Run workflow** and select `main`.
3. The workflow validates the live website assets and Digital Asset Links, then generates and signs the APK and Play Store AAB.
4. Download the `cadence-android` artifact when the run succeeds.

The TWA configuration is in `twa-manifest.json`, with package ID `dev.edgeone.cadence`, host `cadence.edgeone.dev`, and minimum Android SDK 24. Keep the package ID and signing keystore stable.

## Important limitations

- The web app plays catalogue preview clips where available; it is not a full-track streaming service.
- Spotify access depends on current Spotify developer-mode, account, scope, and API policy restrictions.
- Static validation is not a substitute for testing OAuth, audio, offline behavior, and app-link verification on a physical device.
