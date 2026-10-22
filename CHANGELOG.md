# Changelog

Notable user-facing changes are recorded here for each release.

## [1.1.0] — 2026-10-22

### Added
- **Mini player across tabs:** current artwork and play/pause controls remain available outside Swipe, without interrupting playback when returning to the deck.
- **Play the full track on Spotify:** swipe a card upward to open the exact Spotify track when resolvable, with search fallback when no direct track link is available. This action does not record a taste vote, and the pending track survives a refresh.
- **Google sign-in and taste sync:** sign in through the configured Supabase project and sync the profile across devices.
- **Mood playlists:** describe a feeling or choose a quick prompt to get a personalized set of tracks, with animated mood visuals and staggered results.

### Improved
- **Taste-confidence phase shifts:** the confidence indicator responds when recent listening differs from the established profile, then recovers as the new pattern settles.
- **Mobile navigation and layout:** the mini player fits alongside the navigation dock on narrow screens; the active tab label adapts to available width.
- **Swipe experience:** clearer play-on-Spotify feedback, a more legible Spotify mark, a single-row header, and the archetype strip placed closer to the current card.
- **Playback behavior:** no background playback when the app is hidden; returning to Swipe no longer needlessly restarts the current track. Pull-to-refresh is disabled in the swipe surface.
- **Spotify reliability:** expired sessions prompt reconnect, refresh requests are single-flight, rate limits respect `Retry-After`, and OAuth callback state is validated and consumed safely.
- **Taste-data handling:** exports exclude Spotify credentials; reset clears local OAuth remnants and cloud profile state; profile sync prefers the newer `updatedAt` record.
- **Recommendation efficiency:** bounded state collections, constant-time seen-track lookup, cleaner imports, metadata-aware card refresh, and fewer unnecessary UI updates.
- **Accessibility and usability:** browser zoom remains enabled, installed-app setup guidance is shown in the appropriate context, and reduced-motion preferences are respected.

### Engineering and quality
- Source is organized into `index.html`, `app.css`, `core.js`, and `extras.js` for easier maintenance.
- Added automated tests for taste updates, recommendation scoring, state limits, seen-track lookup, and Spotify token refresh/revocation behavior.
- Service-worker cache cleanup is limited to Cadence-owned caches, avoiding deletion of unrelated apps' caches on the same origin.

### Notes
- Mood and recommendation quality depend on the available catalogue and connected services.
- The automated tests do not replace end-to-end testing of Google/Spotify OAuth, playlist saving, full-track handoff, and playback on a real device.

## [1.0.1] — 2026-10-21

### Added
- Mood-based playlists with quick prompts such as rainy evening, gym, heartbreak, and focus.
- A mini player and a distinct swipe action for opening a track.

### Improved
- Recommendations use a richer taste model built from likes, dislikes, artists, genres, audio characteristics, and track-title keywords.
- Mood and discovery results filter likely duplicates, repeated artists, prompt echoes, comedy, memes, spoken-word tracks, and covers.
- Refined card movement, button feedback, transitions, shadows, animations, reduced-motion handling, and small-screen layout.

### Notes
- Mood playlist quality depends on the available track pool and connected music services.
- End-to-end testing of Spotify sign-in, playlist saving, and playback is still recommended.
