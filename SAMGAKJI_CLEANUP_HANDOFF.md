# 삼각지 대청소 핸드오프

이 문서는 다음 Codex 세션이 바로 이어서 작업할 수 있도록 현재 구조, 원칙, 남은 일, 삼각지 발전도 계획을 모두 정리한 단일 기준 문서입니다. 작업 로그를 길게 누적하지 말고, 최신 상태 중심으로 갱신하세요.

## 현재 프로젝트

- 기술: Phaser.js, Vite, Vanilla JS, HTML/CSS DOM UI.
- 실행/검증: `npm.cmd run build`.
- 삼각지 발전도/동네 변화 설계도 이 문서 안에 통합되어 있습니다. 별도 계획 문서를 새로 만들지 말고 이 파일을 갱신합니다.
- 주요 파일:
  - `src/scenes/PlayScene.js`: 아직 큰 파일입니다. 새 기능 본문을 길게 추가하지 말고 시스템 파일로 분리합니다.
  - `src/config/AssetsData.js`: 이미지, 스프라이트시트, 오디오, Tiled 맵 로딩 등록.
  - `src/config/GameConstants.js`: 주요 좌표 fallback, 퀘스트 기준값.
  - `src/config/InitialGameState.js`: 새 게임 상태 기본값.
  - `src/systems/CheckpointStorage.js`: 이어하기 저장/복원.
  - `src/systems/TiledMapSystem.js`: 메인 Tiled 맵, object layer, map point, collision 처리.
  - `assets/maps/chapter1-samgakji-map.json`: 챕터 1 월드 맵.

## 작업 원칙

- 기존 플레이를 깨지 않는 작은 단위로 수정합니다.
- `PlayScene.js`에는 import, 인스턴스 생성, 시스템 연결 정도만 추가합니다.
- Tiled에서 위치 조정 가능한 것은 가능하면 object layer 또는 spawn point로 둡니다.
- DOM 오버레이가 열려 있을 때는 Phaser world input이 새지 않게 막습니다.
- 저장값 추가 시 기존 세이브와 병합 fallback을 둡니다. 예: `Object.assign({}, defaultValue, loadedValue)`.
- 에셋 경로를 바꿀 때는 `AssetsData.js`, preload, 실제 파일명을 함께 확인합니다.
- 변경 후 최소 `node --check <수정 파일>`과 `npm.cmd run build`를 실행합니다.
- Korean dialogue/text files must be saved as UTF-8. Do not convert files to ANSI/CP949.
- If Korean looks garbled only in PowerShell output, first check the file encoding/editor display before rewriting text; the terminal code page may be the problem, not the file.
- When editing Korean-heavy files, prefer a UTF-8 aware editor or script and verify with `node --check` plus an in-game/browser check when possible.

## NPC Interaction Guide

- NPC dialogue should start by direct click/touch on the NPC, not by Space.
- Do not add floating "Space / touch" prompt text above the map for NPC conversations.
- If the player is too far from the NPC, click/touch should move Haenaem near the NPC first; the player clicks/touches the NPC again when close enough.
- Interactive NPCs and objects should use the existing yellow hover/touch feedback style where possible.
- Keep this rule consistent for world NPCs and interior-map NPCs such as the pharmacist.

## 최근 완료

- 돈 HUD를 `[만원 아이콘] 71,500원` 형태로 단순화했습니다.
- `NpcMemorySystem.js`를 추가해 여비/쭉쭉이/수니수니의 기억 대사를 기존 랜덤 말풍선 fallback 앞에 연결했습니다. 엄마, 프롤로그, 에필로그 전화 시퀀스는 건드리지 않았습니다.
- 배움 노트 등 DOM 오버레이가 게임 화면 뒤로 가거나, 오버레이 터치가 월드 입력으로 새는 문제를 막는 원칙을 적용했습니다.
- `NeighborhoodProgressSystem.js`는 이제 `SamgakjiProgressSystem`의 삼각지 레벨을 기준으로 화단, 나비, 지저분한 오브젝트를 표시합니다. 화단과 진행 오브젝트 위치는 Tiled object로 조정 가능합니다.
- 클릭/터치 이동 목표 지점에 반투명 초록 원을 표시합니다. 원 크기는 현재 빗자루 범위 기준으로 바뀝니다.
- 편의점 문 point와 학습 도우미를 추가했습니다. 편의점은 아직 입장 불가이며, 최초 1회만 "아직 준비중이구나?" 대사를 표시합니다.
- 수니수니 시작 위치를 편의점 앞 쪽으로 바꾸는 흐름을 준비했고, 수니수니 퀘스트 시작 기준은 90,000원입니다.
- 여비 분리수거 시범을 추가했습니다. 캔, 일반쓰레기, 플라스틱 순서로 각 통 앞에 이동해 쓰레기가 통으로 들어가는 연출을 보여준 뒤 퀘스트가 시작됩니다.
- NPC 말풍선 스타일을 검은 배경/흰 글씨로 바꾸고 표시 시간을 늘렸습니다. 분리수거통 아래 라벨도 라운드 처리했습니다.
- 약국 내부를 Tiled 맵 시스템으로 전환했습니다.
  - 맵: `assets/maps/pharmacy-map.json`
  - 타일셋: `assets/tilesets/pharmacy.png`
  - 시스템: `src/systems/PharmacyMapSystem.js`
  - 설정: `src/config/PharmacyMapData.js`
  - 로딩 등록: `src/config/AssetsData.js`, `src/scenes/Preload.js`
  - `pharmacy.tsx`의 이미지 경로가 깨져 있으므로 게임에서는 TSX 경로에 의존하지 않습니다. `Preload.js`에서 `pharmacy-map.json`의 tileset을 `assets/tilesets/pharmacy.png`로 직접 정규화합니다.
  - 사용자가 만든 약국 오브젝트 PNG는 영어 파일명으로 `assets/interiors/pharmacy/`에 복사했습니다.
  - 현재 `pharmacy-map.json`은 바닥/벽 타일맵이고 오브젝트 레이어가 없습니다. 그래서 `PharmacyMapData.js`의 fallback 좌표로 약장, 카운터, 화분, 포스터, 약사 NPC를 배치합니다.
  - 나중에 Tiled object layer를 추가하면 object의 `texture`, `key`, `asset`, name, type 값을 읽어 같은 시스템에서 렌더링할 수 있습니다.
- Pharmacy interaction update:
  - Entering the pharmacy now opens the interior map only.
  - The pharmacy no longer uses floating "Space / touch" prompt text.
  - The player must move the interior Haenaem sprite to the counter, then directly click/touch the pharmacist sprite to start the pharmacy dialogue.
  - Standing near the pharmacist/counter must not auto-start dialogue. Tapping the pharmacist while too far away only moves Haenaem toward the counter; the player taps the pharmacist again when close enough.
  - Pharmacist hover/touch uses the same yellow tint interaction feedback style as other interactive NPCs/objects.
  - During the Sunisuni quest, Sunisuni is also placed inside the pharmacy interior as a companion. Revisit mode keeps the pharmacy as Haenaem-only.
  - Prescription, 10,000 won bill, 5,000 won change, and medicine bag are transferred through the air between Haenaem and the pharmacist using `PharmacyMapSystem.playTransferItem()`.
  - A green circular exit marker is placed in the lower-right corner of the pharmacy interior. Click/touch it to leave.
  - After receiving the medicine bag, Haenaem and Sunisuni walk to the exit marker before the world quest-complete dialogue resumes.
  - `PharmacyMapSystem` now owns pharmacy-only player movement, companion placement, pharmacist click/touch interaction, exit marker handling, and transfer animation.
- NPC event movement naturalization phase 1:
  - `PlayScene.walkNpcToTarget()` now asks `PathfindingSystem.findPath()` for an A* route before falling back to the older crosswalk waypoint route.
  - This affects existing scripted NPC movement that already uses the shared helper, including Yebi recycle demonstrations, Jjook returning home, and Sunisuni returning to her bench/start point.
  - The route is simplified before tweening so NPCs do not receive every grid cell as a separate visual stop.
  - Remaining work is to migrate any custom per-frame follower/escort logic that still moves directly toward targets without using this shared route.
- NPC follow movement naturalization phase 2:
  - Added `src/systems/NpcFollowRouteSystem.js` as a small route-follow helper instead of adding more movement code to `PlayScene.js`.
  - Jjook and Sunisuni follower movement now tries A* path-following first, then falls back to the old direct movement when a path cannot be found.
  - Red-light waiting and existing crosswalk target adjustment remain in each quest system before route-following is called.
  - This specifically improves Jjook plogging/follow/bus escort movement and Sunisuni hospital/pharmacy escort movement without changing quest dialogue or rewards.
  - Next check: manually test Jjook following Haenaem around benches/vending machine/recycling bins and Sunisuni crossing toward hospital/pharmacy. If route jitter appears, increase `repathMs` or target tolerance in `JjookQuestSystem` / `SunisuniQuestSystem`.
- NPC memory direct-dialogue phase 1:
  - `NpcMemorySystem` was already used by ambient/random NPC speech bubbles.
  - Direct click/touch dialogue now also checks memory lines for Yebi, Jjook, and Sunisuni, but only in conservative non-quest states.
  - Yebi memory dialogue is allowed only after can quest and recycle quest are completed.
  - Sunisuni memory dialogue is allowed only after the hospital/pharmacy quest is complete and she is not returning to her bench/start point.
  - Jjook memory dialogue is allowed only after wallet/clothing/packing flow is complete and no follow/escort state is active.
  - If a memory line is shown, Haenaem replies with a short acknowledgement line. If no safe memory line is available, the original quest/dialogue handler runs unchanged.
  - Mother/prologue/epilogue phone sequences were not touched.
- NPC memory direct-dialogue phase 2:
  - Direct memory dialogue gating and Haenaem reply text now live in `src/systems/NpcMemorySystem.js`.
  - `PlayScene.js` only calls `npcMemorySystem.showDirectMemoryDialogue(npcKey)` from each NPC click/touch entry point.
  - Future expansion of memory dialogue conditions should be done inside `NpcMemorySystem`, not in `PlayScene.js`.
- NPC memory direct-dialogue phase 3A:
  - Added `NpcMemorySystem.getQuestSafeMemoryDialogueLine(npcKey)` for memory lines that can be inserted into existing quest-safe dialogue without replacing choices.
  - Jjook's generic post-wallet dialogue can now prepend a memory line while keeping the existing plogging-help choice intact.
  - This does not run during Jjook follow/escort, clothes quest offers, packing offers, or bus boarding states.
  - Use this pattern for future middle-state memory dialogue: insert a memory line into an existing safe dialogue array rather than intercepting the whole interaction.
- NPC memory direct-dialogue phase 3B:
  - Yebi's recycle active/completed dialogue can now prepend a memory line while keeping recycle progress/reward guidance intact.
  - The Yebi memory line only appears after the can quest is complete, during or after the recycle quest, and not during the recycle demonstration.
  - `PlayScene.js` was not changed for this step.
- NPC memory direct-dialogue phase 3C:
  - `NpcMemorySystem` now keeps a short per-NPC cooldown for direct/quest-safe memory lines.
  - This prevents repeated click/touch interactions from showing the same memory line too often.
  - The cooldown is intentionally local to memory dialogue, so existing quest dialogue, random speech fallback, and main story flow are not changed.
  - `PlayScene.js` was not changed for this step.
- NPC memory ambient speech phase 3D:
  - Random NPC speech now asks `NpcMemorySystem.getAmbientSpeech(npcKey, fallbackSpeech)` instead of directly preferring memory text every time.
  - Memory speech still appears before ordinary random fallback when available, but each NPC has a short ambient cooldown so fallback lines continue to appear.
  - This keeps the neighborhood feeling varied without adding UI, assets, or new quest state.
- NPC memory expansion final decision:
  - Sunisuni stays direct-memory only. Do not insert memory lines into her hospital/pharmacy quest dialogue unless a new clearly non-story daily interaction is added later.
  - Reason: most Sunisuni interactions are story-critical, and inserting extra lines risks slowing or confusing the hospital/pharmacy sequence.
  - NPC memory phase is complete for now: ambient memory, direct memory, Jjook quest-safe insertion, Yebi quest-safe insertion, and cooldowns are all in place.
- Sunisuni daily dialogue polish phase 1:
  - After the hospital/pharmacy quest is complete, Sunisuni's direct-memory dialogue now includes a few calmer daily check-in lines.
  - Haenaem's reply can now adjust slightly to the Sunisuni line, for example reminding her to take medicine as explained or rest slowly.
  - This does not insert extra lines into the active hospital/pharmacy story flow.
- Dialogue text polish phase 1:
  - NPC memory/direct daily lines were lightly shortened and made more consistent.
  - Question-style ambient lines that did not expect player input were changed into simple statement-style lines.
  - No quest choices, rewards, or story-state conditions were changed.
- Dialogue presentation polish phase 1:
  - Dialogue modal now uses a small class-based fade/slide-in when opening.
  - Dialogue modal click handling now explicitly prevents default behavior and stops propagation before advancing text, reducing the chance of clicks leaking to the game world.
  - No dialogue content, quest state, or selection behavior was changed.
- Samgakji progress nature asset phase 1:
  - User-provided 4-frame nature sprites were moved from the root `assets/` folder into `assets/progress/nature/` with English names:
    - `broad-tree-growth-a.png`
    - `broad-tree-growth-b.png`
    - `broad-tree-growth-c.png`
    - `pine-tree-growth.png`
    - `small-tree-growth.png`
    - `rose-bush-growth.png`
  - They are registered as 128x128 spritesheets in `AssetsData.js`.
  - Existing Tiled `sunisuni_tree` map objects now render through the new broad-tree/pine sprites at frame 3 while preserving their original map coordinates, display sizes, depth sorting, and collision settings.
  - `NeighborhoodProgressSystem` now uses the new assets for recovered tree/small-tree/rose/pine progress props.
- Samgakji progress dirty-object placement phase 1:
  - Four dirty progress props now use existing bench/tree map points instead of unrelated new fallback positions:
    - `west_rest_bench`
    - `park_tree_center_01`
    - `park_bench_south`
    - `west_tree_rest`
  - The matching original map objects are hidden until the dirty prop's reveal level, then shown again when the dirty prop disappears.
  - Existing map object collision is intentionally preserved. At low levels the visible dirty prop sits on the same place, so the blocker is not invisible; at higher levels the recovered bench/tree is visible again.
  - Remaining design task: manually review these four spots in-game and tune their Tiled coordinates or fallback sizes if any dirty prop feels too large or visually overlaps nearby paths.
- Sunisuni quest dialogue polish:
  - Hospital doctor scene no longer repeats Sunisuni asking Haenaem to speak for her after the reception scene.
  - Haenaem now directly explains the stomach pain to the doctor.
  - Sunisuni completion dialogue was shortened conservatively.
  - Bacchus/vital drink reward now shows a centered item reward overlay before the usual item button is updated.
  - Vital drink use now matches other drinks: it grants the shared movement speed buff instead of increasing sweep range.
- Convenience store learning icon fix:
  - The convenience store educational guide icon now follows the Tiled `convenience_store_door` point with a small upward offset.
  - Educational guide icons render at higher depth so they do not disappear behind building sprites.
- Samgakji level-up popup fallback:
  - Samgakji progress popup phase is implemented without new image assets.
  - `SamgakjiProgressSystem` shows a centered HTML popup only when the Samgakji neighborhood name changes.
  - Because level names change every 2 levels, levels with the same name are acknowledged silently and do not show a popup.
  - The popup blocks world input while visible and saves `lastAnnouncedLevel` after confirmation.
  - Scene shutdown removes any remaining level-up popup DOM and keydown listener.
  - User decision: keep the current assetless HTML popup for now. Later badge/ribbon/sparkle PNG assets are optional, not required.
- Quest notice popup fallback:
  - `UIManager.showNoticePopup()` reuses the Samgakji popup style for important quest unlock notices.
  - Current first use: Sunisuni unlock now shows `수니수니가 기다리고 있어요` as a centered popup instead of a short toast.
  - It uses the same `.samgakji-levelup-modal.is-visible` overlay class, so world touch/click input is blocked while visible.
- Progress object/Tiled placement note:
  - Current dirty progress props can follow existing Tiled bench/tree object points, so moving those source objects in Tiled moves the dirty/recovered spot indirectly.
  - This is useful for replacing existing bench/tree spots with dirty objects at low levels, then restoring clean props at higher Samgakji levels.
  - 2026-06-14 update: progress props now prefer a dedicated Tiled point named exactly like the prop key, for example `progress_tree_recovered`, before falling back to `pointKey`, `replacedMapObjectKey`, or code fallback coordinates.
  - This means future map edits can add lightweight `logic_point` objects named after progress prop keys without changing code.
  - Nature progress props now start from frame 0 and advance through frames 0-3 as Samgakji level rises instead of appearing immediately as fully grown frame 3 sprites.
  - 2026-06-14 update 2: supplemental recovered decorations such as `progress_bench_recovered`, `progress_tree_recovered`, `progress_small_tree_recovered`, `progress_rose_recovered`, and `progress_pine_recovered` were moved away from fallback coordinates so they no longer appear in awkward NPC activity zones or recycling spaces.
  - Dirty props and replaced original map objects still work through existing `pointKey`/`replacedMapObjectKey` fallbacks, so low-level blocked/dirty spots remain visible.
  - 2026-06-15 region progress slice 1:
    - Added dedicated Tiled `logic_point` anchors in `assets/maps/chapter1-samgakji-map.json`:
      - `progress_rose_01`, `progress_rose_02`
      - `progress_small_tree_01` through `progress_small_tree_04`
      - `progress_tree_01`, `progress_pine_01`
    - Added paired low-level old-trash visuals and later recovered landscaping visuals for those anchors.
    - These new regional old-trash/landscaping props are currently non-blocking to avoid creating surprise movement problems.
    - The small tree anchors form the first path-edge row/group. Their exact placement should be adjusted in Tiled after visual review.
    - The paired visuals use the same anchor point: old trash appears first, then the rose/tree/small-tree/pine grows from frame 0 as Samgakji level rises.
  - 2026-06-15 Tiled metadata support:
    - `TiledMapSystem` now stores object-layer point metadata in `scene.mapPointMeta`.
    - `NeighborhoodProgressSystem` can read Tiled properties from progress anchors to override selected config values without code edits.
    - Supported progress-anchor properties include `texture`, `width`, `height`, `displayWidth`, `displayHeight`, `frame`, `showFromLevel`, `showUntilLevel`, `growthStartLevel`, `maxFrame`, `depthOffset`, `depthSortOffsetY`, `collisionWidth`, `collisionHeight`, `collisionOffsetX`, `collisionOffsetY`, `blocksMovement`, and `growthFrames`.
    - If a progress anchor is a rectangle object rather than a zero-size point, its object `width`/`height` can be used as the display size unless overridden by properties.
  - 2026-06-15 Tiled-authored progress objects:
    - A new progress decoration can now be added from Tiled without adding another hard-coded JS config entry.
    - Add a `logic_point` object and set property `progressObject=true`.
    - Required property: `texture`, matching a preloaded texture key.
    - Optional property: `progressKey`, if the object name should differ from the internal progress key.
    - Optional property: `progressType=dirty`, if the object should use the dirty/fallback visual path.
    - Optional visual properties include `originX` and `originY` in addition to the existing size, level, frame, depth, collision, and growth properties.
    - This path is intentionally opt-in. Existing Tiled points are ignored unless `progressObject=true` is set.
  - 2026-06-15 paired Tiled progress objects:
    - A single Tiled progress point can now describe both the low-level dirty object and the later recovered landscaping object.
    - Use `progressObject=true`, `dirtyTexture`, `recoveredTexture`, and `revealAtLevel`.
    - Optional paired properties include `dirtyWidth`, `dirtyHeight`, `dirtyShowUntilLevel`, `dirtyBlocksMovement`, `recoveredWidth`, `recoveredHeight`, `recoveredShowFromLevel`, `recoveredDepthOffset`, and `recoveredGrowthFrames`.
    - Existing region progress anchors (`progress_rose_01`, `progress_rose_02`, `progress_small_tree_01`-`04`, `progress_tree_01`, `progress_pine_01`) were migrated to this paired Tiled-property model.
    - The matching hard-coded `progress_old_trash_*` and recovered regional entries were removed from `STATIC_PROGRESS_PROPS`, reducing future PlayScene/system growth pressure.
  - 2026-06-15 static recovered decoration cleanup:
    - Removed leftover dedicated-point-only recovered decoration entries from `STATIC_PROGRESS_PROPS`.
    - Future bench/tree/lamp/rose/pine recovery decorations should be authored as Tiled `logic_point` objects with `progressObject=true` instead of adding more static JS entries.
  - 2026-06-15 dirty progress point cleanup:
    - `progress_dirty_concrete_scrap` and `progress_dirty_paper_rubble` were moved from static JS config to Tiled `logic_point` objects.
    - They use `progressObject=true`, `progressType=dirty`, `texture`, size, `showUntilLevel`, and `blocksMovement=true`.
    - Future one-off dirty spots should be authored the same way so placement and collision can be tuned from Tiled.
  - 2026-06-15 static progress config removal:
    - Remaining replacement dirty spots (`progress_dirty_planter_west`, `progress_dirty_planter_east`, `progress_dirty_bench_spot`, `progress_dirty_tree_spot`) were migrated to Tiled `logic_point` objects.
    - They use `replacedMapObjectKey` to hide the original bench/tree while the dirty object is visible, then reveal it again after `showUntilLevel`.
    - `STATIC_PROGRESS_PROPS` was removed from `NeighborhoodProgressSystem`; progress props are now authored through Tiled metadata.
  - Future improvement: create dedicated Tiled progress objects with properties like `progressKey`, `dirtyTexture`, `recoveredTexture`, `showUntilLevel`, `revealAtLevel`, and collision size so dirty spots can be edited directly.
- Progress object placement visual issues to fix:
  - 2026-06-15 placement pass 1:
    - `progress_small_tree_01`-`04` were moved into a tighter path-edge row at y=608.
    - `progress_tree_01` and `progress_pine_01` were moved slightly downward toward the lower grass/path edge.
    - `progress_rose_01` and `progress_rose_02` were lightly adjusted inward/upward to reduce path crowding.
  - 2026-06-15 placement pass 2:
    - Moved `west_rest_bench` left so its rendered center changed from about `(827, 546)` to `(704, 546)`.
    - Moved matching `progress_dirty_planter_west` to `(704, 546)`.
    - Goal: reduce crowding between Jjook's start/activity area and nearby flowerbed/progress props while keeping the dirty-to-clean replacement pair aligned.
  - 2026-06-15 map bounds alignment:
    - Current Tiled chapter map is `56 x 38` tiles, 32px each, so the pixel size is `1792 x 1216`.
    - Updated `GAME_CONFIG.worldWidth/worldHeight` to `1792 x 1216` so older helper systems that still read GAME_CONFIG match the Tiled map bounds.
    - Updated `assets/maps/TILED_GUIDE.md` to the current map size.
    - `npm.cmd run validate:map-progress` now warns if Tiled map pixel dimensions and `GAME_CONFIG` world dimensions drift apart again.
  - 2026-06-15 map validation safety step:
    - Added `scripts/validate-map-progress.mjs`.
    - Added `npm.cmd run validate:map-progress`.
    - This checks Tiled-authored progress objects for unknown texture keys, duplicate progress keys, missing `replacedMapObjectKey` targets, and invalid level values.
    - Run it after exporting `assets/maps/chapter1-samgakji-map.json` from Tiled, before build/manual testing.
    - `assets/maps/TILED_GUIDE.md` now documents the progress-object properties and validation command.
  - 2026-06-15 map validation summary step:
    - `npm.cmd run validate:map-progress` now also prints a compact progress-object summary table.
    - Use the table to compare Tiled placement between home/company workspaces before doing visual placement passes.
    - The table includes key, x/y, single vs paired mode, texture flow, reveal/show level, blocking flag, and replacement target.
  - 2026-06-15 replacement alignment validation:
    - `npm.cmd run validate:map-progress` now checks whether a progress point with `replacedMapObjectKey` stays aligned with the rendered center/bottom anchor of the replaced map object.
    - This is useful after moving benches/trees in Tiled because the matching low-level dirty prop should usually move with the recovered object.
    - Current replacement pairs are aligned.
  - 2026-06-15 map object name cleanup:
    - Removed duplicate `map_objects` names for repeated trees and street lamps.
    - Kept one canonical `street_lamp_recycling` and one canonical `street_lamp_vending` key so code fallback decoration checks still have a stable reference.
    - Renamed extra trees/lamps with location-specific names such as `park_tree_northeast_edge`, `street_lamp_vending_south`, and `street_lamp_vending_west`.
    - `npm.cmd run validate:map-progress` now warns if future `map_objects` entries reuse the same name.
  - Remaining manual check: review these positions in-game at several Samgakji levels.
  - If a recovered bench/tree still appears awkwardly near Jjook, flowerbeds, or recycling bins, tune the Tiled point directly rather than editing JS.
  - Preferred direction: progress props should replace or enhance existing natural resting spots, not appear in narrow NPC activity zones, recycling interaction spaces, or the center of walking paths.
  - See this document's `Samgakji Progress System` section for the newer region-based plan:
    - orange regions: roses,
    - purple regions: pine/broad trees,
    - blue regions: small trees,
    - old trash gradually disappears and is replaced by region-appropriate landscaping.

## Samgakji Progress System

Core rule:
- Haenaem does not level up. Samgakji levels up.
- Cleaning should make the neighborhood feel cleaner, brighter, and more alive beyond money rewards.

Current level table:

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

Implemented:
- `totalCleanedCount` is the source of Samgakji progress.
- `src/config/SamgakjiProgressData.js` defines level data and calculation helpers.
- `src/systems/SamgakjiProgressSystem.js` manages current progress state.
- Save/load uses `samgakjiProgress` with safe normalization.
- HUD shows `삼각지 Lv.N`, level name, and progress to next level.
- `NeighborhoodProgressSystem` uses Samgakji level for flowerbeds, butterflies, dirty props, and recovered props.
- Level/name popup uses an assetless HTML overlay. It appears only when the neighborhood name changes, not every level.
- `neighborhoodBloom` remains for save compatibility. Do not remove it yet.

Visual mapping:
- Lv.1-2: flowerbed Stage 0.
- Lv.3-4: flowerbed Stage 1.
- Lv.5-6: flowerbed Stage 2.
- Lv.7-8: flowerbed Stage 3 and butterfly appears.
- Lv.9+: flowerbed Stage 4 and butterflies increase.

Current progress assets:
- `assets/sprites/flowerbed_growth.png`, frame size 160 x 96.
- `assets/sprites/flowerbed_growth2.png`, frame size 160 x 96.
- `assets/sprites/butterfly_idle.png`, frame size 64 x 64.
- `assets/progress/dirty/dirty-trash-bags.png`.
- `assets/progress/dirty/dirty-cardboard-pile.png`.
- `assets/progress/dirty/dirty-soil-rubble.png`.
- `assets/progress/dirty/dirty-concrete-scrap.png`.
- `assets/progress/dirty/dirty-spilled-bin.png`.
- `assets/progress/dirty/dirty-paper-rubble.png`.
- `assets/progress/nature/broad-tree-growth-a.png`.
- `assets/progress/nature/broad-tree-growth-b.png`.
- `assets/progress/nature/broad-tree-growth-c.png`.
- `assets/progress/nature/pine-tree-growth.png`.
- `assets/progress/nature/small-tree-growth.png`.
- `assets/progress/nature/rose-bush-growth.png`.

Progress landscaping plan:
- Orange regions: rose bushes.
- Purple regions: pine trees and broad trees.
- Blue regions: small trees.
- Trees and roses should not appear immediately as full-grown frame 3 sprites.
- New landscaping starts from frame 0.
- As Samgakji level rises, more landscaping objects appear.
- Older placed landscaping objects advance frame 0 -> 1 -> 2 -> 3.
- Old trash/neglect objects should sit along roadsides, grass edges, or empty lawn spots.
- Some old trash objects should initially occupy orange/purple/blue landscaping regions.
- When those old trash objects disappear, the correct landscaping object appears in that same region.
- Use ordered reveal/growth so newer objects stay younger while older objects become fuller.

Future Tiled-friendly progress object model:
- Add object anchors such as `progress_rose_01`, `progress_pine_01`, `progress_tree_01`, `progress_small_tree_01`, `progress_old_trash_01`.
- For new no-code progress decorations, prefer adding a `logic_point` object with `progressObject=true` and a `texture` property.
- For dirty-to-recovered spots, prefer the paired object form:
  - `progressObject=true`
  - `dirtyTexture`
  - `recoveredTexture`
  - `revealAtLevel`
  - optional size/depth/growth properties
- Suggested properties:
  - `progressObject`: `true`
  - `progressKey`
  - `progressType`: `rose`, `pine`, `tree`, `small_tree`, `old_trash`
  - `region`: `orange`, `purple`, `blue`
  - `dirtyTexture`
  - `recoveredTexture`
  - `unlockLevel`
  - `growStartLevel`
  - `growFullLevel`
  - `showUntilLevel`
  - `revealAtLevel`
  - `replacedBy`
  - `collisionWidth`
  - `collisionHeight`
  - `collisionOffsetX`
  - `collisionOffsetY`
- Tiled object positions should always override JS fallback coordinates.

Progress collision policy:
- Old trash can block small areas if it visually communicates neglect.
- Small roses/shrubs should normally not block movement.
- Large trees may block only their trunk/base area, not the canopy.
- Collision should be editable in Tiled with `collisionWidth`, `collisionHeight`, `collisionOffsetX`, and `collisionOffsetY`.

Future progress ideas:
- Lv.10+ can use one brighter outdoor Samgakji BGM only. Do not change music every level.
- Future BGM asset recommendation: `assets/audio/bgm/samgakji-bright.mp3`.
- Animal visit system is deferred. If implemented later, start small with cat and sparrow only.
- Progress album, visitor increase, bench improvement, signs/banners/posters, and rest-window progress record are deferred.

## Tiled 편집 규칙

- `spawn` layer: 논리 지점입니다. 예: `player_start`, `pharmacy_door`, `convenience_store_door`, `recycle_demo_can`.
- `map_objects` layer: 실제 보이는 오브젝트입니다. `texture`, `displayWidth`, `displayHeight`, `collides` 같은 property를 사용합니다.
- 충돌 조정은 object property `collides`, `collisionWidth`, `collisionHeight`, `collisionOffsetX`, `collisionOffsetY`를 사용합니다.
- 나무/벤치/건물/자판기/분리수거통 위치는 가능하면 Tiled object로 조정합니다.
- 새 타일셋을 쓸 때는 Tiled에서 추가하는 것만으로 끝나지 않습니다. 게임 preload 쪽에서도 tileset source/name/key가 맞아야 합니다.
- 약국 내부처럼 별도 Tiled 맵을 만들 때는 `AssetsData.js`의 `INTERIOR_TILED_MAPS`에 등록하세요.

## Unified Priority Backlog

Use this as the single task list. Work from the top, in small verified units.

### P0: Progression Blockers

1. Final ending does not proceed after the last ending screen.
   - Status: mitigation applied; needs manual in-game check.
   - Symptom: ending image remains very dark and the flow does not continue/respond as expected.
   - 2026-06-14 update: final ending now avoids the camera fade-out transition, resets camera FX before showing the ending image, removes the interior dim overlay for `type === "ending"`, and accepts click/touch/Space/Enter to return to StartScene.
   - Manual check: finish the mother phone ending, confirm the final ending image is not dark/blocked, then click/touch or press Space to return to the title screen.

### P1: Player-Facing Bugs And Feel

1. Hide educational guide icons during cutscenes/interior/story scenes.
   - Status: mitigation applied; needs visual check in cutscenes and pharmacy.
   - Yellow learning question-mark icons can leak into cutscenes, pharmacy/interior scenes, and story illustration scenes.
   - Rule: educational guide icons are world-map helpers only.
   - 2026-06-14 update: `EducationalGuideSystem` now updates icon visibility every frame and hides/disables icon input whenever world input is blocked, an interior scene is active, dialogue/cutscene/menu state is active, or the guide modal itself is open.
   - Manual check: enter pharmacy/interior scenes and prologue/ending-style story scenes; no yellow question-mark icons should be visible or clickable.

2. NPC movement naturalization.
   - Phase 1 and 2 are implemented through `walkNpcToTarget()` and `NpcFollowRouteSystem`.
   - 2026-06-14 small safety step: NPC separation movement now checks both object collision rectangles and the pathfinding walkable grid before moving an NPC. This reduces cases where NPCs are pushed into blocked tiles, roads, trees, or props while avoiding broad AI changes.
   - 2026-06-14 follow-route safety step: `NpcFollowRouteSystem` now checks `scene.canNpcStandAt()` before applying each movement step. If diagonal movement is blocked, it tries a safe X-only or Y-only step; if no safe step exists, it stops the NPC walk and returns handled so old direct-movement fallback does not push the NPC through props.
   - 2026-06-14 Sunisuni follow cleanup: Sunisuni's hospital/pharmacy escort no longer falls back to raw direct `x/y` movement when `NpcFollowRouteSystem` exists. If route-follow cannot move safely, she stops instead of sliding through blocked objects.
   - 2026-06-14 Jjook follow cleanup: Jjook's plogging/follow/clothes/bus escort movement also stops instead of falling back to raw direct `x/y` movement when `NpcFollowRouteSystem` exists.
   - 2026-06-14 Yebi recycle intro cleanup: Yebi's approach to Haenaem before the recycling intro now uses shared `walkNpcToTarget()` instead of custom X-then-Y tweens. This keeps her approach path consistent with object/crosswalk routing while leaving the recycling demo item-transfer sequence unchanged.
   - 2026-06-14 Yebi recycling-stand travel cleanup: Yebi's travel to the recycling stand now uses shared `walkNpcToTarget()` instead of the old hand-built waypoint tween path. Immediate placement for checkpoint/restore remains in `moveYebiToRecyclingCenter()`.
   - 2026-06-14 follow tuning cleanup: Jjook/Sunisuni route-follow speed, repath, and target-tolerance values now live in `GAME_CONFIG` instead of being hard-coded inside quest systems. This makes future jitter tuning safer and keeps behavior values centralized.
   - Remaining work:
     - Test/tune Jjook follow jitter around dense objects.
     - Test Sunisuni hospital/pharmacy escort across roads/crosswalks.
     - Move any remaining destination travel tweens in Jjook/Sunisuni systems to `walkNpcToTarget()`.
     - Review remaining `separateNpcSprites()` edge cases after manual playtesting, especially near crosswalks and recycling bins.
     - If manual testing shows jitter, tune the new follow config values rather than editing quest logic.

3. Mobile loading speed.
   - Asset count has grown.
   - Plan: preload only chapter-critical assets, lazy-load shop/interior/ending assets, and remove unused temporary assets.

4. Store/interior map consistency.
   - Pharmacy is the first reference implementation.
   - Hospital and clothing shop are not full interior movement maps yet.
   - Future interiors should use object points such as `player_start`, `exit`, `counter`, and `npc_*`.

### P2: Samgakji Progress And Map Visuals

1. Progress landscaping placement cleanup.
   - Fix awkward bench between Jjook and flowerbed.
   - Remove/relocate tree between right-side recycling bins.
   - Review rose bush placement.
   - Move path-grown tree down to the grass/path boundary.
   - Prefer a row/group of about 4 small trees or shrubs along the path edge.

2. Progress object Tiled authoring.
   - Status: implemented for current progress props.
   - Current dirty/recovered props are authored through Tiled `logic_point` objects with `progressObject=true`.
   - Use `texture` for one-off props, or `dirtyTexture`/`recoveredTexture`/`revealAtLevel` for paired dirty-to-recovered props.
   - Use `replacedMapObjectKey` when a dirty prop should temporarily hide an existing bench/tree object.

3. Region-based landscaping implementation.
   - Orange regions: roses.
   - Purple regions: pine/broad trees.
   - Blue regions: small trees.
   - Old trash should gradually disappear and be replaced by region-appropriate landscaping.
   - Implement first as a tiny slice: one rose, one tree, one small-tree row, one old-trash replacement.

4. Samgakji progress polish.
   - Current assetless popup is accepted and should stay.
   - Popup appears only when the neighborhood name changes.
   - Optional future: Lv.10+ brighter outdoor BGM only.

### P3: Structure And Maintainability

1. Continue reducing `PlayScene.js`.
   - Move small event groups into systems.
   - Do not add long new features directly to PlayScene.
   - Always run `node --check` on changed JS files and `npm.cmd run build`.

2. Dialogue polish continuation.
   - Quest unlock notices that are easy to miss can use `UIManager.showNoticePopup()`.
   - Interior dialogue should wait for fade/dissolve completion before appearing.
   - NPC memory lines must remain short and must not interrupt active quest choices.
   - Keep mom/prologue/epilogue phone dialogue separate from map NPC memory logic unless a dedicated story-memory system is created.

3. NPC memory system.
   - Current scope is complete: Yebi/Jjook/Sunisuni ambient/direct/quest-safe memory lines and cooldowns.
   - Sunisuni remains direct-memory only for now.
   - Priority rule remains: active quest dialogue > direct memory line > generic NPC dialogue.

### P4: Deferred Ideas

- Pharmacy interior aspect ratio cleanup with black side bars/letterboxing.
- Hospital/clothing shop interior maps.
- Touch/click destination marker color/size tuning.
- Cat/sparrow visit system after progress visuals are stable.
- Progress album/rest-window progress record.
- Optional level-up image assets under `assets/progress/level-up/`.

### Future Asset Plan: Samgakji Progress Expansion

This is a future asset/design note, not an active implementation task.

Goal:
- Extend Samgakji progress beyond the current nature/dirty-object pass only when enough visible assets exist.
- Current assets are strongest for Lv.1-12. Lv.13-16 can work with text/popup support, but Lv.17-20 should wait for more visible changes.

Planned people/NPC assets:
- Garden expert NPC
  - 4-direction walking spritesheets.
  - Standard frame size: 64 x 96.
  - Direction sheet size: 192 x 96, 3 frames.
  - Frame order: left foot, neutral, right foot.
  - Optional portrait: 400 x 400 transparent PNG.
- Tree expert NPC
  - Same sprite and portrait standard as the garden expert.

Recommended prop assets:
- Flower icon sign, no readable text.
  - Use a simple flower pictogram instead of Korean/English writing because small text is hard to read in-game.
  - Recommended sizes: 64 x 64 for small path signs, 96 x 96 for larger flowerbed signs.
  - Transparent PNG, bottom anchor touching the bottom edge.
- Garden tools/props.
  - Watering can, small shovel, small flowerpot, seed bag, or garden gloves.
  - Recommended size: 96 x 96 or 128 x 96 transparent PNG.
- Clean bench-area props.
  - Small potted plant, picnic mat, or resting bag.
  - Recommended size: 128 x 96 transparent PNG.
- Extra complete-tree variants.
  - Recommended size: 128 x 128 or 160 x 160 transparent PNG/spritesheet.

Design rules:
- Prefer pictograms over text for tiny signs.
- Keep new progress props visual-first and non-blocking unless there is a clear gameplay reason.
- Add new progress placement through Tiled `logic_point` objects with `progressObject=true`, not hard-coded JS config.
- Run `npm.cmd run validate:map-progress` after adding new Tiled progress props.

## 검증 체크리스트

- `node --check src/scenes/PlayScene.js`
- 변경한 시스템 파일별 `node --check`
- `npm.cmd run build`
- 새 게임과 이어하기 모두 확인
- 모바일 가로/세로에서 DOM 모달 스크롤과 버튼 터치 확인
- Tiled 좌표 기반 기능은 실제 object가 우선 적용되는지 확인

## 2026-06-08 Pharmacy Interior Tiled Object Update

- Pharmacy interior objects are now intended to be managed from `assets/maps/pharmacy-map.json` object layers first.
- `map_objects` layer can contain visible pharmacy props. Use object property `texture` with Phaser keys such as `pharmacy_counter`, `pharmacy_shelf_general`, `pharmacy_shelf_cold`, `pharmacy_shelf_care`, `pharmacy_shelf_health`, `pharmacy_waiting_chair`, `pharmacy_plant`, `pharmacy_prescription_drop`, and `pharmacy_medicine_bag_display`.
- NPC objects can use `role: npc` and `texture: pharmacist_sprite`; name the pharmacist object `pharmacist`.
- `spawn` layer can contain point objects named `player_start`, `sunisuni_start`, `counter_point`, and `exit`.
- `PharmacyMapSystem.js` now reads Tiled object positions before falling back to `PharmacyMapData.js`.
- The temporary Korean folder `assets/??` was removed after confirming its assets already existed under English paths: `assets/interiors/pharmacy/*.png` and `assets/sprites/pharmacist.png`.
- `assets/tilesets/pharmacy.tsx` now points to `pharmacy.png`, not a Korean temporary path.
- Pharmacy map-wide pointer zone depth was lowered so the pharmacist sprite and exit marker can receive click/touch first.

## 2026-06-08 Pharmacy Counter And Collision Update

- The pharmacist Tiled object was moved behind the counter visually.
- In `assets/maps/pharmacy-map.json`, the `pharmacist` object now uses a lower `depthOffset` so the counter renders in front of the pharmacist's lower body.
- Added a Tiled `collision` object layer for the pharmacy interior.
- `PharmacyMapSystem.js` now reads collision rectangles from:
  - Any object in layer named `collision`
  - Or any object with `role: collision`
  - Or any object with `collides: true`
- Current pharmacy collision objects cover the counter, four shelves, chair, plant, and poster/wall area.
- Interior player movement now blocks against these rectangles and tries horizontal/vertical sliding before stopping.
- When editing in Tiled, adjust rectangles in the `collision` layer rather than hard-coding collision coordinates in JavaScript.


## 2026-06-08 Pharmacy Touch Priority Fix

- High-priority pharmacy issue addressed: pharmacist click/touch could fail because the sprite hit area and map-wide input zone competed.
- PharmacyMapSystem.setupPharmacistInteraction() now uses a standard frame-local hit rectangle: 0, 0, width, height.
- handleInteriorPointer() now also checks whether the pointer is inside the pharmacist padded bounds. If yes, it calls startCounterDialogueFromPharmacistTap() instead of treating the tap as general floor movement.
- This keeps the intended rule: no floating Space/touch prompt; direct click/touch on pharmacist starts the pharmacy interaction, or moves Haenaem to the counter first when too far.
- Manual in-game check still recommended on mobile/PWA: enter pharmacy, tap pharmacist from far away, confirm Haenaem moves to counter, tap pharmacist again, confirm dialogue starts.


## 2026-06-08 Pharmacy NPC Overlap Fix

- Fixed a pharmacy interior issue where Haenaem could walk over/through the pharmacist sprite.
- Cause: the pharmacy counter collision only covered the lower/front area, and the pharmacist NPC did not have a dedicated collision rectangle.
- Updated `assets/maps/pharmacy-map.json` collision layer with:
  - `counter_collision` for the front counter body
  - `counter_back_collision` for the staff-side counter area
  - `pharmacist_collision` for the pharmacist foot/body space
- Interior map rule: every walkable-map NPC should have a nearby collision rectangle or a deliberate no-overlap zone in Tiled. Visual sprite placement alone does not block movement.
- Keep dialogue interaction separate from collision: click/touch on the pharmacist still routes through `PharmacyMapSystem.startCounterDialogueFromPharmacistTap()`.


## 2026-06-10 Top HUD And Next Goal Cleanup

- Removed the fixed top HUD next-quest capsule because it looked like an action button and competed with the new Samgakji level system.
- Deleted `src/systems/NextGoalSystem.js` and removed its PlayScene wiring.
- Removed the old `#nextQuestHint` DOM node and stale `UIManager.updateNextQuestHint()` path.
- Samgakji level/progress HUD now lives inside the main top money/trash HUD as a compact status block.
- Design rule going forward: top HUD should show persistent state only (money, carried trash, Samgakji level/progress). Quest prompts should use contextual tools such as NPC question marks, route arrows, and short toasts only when needed.
- Recheck mobile landscape after HUD changes, especially overlap with can quest/recycle quest gauges and right-side buttons.

## 2026-06-10 Samgakji Progress Visual Phase 3A

- Implemented the first no-new-sprite pass in `src/systems/NeighborhoodProgressSystem.js`.
- Superseded by the 2026-06-11 update: flowerbeds and butterflies now follow Samgakji level, not old quest-gated bloom stages.
- New static progress props now read the current Samgakji level from `SamgakjiProgressSystem`.
- Temporary dirty/neglect spots are generated from Phaser shapes, so no new image assets are required yet.
- Existing assets are reused for recovered props: `sunisuni_bench`, `sunisuni_tree`, and `street_lamp`.
- Progress prop keys such as `progress_dirty_planter_west`, `progress_bench_recovered`, and `progress_tree_recovered` can be added as Tiled anchors later. For new recovered decorations, prefer `progressObject=true` on the Tiled point instead of adding static JS entries.
- Superseded by the 2026-06-11 collision update: visible dirty progress props now block movement with small collision areas.
- Documented the asset replacement path in this handoff: replace generated dirt with `assets/progress/dirty/*.png`, then replace full-grown tree fallback with a tree-growth spritesheet when ready.

## 2026-06-10 Dirty Prop Asset Integration

- Imported six user-provided dirty object PNGs from `assets/지저분한 오브젝트/`.
- Renamed them to English filenames and moved them to `assets/progress/dirty/`.
- Removed the now-empty temporary Korean source folder.
- Registered the six textures in `src/config/AssetsData.js`:
  - `dirty_trash_bags`
  - `dirty_cardboard_pile`
  - `dirty_soil_rubble`
  - `dirty_concrete_scrap`
  - `dirty_spilled_bin`
  - `dirty_paper_rubble`
- Updated `NeighborhoodProgressSystem.js` so Samgakji progress dirty spots use these real PNGs first, falling back to generated Phaser shapes only if a texture is missing.
- Superseded by the 2026-06-11 collision update: dirty progress props are no longer visual-only while visible.

## 2026-06-11 Samgakji Progress Planning Cleanup

- Samgakji progress planning was rewritten as a single planning reference for the Samgakji level/progress system.
- Later, that planning content was merged into this handoff so this file is now the only required reference.
- It connects the company-side work and home-side work into one current-state document:
  - Lv.1-16 level table.
  - Implemented Phase 1-3 status.
  - Phase 4 level-up popup asset requirements.
  - Future BGM idea after Lv.10.
  - Deferred animal visit idea.
  - Implementation history for no-new-sprite pass, dirty asset integration, level expansion, and dirty prop collision.
- For future work, update this handoff when changing Samgakji level rules, visual progression, level-up popup assets, progress BGM, or animal visit design.

## 2026-06-11 Samgakji Progress Dirty Collision Update

- Visible dirty progress props now block player movement with intentionally small collision rectangles.
- Hidden dirty props disable their collision bodies and are removed from pathfinding collision bounds.
- `PathfindingSystem.getStaticColliderBounds()` now ignores disabled Arcade bodies.
- `NeighborhoodProgressSystem` recalculates the pathfinding grid after progress visibility/collision changes.
- Current rule: dirty progress objects may block movement while visible; flowerbeds, butterflies, and recovered decorative props should remain non-blocking unless deliberately changed later.
