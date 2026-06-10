# 삼각지 발전도 시스템

상태: 기획 확정
구현 단계: 3단계 구현 완료

## 최종 목표

해냄이는 성장하지 않는다.
삼각지가 성장한다.

청소 누적 수를 발전도 경험치처럼 사용해, 돈벌이와 별개로 “내가 청소해서 동네가 좋아진다”는 동기를 만든다.

## 레벨 기준

| 레벨 | 이름 | 청소 누적 |
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

레벨 이름은 2레벨 단위로 유지한다.
예: Lv.1~2는 `잠든 삼각지`, Lv.3~4는 `새싹 돋는 삼각지`.

## 구현 단계

### Phase 1

발전도 데이터

- totalCleanedCount 기반 레벨 계산
- 레벨 계산 함수
- 저장/불러오기
- 화면 변화 없음

상태:
[x] 구현

### Phase 2

HUD 표시

- 삼각지 Lv 표시
- 다음 레벨까지 진행도 바
- 기존 돈/퀘스트 HUD와 충돌하지 않게 배치

상태:
[x] 구현

### Phase 3

화단 연동

- 기존 NeighborhoodProgressSystem 유지
- 삼각지 레벨에 따라 화단 단계 변경
- Lv.4부터 나비 등장
- 가능한 경우 기존 나무/벤치 변화와 연결

상태:
[x] 구현

세부 기록:
- 화단 Stage 0~4는 16레벨 확장에 맞춰 2레벨 단위 흐름으로 연결한다.
- Lv.1~2: 화단 Stage 0
- Lv.3~4: 화단 Stage 1
- Lv.5~6: 화단 Stage 2
- Lv.7~8: 화단 Stage 3 및 나비 등장
- Lv.9 이상: 화단 Stage 4 및 나비 증가
- 기존 neighborhoodBloom 저장값은 하위 호환용으로 유지한다.
- 기존 Phase 3A의 더러운 오브젝트/회복 오브젝트는 SamgakjiProgressSystem 레벨을 계속 사용한다.

## Phase 4 Level-Up Popup Asset Preparation List

Purpose: level-up feedback for Samgakji itself, not Haenaem.

Recommended folder:
- `assets/progress/level-up/`

Required assets:
1. Level-up badge or emblem
- Format: transparent PNG.
- Recommended filename pattern:
  - `samgakji-level-badge-01.png`
  - `samgakji-level-badge-02.png`
  - ...
  - `samgakji-level-badge-16.png`
- Recommended canvas size: 256 x 256.
- Safe visual area: keep the main icon within the central 220 x 220 area.
- Style: simple, bright, readable at mobile size.
- Text inside image: avoid tiny Korean text. The game UI will render the level/name as HTML text.
- If creating 16 badges is too much, prepare 8 mood badges instead:
  - `samgakji-mood-badge-01.png` for Lv.1~2
  - `samgakji-mood-badge-02.png` for Lv.3~4
  - ...
  - `samgakji-mood-badge-08.png` for Lv.15~16

2. Popup sparkle effect, optional
- Format: transparent PNG spritesheet.
- Recommended filename: `level-up-sparkle.png`.
- Frame size: 64 x 64.
- Frame count: 4 or 6 horizontal frames.
- Total size examples:
  - 4 frames: 256 x 64
  - 6 frames: 384 x 64
- Use only if it stays light for mobile. CSS animation or Phaser particles can be avoided.

3. Background ribbon or panel decoration, optional
- Format: transparent PNG.
- Recommended filename: `level-up-ribbon.png`.
- Recommended size: 512 x 160.
- This should be decorative only. Text will be rendered by HTML for accessibility and easy editing.

Popup UI rules:
- The popup must be an HTML overlay above the game stage.
- It must block world input while visible.
- It must include a clear `확인` button.
- It must show:
  - `삼각지 Lv.N`
  - current level name, such as `꽃피는 삼각지`
  - one short message, such as `삼각지가 조금 더 밝아졌어요.`
- If no badge asset exists, use text/emoji fallback first.

### Phase 4

레벨업 팝업

- 레벨업 시 1회 표시
- 확인 버튼 후 게임 복귀
- 팝업 중 월드 입력 차단

상태:
[ ] 미구현

### Future

- 발전 앨범
- NPC 증가
- 벤치 정비
- 표지판/현수막/포스터
- 휴식창 발전 기록

## 현재 판단

기존 “다음 할 일” HUD는 당장 유지한다.
삼각지 발전도는 장기 동기이고, 다음 할 일은 퀘스트 길잡이라 역할이 다르다.
Phase 2에서 레벨 HUD가 들어오면 다음 할 일 HUD를 더 작게 만들거나 설정에서 숨기는 방향을 검토한다.


## Phase 3 Asset Preparation List

Goal: keep the normal cleanable trash system as-is, and add non-cleanable neighborhood dirt/decay objects that disappear as Samgakji levels up. Recovered objects such as benches, trees, flowerbeds, butterflies, and visitors appear in their place.

### Existing Assets Already Available

- Flowerbed growth spritesheets: `assets/sprites/flowerbed_growth.png`, `assets/sprites/flowerbed_growth2.png`
  - Current code expects frame size 160 x 96.
- Butterfly spritesheet: `assets/sprites/butterfly_idle.png`
  - Current code expects frame size 64 x 64.
- Bench prop: `assets/props/sunisuni-bench.png`
  - Static transparent PNG. Recommended displayed size around 104 x 72 world pixels unless adjusted in Tiled.
- Tree prop: `assets/props/sunisuni-tree.png`
  - Static transparent PNG. Can remain as fallback/full-grown tree.

### Required New Assets

1. Dirty neighborhood objects, static props
- Purpose: visual dirt/neglect that Haenaem cannot directly sweep. These disappear when Samgakji level rises.
- Recommended folder: `assets/progress/dirty/`
- Recommended format: transparent PNG, English filenames.
- Recommended size per object: 128 x 96 or 160 x 96 canvas.
- Visual anchor: bottom-centered, no empty transparent margin below the object.
- Suggested variants:
  - `dirty-cardboard-pile.png`
  - `dirty-weed-patch.png`
  - `dirty-dust-pile.png`
  - `dirty-broken-planter.png`
  - `dirty-old-bench-spot.png`
  - `dirty-construction-scrap.png`
- Collision: usually none. These should feel like visual decay, not movement blockers, unless a specific object is intentionally large.

2. Tree growth spritesheet
- Purpose: tree grows gradually as levels rise.
- Recommended folder: `assets/progress/nature/`
- Recommended filename: `tree-growth.png`
- Recommended frame size: 128 x 128.
- Recommended frames: 4 horizontal frames.
  - frame 0: small sprout or sapling
  - frame 1: young tree
  - frame 2: medium tree
  - frame 3: full tree
- Total image size if horizontal: 512 x 128.
- Visual anchor: bottom-centered, trunk/base touches bottom edge, no lower transparent padding.
- If you want a larger full tree, use frame size 160 x 160 instead, but keep all frames the same size.

3. Visitor/person sprites
- Purpose: later levels make Samgakji feel alive. These can appear at Lv.6 or Lv.7+.
- Recommended folder: `assets/progress/people/`
- Recommended standard: match existing NPC movement sheets.
- Frame size: 64 x 96.
- Direction files: one spritesheet per direction, 3 frames each.
  - `visitor-01-walk-down.png` size 192 x 96
  - `visitor-01-walk-up.png` size 192 x 96
  - `visitor-01-walk-left.png` size 192 x 96
  - `visitor-01-walk-right.png` size 192 x 96
- Frame order: 1 left foot, 2 neutral, 3 right foot, same as Haenaem/NPC standard.
- Start with 1 visitor set. Add 2-3 variants later only if needed.

### Optional New Assets

- Clean/recovered ground patches: transparent PNG, 128 x 96 or 160 x 96.
  - Use if dirty objects disappear and the original map tile underneath does not look clean enough.
- Bench installation sparkle or dust puff: spritesheet 64 x 64, 4 frames.
  - Nice for Phase 4 level-up polish, not required for Phase 3.

### Static Dirty Props vs Animated/Spritesheet Dirty Props

Recommendation: use 1-frame static PNGs for dirty neighborhood objects at first.

Reason:
- The player does not directly interact with these objects.
- They are state markers, not active gameplay objects.
- Static PNGs are easier to place in Tiled, easier to swap/hide by level, and cheaper on mobile/PWA.
- Overall quality will come more from strong shape, good placement, and gradual disappearance than from animation.

Use spritesheets only when the object itself transforms in place and the transformation matters visually. Best candidates:
- tree growth
- flowerbed growth
- butterflies/visitors
- optional sparkle/dust effect

For dirty objects, the high-quality version should still usually be static: make 4-6 polished variants instead of animating one dirty pile.

### Suggested Level Visual Flow

- Lv.1: many dirty props visible; few or no recovery props.
- Lv.2: some dirty props disappear; small sprouts/early flowerbed frames appear.
- Lv.3: more dirty props disappear; flowerbeds become clearer.
- Lv.4: tree growth begins and butterflies can start appearing.
- Lv.5: benches appear in cleaned spots; larger trees/cleaner park feel.
- Lv.6+: visitors or resting people appear; Samgakji feels used and cared for.

### Implementation Notes For Later

- Add Tiled object layer anchors for progress props, for example `progress_objects`.
- Each object should include properties like `texture`, `showUntilLevel`, `showFromLevel`, and optional `frameByLevel`.
- Keep collision separate. Do not let visual dirty props block the player unless deliberately designed.

## 2026-06-10 Phase 3A: No-New-Sprite Implementation

Status: implemented as a safe first pass.

What changed:
- `NeighborhoodProgressSystem.js` now creates extra progress props without requiring new image assets.
- Temporary dirty/neglect props are generated with Phaser shapes, so the feature can be tested before final sprites are ready.
- Existing assets are reused for recovered props:
  - `sunisuni_bench`
  - `sunisuni_tree`
  - `street_lamp`
- These props read the current Samgakji level from `SamgakjiProgressSystem`, while the existing flowerbed/butterfly flow keeps its older quest-gated stage logic.
- Every prop has a stable key such as `progress_dirty_planter_west`, `progress_bench_recovered`, or `progress_tree_recovered`.
- If a Tiled point/object with the same key is added later, that Tiled position will override the fallback position.

Visual behavior:
- Low levels show simple dirty patches.
- As the Samgakji level rises, dirty patches disappear.
- Existing bench/tree/lamp props appear at later levels as a temporary recovery visualization.
- No collision is attached to these temporary progress props.

Replacement path when final assets are ready:
- Replace the generated dirty patches with transparent PNGs under `assets/progress/dirty/`.
- Keep the same object keys so code changes stay small.
- Add Tiled anchors for exact placement before tuning code fallback coordinates.
- Tree growth should later replace the temporary full-grown `sunisuni_tree` fallback with a level-based spritesheet.

## 2026-06-10 Dirty Prop Asset Integration

Status: implemented.

Imported assets:
- Source folder removed after import: `assets/지저분한 오브젝트/`
- Destination folder: `assets/progress/dirty/`
- Registered Phaser texture keys:
  - `dirty_trash_bags`: `assets/progress/dirty/dirty-trash-bags.png`
  - `dirty_cardboard_pile`: `assets/progress/dirty/dirty-cardboard-pile.png`
  - `dirty_soil_rubble`: `assets/progress/dirty/dirty-soil-rubble.png`
  - `dirty_concrete_scrap`: `assets/progress/dirty/dirty-concrete-scrap.png`
  - `dirty_spilled_bin`: `assets/progress/dirty/dirty-spilled-bin.png`
  - `dirty_paper_rubble`: `assets/progress/dirty/dirty-paper-rubble.png`

Implementation notes:
- `NeighborhoodProgressSystem.js` now uses these real dirty PNGs first.
- The older generated Phaser-shape dirty patch remains only as a fallback if a texture is missing.
- All imported dirty images are 160 x 96 transparent PNGs, matching the recommended static dirty prop size.
- The props remain visual-only and do not add collision.
