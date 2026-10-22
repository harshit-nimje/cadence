# Cadence v1.1.0 — deployment and Android TWA notes

Cadence is hosted at **https://cadence.edgeone.dev/** by the existing EdgeOne Pages Git integration. The Android workflow packages a **Trusted Web Activity (TWA)** around that hosted site; it is not a native Kotlin/Jetpack Compose app.

## v1.1.0 highlights

- Mini-player controls remain available while browsing other tabs, with playback paused when the app leaves the foreground.
- Swipe up to open the exact track on Spotify without recording a like/dislike; the pending track survives a refresh.
- The taste-confidence meter detects a shift in recent listening patterns.
- Google account sign-in and cross-device taste-profile sync are available through the configured Supabase project.
- Export omits Spotify credentials; reset clears local OAuth state and the cloud profile.
- Spotify refresh/reconnect handling, OAuth state validation, bounded state storage, and service-worker cache behavior are hardened.
- The app source is split into `index.html`, `app.css`, `core.js`, and `extras.js`; automated tests cover core recommendation and token-refresh behavior.

## Website deployment

1. Push the site files to `main`. EdgeOne Pages deploys from its existing GitHub connection; no separate API-token deployment workflow is required.
2. Wait for EdgeOne's Git deployment to finish, then open https://cadence.edgeone.dev/.
3. Verify the `1.1.0` build marker, five navigation tabs, mood generation, mini player, swipe gestures, Spotify reconnect, Google sign-in, export/reset, and mobile layout.
4. Run `node --test tests/cadence.test.js` and `node --check core.js && node --check extras.js`. These are useful automated checks, not a substitute for live-device OAuth/audio testing.

The app's service-worker shell includes the HTML, CSS, core scripts, manifest, and icons. Run `node stamp.js` before a manually assembled deployment to derive the cache version from shell contents.

## Android TWA build

1. Repository Actions secrets must include `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, and `KEY_PASSWORD`. Never commit or paste these secrets into chat.
2. A push to `main` starts **Build Android (TWA)** automatically. The workflow waits for the EdgeOne deployment, validates the live manifest, icons and Digital Asset Links, then creates a signed APK and Play Store AAB.
3. Download the `cadence-android` artifact from the successful workflow run. It includes `app-release-signed.apk`, `app-release-bundle.aab`, and `SHA256SUMS.txt`.

Keep package ID `dev.edgeone.cadence`, the production host, and the signing key stable. The live `/.well-known/assetlinks.json` must match the package ID and SHA-256 fingerprint in `twa-manifest.json`; never replace it with `assetlinks.example.json`.

## Known limits

- Preview audio availability depends on the catalogue source; Cadence is not a full-track streaming service by itself. Swipe-up opens Spotify for full-track playback when the exact track can be resolved.
- Spotify API access is subject to current account eligibility, developer-mode restrictions, scopes, and policy.
- Automated tests do not cover every live OAuth, playlist-save, playback, offline, or Digital Asset Links path. Test those on a real Android device before distributing broadly.
