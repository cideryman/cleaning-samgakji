import { GAME_CONFIG } from "../config/GameConstants.js";
import {
  ClothesQuestState,
  JjookQuestState,
  PackingQuestState,
  RecycleQuestState,
  SunisuniQuestState,
} from "../config/QuestStates.js";

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.questToastQueue = [];
    this.isShowingQuestToast = false;
    
    // 휴식하기 버튼 및 통계 모달 생성
    this.createRestStatsButton();
    this.createRestStatsModal();

    // 씬 셧다운 시 DOM 청소 등록
    this.scene.events.once("shutdown", () => {
      this.destroyRestStatsElements();
    });

    // ESC 키로 휴식 모달 토글 등록
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKeyRefreshEvent = this.scene.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
          this.toggleRestStatsModal();
        }
      }
    });
  }

  showQuestToast(message, duration = 1700) {
    if (!message) return;

    this.questToastQueue.push({ message, duration });
    this.showNextQuestToast();
  }

  showNextQuestToast() {
    if (this.isShowingQuestToast || this.questToastQueue.length === 0) return;

    this.isShowingQuestToast = true;
    const { message, duration } = this.questToastQueue.shift();
    const toast = document.createElement("div");
    toast.className = "quest-toast";
    toast.textContent = message;
    toast.style.setProperty("--toast-duration", `${duration}ms`);
    document.querySelector(".game-stage")?.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
      this.isShowingQuestToast = false;
      this.showNextQuestToast();
    }, duration + 120);
  }

  showSpeechBubble(target, message, duration = 2400) {
    if (!target || !message) return;

    const container = this.scene.add.container(target.x, target.y - 62);
    const text = this.scene.add.text(0, 0, message, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 220, useAdvancedWrap: true },
    });
    text.setOrigin(0.5);

    const paddingX = 12;
    const paddingY = 8;
    const width = Math.max(48, text.width + paddingX * 2);
    const height = Math.max(30, text.height + paddingY * 2);
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x21352c, 0.94);
    panel.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    panel.lineStyle(2, 0xffd75a, 0.95);
    panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    container.add([panel, text]);
    container.setDepth(20);

    this.scene.tweens.add({
      targets: container,
      y: container.y - 16,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => container.destroy(),
    });
  }

  queueInventoryCaption(message) {
    if (!message) return;

    this.scene.inventoryCaptionQueue.push(message);
    this.showNextInventoryCaption();
  }

  showNextInventoryCaption() {
    if (this.scene.isShowingInventoryCaption || this.scene.inventoryCaptionQueue.length === 0) return;

    this.scene.isShowingInventoryCaption = true;
    const message = this.scene.inventoryCaptionQueue.shift();
    
    // 기존의 밋밋한 SpeechBubble(Phaser 3 text) 대신 premium HTML floating text로 개선!
    this.showFloatingPopText(this.scene.player, message, false);

    // 플로팅 애니메이션 지속시간(850ms)에 맞게 딜레이를 820ms로 최적 이격
    this.scene.time.delayedCall(820, () => {
      this.scene.isShowingInventoryCaption = false;
      this.showNextInventoryCaption();
    });
  }

  showMoneyRewardAnimation(amount, { label = "\uC120\uBB3C", icon = "./assets/ui/10000won.png", framed = true } = {}) {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    const reward = document.createElement("div");
    reward.className = "money-reward-pop";
    reward.classList.toggle("is-unframed", !framed);
    reward.innerHTML = `
      <img src="${icon}" alt="${label}" />
      <strong>${label} ${amount.toLocaleString()}\uC6D0</strong>
    `;
    stage.appendChild(reward);
    window.setTimeout(() => reward.remove(), 3600);
  }

  showItemRewardOverlay({
    title = "아이템 획득!",
    itemName = "선물",
    description = "",
    icon = "./assets/ui/bacchus.png",
    duration = 2800,
  } = {}) {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    document.querySelectorAll(".item-reward-overlay").forEach((el) => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "item-reward-overlay";
    overlay.innerHTML = `
      <div class="item-reward-card">
        <div class="item-reward-title">${title}</div>
        <img class="item-reward-icon" src="${icon}" alt="" aria-hidden="true" />
        <div class="item-reward-name">${itemName}</div>
        ${description ? `<div class="item-reward-desc">${description}</div>` : ""}
      </div>
    `;
    stage.appendChild(overlay);
    window.setTimeout(() => overlay.remove(), duration);
  }

  updateHud() {
    const scene = this.scene;
    const visibleWaveCount = scene.isMissionComplete
      ? scene.cleanProgressEls.length
      : Math.floor((scene.totalCleanedCount / GAME_CONFIG.totalGoal) * scene.cleanProgressEls.length);

    scene.cleanProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < visibleWaveCount);
    });

    scene.canProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < scene.cleanedCanCount);
    });

    if (scene.missionCountEl) {
      scene.missionCountEl.textContent = `${scene.totalCleanedCount}/${GAME_CONFIG.totalGoal}`;
    }

    if (scene.inventoryNormalCountEl) {
      scene.inventoryNormalCountEl.textContent = scene.recyclingInventory.normal;
    }
    if (scene.inventoryPlasticCountEl) {
      scene.inventoryPlasticCountEl.textContent = scene.recyclingInventory.plastic;
    }
    if (scene.inventoryCanCountEl) {
      scene.inventoryCanCountEl.textContent = scene.recyclingInventory.can;
    }

    scene.sweepButton?.classList.toggle("is-upgraded", scene.hasBroomUpgrade);

    if (scene.specialButton) {
      scene.specialButton.hidden = !scene.hasUnlockedYebi || scene.hasUsedYebi;
      scene.specialButton.classList.toggle("is-ready", scene.hasUnlockedYebi && !scene.hasUsedYebi);
    }

  }

  updateNextQuestHint() {
    if (!this.nextQuestHintEl) return;

    const hint = this.getNextQuestHint();
    if (!hint) {
      this.nextQuestHintEl.classList.add("is-hidden");
      this.nextQuestHintEl.setAttribute("aria-hidden", "true");
      this.nextQuestHintEl.textContent = "";
      return;
    }

    this.nextQuestHintEl.textContent = hint;
    this.nextQuestHintEl.classList.remove("is-hidden");
    this.nextQuestHintEl.setAttribute("aria-hidden", "false");
  }

  getNextQuestHint() {
    const scene = this.scene;
    const money = scene.moneySystem?.money ?? 0;
    const yebiQuestSystem = scene.yebiQuestSystem;
    if (!yebiQuestSystem) return "";

    const recycleState = yebiQuestSystem.getRecycleQuestState?.() ?? RecycleQuestState.LOCKED;
    if (recycleState === RecycleQuestState.LOCKED && !scene.hasAnnouncedRecycleQuest) {
      return this.formatQuestHint("분리수거", GAME_CONFIG.recycleQuestUnlockMoney, money);
    }

    if (recycleState === RecycleQuestState.COMPLETED && scene.jjookQuestState === JjookQuestState.LOCKED && !scene.hasAnnouncedJjookQuest) {
      return this.formatQuestHint("쭉쭉이", GAME_CONFIG.jjookQuestUnlockMoney, money);
    }

    if (scene.jjookQuestState === JjookQuestState.COMPLETED && scene.sunisuniQuestState === SunisuniQuestState.LOCKED && !scene.hasAnnouncedSunisuniQuest) {
      return this.formatQuestHint("병원", GAME_CONFIG.sunisuniQuestUnlockMoney, money);
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE && scene.clothesQuestState === ClothesQuestState.LOCKED && !scene.hasAnnouncedClothesQuest) {
      return this.formatQuestHint("여행 준비", GAME_CONFIG.clothesQuestUnlockMoney, money);
    }

    return "";
  }

  formatQuestHint(label, targetMoney, currentMoney) {
    const remaining = Math.max(0, targetMoney - currentMoney);
    if (remaining <= 0) {
      return `다음: ${label} 가능`;
    }
    return `다음: ${label} ${targetMoney.toLocaleString()}원`;
  }

  // --- 1️⃣ 캐릭터 머리 위 Floating Pop Text 렌더링 엔진 ---
  showFloatingPopText(target, text, isSpecial = false) {
    if (!target || !text) return;

    const cam = this.scene.cameras.main;
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    // Phaser 월드 좌표 구득
    const wx = target.x;
    const wy = target.y;

    // 카메라 Scroll 및 Zoom 비율을 대입해 브라우저 픽셀 좌표 수학적 연산
    const screenX = (wx - cam.scrollX) * cam.zoom + (cam.width * (1 - cam.zoom) / 2);
    const screenY = (wy - cam.scrollY) * cam.zoom + (cam.height * (1 - cam.zoom) / 2);

    const popText = document.createElement("div");
    popText.className = "floating-pop-text";
    if (isSpecial) {
      popText.classList.add("special-waste-pop");
    }
    popText.textContent = text;

    // stage의 boundary 기준 relative offset 배치
    popText.style.left = `${screenX}px`;
    popText.style.top = `${screenY - 15}px`; // 머리 위에 뜨도록 상향 보정

    stage.appendChild(popText);

    // 애니메이션 소멸 주기에 맞춰 DOM 자동 청소
    const duration = isSpecial ? 1150 : 850;
    window.setTimeout(() => {
      popText.remove();
    }, duration - 20);
  }

  // --- 5️⃣ 휴식하기 ☕ 버튼 생성 ---
  createRestStatsButton() {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    // 이미 존재하면 중복 생성 방지
    if (document.querySelector(".rest-btn")) return;

    const btn = document.createElement("button");
    btn.className = "rest-btn";
    btn.innerHTML = '<img src="assets/ui/coffee-cup.png" alt="휴식" style="width: 32px; height: 32px; object-fit: contain; pointer-events: none;" />';
    btn.setAttribute("aria-label", "휴식하고 내 성취 보기");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleRestStatsModal();
    });

    const container = document.querySelector(".touch-controls") || stage;
    container.appendChild(btn);
    this.restBtnEl = btn;
  }

  // --- 5️⃣ 휴식 및 성취 요약 모달 생성 ---
  createRestStatsModal() {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    // 이미 존재하면 중복 생성 방지
    if (document.querySelector("#rest-stats-modal")) return;

    const modal = document.createElement("div");
    modal.id = "rest-stats-modal";
    modal.className = "rest-stats-modal";

    modal.innerHTML = `
      <div class="rest-stats-panel">
        <div class="rest-stats-header">
          <strong>☕ 쉬는 시간</strong>
          <span id="rest-stats-time">08:00</span>
        </div>
        <div class="rest-stats-body">
          <div class="rest-daily-note">
            <label>오늘의 한 마디</label>
            <p id="stats-daily-quote">천천히 해도 괜찮아. 오늘도 한 걸음 나아갔어.</p>
          </div>
          <!-- 여비 저축 현황 -->
          <div class="stats-row">
            <div class="stats-row-icon">💰</div>
            <div class="stats-row-info">
              <label>서울 여행 여비 모으기</label>
              <span id="stats-money-text">0원 / 100,000원</span>
              <div class="stats-gauge-container">
                <div id="stats-money-gauge" class="stats-gauge-fill"></div>
              </div>
            </div>
          </div>
          <!-- 치운 쓰레기 개수 -->
          <div class="stats-row">
            <div class="stats-row-icon">🧹</div>
            <div class="stats-row-info">
              <label>치운 일반 쓰레기</label>
              <span id="stats-cleaned-text">0개</span>
            </div>
          </div>
          <!-- 분리배출 개수 -->
          <div class="stats-row">
            <div class="stats-row-icon">♻️</div>
            <div class="stats-row-info">
              <label>분리배출한 재활용품</label>
              <span id="stats-recycled-text">0개</span>
            </div>
          </div>
          <!-- 오늘 해낸 일 앨범 -->
          <div class="rest-album-card">
            <div class="rest-album-title">
              <strong>오늘 해낸 일</strong>
              <span id="stats-achievement-count">0개 완료</span>
            </div>
            <div class="achievement-grid" id="stats-achievement-grid" aria-label="오늘 해낸 일"></div>
          </div>
        </div>
        <div class="rest-stats-footer">
          <button class="rest-close-btn">다시 청소하러 가기 🧹</button>
        </div>
      </div>
    `;

    modal.querySelector(".rest-close-btn").addEventListener("click", () => {
      this.toggleRestStatsModal(false);
    });

    stage.appendChild(modal);
    this.restModalEl = modal;
  }

  // --- 5️⃣ 휴식 모달 토글 제어 ---
  toggleRestStatsModal(forceShow) {
    if (!this.restModalEl) return;

    const isVisible = this.restModalEl.classList.contains("is-visible");
    const show = (forceShow !== undefined) ? forceShow : !isVisible;

    if (show) {
      // 시간 업데이트 및 데이터 연동
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      const timeEl = this.restModalEl.querySelector("#rest-stats-time");
      if (timeEl) timeEl.textContent = timeStr;

      this.updateRestStatsData();
      this.restModalEl.classList.add("is-visible");
      
      // 물리 엔진 및 플레이어 조작 차단
      this.scene.physics?.world?.pause();
      this.scene.sceneControlSystem?.blockWorldInput?.(true);
    } else {
      this.restModalEl.classList.remove("is-visible");
      
      // 물리 엔진 복구 및 조작 재개
      this.scene.physics?.world?.resume();
      this.scene.sceneControlSystem?.blockWorldInput?.(false);
    }
  }

  // --- 5️⃣ 통계 데이터 실시간 바인딩 ---
  updateRestStatsData() {
    if (!this.restModalEl) return;

    const scene = this.scene;
    const currentMoney = scene.moneySystem?.money ?? 0;
    const targetMoney = 100000;
    const moneyPercent = Math.min(100, (currentMoney / targetMoney) * 100);

    // 💰 여비 저축 게이지 렌더링
    const moneyTextEl = this.restModalEl.querySelector("#stats-money-text");
    const moneyGaugeEl = this.restModalEl.querySelector("#stats-money-gauge");
    if (moneyTextEl) moneyTextEl.textContent = `${currentMoney.toLocaleString()}원 / ${targetMoney.toLocaleString()}원`;
    if (moneyGaugeEl) moneyGaugeEl.style.width = `${moneyPercent}%`;

    // 🧹 치운 쓰레기 개수 연동
    const cleanedTextEl = this.restModalEl.querySelector("#stats-cleaned-text");
    if (cleanedTextEl) cleanedTextEl.textContent = `${scene.totalCleanedCount}개`;

    // ♻️ 분리배출 개수 연동
    const recycledTextEl = this.restModalEl.querySelector("#stats-recycled-text");
    if (recycledTextEl) recycledTextEl.textContent = `${scene.totalRecycledCount}개`;

    this.renderAchievementAlbum();
  }

  renderAchievementAlbum() {
    if (!this.restModalEl) return;

    const scene = this.scene;
    const yebiState = scene.yebiQuestSystem?.getRecycleQuestState?.() ?? RecycleQuestState.LOCKED;
    const jjookState = scene.jjookQuestState ?? JjookQuestState.LOCKED;
    const sunisuniState = scene.sunisuniQuestState ?? SunisuniQuestState.LOCKED;
    const clothesState = scene.clothesQuestState ?? ClothesQuestState.LOCKED;
    const packingState = scene.packingQuestState ?? PackingQuestState.LOCKED;

    const achievements = [
      {
        icon: "🧹",
        label: "청소 시작",
        detail: `${scene.totalCleanedCount ?? 0}개`,
        done: (scene.totalCleanedCount ?? 0) > 0,
      },
      {
        icon: "♻️",
        label: "분리수거",
        detail: `${scene.totalRecycledCount ?? 0}개`,
        done: yebiState === RecycleQuestState.COMPLETED || (scene.totalRecycledCount ?? 0) > 0,
      },
      {
        icon: "🏃",
        label: "쭉쭉이 도움",
        detail: "지갑 찾기",
        done: jjookState === JjookQuestState.COMPLETED,
      },
      {
        icon: "💊",
        label: "수니수니 도움",
        detail: "병원·약국",
        done: sunisuniState === SunisuniQuestState.QUEST_COMPLETE,
      },
      {
        icon: "👕",
        label: "옷가게",
        detail: "여행 준비",
        done: clothesState === ClothesQuestState.COMPLETED,
      },
      {
        icon: "🎒",
        label: "짐싸기",
        detail: "가방 준비",
        done: [PackingQuestState.COMPLETED, PackingQuestState.GOING_BUS_STOP, PackingQuestState.BOARDING_BUS, PackingQuestState.TRAVELING_HOME, PackingQuestState.ENDING_COMPLETE].includes(packingState),
      },
    ];

    const completed = achievements.filter((item) => item.done).length;
    const grid = this.restModalEl.querySelector("#stats-achievement-grid");
    if (grid) {
      grid.innerHTML = achievements.map((item) => `
        <div class="achievement-badge ${item.done ? "is-done" : "is-pending"}">
          <span class="achievement-icon" aria-hidden="true">${item.done ? item.icon : "○"}</span>
          <span class="achievement-label">${item.label}</span>
          <small>${item.done ? item.detail : "아직"}</small>
        </div>
      `).join("");
    }

    const countEl = this.restModalEl.querySelector("#stats-achievement-count");
    if (countEl) {
      countEl.textContent = `${completed}개 완료`;
    }

    const quoteEl = this.restModalEl.querySelector("#stats-daily-quote");
    if (quoteEl) {
      quoteEl.textContent = this.getDailyQuote({ completed, achievements });
    }
  }

  getDailyQuote({ completed, achievements }) {
    const scene = this.scene;
    const money = scene.moneySystem?.money ?? 0;

    if (scene.packingQuestState === PackingQuestState.ENDING_COMPLETE || scene.isChapterComplete) {
      return "스스로 준비한 여행은 오래 기억에 남아. 정말 멋진 하루였어.";
    }
    if (scene.packingQuestState === PackingQuestState.COMPLETED) {
      return "가방까지 챙겼어. 이제 여행 준비가 아주 든든해졌어.";
    }
    if (scene.clothesQuestState === ClothesQuestState.COMPLETED) {
      return "필요한 것을 고르고 계산까지 해냈어. 여행이 한층 가까워졌어.";
    }
    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      return "아픈 친구를 도운 마음이 오늘의 가장 반짝이는 성취야.";
    }
    if (scene.jjookQuestState === JjookQuestState.COMPLETED) {
      return "친구를 돕고 함께 걸었어. 청소가 더 즐거워지는 순간이야.";
    }
    if ((scene.totalRecycledCount ?? 0) > 0 || scene.yebiQuestSystem?.getRecycleQuestState?.() === RecycleQuestState.COMPLETED) {
      return "나눠서 버리는 습관이 삼각지를 더 깨끗하게 만들고 있어.";
    }
    if ((scene.totalCleanedCount ?? 0) >= 20) {
      return "벌써 많이 치웠어. 꾸준함이 모이면 거리도 마음도 환해져.";
    }
    if ((scene.totalCleanedCount ?? 0) > 0) {
      return "첫 쓰레기를 치운 것부터 이미 좋은 변화가 시작됐어.";
    }
    if (money > 0 || completed > 0 || achievements.some((item) => item.done)) {
      return "작은 행동을 모으면 큰 준비가 돼. 오늘도 잘하고 있어.";
    }
    return "천천히 해도 괜찮아. 오늘도 한 걸음 나아가면 충분해.";
  }

  // --- 2️⃣ 친환경 특수 쓰레기 습득 시 화면 중앙 오버레이 팝업 연출 ---
  showSpecialWasteOverlay(specialType) {
    if (!specialType) return;

    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    // 이미 오버레이가 있다면 중복 제거
    const existing = document.querySelector(".special-overlay-pop");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "special-overlay-pop";

    const config = {
      golden_can: {
        title: "✨ 황금 압축 캔 발견! ✨",
        icon: '<img src="assets/sprites/organized-can.png" style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,235,59,0.6));" />',
        desc: "찌그러뜨려서 부피를 줄인 황금 캔이에요!\n캔은 압축해서 버리면 재활용 가치가 훨씬 높아져요!"
      },
      clean_bottle: {
        title: "✨ 깨끗이 헹군 빈 병 발견! ✨",
        icon: '<img src="assets/sprites/washed-bottle.png" style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,235,59,0.6));" />',
        desc: "음료를 다 비우고 깨끗하게 헹군 병이에요!\n안에 이물질이 없어야 100점짜리 재활용이 돼요!"
      },
      label_pet: {
        title: "✨ 라벨 뗀 투명 페트 발견! ✨",
        icon: '<img src="assets/sprites/organized-plastic.png" style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,235,59,0.6));" />',
        desc: "비닐 라벨을 말끔하게 떼어낸 투명 페트병이에요!\n라벨을 분리해야 새 페트병으로 다시 태어날 수 있어요!"
      },
      bundled_paper: {
        title: "✨ 차곡차곡 묶인 신문지 발견! ✨",
        icon: '<img src="assets/sprites/organized-newspaper.png" style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,235,59,0.6));" />',
        desc: "바람에 흩날리지 않게 끈으로 꼭 묶은 신문지에요!\n종이류는 잘 모아서 묶어 배출하는 것이 약속이에요!"
      }
    };

    const info = config[specialType] || {
      title: "✨ 특수 재활용 자원 발견! ✨",
      icon: "♻️",
      desc: "지구를 지키는 훌륭한 재활용품을 발견했습니다!"
    };

    overlay.innerHTML = `
      <div class="special-overlay-title">${info.title}</div>
      <div class="special-overlay-icon">${info.icon}</div>
      <div class="special-overlay-desc">${info.desc}</div>
      <div class="special-overlay-reward">+${(GAME_CONFIG.specialTrashReward || 2000).toLocaleString()}원 보상 획득! 💰</div>
    `;

    stage.appendChild(overlay);

    // 3.0초 뒤 자동으로 엘리먼트 제거 (가독성 향상)
    window.setTimeout(() => {
      overlay.remove();
    }, 3000);
  }

  // --- 씬 셧다운 시 메모리 누수 방지용 DOM 파괴자 ---
  destroyRestStatsElements() {
    if (this.restBtnEl) {
      this.restBtnEl.remove();
      this.restBtnEl = null;
    }
    if (this.restModalEl) {
      this.restModalEl.remove();
      this.restModalEl = null;
    }
    document.querySelectorAll(".special-overlay-pop")?.forEach((el) => el.remove());
    if (this.escKeyRefreshEvent) {
      this.escKeyRefreshEvent.destroy();
    }
  }
}
