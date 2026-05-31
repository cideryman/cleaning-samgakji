# Audio Asset Layout

Keep audio files grouped by usage so new sound work does not become mixed into one flat folder.

- `bgm/`: background music, room ambience, travel/ending ambience.
- `voice/`: recorded voice lines such as short NPC phrases.
- `sfx/`: file-based sound effects. Current sweep, clean, reward, and pickup effects are generated in `AudioManager.js` with Web Audio, so this folder may stay empty.

When adding audio, register the file in `src/config/AssetsData.js` and update `sw.js` if it should be precached for PWA/offline use.
