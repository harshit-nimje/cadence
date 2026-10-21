# Changelog

## [1.0.1] — 2026-10-21

### Updated
- Replaced the repository's older `index.html` with the supplied 1.0.1 app build (267.6 KB; 2,991 lines).
- Added an explicit `app-version=1.0.1` marker to the web app.
- Advanced the service-worker cache from `cadence-v11` to `cadence-v22` so clients receive a fresh cache after deployment.
- Updated the Android Trusted Web Activity manifest to version `1.0.1` and version code `2`.

### Deployment reliability
- Fixed the EdgeOne deployment workflow to copy all icon assets rather than only the SVG and 192px icon.
- Added deployment-time checks for the 96px, Apple touch, 512px, and maskable icons referenced by the app/manifest.

### Verification
- All 13 inline JavaScript blocks in the supplied HTML passed Node.js syntax checks.
- Manual visual, interaction, Spotify OAuth, Supabase, offline-mode, and Android device tests remain outstanding; syntax validation alone does not establish end-to-end correctness.
