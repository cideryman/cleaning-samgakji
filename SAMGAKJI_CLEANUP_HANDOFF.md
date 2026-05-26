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
  - Keep embedded tileset data enabled when exporting JSON.
- Do not rename a tileset after it is already used by the map unless the map JSON is updated too.
- Do not move existing tiles around inside `samgakji-tiles.png`; append new tiles or add a new tileset instead.

### Known Issue: `park_tiles`

- The user added `park_tiles` as an extra Tiled tileset, but it currently causes an error in-game.
- Do not assume the multi-tileset workflow is fully stable yet.
- Next time, inspect without changing gameplay first:
  - Check the exported `assets/maps/chapter1-samgakji-map.json` tileset entry for `park_tiles`.
  - Confirm the `image` path resolves correctly from the map JSON location.
  - Confirm the tileset `name` in Tiled exactly matches the texture key loaded by `Preload.js`.
  - Confirm `assets/tilesets/park_tiles.tsx` and `assets/tilesets/park_tiles.png` dimensions match `32x32` tile settings.
  - Check browser console/build output for the exact missing texture or tileset error.
- For now, this is only documented here; no code fix was applied for this issue.

## Next Map Refactor Candidate

- `PlayScene.js` still owns too much Tiled map setup.
- Safe next extraction target: a future `TiledMapSystem` or `MapLoaderSystem`.
- Candidate methods to move together:
  - `createMap`
  - `createTiledMap`
  - `createTiledTilesets`
  - `getTiledTilesetTextureKey`
  - `applyTiledObjects`
  - `createTiledMapObjects`
  - map-object fallback helpers that only exist to bridge Tiled objects and code defaults
- Keep old `PlayScene` wrapper methods temporarily during extraction so gameplay does not break.
- After extraction, check whether `findTiledTileset` is unused and remove it only if build/search confirms it is safe.
