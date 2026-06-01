# 삼각지 대청소 개발 핸드오프

이 문서는 집/회사 또는 다른 Codex 세션에서 작업을 이어갈 때 현재 상태와 다음 작업을 빠르게 파악하기 위한 인수인계 문서입니다.

프로젝트는 Phaser.js 기반 2D 웹 게임이며, 목표는 발달장애 이용자가 재미있는 플레이 안에서 청소, 분리수거, 병원/약국, 자판기, 교통, 여행 준비 같은 자립생활 흐름을 자연스럽게 익히도록 돕는 것입니다.

---

## 1. 현재 상태 요약

### 프로젝트
- 게임명: `삼각지 대청소`
- 작업 폴더: `C:\Users\sec\Desktop\cleaning-samgakji`
- 기술 스택: Phaser.js, Vanilla JavaScript, HTML/CSS DOM UI, Vite
- 실행/검증: `npm.cmd run build`

### 현재 구현된 큰 흐름
- 프롤로그: 친구 쭉쭉이의 여행 제안, 돈 부족 인지, 어머니의 청소 아르바이트 제안, 삼각지 이동.
- 초반 튜토리얼: 조작, 청소, 제출, 여비와 대화하는 흐름.
- 여비 퀘스트: 캔 수집, 분리수거장, 종류별 재활용 제출.
- 쭉쭉이 퀘스트: 지갑 찾기, 자판기, 음료 선택, 플로깅 동행.
- 수니수니/병원/약국 흐름: 병원, 처방, 약국, 건강/카페인 교육.
- 옷가게 에피소드: 여행 준비용 옷/신발 등 선택, 영수증/거스름돈 훈련.
- 짐싸기/이름표: 여행 가방 준비, 이름표 커스터마이저.
- 엔딩/여행 시퀀스: 버스 정류장, 이동, 서울 여행 에필로그, 엄마 안부 전화.
- 맵 시스템: Tiled 맵, 도로/횡단보도/신호등, 차량/보행 안전 로직.
- 조작: 키보드, 모바일 조이스틱, PC 마우스 클릭 이동/A* 경로 회피, 일부 원클릭 상호작용.
- UI: HUD, 설정창, 휴식/통계창, 교육 안내 물음표, 큰 글씨 모드, TTS 토글, 사운드 토글.

### 현재 코드 구조
- `src/scenes/PlayScene.js`
  - 아직 중앙 조립자 역할을 하지만, 점진적으로 얇게 만드는 중입니다.
  - 새 기능 로직을 직접 추가하지 않는 것이 원칙입니다.
- `src/config/`
  - `InitialGameState.js`: 초기 상태 기본값.
  - `QuestStates.js`: 퀘스트 상태 문자열 상수.
  - `AssetsData.js`: 주요 에셋 목록/경로.
  - `GameConstants.js`: 크기, 줌, 게임 상수.
- `src/controllers/`
  - `PlayerController.js`: 키보드, 모바일 조이스틱, 마우스 이동/클릭 입력.
- `src/systems/`
  - `AudioManager.js`: BGM, 효과음, Web Audio 합성.
  - `CheckpointStorage.js`: 저장/불러오기.
  - `CleaningSystem.js`: 청소 및 쓰레기 수거.
  - `ClothingShopSystem.js`: 옷가게 UI/구매/영수증.
  - `DialogueSystem.js`, `DialogueManager.js`, `PortraitManager.js`: 대화/초상화/JSON 기반 대사 준비.
  - `HtmlUiBindingSystem.js`: DOM 버튼/설정 UI 바인딩.
  - `InteractionSystem.js`: 스페이스/터치 상호작용 우선순위.
  - `JjookQuestSystem.js`: 쭉쭉이 퀘스트 및 동행 AI.
  - `MoneySystem.js`: 돈 표시/증감.
  - `ObjectVisibilitySystem.js`: 큰 오브젝트 뒤 캐릭터 가림 방지 투명화.
  - `PackingSystem.js`: 짐싸기 및 이름표 모달.
  - `PathfindingSystem.js`: A* 길찾기 격자.
  - `RoadTrafficSystem.js`: 신호등, 차량, 무단횡단 제어.
  - `RouteGuideSystem.js`: 바닥 화살표/퀘스트 안내.
  - `SlimeSystem.js`: 쓰레기 스폰/표시/특수 쓰레기.
  - `SunisuniQuestSystem.js`: 수니수니/병원/약국 퀘스트.
  - `TiledMapSystem.js`: Tiled 맵 로딩/충돌/레이어.
  - `TravelEndingSystem.js`: 버스/엔딩/여행 시퀀스.
  - `TutorialSystem.js`: 초반 튜토리얼/구출 힌트.
  - `UIManager.js`: HUD, 휴식/통계, 토스트 등.
  - `VendingMachineSystem.js`: 자판기.
  - `YebiQuestSystem.js`: 캔 수집/분리수거 퀘스트.

---

## 2. 리팩토링 원칙

### 반드시 지킬 것
- `PlayScene.js`에는 새 퀘스트 로직, 긴 UI 로직, 큰 조건문을 추가하지 않습니다.
- 새 기능은 가능한 한 `src/systems/` 안의 기존 시스템 또는 신규 시스템에 넣습니다.
- 데이터성 값은 `src/config/` 또는 `src/data/`로 빼는 방향을 우선합니다.
- 기존 기능을 고칠 때도 먼저 담당 시스템 파일을 찾고, `PlayScene.js`는 생성/연결/update 호출만 담당하게 유지합니다.
- 모바일/PWA 입력 문제는 CSS, DOM 바인딩, 각 시스템의 모달 open/close 내부에서 해결하고 `PlayScene.js`를 키우지 않습니다.
- 리팩토링은 한 번에 크게 갈아엎지 말고 `작은 분리 -> 문법 체크 -> 빌드 -> 핸드오프 기록` 순서로 진행합니다.

### 권장 진행 방식
1. 관련 파일 검색: `rg "키워드" src`
2. 담당 시스템 확인.
3. 기존 동작을 유지하는 작은 변경.
4. `node --check`로 수정 JS 문법 체크.
5. `npm.cmd run build`.
6. `git diff --check`.
7. 이 문서의 최근 작업 로그 갱신.

---

## 3. 검증 방법

### 기본 검증
```powershell
npm.cmd run build
git diff --check
git status -sb
```

### JS 문법만 빠르게 확인
```powershell
& 'C:\Users\sec\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src/main.js
```

### 빌드가 `vite`를 못 찾을 때
회사 PC처럼 `node_modules`가 없으면 `npm.cmd run build`가 아래처럼 실패할 수 있습니다.

```text
'vite' is not recognized as an internal or external command
```

이 경우:
```powershell
npm.cmd install
npm.cmd run build
```

참고:
- `npm install` 후 취약점 경고가 보일 수 있습니다. 현재는 Vite 개발 의존성 경고이며, 게임 실행 자체와 별개입니다.
- `npm audit fix --force`는 큰 버전 변경을 만들 수 있으므로 함부로 실행하지 않습니다.
- 빌드 후 `dist/`가 생기며, 보통 Git에는 올리지 않습니다.

---

## 4. 최근 완료 작업 로그

### 2026-06-01 저장 후 나가기 이어하기 쓰레기 리스폰 수정
문제:
- 인게임 설정창의 `게임 저장하고 나가기` 후 시작 화면에서 `이어하기`를 누르면 쓰레기 리스폰이 멈추는 문제가 있었습니다.

원인:
- 체크포인트 저장 데이터에 `tutorialState`가 포함되지 않았습니다.
- 이어하기 복원 후 실제 진행은 복구되지만 `tutorialState`가 초기값 `intro`로 남아, `SlimeSystem.startRespawnLoop()`의 튜토리얼 중 리스폰 차단 조건에 걸렸습니다.

변경:
- `src/systems/CheckpointStorage.js`
  - `saveSceneCheckpoint()`와 `savePrologueCompleted()` 저장 데이터에 `tutorialState` 추가.
  - `applyToScene()`에서 `tutorialState`를 복원.
  - 기존 저장처럼 `tutorialState`가 없는 경우에도 체크포인트, 청소 수, 퀘스트 진행도를 보고 튜토리얼 완료 상태를 추론하는 `inferTutorialState()` 추가.
  - 복원 직후 `TutorialSystem` 내부 state도 scene 상태와 동기화.

검증 필요:
- 설정창에서 저장 후 나가기 -> 이어하기 -> 12초 안팎으로 쓰레기가 다시 생성되는지 확인.
- 프롤로그 직후 저장/이어하기에서는 튜토리얼이 정상 시작되는지 확인.

검증:
- `node --check src/systems/CheckpointStorage.js` 통과.
- `node --check src/systems/UIManager.js` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있음.
- `npm.cmd run build` 통과.

### 2026-06-01 커피잔 휴식/통계창 성취 앨범 개선
변경:
- `src/systems/UIManager.js`
  - 기존 여비 게이지, 청소 수, 분리배출 수는 유지.
  - `오늘 해낸 일` 앨범 섹션 추가.
  - 청소 시작, 분리수거, 쭉쭉이 도움, 수니수니 도움, 옷가게, 짐싸기를 배지 카드로 표시.
  - 완료 여부는 현재 퀘스트 상태와 청소/분리수거 수를 기준으로 판단.
  - 진행 상황에 따라 바뀌는 `오늘의 한 마디` 추가.
- `styles.css`
  - 새 에셋 없이 CSS 카드와 이모지 중심의 앨범 스타일 추가.
  - 모바일 가로 화면에서는 3열의 작은 배지로 줄이고 기존 overlay/panel 스크롤 구조를 유지.

검증:
- `node --check src/systems/UIManager.js` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있음.
- `npm.cmd run build` 통과.

### 2026-06-01 NextGoalSystem 짧은 목표 안내 HUD 추가
변경:
- `src/systems/NextGoalSystem.js` 추가.
  - 상단 HUD의 `#nextQuestHint` 캡슐을 전담 관리.
  - 튜토리얼, 대화창, DOM 모달, 컷신/실내/에필로그, 상점/짐싸기/자판기 메뉴 중에는 자동 숨김.
  - 자유 이동 중에만 행동 중심 문구를 1줄로 표시.
  - 현재 진행 중인 퀘스트, 시작 가능한 퀘스트, 다음 해금 금액, 자유 청소 안내 순으로 우선순위 판단.
  - 500ms interval로 가볍게 갱신하고, 같은 문구 반복 렌더링 방지 및 2초 이내 중복 변경 방지 적용.
- `src/scenes/PlayScene.js`
  - `NextGoalSystem` import, 생성, create 호출, shutdown destroy만 추가.
  - 목표 판단 로직은 `PlayScene.js`에 넣지 않음.
- `src/systems/UIManager.js`
  - 기존 `nextQuestHint` 갱신 책임을 제거해 새 시스템과 충돌하지 않게 정리.
- `styles.css`
  - 기존 상단 HUD와 어울리는 노란색 계열 캡슐 스타일로 보강.
  - 목표 변경 시 짧은 pulse 애니메이션 추가.
  - 모바일 landscape에서는 더 짧고 작은 캡슐로 유지.

확인 필요:
- 실기기 모바일 가로 화면에서 돈/쓰레기 HUD와 오른쪽 아이콘 스택, 토스트와 시각적으로 겹치지 않는지 확인.
- 설정/휴식/옷가게/짐싸기/이름표/교육 안내 모달이 열린 동안 캡슐이 숨는지 확인.

검증:
- `node --check src/systems/NextGoalSystem.js` 통과.
- `node --check src/scenes/PlayScene.js` 통과.
- `node --check src/systems/UIManager.js` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있음.
- `npm.cmd run build` 통과.

### 2026-06-01 인게임 설정창 저장 후 나가기 버튼 추가
변경:
- `index.html`
  - 설정창 footer에 `게임 저장하고 나가기` 버튼을 추가.
- `src/systems/HtmlUiBindingSystem.js`
  - 설정창 DOM lookup/bind/unbind에 `settings-save-exit` 버튼을 연결.
  - 클릭 시 `scene.saveCheckpoint("manual_exit")`로 현재 진행을 저장한 뒤 오디오를 정리하고 `StartScene`으로 이동.
  - `PlayScene.js`에는 새 로직을 추가하지 않음.
- `styles.css`
  - 설정창 footer를 세로 버튼 스택으로 바꾸고, 저장 후 나가기 버튼은 흰색 보조 버튼 스타일로 정리.
  - 큰 글씨 모드와 모바일 landscape 높이 보정에 새 버튼 크기를 포함.

검증:
- `node --check src/systems/HtmlUiBindingSystem.js` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있음.
- `npm.cmd run build` 통과.

### 2026-06-01 모바일 DOM 모달 스크롤 안정화
대상:
- 인게임 휴식/통계창
- 옷가게 모달
- 짐싸기 모달
- 짐싸기 완료 후 이름표 모달

변경:
- `src/main.js`
  - `.game-shell` 내부 `touchmove` 전역 차단에서 설정/휴식/옷가게/짐싸기/이름표 모달 및 패널을 예외 처리.
  - Phaser 캔버스 입력 차단은 유지하면서 DOM 모달 내부 세로 스크롤만 허용.
- `styles.css`
  - 대상 모달 overlay와 panel에 `overflow-y: auto`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`, `touch-action: pan-y` 적용.
  - 모바일 landscape에서 overlay를 상단 정렬하고 safe-area padding 적용.
  - panel 높이를 `100svh/100dvh` 기준으로 제한.
  - 옷가게/짐싸기 내부 body/grid는 모바일 landscape에서 panel 전체 스크롤이 우선되도록 보정.
  - footer 버튼은 `position: sticky; bottom: 0`로 접근성 강화.
  - 옷가게/짐싸기 아이콘과 버튼 크기를 짧은 화면에서 축소.
  - 이름표 모달은 모바일 landscape에서 2열 구조로 정리.
- `SAMGAKJI_CLEANUP_HANDOFF.md`
  - 원인/변경/확인 필요 사항 기록.

검증:
- `node --check src/main.js` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있음.
- `npm.cmd run build` 통과.

확인 필요:
- iPhone Safari/PWA 가로화면 높이 360px 전후에서 실제 스와이프 접근성 확인.
- 만약 특정 iOS에서 여전히 막히면, 모달 표시 중에만 `body`에 스크롤 허용 클래스를 붙이는 방식으로 추가 보정. 이 경우에도 `PlayScene.js`에는 넣지 말고 각 시스템 또는 `HtmlUiBindingSystem`에서 처리.

### 2026-06-01 오브젝트 투명화 시스템 분리
변경:
- `src/systems/ObjectVisibilitySystem.js` 추가.
- `PlayScene.updateBehindObjectsOpacity()` 본문을 시스템으로 이동.
- `PlayScene.js`는 시스템 생성과 update 호출만 담당.

효과:
- 플레이어가 나무, 건물, 자판기 같은 큰 오브젝트 뒤쪽에 겹치면 오브젝트 alpha가 `0.5`로 낮아졌다가 복구됩니다.
- `PlayScene.js`를 소폭 경량화했습니다.

검증:
- `node --check src/scenes/PlayScene.js` 통과.
- `node --check src/systems/ObjectVisibilitySystem.js` 통과.

### 2026-06-01 오디오 에셋 구조 정리
변경:
- `assets/audio/bgm/`: 챕터 BGM, 프롤로그 BGM, 실내/에필로그 앰비언스.
- `assets/audio/voice/`: 녹음 대사 및 짧은 음성 안내.
- `assets/audio/sfx/`: 향후 파일 기반 효과음.
- `assets/audio/README.md`: 오디오 추가 규칙.
- `src/config/AssetsData.js`, `src/systems/AudioManager.js`, `sw.js`, `assets/maps/TILED_GUIDE.md` 경로 반영.

주의:
- 현재 쓸기, 청소, 보상 효과음 일부는 `AudioManager.js`의 Web Audio 합성으로 동작하므로 파일이 없어도 정상입니다.

### 2026-06-01 안정화 패치 묶음
처리:
- 짧은 모바일 가로 화면에서 여행 준비 종이가방 HUD와 설정 버튼 겹침 완화.
- 휴식/이름표/옷가게/짐싸기/교육 안내 모달의 모바일 스크롤 보정.
- 옷가게 첫 구매 후 모달/실내/대화가 같은 프레임에 겹치는 문제 완화.
- 짐싸기 UI에서 중복 범주 제목과 별도 나가기 버튼 정리.
- README 일부 갱신.

확인 필요:
- 옷가게 첫 구매 흐름은 모바일/PWA에서 한 번 더 실기기 확인 권장.

---

## 5. 현재 주의해야 할 위험 구역

### PlayScene 비대화
- `PlayScene.js`는 여전히 중앙 허브입니다.
- 새 기능을 빠르게 넣기 쉽지만, 장기적으로 다시 6000줄대로 커질 수 있습니다.
- 새 장소/퀘스트/모달은 시스템 파일로 만듭니다.

### DOM UI와 Phaser 입력 충돌
- 설정창, 옷가게, 짐싸기, 휴식창, 이름표, 교육 안내는 DOM UI입니다.
- 모달이 떠 있을 때 뒤쪽 게임 입력이 반응하면 안 됩니다.
- 스크롤은 허용하되, Phaser 캔버스 조작은 막아야 합니다.

### 모바일 Safari/PWA 캐시
- PWA는 서비스 워커와 브라우저 캐시 때문에 최신 변경이 바로 반영되지 않을 수 있습니다.
- 실기기 테스트 시 새로고침, 캐시 삭제, 시크릿 모드, PWA 재설치를 함께 고려합니다.

### 저장 데이터
- 세이브 구조는 점진적으로 V2/챕터 분리 구조를 향해 가고 있습니다.
- `CheckpointStorage.js`를 건드릴 때는 이어하기, 프롤로그 완료, 플레이어 좌표, 퀘스트 상태 복원을 함께 확인해야 합니다.

### 대사/TTS
- `DialogueManager.js`와 `dialogues.json`이 준비되어 있지만, 모든 대사가 JSON으로 빠진 상태는 아닙니다.
- 교육 문구가 자주 바뀌는 병원/약국/퀘스트 대사부터 점진적으로 외부화하는 것이 좋습니다.

---

## 6. 다음 리팩토링 추천 순서

### 1순위: NpcAmbientSystem 분리
목표:
- `PlayScene.js`의 NPC 랜덤 말풍선/기억 대사 관련 함수 분리.

이유:
- 비교적 독립적이고 안전합니다.
- `PlayScene.js` 줄 수를 줄이는 효과가 있습니다.

예상 파일:
- `src/systems/NpcAmbientSystem.js`

검증:
- 랜덤 말풍선이 정상 출력되는지.
- 퀘스트 중 강제 대화/중요 대사와 충돌하지 않는지.

### 2순위: NpcRoamingSystem 분리
목표:
- NPC 배회 설정(`NPC_ROAM_CONFIG`)과 로밍 update 묶음 분리.

주의:
- NPC 퀘스트 상태, 동행 상태, 컷신 이동과 연결되어 있어 한 번에 옮기지 말고 함수 단위로 진행.

예상 파일:
- `src/systems/NpcRoamingSystem.js`

### 3순위: MapObjectFactory 도입
목표:
- 나무, 벤치, 자판기, 건물, 교육 안내 물음표 등 고정 오브젝트 배치/생성을 `PlayScene.js`에서 분리.

방향:
- 가능하면 Tiled Object Layer를 읽어 생성.
- 맵에 오브젝트를 직접 배치하고 `type` 프로퍼티로 `tree`, `bench`, `vending_machine`, `building`, `guide_marker` 등을 지정.

예상 파일:
- `src/systems/MapObjectFactory.js`
- 또는 `TiledMapSystem.js`의 보조 모듈.

### 4순위: Preload/AssetsData 추가 정리
목표:
- 에셋 추가 시 `Preload.js`가 계속 커지지 않도록 용도별 assets config를 더 분리.

예상 구조:
- `src/config/assets/coreAssets.js`
- `src/config/assets/mapAssets.js`
- `src/config/assets/questAssets.js`
- `src/config/assets/uiAssets.js`
- `src/config/assets/audioAssets.js`

### 5순위: 대사 JSON 외부화
우선순위:
1. 병원/약국 대사
2. 수니수니 대사
3. 쭉쭉이 대사
4. 여비 대사
5. 엔딩 대사

목표:
- 문장, 선택지, 다음 대사 연결, audio 경로는 JSON에서 수정.
- 돈 지급, 퀘스트 상태 변경, 아이템 지급 같은 게임 로직은 시스템 코드에 유지.

---

## 7. 기능 백로그

### 특수 쓰레기/동네 변화
- 친환경 특수 자원 종류 확장.
- 특수 자원 최초 수거 설명 오버레이 유지.
- 동네 청결도에 따라 꽃, 나비, 벤치 주변 장식 등 경량 시각 피드백 추가.
- 카메라 뷰포트 내부 즉시 스폰 방지 강화.

### 교통/신호등
- 현재 보행자 신호등과 무단횡단 방지 로직이 있습니다.
- 도로 위 쓰레기를 주우러 가야 하는 상황과 신호 대기를 자연스럽게 연결하는 UX는 계속 조율 필요.
- 신호 대기 중 안내 말풍선, 초록불 전환 시 작은 효과음/화살표 등을 고려할 수 있습니다.

### 접근성
- 큰 글씨 모드와 모바일 landscape UI는 계속 유지.
- 새 DOM 모달을 추가할 때는 반드시 아래 속성을 확인:
  - overlay: `overflow-y: auto`
  - panel: `max-height`, `overflow-y: auto`
  - iOS: `-webkit-overflow-scrolling: touch`
  - touch: `touch-action: pan-y`
  - footer: absolute 고정보다는 sticky 또는 일반 문서 흐름
  - safe-area: `env(safe-area-inset-bottom)` 고려

### TTS/음성
- 현재 Web Speech API 기반 TTS 토글이 있습니다.
- 캐릭터성이 강한 음성을 원하면 나중에 외부 TTS API를 검토.
- API 키 노출 방지를 위해 프론트 단독 호출보다 서버리스 프록시 권장.

---

## 8. Git/에셋 관리 메모

### Git에 올릴 것
- `assets/`
- `src/`
- `index.html`
- `styles.css`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `manifest.webmanifest`
- `sw.js`
- `README.md`
- `SAMGAKJI_CLEANUP_HANDOFF.md`

### 보통 올리지 않을 것
- `node_modules/`
- `dist/`
- `photothumb.db`
- `Thumbs.db`
- `.DS_Store`
- 사용하지 않는 원본 이미지 폴더
- 작업용 한글 원본 에셋 폴더

### 주의
- `.github/` 폴더는 GitHub Actions나 이슈/PR 템플릿이 있을 때 쓰입니다.
- 안에 워크플로가 없다면 필수는 아니지만, 삭제 전 내용 확인이 좋습니다.

---

## 9. 마지막 검증 기록

가장 최근 검증:
- `node --check src/main.js`: 통과
- `git diff --check`: 통과, LF/CRLF 줄바꿈 경고만 있음
- `npm.cmd run build`: 통과

최근 빌드 경고:
```text
<script src="./vendor/phaser.min.js"> in "/index.html" can't be bundled without type="module" attribute
<script src="./src/pwa.js?v=3"> in "/index.html" can't be bundled without type="module" attribute
```

해석:
- 현재 빌드 실패는 아닙니다.
- Phaser를 `vendor/phaser.min.js`로 직접 불러오는 현재 구조 때문에 Vite가 알려주는 경고입니다.
- 당장 고칠 필요는 없고, 나중에 Phaser를 npm 패키지 import 방식으로 바꿀 때 함께 정리할 수 있습니다.

---

## 2026-06-01 HUD 돈 표시 단순화

요청 반영:
- 상단 돈 HUD를 지폐/동전별 개수 표시에서 `[만원 아이콘] 현재 잔고` 한 줄 표시로 단순화했습니다.
- 예시 표시 형태: `[만원 아이콘] 71,500원`

수정 파일:
- `index.html`
  - `count10000`, `count1000`, `count500`, `count100` 표시 요소를 제거했습니다.
  - `#totalMoney`를 만원 아이콘 옆의 단일 금액 텍스트로 유지했습니다.
- `src/systems/MoneySystem.js`
  - 지폐/동전 단위별 계산과 DOM 업데이트를 제거했습니다.
  - 현재 잔고만 `N원` 형식으로 표시합니다.
- `styles.css`
  - 돈 HUD가 모바일/PC에서 줄바꿈되지 않도록 `white-space: nowrap`, 적정 `min-width`를 적용했습니다.
  - 예전 동전 전용 보조 스타일은 화면에 표시되지 않도록 유지했습니다.

주의:
- 쓰레기 인벤토리 아이콘 영역은 그대로 유지했습니다.
- 실제 돈 계산 로직은 변경하지 않았고, 화면 표시 방식만 바꿨습니다.

### 2026-06-01 배움 시스템 축소 및 "배움 노트" 복습 앨범 추가

요청 반영:
- 7대 자립생활 배움터 물음표 시스템을 "첫 학습 강조 + 이후 조용한 다시보기" 구조로 개선했습니다.
- 인게임 설정창 내에 "배움 노트 보기" 버튼을 연동하고, 카드로 구성된 7대 시설 리스트를 통해 교육 모달을 다시 열 수 있는 전용 "배움 노트" 오버레이 모달을 도입했습니다.

수정 및 추가 파일:
1. `src/systems/EducationalGuideSystem.js` [MODIFY]
   - 각 시설에 대한 seen 열람 상태를 확인하고, 미열람 시설은 기존의 크고 눈에 잘 띄는 노란색 물음표 + floating sine-wave 애니메이션을 유지합니다.
   - 열람을 완료한 시설은 더 작고 조용한 "다시보기" 상태(Alpha 0.42, circle 크기 축소, 애니메이션 거의 멈춤)로 스타일을 자동 전환합니다.
   - 7대 시설 교육 안내 리스트를 동적으로 구축하여 봤어요/안봤어요 상태 및 픽토그램/클릭 동작을 결합하는 `renderLearningNotes()`를 추가 구현했습니다.
   - 배움 노트에서 특정 카드를 클릭해 세부 교육 모달을 열었을 때, 닫기 클릭 시 다시 배움 노트 모달로 회귀할 수 있도록 `openedFromNotes` 흐름 제어를 도입했습니다.
2. `src/systems/CheckpointStorage.js` [MODIFY]
   - 신규 게임 시작 및 체크포인트 세이브 시 `educationGuideSeen` 7대 시설(hospital, pharmacy, clothing, vending, crosswalk, recycling, busStop) Seen 상태를 누락 없이 저장 및 복구하도록 업데이트했습니다.
   - 기존 저장 데이터와의 호환을 보장하도록 병합 구조(`...(data.educationGuideSeen ?? {})`)를 적용했습니다.
3. `index.html` [MODIFY]
   - 인게임 설정창 body 내에 "배움 노트 보기" (`#setting-open-notes`) 버튼을 정렬했습니다.
   - 하단에 7대 시설 카드가 바인딩될 `#edu-notes-modal` 마크업 구조를 완벽하게 선언했습니다.
4. `styles.css` [MODIFY]
   - 배움 노트 모달, 판넬, 리스트 카드, 뱃지 상태 태그(`.edu-note-status.seen` / `.unseen`)에 대한 프리미엄 다크/골드그린 계열 스타일을 추가했습니다.
   - 모바일 가로화면에서도 화면이 잘리지 않도록 `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`, `overflow-y: auto`, `touch-action: pan-y`를 포함한 스크롤 및 레이아웃 반응형 보정 규칙을 완비했습니다.
5. `src/systems/HtmlUiBindingSystem.js` [MODIFY]
   - "배움 노트 보기" 및 닫기/확인 버튼에 대한 DOM 연동 및 클릭 이벤트 리스너를 매핑했습니다.
   - 모달 열기/닫기 시 `scene.sceneControlSystem?.blockWorldInput`과 설정 모달과의 전환 연결고리를 안정적으로 바인딩했습니다.
6. `src/scenes/PlayScene.js` [MODIFY]
   - 체크포인트 복원이 없는 경우에 대비해 `educationGuideSeen` 기본값 false 딕셔너리를 create 수명주기에 초기화했습니다.

검증:
- `cmd.exe /c "npm run build"` 빌드 성공 확인.
- 퀘스트 물음표와의 충돌이 없고, 교육 모달 열람 시 seen 처리 및 지도 상의 물음표가 즉시 작고 조용한 다시보기 형태로 바뀌는 것을 성공적으로 보증했습니다.
- 단, 설정창 내에서 "배움 노트 보기" 버튼을 눌렀을 때, `#edu-notes-modal` 팝업이 노출되지 않는 현상이 일부 환경에서 보고되어 추후 디버깅이 필요합니다. (월드 물음표 축소/다시보기 기능 자체는 완벽하게 동작하며 저장도 호환됩니다.)

### 2026-06-01 NPC 기억 대사 1단계 추가

요청 반영:
- 머리 위 친분도 게이지나 새 이미지 에셋 없이, 기존 진행 상태를 바탕으로 NPC가 해냄이의 행동을 기억하는 듯한 말풍선을 띄우는 1단계 시스템을 추가했습니다.
- 대상은 맵 위에 실제 NPC로 존재하는 `여비(yebi)`, `쭉쭉이(jjook)`, `수니수니(sunisuni)`만입니다.
- 엄마는 맵 위 NPC가 아니라 스토리/전화 대화 전용 인물이므로 이번 랜덤 말풍선 연동 대상에서 제외했습니다. 추후 필요하면 `StoryMemoryLine` 같은 별도 흐름으로 다루는 주석만 남겼습니다.

수정 및 추가 파일:
1. `src/systems/NpcMemorySystem.js` [ADD]
   - `getMemorySpeech(npcKey)` 진입점 추가.
   - `getYebiMemorySpeech()`, `getJjookMemorySpeech()`, `getSunisuniMemorySpeech()`로 NPC별 조건을 분리했습니다.
   - 조건에 맞는 후보가 여러 개면 랜덤 선택하되, 같은 NPC의 직전 문구는 가능한 한 피하도록 `lastSpeechByNpc`를 둡니다.
   - 튜토리얼, 대화창, 상점/짐싸기/인테리어/컷신/엔딩 등 월드 입력이 막힌 상태에서는 기억 말풍선을 반환하지 않습니다.
2. `src/scenes/PlayScene.js` [MODIFY]
   - `NpcMemorySystem`을 시스템 초기화 흐름에 추가했습니다.
   - 기존 NPC 로밍 중 랜덤 말풍선(`maybeShowNpcAmbientLine`)과 45~75초 주기의 랜덤 NPC 말풍선(`triggerRandomNpcBubble`)에서 먼저 `npcMemorySystem.getMemorySpeech(npcKey)`를 확인합니다.
   - 기억 대사가 없으면 기존 `NPC_ROAM_CONFIG.messages` 랜덤 대사를 그대로 fallback으로 사용합니다.
   - 기존 `getNpcRememberSpeech()`의 긴 직접 로직은 제거하여 PlayScene 책임을 줄였습니다.

NPC별 기억 대사 조건:
- 여비
  - 캔 퀘스트 완료: “해냄아, 캔을 모으는 실력이 정말 좋아졌네!”
  - 분리수거 퀘스트 완료: “이제 분리수거장도 제법 잘 쓰는구나.”
  - 누적 분리수거 기록이 충분히 있음: “삼각지가 깨끗해지는 게 보여. 해냄이 덕분이야.”
  - 특수 재활용 자원 안내를 본 적 있음: “깨끗한 재활용품을 알아보는 눈이 생겼구나!”
- 쭉쭉이
  - 지갑/음료 퀘스트 완료: “지난번에 지갑 찾아줘서 정말 고마웠어!”
  - 플로깅 동행 중: “같이 플로깅하니까 훨씬 재밌다!”
  - 옷가게 퀘스트 열림/진행/완료: “서울 여행 준비하니까 두근두근하지 않아?”
  - 짐싸기 이후 흐름: “이제 진짜 여행 가는 느낌이 난다!”
- 수니수니
  - 병원/약국 퀘스트 완료: 병원 동행, 약국 동행, 회복 후 휴식 관련 기억 대사.
  - 병원/약국 진행 중: 현재 동행 상태에 맞는 짧은 고마움 대사.

검증:
- `node --check src/systems/NpcMemorySystem.js`: 통과
- `node --check src/scenes/PlayScene.js`: 통과
- `git diff --check`: 통과, LF/CRLF 줄바꿈 경고만 있음
- `npm.cmd run build`: 통과
- 빌드 과정에서 생긴 `dist` 해시 산출물 변경은 소스 작업 범위 유지를 위해 되돌렸습니다.

### 2026-06-02 배움노트 오버레이/입력 차단 안정화

수정한 오류:
- 배움노트가 게임 화면 뒤쪽에 가려지거나 정상 모달처럼 보이지 않는 문제를 수정했습니다.
- 설정창, 배움노트, 교육 상세창, 휴식창 같은 HTML 오버레이가 떠 있을 때 Phaser 월드 입력이 새어 들어가 NPC 대화/쓰레기 줍기/이동이 실행될 수 있는 문제를 줄였습니다.

수정 파일:
1. `src/systems/SceneControlSystem.js`
   - 실제로 동작하는 `blockWorldInput(blocked)` 메서드를 추가했습니다.
   - `isWorldInputBlocked()`가 명시적 입력 차단 상태와 주요 DOM 오버레이 표시 상태를 함께 확인하도록 확장했습니다.
   - 오버레이가 열릴 때 플레이어 클릭 이동 목표를 취소하도록 했습니다.
2. `src/systems/UIManager.js`
   - 휴식창이 기존의 존재하지 않는 `scene.blockWorldInput()` 대신 `scene.sceneControlSystem.blockWorldInput()`을 사용하도록 수정했습니다.
3. `src/systems/HtmlUiBindingSystem.js`
   - 설정창/배움노트 모달에 pointer/touch 이벤트 전파 차단을 추가해 터치가 게임 캔버스로 내려가지 않게 했습니다.
4. `src/systems/EducationalGuideSystem.js`
   - 교육 상세 모달에도 pointer/touch 이벤트 전파 차단을 추가했습니다.
   - `isModalOpen()`을 추가해 다른 시스템에서 교육 모달/배움노트 표시 여부를 확인할 수 있게 했습니다.
5. `src/systems/CheckpointStorage.js`
   - `educationGuideSeen` 저장/복원 시 `Object.assign({}, defaultSeen, loadedSeen)` 방식의 안전 병합을 적용했습니다.
   - 저장 데이터가 없거나 깨진 타입이어도 기본값으로 회복되도록 `normalizeEducationGuideSeen()`을 추가했습니다.
6. `styles.css`
   - `edu-notes-modal`, `edu-notes-panel`, `edu-note-card` 등 배움노트 전용 CSS를 추가했습니다.
   - 배움노트와 교육 상세창의 z-index를 Phaser 캔버스/HUD보다 확실히 위에 오도록 조정했습니다.
   - 배움노트는 HTML/CSS Grid 기반 카드 레이아웃으로 구성되어 모바일 가로 화면 대응이 쉽도록 유지했습니다.

원인 분석:
- 이 게임은 Phaser 캔버스 위에 HTML/CSS 기반 HUD와 모달을 함께 얹는 구조입니다.
- Phaser 월드는 캔버스 안에서 계속 입력을 받고, HTML 오버레이는 DOM 이벤트를 따로 받습니다.
- 따라서 HTML 모달이 화면에 보이더라도 다음 조건 중 하나라도 빠지면 터치/클릭이 캔버스까지 내려갈 수 있습니다.
  - DOM 모달의 `z-index`가 Phaser 캔버스/HUD보다 낮음.
  - DOM 모달에 `pointer-events: auto`가 없거나, 보이는 패널 외부가 입력을 받지 않음.
  - 모달의 `pointerdown`/`touchstart` 이벤트에서 `stopPropagation()`을 하지 않음.
  - Phaser 쪽 `isWorldInputBlocked()`가 DOM 모달 표시 상태를 모름.
- 이번 배움노트 문제는 “화면에는 오버레이처럼 보여야 하는데 실제 레이어/입력 차단 구조가 완전하지 않은 상태”에서 발생했습니다.

해결 원칙:
- 새 HTML 오버레이를 만들 때는 CSS와 Phaser 입력 차단을 반드시 같이 처리합니다.
- CSS만으로 `z-index`를 올리는 것은 충분하지 않습니다. Phaser 월드 입력 차단도 함께 해야 합니다.
- 오버레이 루트는 기본적으로 아래 속성을 갖는 것을 권장합니다.
  - `position: fixed`
  - `inset: 0`
  - `z-index`: 기존 HUD/캔버스보다 높은 값
  - `pointer-events: auto`
  - 모바일 스크롤이 필요한 경우 `touch-action: pan-y`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`
- 오버레이 루트 또는 패널에는 `pointerdown`, `touchstart`에서 `event.stopPropagation()`을 걸어 캔버스로 이벤트가 새지 않게 합니다.
- 오버레이가 열렸는지 여부는 `SceneControlSystem.hasOpenDomOverlay()`에 등록합니다.
- 월드 입력을 수동으로 막아야 하는 오버레이는 `scene.sceneControlSystem.blockWorldInput(true/false)`를 사용합니다.
- 오버레이가 열릴 때는 `playerController.cancelMoveTarget()`처럼 이미 걸린 이동 목표도 취소해야 합니다.

앞으로 새 DOM 오버레이를 추가할 때 체크리스트:
1. `styles.css`에서 오버레이 루트가 `fixed + high z-index + pointer-events: auto`인지 확인.
2. `HtmlUiBindingSystem.js` 또는 해당 시스템에서 `pointerdown/touchstart stopPropagation` 등록.
3. `SceneControlSystem.hasOpenDomOverlay()` 목록에 셀렉터 추가.
4. 열기/닫기 시 `blockWorldInput(true/false)`가 필요한지 판단.
5. 모바일 가로/세로에서 내부 패널이 스크롤 가능한지 확인.
6. 오버레이가 열려 있을 때 NPC 대화, 청소, 이동, 자판기/상점 입력이 실행되지 않는지 확인.

검토한 제안에 대한 판단:
- `educationGuideSeen` 안전 병합: 적용 완료. 기존 세이브 호환성과 깨진 데이터 방어에 도움이 됩니다.
- 휴식창 성취 앨범: 현재도 HTML/CSS Grid 기반이므로 Phaser 그래픽보다 좋은 방향입니다. 앞으로 배지를 추가해도 CSS Grid/Flexbox 유지 권장.
- 오늘의 칭찬 시스템 쿨타임: 현재 별도 `NpcPraiseSystem.js`는 없습니다. 추후 만들 경우, 단순 시간 쿨타임보다 “플레이어가 일정 거리 이상 이동했거나 새 쓰레기를 치운 뒤” 가끔 트리거하는 방식이 더 자연스럽습니다.
- 병원/약국/상점/집/엔딩 등 화면 전환 페이드 인/아웃: 동의합니다. 바로 적용하지 않고 다음 기능 후보로 등록합니다. `InteriorSceneSystem` 또는 별도 `SceneTransitionSystem`으로 분리하는 것을 추천합니다.

새 미해결 오류:
- 에필로그 엄마 전화 후 검은 화면이 유지되고 엔딩 화면이 로딩되지 않는 문제가 보고되었습니다.
- 우선 확인 후보:
  - `TravelEndingSystem`의 엄마 전화 이후 `showFinalEndingScene()` 진입 여부
  - `ending_chapter1_final` 텍스처 로드 완료 타이밍
  - `interiorSceneGroup` 정리와 다음 배경 표시 순서
  - 엔딩 BGM/배경 로드 실패 시 fallback 처리

### 2026-06-02 수니수니 보상/활력수/상단 아이콘/튜토리얼 개선

이번 요청 우선순위:
1. 쉬운 오류 수정: 활력수 버튼 터치 불가, 수니수니 퀘스트 돈 보상 제거.
2. 작은 UI 정리: 커피잔 휴식 버튼과 설정 버튼 크기/행 정렬 통일.
3. 안내 개선: 튜토리얼 문구를 PC/모바일 조작 방식에 맞춰 분기하고, 건물 입장/자판기 사용 힌트 추가.
4. 추후 확장 후보: 튜토리얼을 더 큰 단계형 시스템으로 확장해 병원/약국/자판기/옷가게 첫 진입마다 한 번씩 짧은 카드 안내를 띄우는 구조.

수정한 내용:
- `src/systems/SunisuniQuestSystem.js`
  - 수니수니 퀘스트 완료 시 10,000원 지급, 돈 보상 효과음, 돈 보상 애니메이션을 제거했습니다.
  - 보상은 활력수만 유지하고, 완료 대사를 “활력수 선물” 맥락으로 변경했습니다.
- `styles.css`
  - `.bacchus-button:not([hidden])` 상태에서 `pointer-events: auto`를 명시해 활력수 아이콘 터치가 실제 버튼 입력으로 들어가도록 수정했습니다.
  - `.rest-btn`을 설정 버튼과 같은 58px 원형 버튼으로 맞추고, 설정 버튼 왼쪽 같은 행에 정렬했습니다.
- `src/systems/TutorialSystem.js`
  - `getControlCopy()`와 `isTouchDevice()`를 추가해 PC와 모바일 안내 문구를 분리했습니다.
  - PC는 WASD/방향키/마우스/스페이스 기준, 모바일은 왼쪽 터치 이동/오른쪽 빗자루 버튼 기준으로 안내합니다.
  - 병원/약국/옷가게 입장 힌트와 자판기 사용 힌트도 같은 조작 문구를 재사용하도록 정리했습니다.

오류별 해결 방법과 원칙:
- 수니수니 돈 보상 제거
  - 해결: `SunisuniQuestSystem.completeQuest()`에서 `moneySystem.addMoney(10000)`, 돈 효과음, 돈 보상 애니메이션을 제거했습니다.
  - 원칙: 퀘스트 보상 변경은 대사, 실제 지급 로직, 보상 애니메이션을 함께 수정해야 합니다. 하나만 바꾸면 “말은 선물인데 돈도 들어옴” 같은 불일치가 생깁니다.
- 활력수 터치 불가
  - 원인: `.bacchus-button` 기본 스타일에 `pointer-events: none`이 있고, 보이는 상태에서 이를 되돌리지 않아 버튼은 보이지만 클릭/터치가 통과했습니다.
  - 해결: `.bacchus-button:not([hidden])`에 `pointer-events: auto`를 추가했습니다.
  - 원칙: `hidden`으로 표시/숨김을 제어하는 버튼은 visible 상태 CSS에 `display`, `opacity`, `pointer-events`를 모두 확인해야 합니다.
- 커피잔/설정 아이콘 정렬
  - 해결: `.rest-btn`을 설정 버튼과 같은 58px 원형 버튼 기준으로 맞추고, 설정 버튼 왼쪽 같은 행에 배치했습니다.
  - 원칙: HUD 버튼은 개별 위치값을 감으로 맞추지 말고, 같은 기준 크기/같은 safe-area 계산식을 공유해야 모바일에서 덜 흔들립니다.
- 튜토리얼 PC/모바일 문구 분기
  - 해결: `TutorialSystem.getControlCopy()`로 기기별 조작 문구를 한곳에서 반환하게 했습니다.
  - 원칙: 조작 안내 문구를 각 단계에 하드코딩하지 말고, 공통 helper에서 PC/모바일 문구를 반환하게 해야 이후 조작 방식 변경에 안전합니다.

주의:
- 수니수니 퀘스트 완료 후 돈 보상이 없어졌으므로, 기존 플레이 밸런스에서 10,000원이 줄어듭니다. 의도된 변경입니다.
- 활력수 아이콘은 보유 중 또는 효과 지속 중에만 보입니다.
- 튜토리얼은 아직 “초반 핵심 조작 + 막힐 때 도움말” 중심입니다. 사용자가 원하면 추후 `TutorialSystem`을 더 세분화해 첫 건물 입장/첫 자판기/첫 상점 사용을 별도 1회성 카드로 확장하는 것을 추천합니다.
