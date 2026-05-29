# Codex Handoff Notes For Cleaning Samgakji

이 문서는 사용자가 읽기 위한 기획서가 아니라, 다음 작업을 맡은 Codex가 바로 이어서 작업하기 위한 개발 인수인계 문서다.  
작업을 시작하기 전에 이 파일을 먼저 읽고, 특히 `PlayScene.js`를 더 키우지 않는 규칙을 지킨다.

## Project Snapshot

- 프로젝트: Phaser.js 기반 2D 웹 게임 `삼각지 대청소`
- 실행: `npm.cmd run dev`
- 검증: `npm.cmd run build`
- 메인 씬: `src/scenes/PlayScene.js`
- 시작 씬: `src/scenes/StartScene.js`
- 프롤로그 씬: `src/scenes/PrologueScene.js`
- 주요 CSS: `styles.css`
- 맵: Tiled JSON 기반. 코드 좌표가 남아 있더라도 새 좌표/오브젝트는 되도록 Tiled object로 옮긴다.

## Current Refactoring State

`PlayScene.js`는 아직 크지만, 일부 기능은 시스템으로 분리되어 있다.

분리 완료:

- `src/controllers/PlayerController.js`
- `src/systems/CleaningSystem.js`
- `src/systems/SlimeSystem.js`
- `src/systems/InteractionSystem.js`
- `src/systems/UIManager.js`
- `src/systems/MoneySystem.js`
- `src/systems/QuestManager.js`
- `src/systems/DialogueSystem.js`
- `src/systems/DialogueManager.js`
- `src/systems/PortraitManager.js`
- `src/systems/CheckpointStorage.js`
- `src/systems/RoadTrafficSystem.js`
- `src/systems/RouteGuideSystem.js`
- `src/systems/VendingMachineSystem.js`
- `src/systems/PackingSystem.js`
- `src/systems/ClothingShopSystem.js`
- `src/systems/SunisuniQuestSystem.js`
- `src/systems/JjookQuestSystem.js`

최근 분리:

- 짐싸기 데이터: `src/config/PackingData.js`
- 옷가게 데이터: `src/config/ClothingShopData.js`
- 짐싸기 UI/선택 처리: `PackingSystem`
- 옷가게 UI/선택/계산/쇼핑백 HUD: `ClothingShopSystem`
- 수니수니 병원/약국 대화 흐름, 따라오기 AI, 이펙트, 벤치 복귀: `SunisuniQuestSystem`
- 쭉쭉이 지갑 대화 진입, 자판기 보상 연결, 플로깅 요청, 옷가게 제안/수락/거절/입장/완료 후 짐싸기 제안, 짐싸기 제안 수락/거절, 동행 따라오기, 자동 청소, 동행 종료: `JjookQuestSystem`

아직 `PlayScene.js`에 남겨도 되는 것:

- 씬 초기화
- 맵 생성과 Tiled object 연결
- 시스템 인스턴스 생성
- 퀘스트 흐름 연결
- 여러 시스템을 이어주는 얇은 래퍼

앞으로 분리 후보:

- `JjookQuestSystem`: 옷가게/짐싸기/버스정류장으로 이어지는 쭉쭉이 후반 흐름
- `YebiQuestSystem`: 캔 모으기/분리수거 안내 흐름
- `TravelEndingSystem`: 버스, 짐싸기 이후 방/기차/서울/엔딩 컷신
- `MapObjectFactory`: 병원, 약국, 옷가게, 자판기, 분리수거통, NPC 생성
- `AudioManager`: BGM, 효과음, 장면별 음악 전환
- `ToastQueue`: 겹치지 않는 안내 메시지 큐

## Hard Rule: Do Not Grow PlayScene

새 기능을 추가할 때 `PlayScene.js`에 큰 함수를 추가하지 않는다.

허용되는 `PlayScene.js` 코드:

- 시스템 생성: `this.someSystem = new SomeSystem(this)`
- 이벤트 연결: `this.someSystem?.start(...)`
- 상태 전달용 얇은 래퍼
- 기존 레거시 코드와 새 시스템 사이의 짧은 브리지

금지:

- 새 모달 DOM 전체를 `PlayScene.js`에 직접 작성
- 새 퀘스트 전체 흐름을 `PlayScene.js`에 100줄 이상 추가
- 새 데이터 배열을 `PlayScene.js` 상단에 추가
- 새 에셋 경로를 여러 함수에 하드코딩
- 같은 키 입력/터치 이벤트를 여러 곳에서 중복 등록

목표:

- 단기: `PlayScene.js` 5000줄 이하
- 중기: `PlayScene.js` 2500줄 이하
- 장기: `PlayScene.js` 600~800줄

## Refactoring Method

한 번에 크게 바꾸지 않는다. 아래 순서를 따른다.

1. 기능 하나를 정한다.
2. 데이터가 있으면 `src/config/*Data.js`로 먼저 분리한다.
3. 새 시스템 파일을 만든다.
4. 기존 동작을 그대로 복사하되 `scene` 참조 방식만 정리한다.
5. `PlayScene.js`에는 기존 함수명 래퍼를 남긴다.
6. `npm.cmd run build`로 확인한다.
7. 빌드 성공 후에만 다음 함수 묶음을 옮긴다.
8. `dist/`가 생기면 커밋 전에 삭제한다.

권장 패턴:

```js
// PlayScene.js
openSomething() {
  this.somethingSystem?.open();
}
```

```js
// src/systems/SomethingSystem.js
export default class SomethingSystem {
  constructor(scene) {
    this.scene = scene;
  }
}
```

## State And Input Rules

대화, 쇼핑, 컷신, 청소가 동시에 실행되지 않게 한다.

확인할 상태:

- `this.isInDialogue`
- `this.clothingShopModal`
- `this.packingModal`
- `this.vendingMenuGroup`
- `this.interiorSceneGroup`
- `this.stateManager`

입력 우선순위:

1. 모달/메뉴가 열려 있으면 메뉴 입력만 처리
2. 대화 중이면 대화 넘기기/선택지만 처리
3. 청소 범위 안에 쓰레기가 있으면 청소 우선
4. 쓰레기가 없을 때 NPC/오브젝트 상호작용

## Tiled Object Migration Rules

가능하면 새 위치는 코드 좌표가 아니라 Tiled object로 관리한다.

Tiled object로 두는 것이 좋은 것:

- NPC 시작 위치
- 병원문, 약국문, 옷가게문
- 자판기 사용 위치
- 분리수거통 위치와 상호작용 영역
- 버스정류장 위치
- 차량 정지선
- 퀘스트 목적지
- 충돌 박스

코드 fallback은 유지한다. Tiled object가 없어도 현재처럼 플레이 가능해야 한다.

## Verification Checklist

수정 후 최소 확인:

```powershell
npm.cmd run build
if (Test-Path dist) { Remove-Item -LiteralPath dist -Recurse -Force }
git status -sb
```

한글 깨짐 의심 시:

```powershell
rg -n "\?\?\?|�|留|怨|癒|꾩|덉|リ" src
```

단, PowerShell 콘솔 출력은 한글이 깨져 보일 수 있다. 파일 자체가 UTF-8인지 확인하려면 Node로 읽어서 확인한다.

## Gameplay Design Guardrails

대상 이용자를 고려해 다음 원칙을 지킨다.

- 조작은 단순하게 유지한다.
- 실패/벌칙보다 성공 피드백을 우선한다.
- 상호작용 범위는 넉넉하게 둔다.
- 설명보다 시각적 변화와 짧은 대사를 우선한다.
- 새 기능은 청소, 돈, 퀘스트, 이동, 생활 경험과 연결한다.
- 긴 이동거리, 과한 자유도, 복잡한 컨트롤은 피한다.

## Current Risk Areas

주의해서 만질 것:

- `PlayScene.js`의 퀘스트 상태값들은 서로 얽혀 있다.
- 자판기/옷가게/짐싸기/수니수니/엔딩 흐름은 대화 콜백에 의존한다.
- PWA와 모바일 Safari는 캐시 때문에 GitHub Pages 반영이 늦게 보일 수 있다.
- DOM 기반 모달과 Phaser 입력이 동시에 켜질 때 입력 충돌이 생기기 쉽다.
- Tiled 충돌과 코드 충돌이 동시에 있으면 길이 막힐 수 있다.

## Next Recommended Refactor

다음에 이어서 한다면 아래 순서를 추천한다.

1. 버스정류장 안내, 버스 탑승, 집/짐싸기 이후 엔딩 흐름을 별도 `TravelEndingSystem`으로 분리
2. `YebiQuestSystem` 분리
3. `TravelEndingSystem` 분리
4. `AudioManager` 분리
5. `MapObjectFactory` 분리

`SunisuniQuestSystem`은 현재 수니수니 병원/약국 대화 흐름, 따라오기 AI, 하트/별 이펙트, 벤치 복귀를 담당한다. `PlayScene.js`에는 기존 호출을 보존하는 래퍼만 남아 있다.
`JjookQuestSystem`은 현재 지갑 대화 진입, 자판기 보상 연결, 플로깅 요청, 옷가게 제안/수락/거절/입장/완료 후 짐싸기 제안, 짐싸기 제안 수락/거절, 쭉쭉이 동행, 자동 청소, 동행 종료와 콜라 보답을 담당한다. 지갑 아이템 생성/수거, 버스정류장 이동, 버스 탑승, 집/기차/서울/엔딩 흐름은 아직 `PlayScene.js`에 남아 있다.

## Recent Refactor Notes

- Added `src/systems/TravelEndingSystem.js`.
- `TravelEndingSystem` now owns the bus stop route phase: bus stop object creation, bus stop arrival check, bus arrival tween, boarding transition, and bus stop cleanup.
- `PlayScene.js` keeps wrapper methods with the old names for compatibility:
  - `getTravelBusStopPoint`
  - `createTravelBusStopObjects`
  - `startBusStopBoardingSequence`
  - `getTravelBusArrivalPoint`
  - `updateQuestRouteGuide`
  - `updateTravelBusRouteGuide`
  - `checkTravelBusStopArrival`
  - `startBusArrivalSequence`
  - `boardTravelBus`
  - `cleanupTravelBusStopSequence`
- `startTravelHomeSequence` and later home/packing/train/ending cutscene flow still live in `PlayScene.js`.
- Next safe step: move `startTravelHomeSequence` through the room packing entry point into `TravelEndingSystem`, while keeping the existing `PlayScene` wrapper names.

## Start Screen Mobile Note

- `src/scenes/StartScene.js` was adjusted so the start screen uses the actual mobile viewport size on touch devices.
- When the player chooses new game or continue, `StartScene` resizes Phaser back to the main game base size `768x480`.
- This is intentional: it removes the start illustration side margins on mobile without changing the main gameplay camera/layout.
- If the start screen is edited again, keep this split:
  - Start screen: viewport-sized on touch devices.
  - Prologue/Play scenes: existing base game size.

## Recent Gameplay And Refactor Notes

- Mobile landscape camera zoom is back to `1` via `GAME_CONFIG.wideCameraZoom`.
- Recycling bin interaction was widened without overlapping neighboring bins:
  - `recycleBinHitboxWidth: 128`
  - `recycleBinHitboxHeight: 184`
  - `recycleBinHitboxYOffset: 22`
- The hitbox is intentionally taller rather than wider, so the player can recycle from front/back while the three bin zones remain separate.
- Recycling center creation moved from `PlayScene.createRecyclingCenter()` into `YebiQuestSystem.createRecyclingCenter()`.
- `PlayScene.createRecyclingCenter()` is now only a compatibility wrapper.
- Build check after this change passed with `npm.cmd run build`; generated `dist/` was removed.

## Tiled Tileset Workflow Notes

- Active map file is `assets/maps/chapter1-samgakji-map.json`.
- The old extra map file `assets/maps/samgakji-map.json` was removed earlier because it was not used by the game.
- Tiled maps now support multiple tilesets.
- `Preload.js` loads the map JSON first, reads the `tilesets` list, and queues each tileset image found in the exported map.
- `PlayScene.createTiledMap()` now builds map layers with all loaded Tiled tilesets instead of assuming a single hard-coded tileset.
- Current extra tileset added for editing:
  - `assets/tilesets/park_tiles.png`
  - `assets/tilesets/park_tiles.tsx`
  - Tiled tileset name: `park_tiles`
  - Tile size: `32x32`
  - Image size: `512x512`
  - Columns: `16`
  - Tile count: `256`
- User-facing Tiled instructions live in `assets/maps/TILED_GUIDE.md`.
- Recommended Tiled workflow:
  - Add new PNG/TSX tilesets under `assets/tilesets/`.
  - Add the `.tsx` tileset inside Tiled.
  - Paint directly in Tiled.
  - Export over `assets/maps/chapter1-samgakji-map.json`.
- Prefer external `.tsx` tilesets while the map is still growing.
- Embedded tilesets are supported too, but external `.tsx` is the recommended default because it keeps tileset metadata separate from the map JSON and is easier for ongoing Tiled editing.
- Do not rename a tileset after it is already used by the map unless the map JSON is updated too.
- Do not move existing tiles around inside `samgakji-tiles.png`; append new tiles or add a new tileset instead.

### Known Issue: `park_tiles`

- The user added `park_tiles` as an extra Tiled tileset.
- Cause found: the map JSON stores `park_tiles` as an external TSX reference:
  - `"source":"../tilesets/park_tiles.tsx"`
  - The previous loader only supported embedded tilesets with direct `image` fields.
- Fix applied in `src/scenes/Preload.js`:
  - Load external `.tsx` tileset files referenced by the Tiled JSON.
  - Parse the TSX `<tileset>` and `<image>` metadata.
  - Normalize the cached map JSON and tilemap JSON into embedded tileset-shaped objects before `PlayScene` creates the map.
  - Then queue each tileset PNG image by its Tiled tileset name.
- This means future extra tilesets can be added in Tiled as external TSX files, as long as the `.tsx` and PNG remain under `assets/tilesets/` and paths stay valid.
- Current check: `chapter1-samgakji-map.json` references `park_tiles`, but no placed tile currently uses gid `65+`; only `samgakji_tiles` is used on the tile layers right now.
- Build passed after this change with `npm.cmd run build`; generated `dist/` was removed.

## Next Map Refactor Candidate

- Added `src/systems/TiledMapSystem.js`.
- `TiledMapSystem` now owns Tiled map setup and code-side map object collider helpers.
- `PlayScene.js` keeps only the compatibility wrapper methods still used by existing callers:
  - `createMap`
  - `getMapPoint`
  - `addObjectCollider`
- This keeps existing systems working while reducing direct map-loading responsibility in `PlayScene.js`.
- Build check after this change passed with `npm.cmd run build`; generated `dist/` was removed.
- Follow-up step also moved fallback map construction into `TiledMapSystem`:
  - `createFallbackMap`
  - `addWall`
  - `addTiledRect`
- The temporary `PlayScene.js` wrappers for these fallback helpers were later removed after search confirmed no external callers.
- Build check after this follow-up also passed with `npm.cmd run build`; generated `dist/` was removed.
- Unused Tiled compatibility wrappers were removed from `PlayScene.js` after search confirmed no external callers.
- Current line counts after this step:
  - `src/scenes/PlayScene.js`: about 2420 lines
  - `src/systems/TiledMapSystem.js`: about 269 lines
- Next safe map cleanup:
  - `findTiledTileset` was confirmed unused and removed from both `PlayScene.js` and `TiledMapSystem.js`.
  - Keep `getMapPoint()` and `addObjectCollider()` wrappers longer because many systems still call them through `scene`.

## Latest Wrapper Cleanup

- Removed unused `PlayScene.js` compatibility wrappers for logic that already lives in dedicated systems:
  - Clothing shop internals now stay in `ClothingShopSystem`.
  - Packing modal internals now stay in `PackingSystem`.
  - Vending menu internals now stay in `VendingMachineSystem`.
  - Travel ending internals now stay in `TravelEndingSystem`.
- Kept thin wrappers where current systems still call through `scene`, especially keyboard/control entry points and checkpoint restore hooks:
  - `openClothingShopMenu`
  - `closeClothingShopMenu`
  - `completeClothesShoppingQuest`
  - `selectFocusedClothingShopOption`
  - `handleClothingShopKeyboard`
  - `openPackingMenu`
  - `closePackingMenu`
  - `selectFocusedPackingOption`
  - `handlePackingMenuKeyboard`
  - `openVendingMenu`
  - `handleVendingMenuKeyboard`
  - `selectHighlightedVendingOption`
  - `playVendingPaymentAnimationLike`
  - bus stop checkpoint helpers such as `createTravelBusStopObjects` and `updateTravelBusRouteGuide`
- Build check passed after this cleanup with `npm.cmd run build`; generated `dist/` was removed.

## Latest Yebi Route Flow Note

- Recycling quest route guidance intentionally still targets the recycling center, not Yebi.
- When recycle quest state is `unlocked`, `YebiQuestSystem.update()` now watches for the player arriving near the recycling center.
- On arrival, Yebi briefly approaches the player, world input is paused with `SceneState.CUTSCENE`, then the existing recycle quest dialogue starts through `YebiQuestSystem.showQuestDialogue()`.
- `PlayScene.update()` only calls `this.yebiQuestSystem?.update(time, delta);`; the arrival detection and approach flow live in `YebiQuestSystem`.
- Recycling bin hitbox values were not changed in this step. Keep the current non-overlapping bin range unless the user explicitly asks again.
- Verification after this change:
  - Node syntax check passed for `src/systems/YebiQuestSystem.js`.
  - Node syntax check passed for `src/scenes/PlayScene.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` could not complete because local `vite` was not installed/available.

## Next Refactor Step

- Continue shrinking `PlayScene.js` by moving one owner area at a time.
- Recommended next target: route/quest marker wrapper cleanup, because `RouteGuideSystem` already owns most route drawing.
- Avoid moving dialogue content and quest state transitions in the same patch. They are riskier and should be extracted only after the wrappers and pure UI helpers are settled.

## External Refactor Review And Direction

The user shared an external review of the current architecture. Overall assessment: the review matches the current direction. `PlayScene.js` has been reduced a lot and the `systems/` split is working, but the project is still in a transitional structure where `PlayScene` acts as scene, composer, state container, and compatibility bridge.

Important interpretation for future Codex work:

- Do not aim for `PlayScene.js` to become zero lines.
- The right target is for `PlayScene` to be a scene composer and bridge only.
- Short-term target: keep reducing toward roughly 2000 lines.
- Mid-term target: 1200-1500 lines.
- Long-term target: 800-1000 lines, only if it can be done safely.
- Never shrink `PlayScene` by scattering unclear dependencies across systems. Move one owner area at a time.

Recommended refactor order from here:

1. State initialization extraction.
   - Add something like `src/config/InitialGameState.js` or `src/state/createInitialGameState.js`.
   - Move default run flags, quest states, inventories, timers, and unlock flags into one factory.
   - First step should only centralize defaults. Do not redesign checkpoint format in the same patch.
   - Goal: make `constructor()` and `resetRunState()` shorter and easier to compare.

2. Quest state constants.
   - Add `src/config/QuestStates.js`.
   - Replace direct strings gradually, starting with one system at a time.
   - Good first targets: `SunisuniQuestSystem`, `JjookQuestSystem`, `RouteGuideSystem`, then `PlayScene` bridge checks.
   - Avoid changing state names and behavior in the same patch. This is a safety refactor.

3. Preload asset list extraction.
   - `Preload.js` is large and will keep growing.
   - Add `src/config/assets/` modules such as `coreAssets.js`, `questAssets.js`, `shopAssets.js`, `endingAssets.js`, `audioAssets.js`.
   - Keep `Preload.js` responsible for loading mechanics, Tiled TSX parsing, and Phaser calls.
   - Move only static asset arrays first.

4. DOM/UI binding extraction.
   - Current `PlayScene.create()` still owns many DOM lookups and event listener registrations.
   - Consider `src/systems/DomInputSystem.js` or `src/systems/HtmlUiBindingSystem.js`.
   - This should own DOM element lookup, listener attach/detach, and mobile button bindings.
   - Keep actual game logic in existing systems.

5. Dialogue JSON migration, starting small.
   - Do not move every dialogue at once.
   - Recommended first target: hospital/pharmacy dialogue because educational text changes often.
   - Then move Sunisuni, Jjook, ending, and finally Yebi.
   - Keep `DialogueSystem` display-only and use `DialogueManager` for JSON lookup/action dispatch.

6. Save/checkpoint structure cleanup before Chapter 2.
   - `CheckpointStorage` currently works but depends heavily on scene fields.
   - Do not redesign this during ordinary feature work.
   - Before Chapter 2, consider a versioned state shape:
     `{ version, chapter, money, player, quests, inventory, flags, unlocked }`.
   - This should be planned as its own migration step.

Git and build hygiene notes from the review:

- Keep `dist/`, `node_modules/`, `photothumb.db`, `Thumbs.db`, `.DS_Store`, and unused original asset folders out of GitHub.
- Recommended `.gitignore` entries:
  - `node_modules/`
  - `dist/`
  - `.DS_Store`
  - `Thumbs.db`
  - `photothumb.db`
  - `*.db`
- Current Phaser vendor script warnings from Vite are not urgent. Keep the vendor Phaser approach for now unless the user explicitly asks to move Phaser into npm imports.

What not to do yet:

- Do not convert to TypeScript now.
- Do not migrate Phaser from `vendor/phaser.min.js` to npm now.
- Do not rewrite the entire checkpoint system during Chapter 1 stabilization.
- Do not move all dialogue to JSON at once.

Standing rule for future features:

- New quest logic goes into a system file.
- New static data goes into `config` or `data`.
- New dialogue should prefer `data/dialogues` when practical.
- `PlayScene` may instantiate systems, call update hooks, expose compatibility wrappers, and pass state, but should not become the home for new feature logic.

## Latest Initial State Refactor

- Added `src/config/InitialGameState.js`.
- `createInitialGameState()` now owns the default values for run/game state such as:
  - cleaning counters
  - recycle inventory and flags
  - Jjook/Sunisuni/clothes/packing quest flags
  - travel bus transient state
  - modal selection defaults
  - route/marker/interior transient containers
  - map point/object fallback containers
- `PlayScene.constructor()` now applies `Object.assign(this, createInitialGameState())` instead of manually listing those defaults.
- `PlayScene.resetRunState()` now performs cleanup side effects first, then reapplies `createInitialGameState()`.
- This was intentionally only a defaults centralization step:
  - Checkpoint format was not changed.
  - Quest state string values were not changed.
  - Timer cleanup, DOM cleanup, and system cleanup still happen in `PlayScene.resetRunState()` before defaults are reapplied.
  - Phaser vectors such as `lastDirection` and `joystickVector` still live in `PlayScene`, because they need existing Phaser vector instances reset rather than plain object replacement.
- Verification after this change:
  - Node syntax check passed for `src/config/InitialGameState.js`.
  - Node syntax check passed for `src/scenes/PlayScene.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` was attempted, but local `vite` was not installed/available.
- Suggested next safe step:
  - Add `src/config/QuestStates.js`.
  - Convert one owner area at a time, starting with the most self-contained state checks.
  - Do not rename state values while converting; import constants that preserve the existing string values.

## Latest Quest State Constants Refactor

- Added `src/config/QuestStates.js`.
- This file centralizes existing quest state string values without renaming them.
- Added state groups:
  - `QuestState`
  - `CanQuestState`
  - `RecycleQuestState`
  - `JjookQuestState`
  - `SunisuniQuestState`
  - `ClothesQuestState`
  - `PackingQuestState`
- First adoption pass was intentionally small:
  - `src/config/InitialGameState.js` now uses quest state constants for default quest states.
  - `src/systems/QuestManager.js` now returns `CanQuestState` and `RecycleQuestState` constants from its state getter methods.
  - `src/systems/RouteGuideSystem.js` now uses constants for route-trigger state checks.
- Behavior should remain unchanged because all constants preserve the previous raw string values.
- This is not a full migration yet. Many raw state strings still exist in `PlayScene.js`, `YebiQuestSystem`, `JjookQuestSystem`, `SunisuniQuestSystem`, `CheckpointStorage`, `TravelEndingSystem`, and UI hint logic.
- Suggested next safe conversion order:
  1. `YebiQuestSystem`, because it mostly depends on `CanQuestState` and `RecycleQuestState`.
  2. `UIManager` quest hint checks.
  3. `CheckpointStorage` restore marker checks, carefully and in a separate patch.
  4. `JjookQuestSystem` and `SunisuniQuestSystem`, one file at a time.
  5. Remaining `PlayScene.js` bridge checks last.
- Verification after this change:
  - Node syntax check passed for `src/config/QuestStates.js`.
  - Node syntax check passed for `src/config/InitialGameState.js`.
  - Node syntax check passed for `src/systems/QuestManager.js`.
  - Node syntax check passed for `src/systems/RouteGuideSystem.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` was attempted, but local `vite` was not installed/available.

## Latest PC Mouse Movement Note

- Added optional PC mouse movement while keeping keyboard movement and Space interaction.
- `PlayerController` now handles Phaser canvas `pointerdown` events:
  - Only left mouse clicks set a movement target.
  - Touch input is ignored here and continues to use the existing joystick flow.
  - Clicks on interactive game objects are ignored as movement targets, so NPC/object clicks do not accidentally move the player.
  - Keyboard/WASD/arrow movement cancels the current mouse movement target immediately.
  - Menus, dialogue, interior/cutscene states, and blocked world input clear or prevent mouse movement.
- `InitialGameState` now includes `mouseMoveTarget: null`.
- Yebi NPC click now calls `showYebiQuestDialogue()` directly instead of routing through general primary action, matching the user request for NPC left-click dialogue.
- Existing Space behavior is unchanged: it still runs the normal interaction priority through `handlePrimaryAction()`.
- Verification after this change:
  - Node syntax check passed for `src/controllers/PlayerController.js`.
  - Node syntax check passed for `src/config/InitialGameState.js`.
  - Node syntax check passed for `src/scenes/PlayScene.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` was attempted, but local `vite` was not installed/available.
- Future improvement if needed:
  - Add click-to-NPC auto-walk and talk on arrival. Current implementation only makes direct NPC clicks trigger the existing dialogue handler; it does not pathfind to distant NPCs.

### PC Mouse Movement Follow-Up

- A follow-up fix changed mouse movement target coordinates to use `pointer.positionToCamera(scene.cameras.main)` instead of raw `pointer.worldX/worldY`.
  - Reason: the game uses Phaser scaling/camera zoom, so explicit camera conversion is more reliable for canvas click positions.
- Another follow-up loosened mouse pointer type detection:
  - It now reads `pointer.event?.pointerType || pointer.pointerType || "mouse"`.
  - Reason: some Phaser/browser combinations may leave `pointer.pointerType` empty even for mouse input, which can cause floor-click movement to be ignored.
- If PC floor-click movement still does not work, next suspected blocker:
  - `currentlyOver.length > 0` may be true because a map/object hit area is under the cursor.
  - Possible fix: ignore only interactive NPCs/shops/buttons as movement blockers, while allowing ordinary world object overlap clicks to set a movement target.

### Mouse Movement Feature Ideas And Difficulty

1. Long-distance left-click with obstacle avoidance/pathfinding.
   - Difficulty: medium to high.
   - Current click movement is straight-line movement toward a target point.
   - To avoid obstacles, the game needs pathfinding over map collision data.
   - Recommended approach:
     - Use Tiled collision layer or generated collision rectangles as the source of blocked cells.
     - Build a simple grid over the world, likely 24px or 32px cells.
     - Use A* pathfinding from player cell to clicked cell.
     - Move through waypoints one by one.
   - Risks:
     - Needs careful tuning around narrow passages, NPCs, bins, trees, benches, and map object colliders.
     - Road/crosswalk rules could later conflict with free pathfinding unless route rules are included.
     - Should not be mixed into `PlayScene`; put it in `PlayerController` plus possibly a new `PathfindingSystem`.
   - Recommendation:
     - Do not add immediately during light refactoring.
     - Add later as a focused feature after click movement is stable.

2. Hold left mouse button and continuously move toward the cursor without repeated clicks.
   - Difficulty: low to medium.
   - This is much easier than pathfinding.
   - Current movement target is set only on `pointerdown`.
   - Add mouse hold tracking so `pointermove` updates `mouseMoveTarget` while the left button is held.
   - Suggested implementation:
     - Add `isMouseMoveHeld` to `InitialGameState`.
     - In `PlayerController`, listen to scene `pointerdown`, `pointermove`, `pointerup`, and maybe `pointerupoutside`.
     - On left mouse down over walkable floor, set hold true and update target.
     - On pointer move while held, update target continuously.
     - On pointer up, keep moving to the last target or stop, depending desired feel. RPG-style usually keeps moving to last point; action-style stops on release.
   - Risks:
     - Must not interfere with dragging/mobile joystick.
     - Must not update target while the cursor is over UI, dialogue, modal, or interactive NPC/shop objects.
   - Recommendation:
     - Reasonable next improvement once basic PC click movement is confirmed working.
     - Keep it inside `PlayerController`; `PlayScene` should not gain new movement logic.

## Latest Quest State Constants Adoption

- Continued the `QuestStates.js` migration in a narrow, behavior-preserving pass.
- Updated `src/systems/YebiQuestSystem.js` to use:
  - `CanQuestState.INACTIVE`
  - `CanQuestState.ACTIVE`
  - `RecycleQuestState.LOCKED`
  - `RecycleQuestState.UNLOCKED`
  - `RecycleQuestState.ACTIVE`
  - `RecycleQuestState.COMPLETED`
- Updated `src/systems/UIManager.js` next-quest hint checks to use:
  - `RecycleQuestState`
  - `JjookQuestState`
  - `SunisuniQuestState`
  - `ClothesQuestState`
- No quest state string values were renamed. This is still a safety refactor only.
- Verification after this change:
  - Node syntax check passed for `src/systems/YebiQuestSystem.js`.
  - Node syntax check passed for `src/systems/UIManager.js`.
  - Node syntax check passed for `src/config/QuestStates.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` was attempted, but local `vite` was not installed/available.
- Suggested next safe conversion:
  - `CheckpointStorage` marker/restore state checks, because it reads several quest states but must be changed carefully.
  - Keep that patch limited to imports and comparisons only. Do not change save format yet.

## Latest Checkpoint Quest State Refactor

- Continued the `QuestStates.js` migration in the next safe owner file.
- Added missing constants that preserve existing raw string values:
  - `ClothesQuestState.DECLINED`
  - `PackingQuestState.OFFERED`
  - `PackingQuestState.DECLINED`
  - `PackingQuestState.ENDING_COMPLETE`
- Updated `src/systems/CheckpointStorage.js` to import quest state constants and use them for:
  - prologue save defaults
  - scene checkpoint fallback values
  - restored scene defaults
  - restore-time marker checks
  - restore-time bus stop route checks
- Save format was not changed. Stored values are still the same strings as before.
- Verification after this change:
  - Node syntax check passed for `src/systems/CheckpointStorage.js`.
  - Node syntax check passed for `src/config/QuestStates.js`.
  - `git diff --check` passed with only Windows line-ending warnings.
  - `npm.cmd run build` passed when rerun outside the sandbox after the sandbox blocked access while loading `vite.config.js`.
  - Generated `dist/` was removed.
- Suggested next safe conversion:
  - `JjookQuestSystem.js`, because it owns many clothes/packing state transitions.
  - Keep that patch to imports, comparisons, and assignments only.
  - Do not change dialogue content or quest flow at the same time.

## Mobile Loading Speed Plan

- Current symptom: mobile loading feels slow as assets have grown.
- Likely causes to measure first:
  - Many large PNG backgrounds/interior scenes are preloaded even before the player reaches those scenes.
  - Multiple high-resolution sprite/portrait/BGM assets are loaded up front.
  - PWA/service-worker cache can preserve old bundles, so testing may mix old and new load behavior.
- First measurement step:
  - Add a lightweight preload timing log in development only, or inspect the Network panel on a phone/desktop mobile emulator.
  - Record largest assets by transfer size and decode time.
- Recommended implementation order:
  1. Keep StartScene assets minimal: title background, logo, start buttons, only the first BGM if needed.
  2. Split PlayScene preload into groups: core map/player/trash first, then lazy-load interiors/endings only when their scene starts.
  3. Lazy-load heavy BGM and ambient tracks by situation: shop, hospital, pharmacy, bus, train, ending.
  4. Compress oversized PNGs. Keep pixel sprites lossless, but consider WebP for large illustration backgrounds if Safari/PWA behavior is verified.
  5. Add explicit asset manifests by chapter so Chapter 1 can load only what it needs.
  6. Update PWA cache version whenever asset loading changes, so mobile home-screen installs do not reuse stale caches.
- Refactor boundary:
  - Do not put lazy-loading logic directly into `PlayScene.js`.
  - Prefer an `AssetLoadSystem` or extend `Preload.js`/scene-specific loader helpers.
  - Keep the first optimization patch small: lazy-load one heavy category, such as ending/interior backgrounds, then verify mobile.

## Latest Quest State Constants Migration (Step 1)

- Centralized intermediate quest states in `src/config/QuestStates.js` to ensure the entire quest lifecycle has robust type/constant representation.
- Added states:
  - `JjookQuestState.CHOOSING_DRINK = "choosing_drink"` (used during vending machine selection in `VendingMachineSystem` and `PlayScene`)
  - `SunisuniQuestState.ACCEPTED_HELP = "accepted_help"` (used in hospital escort flow in `SunisuniQuestSystem`)
  - `SunisuniQuestState.HOSPITAL_RECEPTION = "hospital_reception"` (used in hospital quiz reception in `SunisuniQuestSystem`)
  - `SunisuniQuestState.GOT_PRESCRIPTION = "got_prescription"` (used in prescription pharmacy check in `SunisuniQuestSystem`)
  - `SunisuniQuestState.MEDICINE_PAID = "medicine_paid"` (used in medicine payment animation in `SunisuniQuestSystem`)
- Did not change any existing string values. Left actual game files (`PlayScene.js`, `JjookQuestSystem.js`, `SunisuniQuestSystem.js`, `VendingMachineSystem.js`) untouched.
- Node syntax check passed: `node -c src/config/QuestStates.js`

## Latest Quest State Constants Migration (Step 2 - Integration Complete)

- Successfully refactored and adopted the centralized constants from `src/config/QuestStates.js` in all dependent files:
  - `src/systems/JjookQuestSystem.js`
  - `src/systems/SunisuniQuestSystem.js`
  - `src/systems/VendingMachineSystem.js`
  - `src/scenes/PlayScene.js` (bridge checks)
- Replaced all raw hardcoded string comparisons and assignments of quest states with type-safe, imported constants (e.g., `JjookQuestState.WALLET_MISSING`, `SunisuniQuestState.GOING_HOSPITAL`, etc.).
- There are no functional or behavioral alterations in the gameplay. All dialogue, interaction triggers, and quest status checks operate exactly as before, now backed by centralized constants.
- Verified all syntax checks on the refactored files:
  ```powershell
  node -c src/scenes/PlayScene.js
  node -c src/systems/JjookQuestSystem.js
  node -c src/systems/SunisuniQuestSystem.js
  node -c src/systems/VendingMachineSystem.js
  ```
- Executed `npm.cmd run build` successfully, certifying Vite/Phaser bundles successfully without any compilation errors.
- Cleaned up the temporarily generated `dist/` directory.

## Latest DOM/UI Binding Extraction (Step 3 - HtmlUiBindingSystem Integration)

- Added `src/systems/HtmlUiBindingSystem.js` to manage all DOM element lookups, event listener attachments/detachments, and HUD state UI resets.
- Extracted extensive UI/DOM binding logic from `src/scenes/PlayScene.js` (`create()`, `resetRunState()`, `SHUTDOWN` callback) into `HtmlUiBindingSystem` to streamline the scene composer class.
- Fixed a legacy memory leak bug in the shutdown flow of `PlayScene.js` where the unbind phase detached `bacchusHandler` instead of `specialHandler` for `specialButton` click listener.
- Ensured behavior preservation: no gameplay mechanics, UI functionality, or logic handlers were changed. The integration serves strictly as a refactoring layer.
- Verified syntax checks on the updated files:
  ```powershell
  node -c src/scenes/PlayScene.js
  node -c src/systems/HtmlUiBindingSystem.js
  ```
- Executed `npm.cmd run build` successfully, verifying proper bundle builds and code integrity.
- Cleaned up the temporarily generated `dist/` directory.

## Latest Preload Asset List Extraction (Step 4 - Centralized Asset Config)

- Added `src/config/AssetsData.js` to hold static asset arrays for:
  - `EXTERNAL_ASSETS`
  - `SPRITESHEET_ASSETS`
  - `TILED_MAP`
  - `AUDIO_ASSETS`
- Refactored `src/scenes/Preload.js` to import these arrays from `src/config/AssetsData.js`, shrinking `Preload.js` from over 650 lines to ~470 lines.
- Kept `Preload.js` solely responsible for actual Phaser loading mechanics, Tiled TSX parsing, and canvas assets generation.
- Verified syntax checks on the updated files:
  ```powershell
  node -c src/config/AssetsData.js src/scenes/Preload.js
  ```
- Executed `npm.cmd run build` successfully, verifying proper bundle compilation.
- Cleaned up the temporarily generated `dist/` directory.

## Latest PC Mouse Hold-to-Move Controls (Step 5 - Input Enhancements)

- Added `isMouseMoveHeld` and `mouseMoveStartTime` states in `src/config/InitialGameState.js` to support holding down the left mouse button.
- Modified `src/controllers/PlayerController.js` to register `pointermove`, `pointerup`, and `pointerupoutside` event listeners.
- Implemented drag-walk logic inside `PlayerController.js`:
  - Tap/Click (<200ms duration): player walks all the way to the target (RPG-style).
  - Hold/Drag (>200ms duration): player continuously follows the cursor and stops immediately upon releasing the left mouse button (action-style).
  - Cancel conditions: Keyboard movement, dialogue, modals, and menus automatically clear the hold state and target.
- Verified syntax checks on the updated files:
  ```powershell
  node -c src/config/InitialGameState.js src/controllers/PlayerController.js
  ```
- Executed `npm.cmd run build` successfully to verify build compilation.
- Cleaned up the temporarily generated `dist/` directory.



