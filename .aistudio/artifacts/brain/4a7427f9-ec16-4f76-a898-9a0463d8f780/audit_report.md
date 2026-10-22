# AuraBeat Comprehensive Codebase Audit Report (TASK 1)

**Audit Date**: October 2026  
**Repository State**: Git snapshot commit `b46fb1f` created with tag `rollback-point-task1`.  
**Current Build Status**: `npm run build` succeeds; TypeScript `npm run lint` passes.  

---

## 1. Executive Summary & Critical Findings

| Subsystem | Severity | Exact File Path(s) | Summary of Finding |
| :--- | :--- | :--- | :--- |
| **Vercel Deployment** | **CRITICAL** | `vercel.json`, `server.ts`, `package.json` | `vercel.json` rewrites `/(.*)` to `/index.html`. In Vercel static/serverless deployments, no API functions exist under `/api/`, so all API calls (`/api/catalog/*`, `/api/lyrics/*`) return HTML and crash with JSON parse errors. |
| **Catalog Security** | **CRITICAL** | `server.ts` | `/api/catalog/publish` and `/api/catalog/delete/:id` have zero authentication, no authorization, no rate limiting, and unvalidated song ID handling. Any user can wipe or overwrite the catalog. |
| **Broken Audio URLs** | **CRITICAL** | `public/cloudCatalog.json`, `src/data/publishedSongs.ts`, `src/data/defaultSongs.ts` | `cloudCatalog.json` references `/uploads/song_local_*.mp3` files that do not exist on disk (404 Not Found). `publishedSongs.ts` disguises SoundHelix MIDI placeholder audio as copyrighted/regional songs ("Kitab Haryanvi", "Alphuliya", etc.). |
| **Ephemeral Storage** | **HIGH** | `server.ts` | Server writes file uploads to `public/uploads/` on the local disk. In serverless/Vercel environments, this filesystem is read-only/ephemeral and wipes between requests. |
| **Audio Clipping & DSP** | **MEDIUM** | `src/utils/audioEngine.ts` | 300% volume boost (>1.0 gain) lacks strict brickwall limiting curves, risking digital distortion and speaker clipping if compressor threshold isn't dynamically linked. |
| **Cross-Device Sync** | **HIGH** | `server.ts`, `src/utils/syncClient.ts` | Vercel serverless cannot maintain persistent WebSocket connections (`/ws/sync`). While PeerJS/WebRTC code exists, fallback signaling for Vercel requires a resilient serverless/P2P handshake. |
| **Lyrics Transparency** | **MEDIUM** | `server.ts`, `src/utils/lyricsParser.ts`, `src/components/LyricsOverlay.tsx` | Procedurally generated lyrics lack explicit "AI / Procedural Sync" transparency badges and could be mistaken for official publisher lyrics. |
| **Memory / Object URLs** | **MEDIUM** | `src/utils/indexedDB.ts`, `src/App.tsx` | Blob URLs created from IndexedDB audio are not consistently revoked via `URL.revokeObjectURL()`, risking memory leaks on mobile devices after many song switches. |
| **MediaSession & Stats** | **MEDIUM** | `src/App.tsx` | Lock screen media controls are partially configured; stats timer increments even during audio stall or buffer delay. |
| **Automated Testing** | **MEDIUM** | `package.json` | No automated test suite exists (`npm test` missing). |

---

## 2. Detailed Issue List by Task & Exact File Paths

### TASK 2: Vercel Backend & API Routes Fix
- **Files**: `vercel.json`, `server.ts`, `api/index.ts` (to be created), `package.json`
- **Issues**:
  1. `vercel.json` line 14: `"source": "/(.*)", "destination": "/index.html"` intercepts all `/api/*` endpoints.
  2. `server.ts` is configured as a monolithic Express server with `http.createServer(app)`. Vercel serverless requires an exported serverless request handler or `@vercel/node` compatible entry point in `/api/`.
  3. `package.json` has `"dev": "tsx server.ts"` and `"start": "tsx server.ts"`, which works in container environments but needs serverless parity for Vercel.

### TASK 3: Admin Security & API Protection
- **Files**: `server.ts`, `api/index.ts`, `src/App.tsx`
- **Issues**:
  1. `server.ts` lines 137-221: No check for admin credentials (`x-admin-key`, Bearer token, or session).
  2. Missing input validation: `songId` accepts arbitrary strings; `audioBase64` accepts arbitrary payloads without MIME verification.
  3. No rate limiting middleware on public routes (`/api/catalog/songs`, `/api/lyrics/generate`).

### TASK 4: Real Songs & Audio URL Verification
- **Files**: `public/cloudCatalog.json`, `src/data/publishedSongs.ts`, `src/data/defaultSongs.ts`, `src/App.tsx`
- **Issues**:
  1. `public/cloudCatalog.json`: References 4 non-existent files in `/uploads/` (`song_local_1792434880509_wnas.mp3`, `song_local_1792436226002_l5on.mp3`, etc.).
  2. `src/data/publishedSongs.ts`: Labeled as specific regional songs, but points to `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3` through `SoundHelix-Song-4.mp3`.
  3. Missing error feedback: When an audio URL fails to load (404, CORS error, network failure), `src/App.tsx` does not display an actionable "Track Unavailable" message, leaving the user confused with an unresponsive play button.

### TASK 5: Permanent Cloud Storage Architecture
- **Files**: `server.ts`, `api/index.ts`, `src/utils/indexedDB.ts`
- **Issues**:
  1. Direct write to `public/uploads/` via `fs.writeFileSync()` is invalid on serverless platforms.
  2. Need dual-layer architecture:
     - Cloud storage provider adapter (Vercel Blob / S3 / Cloudinary / Base64 DB store).
     - Robust local IndexedDB storage that remains 100% independent and functional on device.

### TASK 6: Music Player Playback Bug Fixes
- **Files**: `src/App.tsx`, `src/components/PlayerBar.tsx`, `src/components/FullPlayerModal.tsx`
- **Issues**:
  1. `queue[currentSongIndex]` can be `undefined` when queue filtering changes or search query narrows results, causing unhandled errors.
  2. Mobile autoplay restriction: Unhandled `NotAllowedError` rejection on iOS Safari / Chrome Android when `audio.play()` is invoked without prior user interaction.
  3. Race condition on rapid Next/Prev clicks triggering overlapping `audio.play()` calls before `canplay` resolves.

### TASK 7: Volume Boost, EQ & Audio Quality
- **Files**: `src/utils/audioEngine.ts`, `src/components/EqualizerModal.tsx`
- **Issues**:
  1. `boostGainNode` multiplies signal up to 3.0x. If `compressorNode` is bypassed or set with soft knee, signal produces harsh digital clipping.
  2. Sleep timer volume fade modifies `audioElement.volume`. If user cancels sleep timer or changes tracks, the original pre-fade volume was not reliably restored.

### TASK 8: Listen Together Cross-Device Sync
- **Files**: `src/utils/syncClient.ts`, `server.ts`, `api/index.ts`
- **Issues**:
  1. `server.ts` uses in-memory `ws` WebSocket connections. In serverless deployments, WebSocket connections terminate immediately.
  2. `syncClient.ts` has WebRTC / PeerJS logic, but needs a rock-solid signaling handshake and room state sync that works on serverless Vercel deployments.

### TASK 9: Lyrics & Lyrics Synchronization
- **Files**: `src/components/LyricsOverlay.tsx`, `src/utils/lyricsParser.ts`, `server.ts`
- **Issues**:
  1. Procedurally generated lyrics need a badge indicating "AI / Procedural Sync" rather than verified official artist lyrics.
  2. Missing error boundary for malformed LRC timestamps (e.g. invalid minutes/seconds parsing returning `NaN`).

### TASK 10: IndexedDB & Playlists Reliability
- **Files**: `src/utils/indexedDB.ts`, `src/App.tsx`
- **Issues**:
  1. Missing cleanup: Audio blob object URLs created with `URL.createObjectURL` are not revoked when replacing or deleting songs.
  2. Storage Quota handling: When local storage is full, IndexedDB `put` rejects without a user-friendly storage alert.

### TASK 11: PWA & Offline Mode
- **Files**: `public/sw.js`, `public/manifest.json`, `index.html`
- **Issues**:
  1. Precached assets in `sw.js` must be strictly verified.
  2. Avoid caching streaming audio files in CacheStorage to prevent exceeding browser storage limits.

### TASK 12: Mobile UI & Responsive Design
- **Files**: `src/components/PlayerBar.tsx`, `src/components/FullPlayerModal.tsx`, `src/components/SparkProgressBar.tsx`, `src/App.tsx`
- **Issues**:
  1. Bottom navigation and PlayerBar need safe-area padding for mobile gesture bars (`env(safe-area-inset-bottom)`).
  2. Small screen (<360px) touch target spacing optimization.

### TASK 13: Performance & Battery Optimization
- **Files**: `src/components/AudioVisualizer.tsx`, `src/App.tsx`
- **Issues**:
  1. Visualizer should automatically pause frame rendering when tab is hidden via `document.visibilityState === 'hidden'`.

### TASK 14: Search, Sorting & Library Experience
- **Files**: `src/App.tsx`
- **Issues**:
  1. Filtering by genre or search query should preserve the existing active queue rather than destructively re-indexing current song index.

### TASK 15: Real Statistics & Media Controls
- **Files**: `src/App.tsx`
- **Issues**:
  1. Listening minutes counter must only accumulate time while `!audio.paused && !audio.ended && audio.currentTime > 0`.
  2. MediaSession action handlers (`play`, `pause`, `previoustrack`, `nexttrack`, `seekto`) need complete metadata synchronization.

### TASK 16: Automated Tests & Verification
- **Files**: `package.json`, test files (`src/tests/*`)
- **Issues**:
  1. No test runner or test scripts in `package.json`.
  2. Need Vitest / unit tests for lyrics parsing, audio engine clamping, and catalog validation.

---

## 3. Rollback & Backup Point
- **Git Commit**: `b46fb1f`
- **Git Tag**: `rollback-point-task1`
- **Restoration Command**: `git checkout rollback-point-task1` (if any regression occurs).
