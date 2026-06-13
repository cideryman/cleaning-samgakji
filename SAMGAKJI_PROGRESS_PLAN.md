# Samgakji Progress System

Status: planning confirmed, Phase 1-4 implemented with text fallback.

Core rule:
Haenaem does not level up. Samgakji levels up.

The purpose of this system is to give cleaning a visible long-term meaning beyond earning money for Seoul. Cleaning should make the neighborhood feel cleaner, brighter, and more alive.

## Current Level Table

Level names change every 2 levels. This keeps the system expandable without requiring 16 separate mood names.

| Level | Name | Total cleaned |
|---|---|---:|
| Lv.1 | 잠든 삼각지 | 0 |
| Lv.2 | 잠든 삼각지 | 50 |
| Lv.3 | 새싹 돋는 삼각지 | 120 |
| Lv.4 | 새싹 돋는 삼각지 | 220 |
| Lv.5 | 꽃피는 삼각지 | 350 |
| Lv.6 | 꽃피는 삼각지 | 520 |
| Lv.7 | 향기로운 삼각지 | 700 |
| Lv.8 | 향기로운 삼각지 | 950 |
| Lv.9 | 빛나는 삼각지 | 1200 |
| Lv.10 | 빛나는 삼각지 | 1500 |
| Lv.11 | 쉬어가는 삼각지 | 1800 |
| Lv.12 | 쉬어가는 삼각지 | 2200 |
| Lv.13 | 사람들이 찾는 삼각지 | 2600 |
| Lv.14 | 사람들이 찾는 삼각지 | 3100 |
| Lv.15 | 사랑받는 삼각지 | 3700 |
| Lv.16 | 사랑받는 삼각지 | 4500 |

## Implemented Phases

### Phase 1: Progress Data

Status: implemented.

- `totalCleanedCount` is the source of progress.
- `src/config/SamgakjiProgressData.js` defines level data and calculation helpers.
- `src/systems/SamgakjiProgressSystem.js` manages current progress state.
- Save/load uses `samgakjiProgress` with safe normalization.
- No visual changes were added in this phase.

### Phase 2: HUD

Status: implemented.

- The HUD shows `삼각지 Lv.N`, the level name, and progress to the next level.
- The existing “next goal” HUD remains for quest guidance.
- Current design decision: keep both systems because progress is long-term motivation and next-goal text is short-term navigation.

### Phase 3: Neighborhood Visuals

Status: implemented.

- `NeighborhoodProgressSystem` remains the visual system.
- Flowerbeds and butterflies now follow Samgakji level instead of old quest-gated thresholds.
- Visual mapping:
  - Lv.1-2: flowerbed Stage 0
  - Lv.3-4: flowerbed Stage 1
  - Lv.5-6: flowerbed Stage 2
  - Lv.7-8: flowerbed Stage 3 and butterfly appears
  - Lv.9+: flowerbed Stage 4 and butterflies increase
- `neighborhoodBloom` remains for save compatibility.
- Dirty/recovered props use `SamgakjiProgressSystem` level.
- Dirty props now have small collision areas while visible.
- When dirty props disappear by level-up, their collision is disabled and the pathfinding grid is recalculated.

## Current Assets

### Already Used

- `assets/sprites/flowerbed_growth.png`
  - spritesheet, frame size 160 x 96
- `assets/sprites/flowerbed_growth2.png`
  - spritesheet, frame size 160 x 96
- `assets/sprites/butterfly_idle.png`
  - spritesheet, frame size 64 x 64
- `assets/progress/dirty/dirty-trash-bags.png`
- `assets/progress/dirty/dirty-cardboard-pile.png`
- `assets/progress/dirty/dirty-soil-rubble.png`
- `assets/progress/dirty/dirty-concrete-scrap.png`
- `assets/progress/dirty/dirty-spilled-bin.png`
- `assets/progress/dirty/dirty-paper-rubble.png`

### Existing Reused Props

- `assets/props/sunisuni-bench.png`
- `assets/props/sunisuni-tree.png`
- `assets/props/street-lamp.png`

## Phase 4: Level-Up Popup

Status: implemented with text/emoji fallback.

Goal:
Show a progress popup only when the Samgakji neighborhood name changes.

Rules:
- Popup must be HTML overlay above the game stage.
- Popup must block world input while visible.
- Popup must have a clear `확인` button.
- It must show:
  - `삼각지 Lv.N`
  - level name, such as `꽃피는 삼각지`
  - one short message, such as `삼각지가 조금 더 밝아졌어요.`
- Uses text/emoji fallback while dedicated image assets are not ready.
- Save `lastAnnouncedLevel` so the popup does not repeat after reload.
- Because level names change every 2 levels, intermediate levels with the same name are acknowledged silently.
- Current design decision: keep the assetless HTML popup. No dedicated popup image asset is required for now.

Current implementation:
- `SamgakjiProgressSystem` detects newly reached levels during cleaning.
- If the newly reached level has the same neighborhood name as the last announced level, it updates save state without showing a popup.
- If the neighborhood name changes, it shows the centered popup.
- The popup is an HTML overlay appended to `.game-stage`.
- The popup blocks world input while visible.
- Confirmation button, Enter, or Space updates `lastAnnouncedLevel` and saves a checkpoint.
- Scene shutdown removes any remaining popup DOM and key listener.
- No new image asset is required yet.

## Quest Notice Popup Pattern

Status: initial implementation.

- Quest unlock notices can reuse the same assetless popup style as the Samgakji progress popup.
- This keeps important events more visible than a short toast without adding new assets.
- Current first use: Sunisuni unlock notice, `수니수니가 기다리고 있어요`.
- The popup uses `.samgakji-levelup-modal.is-visible`, so `SceneControlSystem` already blocks world input while it is open.
- Future quest unlocks can use the same pattern when a toast is too easy to miss.

## Progress Object Placement And Tiled Editing

Status: partially implemented, future cleanup recommended.

- Some dirty/recovered progress props now follow existing Tiled map object points such as bench/tree positions.
- This is good for natural placement because dirty objects can replace places where a bench or tree will later appear.
- Currently Tiled can adjust those positions indirectly by moving the original map object point/object.
- Future recommendation: add a dedicated Tiled object layer or object property set for progress props.
- Suggested properties:
  - `progressKey`
  - `dirtyTexture`
  - `recoveredTexture`
  - `showUntilLevel`
  - `revealAtLevel`
  - `collisionWidth`
  - `collisionHeight`
- That would let the designer move dirty spots directly in Tiled without editing JS.

### Phase 4 Asset Prep

Recommended folder:

- `assets/progress/level-up/`

Required or recommended assets:

1. Level badge or emblem
- Format: transparent PNG.
- Recommended canvas: 256 x 256.
- Safe visual area: central 220 x 220.
- Avoid tiny Korean text inside the image. HTML should render level/name text.
- Option A, 16 badges:
  - `samgakji-level-badge-01.png`
  - `samgakji-level-badge-02.png`
  - ...
  - `samgakji-level-badge-16.png`
- Option B, 8 mood badges:
  - `samgakji-mood-badge-01.png` for Lv.1-2
  - `samgakji-mood-badge-02.png` for Lv.3-4
  - ...
  - `samgakji-mood-badge-08.png` for Lv.15-16

2. Optional sparkle spritesheet
- Filename: `level-up-sparkle.png`
- Format: transparent PNG spritesheet.
- Frame size: 64 x 64.
- 4 frames: 256 x 64.
- 6 frames: 384 x 64.
- Keep it light for mobile.

3. Optional ribbon/panel decoration
- Filename: `level-up-ribbon.png`
- Format: transparent PNG.
- Recommended size: 512 x 160.
- Decoration only. Text should remain HTML.

## Future Ideas

### Brighter BGM After Lv.10

Decision: good idea, but keep it to one calm change only.

Recommended behavior:
- Lv.1-9: current Samgakji default BGM.
- Lv.10-16: slightly brighter Samgakji default BGM.
- Do not change music every level.
- Only affect the normal outdoor Samgakji BGM.
- Do not override shop, hospital, pharmacy, bus, epilogue, or other scene-specific BGM.
- Use fade transition when switching.
- On save/load, if the player is Lv.10 or higher, start with the bright BGM.

Recommended future asset:
- `assets/audio/bgm/samgakji-bright.mp3`

### Animal Visit System

Decision: keep for later. Do not implement now.

Initial scope should stay small:
- Cat
- Sparrow

Suggested stages:
- Stage 1: animals appear as background life.
- Stage 2: animals react when the player comes near.
- Stage 3: animals follow the player briefly, then wander away.

Design caution:
- This should support the feeling that Samgakji is recovering.
- Do not let it grow into a pet collection system.
- Avoid adding many animals at once.

### Other Future Items

- Progress album.
- More visitors or resting people.
- Bench improvement.
- Signs, banners, posters.
- Rest-window progress record.

## Implementation History

### 2026-06-10 Phase 3A: No-New-Sprite Pass

- Added progress props before final dirty assets were ready.
- Used Phaser-generated fallback shapes for dirty objects.
- Reused `sunisuni_bench`, `sunisuni_tree`, and `street_lamp`.
- Added stable object keys such as:
  - `progress_dirty_planter_west`
  - `progress_bench_recovered`
  - `progress_tree_recovered`
- Tiled point/object with the same key can override fallback positions.

### 2026-06-10 Dirty Prop Asset Integration

- Imported dirty assets into `assets/progress/dirty/`.
- Registered texture keys:
  - `dirty_trash_bags`
  - `dirty_cardboard_pile`
  - `dirty_soil_rubble`
  - `dirty_concrete_scrap`
  - `dirty_spilled_bin`
  - `dirty_paper_rubble`
- Dirty PNGs are 160 x 96 transparent images.
- Fallback Phaser shapes remain only if a dirty texture is missing.

### 2026-06-11 Level Expansion

- Expanded from 8 levels to 16 levels.
- Kept level names changing every 2 levels.
- Updated flowerbed/butterfly mapping to the 16-level scale.

### 2026-06-11 Dirty Prop Collision

- Dirty props now block movement while visible.
- Collision is intentionally small so the objects feel present without making navigation frustrating.
- Hidden dirty props disable their collision.
- Pathfinding grid is recalculated after dirty prop collision changes.

### 2026-06-11 Level-Up Popup Fallback

- Implemented Phase 4 without new assets.
- `SamgakjiProgressSystem` now shows a centered HTML level-up popup when Samgakji reaches a new level.
- The popup uses a text/emoji house badge until proper level-up assets are prepared.
- `SceneControlSystem` treats `.samgakji-levelup-modal.is-visible` as an open overlay, so world input is blocked.
- `CleaningSystem` now refreshes Samgakji progress in announce mode after trash cleanup.
- The popup confirmation button receives focus and can also be confirmed with Enter or Space on PC.
- Scene shutdown cleanup prevents stale popup DOM or keydown listeners after restart/scene changes.
- Future badge/ribbon/sparkle assets can replace the fallback visuals without changing level logic.

## Current Notes For Future Codex Work

- Keep `PlayScene.js` small. Add new progress logic to systems/config files.
- Prefer data-driven level rules in `SamgakjiProgressData.js`.
- Keep visual changes in `NeighborhoodProgressSystem.js`.
- Keep save compatibility. Do not remove `neighborhoodBloom` yet.
- Any new overlay must block world input.
- Use UTF-8 for all Korean text.
