# 삼각지 대청소 핸드오프

이 문서는 다음 Codex 세션이 바로 이어서 작업할 수 있도록 현재 구조, 원칙, 남은 일을 정리한 문서입니다. 작업 로그를 길게 누적하지 말고, 최신 상태 중심으로 갱신하세요.

## 현재 프로젝트

- 기술: Phaser.js, Vite, Vanilla JS, HTML/CSS DOM UI.
- 실행/검증: `npm.cmd run build`.
- 발전도/동네 변화 설계는 `SAMGAKJI_PROGRESS_PLAN.md`를 함께 봅니다. 이 파일은 실행 핸드오프이고, progress plan은 삼각지 레벨/화단/나비/미래 BGM/동물 아이디어의 설계 기준입니다.
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
  - Phase 4 of `SAMGAKJI_PROGRESS_PLAN.md` is now implemented without new image assets.
  - `SamgakjiProgressSystem` shows a centered HTML popup when a new Samgakji level is reached.
  - The popup blocks world input while visible and saves `lastAnnouncedLevel` after confirmation.
  - Scene shutdown removes any remaining level-up popup DOM and keydown listener.
  - Later level-up badge/ribbon/sparkle PNG assets can replace the current emoji/text fallback.

## Tiled 편집 규칙

- `spawn` layer: 논리 지점입니다. 예: `player_start`, `pharmacy_door`, `convenience_store_door`, `recycle_demo_can`.
- `map_objects` layer: 실제 보이는 오브젝트입니다. `texture`, `displayWidth`, `displayHeight`, `collides` 같은 property를 사용합니다.
- 충돌 조정은 object property `collides`, `collisionWidth`, `collisionHeight`, `collisionOffsetX`, `collisionOffsetY`를 사용합니다.
- 나무/벤치/건물/자판기/분리수거통 위치는 가능하면 Tiled object로 조정합니다.
- 새 타일셋을 쓸 때는 Tiled에서 추가하는 것만으로 끝나지 않습니다. 게임 preload 쪽에서도 tileset source/name/key가 맞아야 합니다.
- 약국 내부처럼 별도 Tiled 맵을 만들 때는 `AssetsData.js`의 `INTERIOR_TILED_MAPS`에 등록하세요.

## 현재 남은 문제와 우선순위

### P0: 진행 차단 또는 엔딩 확인 필요

1. 에필로그 엄마 전화 후 검은 화면 유지 - mitigation applied, needs manual verification
   - Camera fade reset and UTF-8 fallback text were added in `TravelEndingSystem.showChapterOneEndingScene()`.
   - Final ending return input is now click/touch-only.
   - `TravelEndingSystem.transitionWithFade()` now has a fallback timer so the next sequence still starts if the Phaser fade-out complete event is missed.
   - Verify the full mother-phone-to-ending flow on PC and mobile before marking fully resolved.

### P1: 플레이 감각에 직접 영향

1. NPC event movement naturalization
   - Phase 1 is applied for movement that already uses `PlayScene.walkNpcToTarget()`.
   - Phase 2 is applied for Jjook and Sunisuni follower movement through `NpcFollowRouteSystem`.
   - Remaining movement cleanup should be done in small units:
     1. Test and tune Jjook follow jitter around dense objects. If jitter appears, increase route `repathMs` or `targetMoveTolerance`.
     2. Test Sunisuni hospital/pharmacy escort crossing roads. If she waits or detours awkwardly, tune the road/crosswalk adjustment before changing pathfinding.
     3. Move any remaining bespoke event tweens in Yebi/Jjook/Sunisuni systems to `walkNpcToTarget()` only when they represent destination travel, not short cutscene item-transfer motion.
     4. Review `separateNpcSprites()` so collision separation does not push NPCs through trees, bins, or the road.
     5. Longer term: centralize route-follow state keys and NPC movement tuning values into config once behavior is stable.
   - Do not solve this by teleporting NPCs unless the event explicitly needs a scene cut.

2. 모바일 로딩 속도
   - 이미지/BGM 에셋이 많아졌습니다.
   - 챕터 시작 필수 preload, 상점/엔딩 진입 직전 lazy load, 사용하지 않는 임시 에셋 정리가 필요합니다.

3. Store interior map conversion
   - Hospital/pharmacy/clothing shop are not all full interior movement maps yet.
   - Pharmacy is the first reference implementation.
   - Long-term recommendation: use separate interior maps with object points like `player_start`, `exit`, `counter`, and `npc_chemist`.

### P2: 구조 개선과 확장 준비

1. PlayScene 리팩토링
   - 다음 우선순위는 작은 이벤트 함수 묶음을 시스템으로 옮기는 것입니다.
   - 이동 후 `node --check`와 `npm.cmd run build`를 반드시 실행합니다.

2. Neighborhood/NPC memory dialogue expansion
   - Phase 1 is complete for conservative completed/non-quest states.
   - Phase 2 is complete: direct-memory dialogue logic moved into `NpcMemorySystem` so `PlayScene.js` stays thin.
   - Phase 3A is complete: Jjook's generic dialogue can include a memory line without stealing the plogging-help choice.
   - Phase 3B is complete: Yebi's recycle progress/completed dialogue can include a memory line without changing recycle mechanics.
   - Phase 3C is complete: direct/quest-safe memory lines have a short per-NPC cooldown to avoid repeated memory dialogue spam.
   - Current random speech can already prefer `NpcMemorySystem`, and direct click/touch dialogue can now reuse the same memory line.
   - Next step: leave Sunisuni as direct-memory only unless a clearly safe non-story interaction point is added; most Sunisuni interactions are story-critical.
   - Keep the priority rule: active quest dialogue > direct memory line > generic NPC dialogue.
   - Do not add gauge UI or new assets for this step.
   - Do not touch mother/prologue/epilogue phone events.

### P3: 기능 아이디어 백로그

- 병원/약국/옷가게 진입 시 화면 fade와 대화창 fade 타이밍 동기화.
- 상점별 내부 맵 전환 확대.
- 터치/클릭 이동 목표 표시 색상과 크기 조정.
- Lv.10 이후 일반 야외 삼각지 BGM만 조금 더 밝은 곡으로 바꾸는 아이디어가 있습니다. 세부 규칙과 추천 에셋명은 `SAMGAKJI_PROGRESS_PLAN.md`의 Future Ideas를 따릅니다.
- 동물 방문 시스템은 보류입니다. 나중에 하더라도 고양이/참새 정도의 작은 범위로 시작합니다.
- 레벨업 팝업용 전용 이미지 에셋이 준비되면 `assets/progress/level-up/` 아래에 넣고, 현재 HTML fallback에 배지/리본/스파클을 연결합니다.

## Deferred Visual TODO

- Pharmacy interior aspect ratio cleanup: keep the interior map's original visual ratio instead of stretching it to fill the viewport. Use black side bars/letterboxing for leftover space, like classic RPG interiors. This is intentionally deferred.

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
- Progress prop keys such as `progress_dirty_planter_west`, `progress_bench_recovered`, and `progress_tree_recovered` can be added as Tiled anchors later; Tiled positions will override fallback coordinates.
- Superseded by the 2026-06-11 collision update: visible dirty progress props now block movement with small collision areas.
- Documented the asset replacement path in `SAMGAKJI_PROGRESS_PLAN.md`: replace generated dirt with `assets/progress/dirty/*.png`, then replace full-grown tree fallback with a tree-growth spritesheet when ready.

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

## 2026-06-11 Samgakji Progress Plan Cleanup

- `SAMGAKJI_PROGRESS_PLAN.md` was rewritten as the single planning reference for the Samgakji level/progress system.
- It now connects the company-side work and home-side work into one current-state document:
  - Lv.1-16 level table.
  - Implemented Phase 1-3 status.
  - Phase 4 level-up popup asset requirements.
  - Future BGM idea after Lv.10.
  - Deferred animal visit idea.
  - Implementation history for no-new-sprite pass, dirty asset integration, level expansion, and dirty prop collision.
- For future work, update the progress plan when changing Samgakji level rules, visual progression, level-up popup assets, progress BGM, or animal visit design.
- Keep this handoff focused on broader project status, bugs, and next engineering priorities.

## 2026-06-11 Samgakji Progress Dirty Collision Update

- Visible dirty progress props now block player movement with intentionally small collision rectangles.
- Hidden dirty props disable their collision bodies and are removed from pathfinding collision bounds.
- `PathfindingSystem.getStaticColliderBounds()` now ignores disabled Arcade bodies.
- `NeighborhoodProgressSystem` recalculates the pathfinding grid after progress visibility/collision changes.
- Current rule: dirty progress objects may block movement while visible; flowerbeds, butterflies, and recovered decorative props should remain non-blocking unless deliberately changed later.
