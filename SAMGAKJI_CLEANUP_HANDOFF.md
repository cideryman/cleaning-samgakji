# 삼각지 대청소 개발 핸드오프

이 문서는 집/회사 또는 다른 Codex 세션에서 작업을 이어갈 때 현재 상태, 개발 원칙, 남은 작업을 빠르게 확인하기 위한 기준 문서입니다.

앞으로 이 문서를 수정할 때도 아래 구조를 유지합니다. 새 기록은 무작정 뒤에 붙이지 말고, 가능한 한 해당 섹션에 반영합니다. 길어진 작업 기록은 요약만 남기고, 실제 판단에 필요한 원인/수정 파일/검증/다음 확인만 적습니다.

## 1. 프로젝트 개요

- 프로젝트명: 삼각지 대청소
- 작업 폴더: `C:\Users\sec\Desktop\cleaning-samgakji`
- 기술 스택: Phaser.js, Vanilla JavaScript, HTML/CSS DOM UI, Vite
- 실행/검증 기본 명령: `npm.cmd run build`

게임 방향:
- 발달장애 이용자가 생활 속 청소, 분리수거, 병원/약국, 자판기, 상점, 여행 준비를 자연스럽게 경험하는 2D 픽셀 게임입니다.
- 퀘스트 보상은 되도록 직접 돈 지급보다 도구, 기능 해금, 생활 경험 중심으로 설계합니다.
- 돈은 반복 청소와 분리수거 루프에서 얻는 구조를 기본으로 합니다.

## 2. 현재 구현된 기능

- 프롤로그: 쭉쭉이의 서울 여행 제안, 돈 부족 확인, 엄마의 청소 수당 제안, 삼각지 도착.
- 초반 튜토리얼: 이동, 쓸기, 청소, 여비 NPC와 대화.
- 여비 퀘스트:
  - 캔 20개 모으기 완료 시 빗자루 지급.
  - 분리수거 퀘스트 완료 시 분리수거장 보상 해금.
  - 분리수거 해금 후 쓰레기 수거 100원 + 맞는 통에 분리수거 시 추가 100원.
- 쭉쭉이 퀘스트:
  - 지갑 찾기, 자판기 음료 선택, 플로깅 동행, 옷가게/짐싸기/엔딩 연결.
- 수니수니/병원/약국 퀘스트:
  - 병원 동행, 처방전, 약국, 활력수/건강 교육.
  - 수니수니 완료 보상은 돈 대신 활력수 중심으로 변경됨.
- 옷가게:
  - 여행 준비용 옷/신발/외투 등 선택, 한 번에 계산, 보유 아이템 HUD 표시.
- 짐싸기:
  - 여행 가방 준비, 이름표 커스터마이저, 엔딩 흐름 연결.
- 엔딩:
  - 버스정류장 이동, 집/역/서울 여행 장면, 엄마 전화, 최종 엔딩 화면.
- 지도/교통:
  - Tiled 기반 맵, 건물/나무/벤치/분리수거장, 횡단보도, 보행자 신호등, 차량 시스템.
- UI:
  - HUD, 다음 목표 안내, 설정창, 저장 후 나가기, 휴식/통계 성취 앨범, 배움노트, 큰 글씨 모드, TTS 토글, 사운드 토글.
- 조작:
  - 모바일 조이스틱/빗자루 버튼.
  - PC 키보드, 스페이스 상호작용, 마우스 클릭 이동/A* 경로 이동, NPC 좌클릭 대화.

## 3. 핵심 시스템 구조

- `src/scenes/PlayScene.js`
  - 아직 중앙 조립자 역할이 큽니다.
  - 새 기능 로직을 직접 추가하지 않는 것이 원칙입니다.
  - 시스템 생성, 연결, update 호출 정도만 남기는 방향으로 계속 줄입니다.
- `src/scenes/PrologueScene.js`
  - 프롤로그 대사와 배경 전환.
  - 최근 대사량을 약 22줄에서 12줄 수준으로 압축했습니다.
- `src/config/InitialGameState.js`
  - 게임 기본 상태.
- `src/config/QuestStates.js`
  - 퀘스트 상태 문자열 상수.
- `src/config/AssetsData.js`
  - 주요 에셋 목록/경로.
- `src/config/GameConstants.js`
  - 게임 수치, 좌표, 크기, 보상, 줌 등.
- `src/controllers/PlayerController.js`
  - 이동, 키보드/마우스/조이스틱 입력.
- `src/systems/CheckpointStorage.js`
  - 저장/이어하기, 기존 세이브 호환 fallback.
- `src/systems/SlimeSystem.js`
  - 쓰레기 스폰/리스폰/특수 쓰레기.
  - `ensureActiveTrash()`로 이어하기 직후 최소 쓰레기 수량을 보장합니다.
- `src/systems/CleaningSystem.js`
  - 쓸기, 쓰레기 제거, 보상 처리.
- `src/systems/YebiQuestSystem.js`
  - 캔 수집/분리수거 퀘스트.
- `src/systems/JjookQuestSystem.js`
  - 쭉쭉이 지갑/자판기/플로깅/옷가게/짐싸기 연결.
- `src/systems/SunisuniQuestSystem.js`
  - 수니수니, 병원/약국, 활력수 교육.
- `src/systems/ClothingShopSystem.js`
  - 옷가게 DOM 모달, 선택/계산/영수증.
- `src/systems/PackingSystem.js`
  - 짐싸기 DOM 모달, 이름표 커스터마이저.
- `src/systems/TravelEndingSystem.js`
  - 버스정류장, 집/서울/전화/최종 엔딩.
  - 최종 엔딩 이미지는 로딩 fallback과 fadeIn 보강이 들어가 있습니다.
- `src/systems/SceneControlSystem.js`
  - 월드 입력 차단, DOM 오버레이 감지.
- `src/systems/HtmlUiBindingSystem.js`
  - 설정창, 저장 후 나가기, DOM 버튼 바인딩.
- `src/systems/UIManager.js`
  - HUD, 휴식/통계창, 토스트.
- `src/systems/NextGoalSystem.js`
  - 자유 이동 중 상단 HUD 근처에 짧은 다음 행동 안내 표시.
- `src/systems/EducationalGuideSystem.js`
  - 교육 안내/배움노트.
- `src/systems/DialogSystem.js`, `DialogueManager.js`, `PortraitManager.js`
  - 대화창, JSON 대사 준비 구조, 초상화 오버레이.
- `src/systems/PathfindingSystem.js`
  - A* 경로 탐색.
- `src/systems/RoadTrafficSystem.js`
  - 차량/신호등/횡단보도 관련 로직.
- `src/systems/TiledMapSystem.js`
  - Tiled 맵 로딩, 오브젝트 레이어, 충돌.

## 4. 반드시 지킬 개발 원칙

### PlayScene 원칙

- `PlayScene.js`에 새 퀘스트 로직, 새 DOM 모달 로직, 새 보상 로직을 직접 넣지 않습니다.
- 새 기능은 가능한 한 `src/systems/` 안의 기존 시스템 또는 새 시스템에 넣습니다.
- `PlayScene.js`에는 시스템 생성, 연결, update 호출, 얇은 위임만 남깁니다.
- 이미 존재하는 중계 함수는 급하게 모두 제거하지 말고, 새 기능 추가 때 하나씩 줄입니다.

### 데이터와 상태 원칙

- 퀘스트 상태 문자열은 가능하면 `QuestStates.js` 상수를 사용합니다.
- 기본 상태는 `InitialGameState.js` 기준으로 관리합니다.
- 게임 밸런스 수치, 좌표, 보상, 크기는 가능하면 `GameConstants.js` 또는 config에 둡니다.
- 대사, 선택지, 음성 경로는 장기적으로 `src/data/dialogues*.json`으로 옮깁니다.
- 돈/아이템/기능 해금 보상 변경 시 실제 지급 로직, 대사, 효과음, 애니메이션을 함께 확인합니다.

### DOM UI 원칙

- 설정창, 옷가게, 짐싸기, 휴식창, 이름표, 교육 안내는 DOM UI입니다.
- DOM 모달을 만들 때는 CSS 스크롤 구조와 Phaser 월드 입력 차단을 함께 처리합니다.
- 모바일 가로 화면에서 하단 버튼이 잘리면 안 됩니다.
- iPhone Safari/PWA standalone 기준으로 터치 스크롤이 가능해야 합니다.

### 저장/복원 원칙

- 저장 데이터는 단순 수치만 저장하지 말고, 이어하기 후 시스템이 다시 작동할 상태까지 복원해야 합니다.
- `CheckpointStorage.js`를 수정할 때는 이어하기, 프롤로그 완료, 퀘스트 상태, 튜토리얼 상태, 리스폰을 함께 확인합니다.
- 오래된 세이브 호환이 필요하면 `CheckpointStorage`에서 추론/fallback을 둡니다.

### 핸드오프 정리 원칙

- 핸드오프는 계속 누적 로그가 아니라, 이어받기용 기준 문서입니다.
- 새 작업 기록은 해당 섹션에 요약 반영하고, 꼭 필요한 경우에만 “최근 변경 로그”에 추가합니다.
- 기록 형식은 `문제/원인/수정 파일/검증/다음 확인`을 기본으로 합니다.
- 오래된 미해결 항목이 해결되면 “남은 작업”에서 제거하거나 상태를 바꿉니다.
- 인코딩이 깨져 보이는 오래된 문장은 그대로 늘리지 말고, 이해 가능한 한국어로 다시 요약합니다.

## 5. 반복 오류 방지 기준

### 저장/이어하기/리스폰

반복 문제:
- 저장 후 이어하기에서 튜토리얼/체크포인트 복원 순서 때문에 쓰레기 리스폰이 멈추거나 맵에 쓰레기가 없는 상태로 시작한 적이 있습니다.

기준:
- 저장 시 `tutorialState`, 퀘스트 상태, 주요 flags, 인벤토리, 돈, 완료 여부가 함께 저장되는지 확인합니다.
- 이어하기 시 `CheckpointStorage.applyToScene()` 이후 `tutorialSystem.state` 같은 시스템 내부 상태도 동기화합니다.
- 튜토리얼 완료 상태라면 `SlimeSystem.startRespawnLoop()`가 다시 시작되어야 합니다.
- 이어하기 직후 맵에 쓰레기가 너무 적으면 `SlimeSystem.ensureActiveTrash()` 같은 보장 함수가 호출되어야 합니다.
- 새 퀘스트가 쓰레기 생성/제거/청소 상태에 영향을 주면, 저장 후 이어하기 시 같은 상태가 재현되는지 확인합니다.
- 체크포인트 복원 전에만 쓰레기 생성 여부를 판단하지 않습니다.

검증:
- 새 게임 시작 -> 튜토리얼 완료 -> 저장 후 나가기 -> 이어하기 -> 쓰레기가 즉시 보이는지 확인.
- 쓰레기를 모두 치운 상태 -> 저장 -> 이어하기 -> 일정 수량이 보충되는지 확인.
- 퀘스트 중 저장 -> 이어하기 -> HUD/마커/리스폰이 정상인지 확인.

### DOM 오버레이/모달 입력 차단과 모바일 스크롤

반복 문제:
- HTML 모달이 떠 있는데 터치/클릭/스페이스 입력이 뒤쪽 Phaser 캔버스로 내려간 적이 있습니다.
- 모바일 가로 화면에서 하단 버튼이 잘리고, 터치 스크롤이 막힌 적이 있습니다.

overlay/root 기준:
- `position: fixed`
- `inset: 0`
- Phaser canvas/HUD보다 높은 `z-index`
- `pointer-events: auto`
- `overflow-y: auto`
- `overscroll-behavior: contain`
- `touch-action: pan-y`
- `-webkit-overflow-scrolling: touch`

panel 기준:
- `max-height: calc(100dvh - 안전 여백)`
- `overflow-y: auto`
- `touch-action: pan-y`
- `-webkit-overflow-scrolling: touch`

footer/button 기준:
- 화면 밖에 `position: absolute; bottom: ...`로 고정하지 않습니다.
- 필요하면 `position: sticky; bottom: 0` 또는 일반 문서 흐름에 둡니다.
- `padding-bottom: env(safe-area-inset-bottom)` 계열을 고려합니다.

입력 차단 기준:
- 오버레이가 열릴 때 `scene.sceneControlSystem.blockWorldInput(true)` 또는 같은 책임의 API를 사용합니다.
- 오버레이가 닫힐 때 반드시 `blockWorldInput(false)` 또는 대응 정리를 호출합니다.
- overlay/panel에는 `pointerdown`, `touchstart`에서 `event.stopPropagation()`을 걸어 캔버스로 이벤트가 새지 않게 합니다.
- 스크롤 가능한 영역에서 무조건 `preventDefault()`를 호출하지 않습니다.
- `SceneControlSystem.hasOpenDomOverlay()` 목록에 새 모달의 열린 상태를 추가합니다.
- 모달이 열릴 때 기존 마우스 이동 목표나 자동 상호작용 목표가 있으면 취소합니다.

검증:
- 모바일 가로 높이 360px 기준에서 모달 하단 버튼까지 스와이프로 접근 가능한지 확인합니다.
- 모달 위를 터치/스와이프할 때 뒤쪽 NPC 대화, 쓰레기 줍기, 이동, 상점 진입이 실행되지 않는지 확인합니다.
- 설정창은 현재 정상 기준 UI입니다. 새 모달은 설정창의 overlay/panel 스크롤 구조와 비교합니다.
- PC 레이아웃이 과하게 바뀌지 않았는지 확인합니다.

### 컷신/일러스트/엔딩 입력 차단

기준:
- 컷신, 일러스트, 실내 장면, 엔딩 화면이 떠 있는 동안 뒤쪽 월드 입력이 실행되면 안 됩니다.
- 이미지 닫기, 대화 진행, 엔딩 시작 화면 복귀 같은 해당 장면의 입력은 정상 유지해야 합니다.
- 큰 이미지 연출 중에는 `SceneControlSystem` 또는 해당 시스템에서 월드 입력을 잠그고, 종료 후 풀어야 합니다.

### 마우스 이동/A* 길찾기

기준:
- 장애물 판정은 격자 중심점만 보지 말고 플레이어 몸통 여유 공간을 함께 고려해야 합니다.
- 나무, 벤치, 건물처럼 2~3칸 이상을 차지하는 오브젝트는 충돌 사각형을 기준으로 pathfinding grid에서 막힌 영역으로 처리합니다.
- 막힌 오브젝트 위를 클릭한 경우 최종 목적지를 원래 클릭 지점으로 되돌리지 말고, 가장 가까운 안전한 walkable cell 중심으로 유지합니다.
- 대각선 이동은 양옆 직교 칸이 모두 비어 있을 때만 허용해 모서리 끼임을 막습니다.
- 추후 더 정교한 회피가 필요하면 `PathfindingSystem`의 gridSize, collisionPadding, nearest walkable 탐색 범위를 함께 조정합니다.

## 6. 검증 명령어

기본:
```powershell
git status -sb
git diff --check
npm.cmd run build
```

개별 JS 문법 체크:
```powershell
node --check src/systems/파일명.js
node --check src/scenes/파일명.js
```

회사 PC에서 `vite`를 못 찾는 경우:
```powershell
npm.cmd install
npm.cmd run build
```

주의:
- `npm audit fix --force`는 의존성 버전을 크게 흔들 수 있으므로 임의로 실행하지 않습니다.
- 현재 Vite 빌드에서 아래 경고가 나올 수 있으나 빌드 실패는 아닙니다.
  - `vendor/phaser.min.js` script cannot be bundled without `type="module"`
  - `src/pwa.js?v=3` script cannot be bundled without `type="module"`
- 이 저장소는 `dist/`가 추적 중입니다. `npm.cmd run build` 후 해시 파일 변경이 생길 수 있습니다.

## 7. 현재 남은 작업

우선 확인:
- 최종 엔딩 엄마 전화 이후 검은 화면 보강이 실제 플레이에서 정상인지 확인.
- 저장 후 이어하기 직후 쓰레기 즉시 보충이 실제 플레이에서 정상인지 확인.
- 프롤로그 압축 후 템포가 너무 급하지 않은지 확인.

리팩토링 후보:
1. `NpcAmbientSystem` 분리
   - 주민/NPC 랜덤 말풍선, 기억 대사, 주변 대사 관리 분리.
2. `NpcRoamingSystem` 분리
   - NPC 배회 설정과 update 로직 분리.
3. `MapObjectFactory` 도입
   - 나무, 벤치, 건물, 자판기, 안내 오브젝트 생성 분리.
4. `Preload.js` 에셋 목록 분리
   - `src/config/assets/coreAssets.js`, `mapAssets.js`, `questAssets.js`, `uiAssets.js`, `audioAssets.js` 등.
5. 대사 JSON 외부화
   - 우선순위: 병원/약국 -> 수니수니 -> 쭉쭉이 -> 여비 -> 엔딩.
6. 실내/상점/병원/엔딩 전환 시스템화
   - `InteriorSceneSystem` 또는 별도 `SceneTransitionSystem`에서 fade in/out 책임 정리.

기능 후보:
- 프롤로그 “처음 보기/짧게 보기” 옵션.
- 신호등/도로 안전 안내 강화.
- 병원/약국 대사 JSON화 후 음성 경로 추가.

## 8. 최근 변경 로그

### 2026-06-02 HUD 레이아웃 개선 및 에필로그 UI/모달 버그 수정

- `index.html`, `styles.css`
- `src/scenes/PlayScene.js`
- `src/systems/UIManager.js`
- `src/systems/HtmlUiBindingSystem.js`
- `src/systems/ClothingShopSystem.js`
- `src/systems/TravelEndingSystem.js`
- **휴식 버튼 레이어 수정**: `.rest-btn`을 `.game-stage` 대신 `.touch-controls` 하위로 추가하여 설정 버튼과 동일 레벨로 맞추고, 상점 등의 모달 오버레이가 뜰 때 뒤쪽으로 자연스럽게 가려지도록 수정했습니다.
- **프롤로그/에필로그 UI 가리기**: 에필로그 진행 상태(`body.epilogue-scene-active`) 클래스를 추가 및 제어하여 상단 HUD, 휴식창(커피잔), 옷가방(오른쪽 HUD 스택), 설정창이 화면에 나타나지 않도록 가렸습니다.
- **오른쪽 HUD 스택화**: Bacchus, 속도 버프, 쭉쭉이 동행, 옷가방(종이가방) HUD를 `.right-hud-stack` 컨테이너로 감싸 빗자루 위에 세로로 동적 적재되도록 만들었습니다. 종이가방이 존재할 경우 flex-direction 속성을 통해 빗자루 바로 위에 항상 고정되도록 구현했습니다.
- **옷가방 모달 변환**: 기존 부채꼴로 펼쳐지던 방식 대신 설정창과 같은 스타일의 `#travelPrepModal` 팝업 모달창으로 구입한 옷 목록을 볼 수 있게 변경했습니다.
- **버그 수정**: 개발자용 치트 명령어(`forceCompleteDevPackingQuest`) 실행 시 `this.finishChapterOneEnding` 대신 `this.travelEndingSystem?.finishChapterOneEnding`을 호출하도록 정정했습니다.
- 검증: `node --check` 모든 수정 파일 통과, `npm.cmd run build` 빌드 통과.

### 2026-06-02 넓은 장애물 길찾기 회피 보강

- `src/systems/PathfindingSystem.js`
- A* grid 생성 시 플레이어 몸통 여유 공간만큼 정적 충돌 영역을 확장해 나무, 벤치, 건물 같은 넓은 장애물을 더 안정적으로 우회하도록 보강했습니다.
- 타일 충돌도 중심점 하나가 아니라 플레이어 여유 공간이 포함된 영역으로 판정하도록 변경했습니다.
- 막힌 오브젝트를 클릭했을 때 마지막 경유지가 다시 막힌 클릭 지점으로 돌아가던 문제를 수정했습니다.
- 검증: `node --check src/systems/PathfindingSystem.js`, `git diff --check`, `npm.cmd run build` 통과.

### 2026-06-02 쓰레기 스폰 밸런스 조정

- `assets/maps/chapter1-samgakji-map.json`
- `src/scenes/PlayScene.js`
- `src/config/GameConstants.js`
- 하단 지역에도 쓰레기가 더 자연스럽게 나오도록 `slime_spawn` 포인트를 4개 추가했습니다.
- fallback 스폰 영역도 하단으로 조금 확장했습니다.
- 특수 쓰레기 등장 확률을 `0.5%`에서 `0.25%`로 낮췄습니다.
- 검증: 맵 JSON 파싱 통과, `node --check src/config/GameConstants.js`, `node --check src/scenes/PlayScene.js` 통과.

### 2026-06-02 프롤로그 압축

- `src/scenes/PrologueScene.js`
- 대사량을 약 22줄에서 12줄 수준으로 줄였습니다.
- 배경 전환 흐름은 유지했습니다.
- 핵심 흐름은 `서울 여행 제안 -> 돈 부족 -> 엄마의 청소 수당 제안 -> 삼각지 도착`입니다.
- 검증: `node --check src/scenes/PrologueScene.js`, `npm.cmd run build` 통과.

### 2026-06-02 여비 보상 구조 변경

- `src/systems/YebiQuestSystem.js`
- `src/systems/CheckpointStorage.js`
- 캔 모으기 보상: `10,000원` 제거, 빗자루 지급.
- 분리수거 완료 보상: 빗자루 지급 제거, 분리수거장 보상 해금만 유지.
- 기존 저장 파일에서 캔 퀘스트 완료 후 빗자루를 못 받은 경우 이어하기 시 빗자루가 드롭되도록 보강.
- 검증: `node --check src/systems/YebiQuestSystem.js`, `node --check src/systems/CheckpointStorage.js`, `npm.cmd run build` 통과.

### 2026-06-02 최종 엔딩 검은 화면 / 저장 후 재접속 리스폰 보강

- `src/systems/TravelEndingSystem.js`
- `src/systems/SlimeSystem.js`
- `src/scenes/PlayScene.js`
- 최종 엔딩 진입 중복 가드 추가.
- 최종 엔딩 이미지 로딩 fallback 추가.
- 로딩 실패/지연 시에도 `fadeIn()`이 실행되도록 보강.
- 이어하기 후 `SlimeSystem.ensureActiveTrash()`로 최소 쓰레기 수량 보장.
- 검증: 관련 파일 `node --check`, `npm.cmd run build` 통과.

### 2026-06-02 수니수니 보상/활력수/튜토리얼 개선

- `src/systems/SunisuniQuestSystem.js`
- 수니수니 퀘스트 완료 시 10,000원 돈 보상 제거.
- 보상은 활력수 중심으로 유지.
- 활력수 버튼 터치 문제와 튜토리얼 조작 문구 일부 개선.

### 2026-06-02 배움노트/오버레이 입력 차단 안정화

- `SceneControlSystem`, `UIManager`, `HtmlUiBindingSystem`, `EducationalGuideSystem`, `CheckpointStorage`, `styles.css`
- HTML 오버레이 표시 중 Phaser 월드 입력이 새는 문제를 줄였습니다.
- 배움노트/교육 상세창 z-index와 pointer/touch 전파 차단을 정리했습니다.
- `educationGuideSeen` 저장/복원 안전 병합을 추가했습니다.

### 2026-06-01 모바일 DOM 모달 스크롤 안정화

- `src/main.js`
- `styles.css`
- 휴식/통계창, 옷가게, 짐싸기, 이름표 모달의 모바일 가로 화면 스크롤 구조를 보강했습니다.
- 설정창의 정상 스크롤 구조를 기준으로 overlay/panel 구조를 맞췄습니다.

### 2026-06-01 NextGoalSystem 추가

- `src/systems/NextGoalSystem.js`
- 자유 이동 중 상단 HUD 근처에 짧은 다음 행동 안내를 표시합니다.
- 튜토리얼, 대화, DOM 모달, 컷신, 상점/짐싸기 중에는 숨깁니다.

### 2026-06-01 저장 후 나가기 버튼 추가

- `index.html`
- `src/systems/HtmlUiBindingSystem.js`
- `styles.css`
- 설정창에 `게임 저장하고 나가기` 버튼 추가.
- 클릭 시 체크포인트 저장 후 `StartScene`으로 이동.

### 2026-06-01 휴식/통계창 성취 앨범 개선

- `src/systems/UIManager.js`
- `styles.css`
- “오늘 해낸 일” 배지/체크리스트와 “오늘의 한 마디” 추가.
- 오늘의 한 마디는 휴식창 상단으로 이동.

## 9. Git/에셋 관리 메모

Git에 올릴 것:
- `assets/`
- `src/`
- `index.html`
- `styles.css`
- `package.json`
- `vite.config.js`
- `manifest.webmanifest`
- `sw.js`
- `README.md`
- 추적 중인 `dist/` 파일

보통 올리지 않을 것:
- `node_modules/`
- 임시 원본 이미지 폴더
- `Thumbs.db`, `photothumb.db`, `.DS_Store`
- 사용하지 않는 한글 원본 에셋 폴더

주의:
- `.github` 폴더는 GitHub 설정/워크플로/페이지 설정에 쓰일 수 있으므로 용도를 확인하기 전 삭제하지 않습니다.
- `assets/unused`, 자동차 원본 폴더처럼 사용 여부가 불확실한 폴더는 `rg`로 코드 참조를 확인한 뒤 삭제합니다.
- 에셋 파일명은 가능하면 영어 소문자/하이픈/언더스코어로 정리합니다.

## 10. 2026-06-02 작업 로그: 동네 변화 시스템

### NeighborhoodProgressSystem 추가

요청 반영:
- `NeighborhoodProgressSystem.js`를 새로 만들어 청소 누적 수와 주요 퀘스트 진행도에 따라 맵 화단이 자라고, Stage 3부터 나비가 찾아오는 시스템을 추가했습니다.
- 새 UI, 모달, 앨범, 도감, 휴식창 섹션은 만들지 않았습니다. 변화는 맵 장식 오브젝트로만 표현합니다.
- 화단과 나비는 충돌체가 없고, A* 길찾기 walkable grid와 플레이어 이동/상호작용을 방해하지 않습니다.

새로 만든 파일:
- `src/systems/NeighborhoodProgressSystem.js`

수정한 기존 파일:
- `src/config/AssetsData.js`
  - `flowerbed_growth`, `flowerbed_growth2`, `butterfly_idle` 스프라이트시트를 등록했습니다.
- `src/config/InitialGameState.js`
  - `neighborhoodBloom` 기본 상태를 추가했습니다.
- `src/systems/CheckpointStorage.js`
  - 체크포인트 저장/복원에 `neighborhoodBloom`을 추가했습니다.
  - 기존 세이브에 값이 없거나 깨진 타입이어도 기본값으로 병합하는 `normalizeNeighborhoodBloom()`을 추가했습니다.
- `src/scenes/PlayScene.js`
  - import, constructor null 필드, 시스템 인스턴스 생성, `create()`, `update()`, shutdown destroy만 추가했습니다.
  - PlayScene 추가량은 약 7줄 수준이며, 성장 조건/생성/저장 로직은 새 시스템 내부에 둔 상태입니다.

에셋 등록 위치:
- `assets/sprites/flowerbed_growth.png`
  - 4프레임 가로 스프라이트시트, 640x96, frame 160x96
- `assets/sprites/flowerbed_growth2.png`
  - 4프레임 가로 스프라이트시트, 640x96, frame 160x96
- `assets/sprites/butterfly_idle.png`
  - 3프레임 가로 스프라이트시트, 192x64, frame 64x64

화단 기본 좌표:
1. `flowerbed_1`: `{ x: 1030, y: 392 }`
2. `flowerbed_2`: `{ x: 458, y: 595 }`
3. `flowerbed_3`: `{ x: 900, y: 306 }`
4. `flowerbed_4`: `{ x: 1340, y: 720 }`

Tiled에서 화단 위치 조정 방법:
- 코드 기본 좌표는 fallback입니다. Tiled에서 같은 이름의 오브젝트를 만들면 Tiled 좌표가 우선됩니다.
- `spawn` 오브젝트 레이어에 포인트 오브젝트를 추가합니다.
- 오브젝트 이름을 아래처럼 지정합니다.
  - `flowerbed_1`
  - `flowerbed_2`
  - `flowerbed_3`
  - `flowerbed_4`
- 이 오브젝트는 충돌용이 아니라 위치 앵커입니다. collision 레이어나 map_objects 충돌 설정을 추가하지 마세요.
- 도로, 횡단보도, 건물 문 앞, 자판기 앞, 분리수거통 앞, NPC 대기 위치, 좁은 길목에는 두지 않는 것이 좋습니다.

단계별 조건:
- Stage 0
  - 기본 상태
  - 화단 4곳 Frame 0
- Stage 1
  - 총 청소 200개 이상
  - 첫 번째 화단 Frame 1
- Stage 2
  - 총 청소 500개 이상 + 분리수거 퀘스트 완료
  - 첫 번째 화단 Frame 2, 두 번째 화단 Frame 1
- Stage 3
  - 총 청소 1000개 이상 + 쭉쭉이 지갑/음료 퀘스트 완료
  - 첫 번째 화단 Frame 3, 두 번째 Frame 2, 세 번째 Frame 1
  - 나비 1마리 등장
- Stage 4
  - 총 청소 1800개 이상 + 수니수니 병원/약국 퀘스트 완료
  - 화단 4곳 모두 Frame 3
  - 나비 최대 3마리 등장

저장 구조:
```js
neighborhoodBloom: {
  stage: 0,
  unlockedStages: {
    stage1: false,
    stage2: false,
    stage3: false,
    stage4: false
  }
}
```

피드백:
- 새 단계가 처음 해금될 때만 기존 toast를 짧게 사용합니다.
- 예: “화단에 작은 꽃이 피었어요.”, “나비가 찾아왔어요.”
- 큰 오버레이나 새 UI는 만들지 않았습니다.

검증:
- `node --check src/systems/NeighborhoodProgressSystem.js`: 통과
- `node --check src/scenes/PlayScene.js`: 통과
- `node --check src/systems/CheckpointStorage.js`: 통과
- `node --check src/config/AssetsData.js`: 통과
- `node --check src/config/InitialGameState.js`: 통과
- 단계 조건 모의 테스트: `0 -> 1 -> 2 -> 3 -> 4` 통과
- `npm.cmd run build`: 통과
- 소스 대상 `git diff --check`: 통과

주의:
- 전체 `git diff --check`는 현재 `assets/maps/chapter1-samgakji-map.json`의 기존 trailing whitespace 때문에 실패합니다. 이번 작업에서는 Tiled 맵 파일을 수정하지 않는 조건이 있었으므로 해당 파일은 건드리지 않았습니다.
- 화단 에셋이 없으면 시스템이 조용히 fallback 또는 생성 생략으로 넘어가도록 설계했지만, 현재 실제 에셋은 `assets/sprites`에 존재합니다.
