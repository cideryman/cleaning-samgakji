# 삼각지 대청소 핸드오프

이 문서는 다음 Codex 세션이 바로 이어서 작업할 수 있도록 현재 구조, 원칙, 남은 일을 정리한 기준 문서입니다. 오래된 작업 로그를 계속 누적하지 말고, 같은 내용은 이 문서 안에서 최신 상태로 갱신합니다.

## 현재 프로젝트

- 기술: Phaser.js, Vite, Vanilla JS, HTML/CSS DOM UI.
- 실행/검증: `npm.cmd run build`.
- 핵심 파일:
  - `src/scenes/PlayScene.js`: 아직 가장 큰 조립 파일입니다. 새 기능 로직을 길게 넣지 말고 시스템 파일로 분리합니다.
  - `src/config/GameConstants.js`: 주요 수치, 좌표 fallback, 퀘스트 기준 금액.
  - `src/config/InitialGameState.js`: 새 저장 상태 기본값.
  - `src/systems/CheckpointStorage.js`: 이어하기 저장/복원과 구버전 저장 fallback.
  - `src/systems/TiledMapSystem.js`: Tiled 맵, 오브젝트, map point, 충돌 처리.
  - `assets/maps/chapter1-samgakji-map.json`: 챕터 1 필드 맵.

## 작업 원칙

- 기존 플레이를 깨뜨리지 않는 작은 단위로 수정합니다.
- `PlayScene.js`에 새 기능 본문을 길게 추가하지 않습니다. import, 생성, 연결 정도만 남기고 시스템으로 분리합니다.
- Tiled에서 위치 조정할 수 있는 것은 가능하면 object layer 또는 spawn point로 둡니다.
- 오버레이 DOM UI가 열려 있을 때는 반드시 월드 입력을 막습니다. Phaser 캔버스로 터치/클릭/스페이스가 새지 않게 `SceneControlSystem`과 DOM `stopPropagation` 계열 처리를 함께 확인합니다.
- 저장값을 추가할 때는 기존 저장 데이터와 병합 fallback을 둡니다. 예: `Object.assign({}, defaultValue, loadedValue)`.
- 이미지/타일 경로를 바꿀 때는 `AssetsData.js`, Tiled tileset, preload 대상, 실제 파일명을 함께 확인합니다.

## 최근 완료

- 돈 HUD를 단순화했습니다: `[만원 아이콘] 71,500원` 형식으로 표시.
- `NpcMemorySystem.js`를 추가해 여비/쭉쭉이/수니수니의 기억 대사를 기존 랜덤 말풍선의 fallback 위에 얹었습니다. 엄마/전화/프롤로그/에필로그 대사는 건드리지 않습니다.
- 배움노트 등 DOM 오버레이가 게임 뒤로 숨거나, 오버레이 위 터치가 월드 입력으로 새는 문제를 고쳤습니다. 같은 문제가 생기면 z-index, fixed overlay, pointer/touch propagation, world input block을 함께 점검합니다.
- `NeighborhoodProgressSystem.js`를 추가했습니다. 청소 누적/퀘스트 진행에 따라 화단이 성장하고 Stage 3부터 나비가 나옵니다. 화단 위치는 Tiled object로 조정 가능하게 유지합니다.
- 클릭/터치 이동 목표 지점에 반투명 초록 원을 표시합니다. 원 크기는 현재 빗자루 청소 범위에 따라 달라집니다.
- 편의점 문 point와 학습도우미를 추가했습니다. 편의점은 아직 들어갈 수 없고, 최초 1회만 “아, 아직 준비 중이구나?” 대사를 출력합니다.
- 수니수니 역할을 편의점 앞 NPC로 바꾸기 위해 시작 위치와 귀환 기준을 편의점 앞쪽으로 변경했습니다. 수니수니 퀘스트 시작 금액은 90,000원입니다.

## Tiled 편집 규칙

- `spawn` layer: 논리 지점입니다. `player_start`, `sunisuni_start`, `convenience_store_door` 같은 위치 기준을 둡니다.
- `map_objects` layer: 실제 보이는 오브젝트입니다. `texture`, `displayWidth`, `displayHeight`, `collides` 같은 property를 사용합니다.
- 나무/벤치/건물/자판기/분리수거통의 위치는 가능한 한 Tiled object로 조정합니다.
- 충돌을 직접 조정하려면 object property로 `collides`, `collisionWidth`, `collisionHeight`, `collisionOffsetX`, `collisionOffsetY`를 씁니다.
- `park_tiles.png` 같은 추가 타일셋은 Tiled에서 등록할 수 있지만, 게임 로딩 쪽 tileset source/name/key가 맞아야 합니다. 현재 실사용 타일셋은 `samgakji-tiles.png` 중심입니다. 새 타일셋을 본격 사용하려면 preload와 Tiled source 이름을 함께 맞춰야 합니다.

## 현재 해야 할 일

1. 에필로그 엄마 전화 뒤 검은 화면
   - 아직 해결되지 않았습니다.
   - 원래 흐름은 엄마 전화 후 최종 엔딩 이미지로 넘어가고, 스페이스/터치 시 시작화면으로 돌아가는 구조입니다.
   - 의심: fade out 또는 엔딩 이미지 로딩/전환 순서. 급하지 않으면 마지막 엔딩 장면이라 우선순위를 낮춰도 됩니다.

2. 상점 컷씬을 상점 맵으로 전환
   - 현재 병원/약국/옷가게는 `showInteriorScene(textureKey, type)` 기반 한 장짜리 이미지 컷씬입니다.
   - 장기적으로는 상점별 내부 map JSON을 추천합니다. 예: `assets/maps/interiors/pharmacy-map.json`, `hospital-map.json`, `clothing-store-map.json`.
   - 각 내부 맵에는 `player_start`, `exit`, `counter`, `npc_chemist` 같은 object point와 collision layer가 필요합니다.
   - 가장 안전한 첫 단계는 약국만 별도 맵으로 만들어 레퍼런스 구현하는 것입니다. 단, 현재 퀘스트 진행과 내부 이미지 시스템을 바로 교체하면 위험하므로 별도 `InteriorMapSystem`으로 작게 시작하는 것을 권장합니다.

3. 모바일 로딩 개선
   - 이미지/BGM 에셋이 많아졌습니다.
   - 시작 전 필수 에셋과 후반/엔딩 에셋을 분리 로딩하는 계획이 필요합니다.
   - 후보: 챕터 시작 필수 preload, 상점/엔딩 진입 직전 lazy load, 사용하지 않는 임시 에셋 정리.

4. PlayScene 리팩토링 지속
   - 다음 우선순위: 이벤트/퀘스트 연결 함수 중 작은 덩어리를 시스템으로 이동합니다.
   - 이동 후 `node --check`와 `npm.cmd run build`를 실행합니다.

5. 기능 아이디어 백로그
   - 터치/클릭한 땅 지점 표시 개선은 적용됨. 필요하면 색/지속시간/반경만 조정합니다.
   - 병원/약국/옷가게 진입 시 화면 fade와 대화창 fade 타이밍을 맞춥니다.
   - 분리수거 시범 연출: 여비가 먼저 캔을 옮겨 분리수거하는 장면.

## 검증 체크리스트

- `node --check src/scenes/PlayScene.js`
- 변경한 시스템 파일별 `node --check`
- `npm.cmd run build`
- 새 저장/이어하기 모두 확인
- 모바일 가로/세로에서 DOM 모달 스크롤 및 버튼 터치 확인
- Tiled 좌표를 바꾼 기능은 실제 맵 object가 우선 적용되는지 확인
