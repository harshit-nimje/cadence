# Cadence

Cadence is a music-discovery web app. The source of truth for the static site is this repository; production hosting remains on EdgeOne Pages at `https://cadence.edgeone.dev`.

## Architecture

- `index.html`: the existing Cadence app source, with PWA manifest linking and service-worker registration.
- `manifest.webmanifest`, `sw.js`, `icons/icon.svg`: PWA shell assets.
- `.well-known/assetlinks.json`: placeholder for Android Digital Asset Links. It must contain the real signing-certificate fingerprint before Android can verify the TWA as full screen.
- `twa-manifest.json`: Bubblewrap/Android TWA package configuration.
- `.github/workflows/deploy-edgeone.yml`: manually deploys only the site files to an existing EdgeOne Pages project.
- `.github/workflows/android.yml`: builds a signed Android APK and Play Store AAB on GitHub Actions after the deployed website and signing secrets are ready.

## Publish the website to the existing EdgeOne project

The existing live page is on EdgeOne Pages. A GitHub commit by itself does **not** update a separately uploaded EdgeOne project unless the project is connected to this repo or you deploy it.

1. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
2. Add `EDGEONE_API_TOKEN` using an API token from the EdgeOne console. Never commit the token or paste it into a chat.
3. Open **Actions → Deploy Cadence to EdgeOne Pages → Run workflow**.
4. Enter the **exact existing EdgeOne Pages project name** shown in the EdgeOne console, not `cadence.edgeone.dev` unless that is literally the project name. Check it carefully: EdgeOne's CLI may create a new project if the name does not already exist.
5. After deployment, check the live domain serves all of these successfully:
   - `https://cadence.edgeone.dev/`
   - `https://cadence.edgeone.dev/manifest.webmanifest`
   - `https://cadence.edgeone.dev/sw.js`
   - `https://cadence.edgeone.dev/icons/icon.svg`
   - `https://cadence.edgeone.dev/.well-known/assetlinks.json`

This workflow copies only static site files; it does not deploy Android configuration, workflow files, or the README to the website.

## Build Android

1. Make sure the website checks above succeed on the live EdgeOne domain first.
2. Create one Android signing keystore and keep an encrypted backup somewhere safe. Do **not** commit the keystore to GitHub.
3. Add these GitHub Actions repository secrets:
   - `ANDROID_KEYSTORE_BASE64`: base64-encoded keystore file
   - `KEYSTORE_PASSWORD`: keystore password
   - `KEY_PASSWORD`: key password (often the same password)
4. Open **Actions → Build Android (TWA) → Run workflow**.
5. Download the `cadence-android` artifact from a successful run. It should contain `app-release-signed.apk`, `app-release-bundle.aab`, and a SHA-256 checksum file.
6. Test the APK on a physical Android device before distributing it.

## Full-screen verification

The Android app needs Digital Asset Links at exactly `/.well-known/assetlinks.json` on the same live origin. The current file is an empty JSON array placeholder, so it does not yet verify the app. Replace it with the correct statement and SHA-256 signing-certificate fingerprint. If distributing through Google Play App Signing, use the **app-signing certificate fingerprint** for Play-installed builds, not an unrelated key fingerprint.

Until domain verification succeeds, Chrome may open the TWA in a Custom Tab with browser UI rather than full screen.

## Updates and versioning

- Website HTML/CSS/JS changes are published by deploying this static source to EdgeOne. The TWA loads the live website; users get web changes when their app next loads the site.
- Changes to native wrapper settings require a new Android build. Increment both `appVersion` and `appVersionCode` in `twa-manifest.json`; never change `packageId` after publishing to Google Play.
- Back up the signing keystore. Losing the signing key can disrupt future updates.

## Local preview

Serve the source over HTTP rather than opening `index.html` as a `file://` URL. For example, run `python -m http.server 8000` in the project folder and open `http://127.0.0.1:8000/`. Validate the Spotify redirect URI and user-management settings on the deployed HTTPS origin.
