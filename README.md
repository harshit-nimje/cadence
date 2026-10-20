# Cadence

Cadence is a music-discovery web app with an Android Trusted Web Activity (TWA) wrapper. Production hosting remains on EdgeOne Pages at https://cadence.edgeone.dev.

## Source files

- `index.html`: the existing single-page app.
- `manifest.webmanifest`, `sw.js`: PWA manifest and app-shell service worker.
- `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`: app icons.
- `.well-known/assetlinks.json`: Android Digital Asset Links statement for package `dev.edgeone.cadence`.
- `twa-manifest.json`: Bubblewrap configuration for the Android wrapper.
- `.github/workflows/validate.yml`: checks app files, manifest fields, icon sizes, minimum Android SDK and certificate matching on each push.
- `.github/workflows/android.yml`: builds a signed APK and Play Store AAB using GitHub Actions.

## Production site deployment

The existing EdgeOne Pages project `cadence` is connected to this GitHub repository. Keep that connection as the primary deployment route. Its build settings should use repository root `.`, output directory `dist`, and this build command:

```sh
mkdir -p dist && cp index.html manifest.webmanifest sw.js dist/ && cp -R icons .well-known dist/
```

After GitHub commits deploy, check the EdgeOne deployment history. The Android build workflow verifies the live site files, including the 192px and 512px icons and `/.well-known/assetlinks.json`, before generating the app.

The separate `.github/workflows/deploy-edgeone.yml` is an optional manual fallback and is **not needed** while the native EdgeOne Git integration is active. Do not run it unless you intentionally configure its `EDGEONE_API_TOKEN` secret and verify the exact existing EdgeOne project name first.

## Build the Android app

1. Keep the signing keystore backed up securely. **Never commit it to this repository or share it in chat.**
2. In GitHub repository settings, configure these Actions secrets:
   - `ANDROID_KEYSTORE_BASE64`: Base64 representation of the `cadence-upload.jks` keystore.
   - `KEYSTORE_PASSWORD`: keystore password.
   - `KEY_PASSWORD`: key password for alias `android`.
3. Open **Actions → Build Android (TWA) → Run workflow**, select `main`, then run.
4. When successful, download the `cadence-android` artifact. It contains `app-release-signed.apk`, `app-release-bundle.aab`, and `SHA256SUMS.txt`.
5. Install and test the APK on a physical Android device before sharing it.

The TWA's minimum Android SDK is 24 because the Android Browser Helper dependency used by the generated project requires API 24 or newer.

## Full-screen verification and Google Play

The `assetlinks.json` statement and `twa-manifest.json` currently reference the local Android upload/signing certificate fingerprint. This enables full-screen verification for an APK signed with that key, assuming the latest site deployment is live and Chrome can fetch the statement.

If publishing through Google Play App Signing, add the **App signing key certificate SHA-256 fingerprint shown by Play Console** to `assetlinks.json` as an additional fingerprint for the same package. Google Play re-signs the app with the Play app-signing key, which may be different from the upload key used to submit the AAB.

If Digital Asset Links verification fails, Chrome may display browser UI around the TWA rather than showing it full screen. Do not change `packageId` after publishing to Google Play.

## Versioning and updates

- Website HTML/CSS/JS changes go live through the existing EdgeOne Git integration. The TWA loads the live website, so many web changes do not require a new Android package.
- Native wrapper changes require another Android build. Increment both `appVersion` and `appVersionCode` in `twa-manifest.json` for each release.
- Keep multiple secure backups of the signing keystore. Losing it can disrupt future app updates.

## Local preview

Serve the source over HTTP instead of opening the HTML file directly, for example:

```sh
python -m http.server 8000
```

Then open http://127.0.0.1:8000/ in a browser. Confirm Spotify OAuth redirect and related provider settings use the deployed HTTPS origin.
