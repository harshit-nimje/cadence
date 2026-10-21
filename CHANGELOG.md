# Changelog

## [1.0.1] — 2026-10-21

### New
- **Mood-based playlists:** Describe a feeling or pick a quick mood prompt (such as *rainy evening*, *gym*, *heartbreak*, or *focus*) to get a tailored set of tracks.
- **Mini player:** Keep playback controls and the current track's artwork available while navigating around the app.
- **Open-track swipe action:** Adds a distinct swipe affordance for opening a track, alongside the existing like, skip, and middle/neutral actions.

### Improved
- **More personal recommendations:** Swipe feedback now informs a richer taste model that learns from liked and disliked tracks, artists, genres, audio characteristics, and track-title keywords.
- **Cleaner mood results:** Mood playlists filter likely duplicates, tracks that simply echo the prompt, repeated artists, and obvious low-quality or mismatched results.
- **Cleaner discovery pool:** Incoming tracks are filtered to reduce comedy, meme, spoken-word, cover, and other unwanted results, with regional-music filtering adjusted based on taste signals.
- **Smoother interface:** Refined card movement, button feedback, transitions, shadows, and screen-entry animations.
- **Improved small-screen layout:** The taste-confidence meter is more readable on phones, and the navigation dock adapts when the mini player is visible.
- **More polished mood screen:** Added animated mood prompts, a subtle animated colour-wave background, staggered track entrances, and support for reduced-motion preferences.
- **Less disruptive navigation:** Tab changes defer some scroll-reset work to the next animation frame, and unchanged recommendation lists avoid unnecessary re-rendering.

### Notes
- Mood playlist quality depends on the available track pool and connected music services.
- This changelog lists user-facing changes identified by comparing the supplied build with the previous repository version. End-to-end testing of Spotify sign-in, playlist saving, and playback is still recommended.
