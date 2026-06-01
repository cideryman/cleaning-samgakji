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
