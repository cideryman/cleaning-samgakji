# 삼각지 대청소 핸드오프

이 문서는 다음 Codex 세션이 바로 이어서 작업할 수 있도록 현재 구조, 원칙, 남은 일을 정리한 문서입니다. 작업 로그를 길게 누적하지 말고, 최신 상태 중심으로 갱신하세요.

## 현재 프로젝트

- 기술: Phaser.js, Vite, Vanilla JS, HTML/CSS DOM UI.
- 실행/검증: `npm.cmd run build`.
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

## 최근 완료

- 돈 HUD를 `[만원 아이콘] 71,500원` 형태로 단순화했습니다.
- `NpcMemorySystem.js`를 추가해 여비/쭉쭉이/수니수니의 기억 대사를 기존 랜덤 말풍선 fallback 앞에 연결했습니다. 엄마, 프롤로그, 에필로그 전화 시퀀스는 건드리지 않았습니다.
- 배움 노트 등 DOM 오버레이가 게임 화면 뒤로 가거나, 오버레이 터치가 월드 입력으로 새는 문제를 막는 원칙을 적용했습니다.
- `NeighborhoodProgressSystem.js`를 추가했습니다. 청소 누적/퀘스트 진행도에 따라 화단이 자라고 Stage 3부터 나비가 등장합니다. 화단 위치는 Tiled object로 조정 가능합니다.
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

## Tiled 편집 규칙

- `spawn` layer: 논리 지점입니다. 예: `player_start`, `pharmacy_door`, `convenience_store_door`, `recycle_demo_can`.
- `map_objects` layer: 실제 보이는 오브젝트입니다. `texture`, `displayWidth`, `displayHeight`, `collides` 같은 property를 사용합니다.
- 충돌 조정은 object property `collides`, `collisionWidth`, `collisionHeight`, `collisionOffsetX`, `collisionOffsetY`를 사용합니다.
- 나무/벤치/건물/자판기/분리수거통 위치는 가능하면 Tiled object로 조정합니다.
- 새 타일셋을 쓸 때는 Tiled에서 추가하는 것만으로 끝나지 않습니다. 게임 preload 쪽에서도 tileset source/name/key가 맞아야 합니다.
- 약국 내부처럼 별도 Tiled 맵을 만들 때는 `AssetsData.js`의 `INTERIOR_TILED_MAPS`에 등록하세요.

## 현재 남은 문제

1. 에필로그 엄마 전화 후 검은 화면 유지
   - 아직 해결되지 않았습니다.
   - 원래 흐름은 엄마 전화 후 최종 엔딩 이미지로 넘어가고, Space/터치 입력 시 시작 화면으로 돌아가는 구조입니다.
   - 의심 지점: fade out 또는 엔딩 이미지 로딩/전환 순서.
   - 급하지 않으면 마지막 엔딩 장면이므로 우선순위를 낮춥니다. 필요하면 fade를 제거하는 방식도 검토합니다.

2. 상점 컷신의 맵 전환
   - 병원/약국/옷가게는 아직 완전한 내부 이동 맵이 아닙니다.
   - 약국은 첫 레퍼런스로 Tiled 맵 렌더링이 들어갔습니다.
   - 장기적으로는 `assets/maps/interiors/pharmacy-map.json`, `hospital-map.json`, `clothing-store-map.json`처럼 상점별 내부 맵을 두고 `player_start`, `exit`, `counter`, `npc_chemist` 같은 object point를 쓰는 방식을 추천합니다.

3. 모바일 로딩 속도
   - 이미지/BGM 에셋이 많아졌습니다.
   - 챕터 시작 필수 preload, 상점/엔딩 진입 직전 lazy load, 사용하지 않는 임시 에셋 정리가 필요합니다.

4. PlayScene 리팩토링
   - 다음 우선순위는 작은 이벤트 함수 묶음을 시스템으로 옮기는 것입니다.
   - 이동 후 `node --check`와 `npm.cmd run build`를 반드시 실행합니다.

5. 기능 아이디어 백로그
   - 병원/약국/옷가게 진입 시 화면 fade와 대화창 fade 타이밍 동기화.
   - 상점별 내부 맵 전환 확대.
   - 터치/클릭 이동 목표 표시 색상과 크기 조정.

## 검증 체크리스트

- `node --check src/scenes/PlayScene.js`
- 변경한 시스템 파일별 `node --check`
- `npm.cmd run build`
- 새 게임과 이어하기 모두 확인
- 모바일 가로/세로에서 DOM 모달 스크롤과 버튼 터치 확인
- Tiled 좌표 기반 기능은 실제 object가 우선 적용되는지 확인
