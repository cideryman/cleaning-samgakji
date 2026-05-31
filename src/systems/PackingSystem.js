import {
  PACKING_CATEGORIES,
  PACKING_CATEGORY_LABELS,
  PACKING_ITEMS,
} from "../config/PackingData.js";

const PACKING_PAGE_SIZE = 4;
const PACKING_MOBILE_PAGE_SIZE = 2;

export default class PackingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  open() {
    const scene = this.scene;
    this.close();
    this.hideResumeButton();
    // 현실 안전 지도: 가방 짐 목록에서 지갑(wallet)과 교통카드(transit_card)는 강제 제외하여
    // 사용자가 소지품을 따로 보조 가방이나 주머니에 챙기도록 학습을 유도합니다.
    scene.packingSelectedKeys = new Set(
      scene.packingItems
        .map((item) => item.key)
        .filter((key) => key !== "wallet" && key !== "transit_card")
    );
    scene.selectedPackingIndex = 0;
    scene.packingStepIndex = 0;
    scene.packingPageIndex = 0;
    scene.packingMode = "category";

    const stage = document.querySelector(".game-stage") || document.body;
    const modal = document.createElement("div");
    modal.className = "clothing-shop-modal packing-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "여행 짐싸기");
    modal.innerHTML = `
      <div class="clothing-shop-panel packing-panel">
        <div class="clothing-shop-header">
          <strong>여행 가방</strong>
          <span>필요한 짐을 골라 가방에 넣어요.</span>
        </div>
        <div class="shop-alert-box"></div>
        <div class="clothing-shop-progress packing-progress"></div>
        <div class="clothing-shop-body packing-body"></div>
        <div class="clothing-shop-summary packing-summary"></div>
        <div class="clothing-shop-footer packing-footer"></div>
      </div>
    `;
    scene.packingModal = modal;
    stage.appendChild(modal);
    this.renderStep();
  }

  close() {
    const scene = this.scene;
    this.hideAlert();
    scene.packingModal?.remove();
    scene.packingModal = null;
    scene.packingSelectedKeys = new Set();
    scene.selectedPackingIndex = 0;
    scene.packingStepIndex = 0;
    scene.packingPageIndex = 0;
    scene.packingMode = "category";

    // Restore focus to Phaser game canvas
    scene.game.canvas?.focus?.();

    // Show resume button in the middle of the screen if packing is closed but not finished
    if (scene.packingQuestState !== "completed" && scene.interiorSceneType === "home") {
      this.showResumeButton();
    }
  }

  showResumeButton() {
    if (this.resumeButton) return;
    const scene = this.scene;

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    const container = scene.add.container(centerX, centerY).setDepth(65);
    
    const glow = scene.add.circle(0, 0, 72, 0xffd75a, 0.4);
    glow.setStrokeStyle(3, 0xf7d96f, 0.8);
    
    scene.tweens.add({
      targets: glow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const bagImage = scene.add.image(0, -10, "travel_bag");
    bagImage.setDisplaySize(116, 116);
    
    bagImage.setInteractive({ useHandCursor: true });
    bagImage.on("pointerover", () => {
      bagImage.setScale(bagImage.scaleX * 1.1);
      scene.playTone?.({ frequency: 520, duration: 0.08, type: "sine", volume: 0.02 });
    });
    bagImage.on("pointerout", () => {
      bagImage.setScale(bagImage.scaleX / 1.1);
    });

    const label = scene.add.text(0, 72, "🎒 가방 꾸리기 재개", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#21352c",
      padding: { x: 14, y: 8 },
      align: "center"
    }).setOrigin(0.5);
    
    label.setInteractive({ useHandCursor: true });

    const triggerResume = () => {
      scene.playTone?.({ frequency: 880, duration: 0.12, type: "triangle", volume: 0.04 });
      this.hideResumeButton();
      this.open();
    };

    bagImage.on("pointerdown", triggerResume);
    label.on("pointerdown", triggerResume);

    container.add([glow, bagImage, label]);
    
    this.resumeButton = container;
    scene.interiorSceneGroup?.add(container);
  }

  hideResumeButton() {
    if (this.resumeButton) {
      this.resumeButton.destroy();
      this.resumeButton = null;
    }
  }

  showAlert(message) {
    const alertBox = this.scene.packingModal?.querySelector(".shop-alert-box");
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.style.display = "flex";
    
    alertBox.style.animation = "none";
    alertBox.offsetHeight; // trigger reflow
    alertBox.style.animation = "";

    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
    }, 6500); // 짐싸기 알림 텍스트가 살짝 더 긴 편이므로 가독성을 위해 노출 시간을 소폭 늘림
  }

  hideAlert() {
    const alertBox = this.scene.packingModal?.querySelector(".shop-alert-box");
    if (alertBox) {
      alertBox.style.display = "none";
    }
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  getCurrentCategory() {
    const scene = this.scene;
    return PACKING_CATEGORIES[scene.packingStepIndex] || PACKING_CATEGORIES[0];
  }

  getSelectedItems() {
    const scene = this.scene;
    return PACKING_ITEMS.filter((item) => scene.packingSelectedKeys.has(item.key));
  }

  getIconSrc(item) {
    return `./assets/packing/${item.icon}`;
  }

  getPageSize() {
    return window.innerWidth <= 560 ? PACKING_MOBILE_PAGE_SIZE : PACKING_PAGE_SIZE;
  }

  renderStep() {
    const scene = this.scene;
    if (!scene.packingModal) return;

    this.hideAlert();

    const progress = scene.packingModal.querySelector(".packing-progress");
    const body = scene.packingModal.querySelector(".packing-body");
    const footer = scene.packingModal.querySelector(".packing-footer");
    if (!progress || !body || !footer) return;

    body.className = "clothing-shop-body packing-body";
    body.innerHTML = "";
    footer.innerHTML = "";
    progress.innerHTML = this.renderProgress();

    if (scene.packingMode === "review") {
      this.renderReview(body, footer);
    } else {
      this.renderCategory(body, footer);
    }
    this.refreshSelection();
  }

  renderProgress() {
    const scene = this.scene;
    const steps = PACKING_CATEGORIES.map((category, index) => {
      const isDone = index < scene.packingStepIndex || scene.packingMode === "review";
      const isCurrent = index === scene.packingStepIndex && scene.packingMode !== "review";
      const className = ["clothing-shop-step", isDone ? "is-done" : "", isCurrent ? "is-current" : ""]
        .filter(Boolean)
        .join(" ");
      return `<span class="${className}">${category.label}</span>`;
    }).join("<span style='margin: 0 4px; color: #a48b73;'>➔</span>");
    const reviewClass = scene.packingMode === "review" ? "clothing-shop-step is-current" : "clothing-shop-step";
    return `${steps}<span style='margin: 0 4px; color: #a48b73;'>➔</span><span class="${reviewClass}">가방 확인</span>`;
  }

  renderCategory(body, footer) {
    const scene = this.scene;
    const category = this.getCurrentCategory();
    const selectedCount = this.getSelectedItems().filter((item) => item.category === category.key).length;
    const items = PACKING_ITEMS.filter((item) => item.category === category.key);
    const pageSize = this.getPageSize();
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    scene.packingPageIndex = Phaser.Math.Clamp(scene.packingPageIndex || 0, 0, pageCount - 1);
    const pageStart = scene.packingPageIndex * pageSize;
    const pageItems = items.slice(pageStart, pageStart + pageSize);
    const grid = document.createElement("div");
    grid.className = "clothing-shop-grid packing-grid";
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>${category.label}</strong>
        <span>선택 ${selectedCount}개 · ${scene.packingPageIndex + 1}/${pageCount}</span>
      </div>
    `;
    body.appendChild(grid);

    pageItems.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "clothing-shop-item packing-item packing-option";
      button.dataset.action = "toggle";
      button.dataset.itemKey = item.key;
      button.innerHTML = `
        <img src="${this.getIconSrc(item)}" alt="" aria-hidden="true" />
        <span class="item-label">${item.label}</span>
        <span class="item-price">${PACKING_CATEGORY_LABELS[item.category] || item.category}</span>
      `;
      button.addEventListener("click", () => this.toggleSelection(item.key));
      grid.appendChild(button);
    });

    const isFirstPage = scene.packingStepIndex === 0 && scene.packingPageIndex === 0;
    if (!isFirstPage) {
      this.addFooterButton(footer, "이전", "prev-step", "secondary");
    }

    const isLastCategory = scene.packingStepIndex === PACKING_CATEGORIES.length - 1;
    const isLastPage = scene.packingPageIndex === pageCount - 1;
    const nextLabel = (isLastCategory && isLastPage) ? "가방 확인하기" : "다음";
    
    this.addFooterButton(footer, nextLabel, "next-step");
    this.addFooterButton(footer, "나가기", "close", "secondary");
    this.renderSummary();
  }

  renderReview(body, footer) {
    const selectedItems = this.getSelectedItems();
    body.classList.add("is-review");
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>가방 확인</strong>
        <span>Space 또는 터치하면 가방에서 뺄 수 있어요.</span>
      </div>
      <div class="packing-bag-preview">
        <img src="./assets/items/travel-bag.png" alt="" aria-hidden="true" />
        <div class="clothing-shop-review-list packing-review-list"></div>
      </div>
    `;
    const list = body.querySelector(".packing-review-list");

    if (selectedItems.length === 0) {
      list.innerHTML = '<div class="clothing-shop-empty">아직 가방에 넣은 짐이 없어요. 그래도 완료할 수 있어요.</div>';
    } else {
      selectedItems.forEach((item) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "clothing-shop-review-item packing-review-item packing-option";
        row.dataset.action = "remove";
        row.dataset.itemKey = item.key;
        row.innerHTML = `
          <img src="${this.getIconSrc(item)}" alt="" aria-hidden="true" />
          <span class="review-name">${item.label}</span>
          <span class="review-category">${PACKING_CATEGORY_LABELS[item.category] || item.category}</span>
          <span class="review-remove">가방에서 빼기</span>
        `;
        row.addEventListener("click", () => this.removeSelection(item.key));
        list.appendChild(row);
      });
    }

    this.addFooterButton(footer, "이전", "prev-step", "secondary");
    this.addFooterButton(footer, "짐싸기 완료", "complete");
    this.addFooterButton(footer, "나가기", "close", "secondary");
    this.renderSummary();
  }

  addFooterButton(footer, label, action, tone = "primary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `clothing-shop-footer-button packing-option is-${tone}`;
    button.dataset.action = action;
    button.textContent = label;
    // iOS Safari standalone 300ms 터치 씹힘 및 딜레이 방지를 위한 pointerdown 이벤트 적용
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleAction(action);
    });
    footer.appendChild(button);
    return button;
  }

  handleAction(action) {
    if (action === "next-step") {
      this.advanceSequentialStep();
      return;
    }

    if (action === "prev-step") {
      this.goBackSequentialStep();
      return;
    }

    if (action === "close") {
      this.close();
      return;
    }

    if (action === "complete") {
      this.completeSelection();
    }
  }

  advanceSequentialStep() {
    const scene = this.scene;
    if (scene.packingMode === "review") {
      this.completeSelection();
      return;
    }

    const category = this.getCurrentCategory();
    const items = PACKING_ITEMS.filter((item) => item.category === category.key);
    const pageSize = this.getPageSize();
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

    if (scene.packingPageIndex < pageCount - 1) {
      scene.packingPageIndex += 1;
    } else {
      if (scene.packingStepIndex < PACKING_CATEGORIES.length - 1) {
        scene.packingStepIndex += 1;
        scene.packingPageIndex = 0;
      } else {
        scene.packingMode = "review";
      }
    }
    scene.selectedPackingIndex = 0;
    this.renderStep();
  }

  goBackSequentialStep() {
    const scene = this.scene;
    if (scene.packingMode === "review") {
      scene.packingMode = "category";
      scene.packingStepIndex = PACKING_CATEGORIES.length - 1;
      const category = this.getCurrentCategory();
      const items = PACKING_ITEMS.filter((item) => item.category === category.key);
      const pageSize = this.getPageSize();
      const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
      scene.packingPageIndex = pageCount - 1;
    } else {
      if (scene.packingPageIndex > 0) {
        scene.packingPageIndex -= 1;
      } else {
        if (scene.packingStepIndex > 0) {
          scene.packingStepIndex -= 1;
          const category = this.getCurrentCategory();
          const items = PACKING_ITEMS.filter((item) => item.category === category.key);
          const pageSize = this.getPageSize();
          const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
          scene.packingPageIndex = pageCount - 1;
        }
      }
    }
    scene.selectedPackingIndex = 0;
    this.renderStep();
  }

  toggleSelection(itemKey) {
    const scene = this.scene;
    // 현실 안전 지도: 지갑과 교통카드는 큰 여행 가방(캐리어) 안에 넣지 않도록 배제
    if (itemKey === "wallet" || itemKey === "transit_card") {
      const label = itemKey === "wallet" ? "지갑" : "교통카드";
      this.showAlert(`💡 ${label}은(는) 가방 깊숙이 넣으면 차표 예매나 하차 시 꺼내기 힘들어요! 주머니나 보조 백에 따로 휴대하는 것이 훨씬 편하고 안전해요!`);
      scene.playTone?.({ frequency: 220, duration: 0.12, type: "square", volume: 0.035 });
      return;
    }

    if (scene.packingSelectedKeys.has(itemKey)) {
      scene.packingSelectedKeys.delete(itemKey);
    } else {
      scene.packingSelectedKeys.add(itemKey);
    }
    this.renderStep();
  }

  removeSelection(itemKey) {
    const scene = this.scene;
    scene.packingSelectedKeys.delete(itemKey);
    scene.selectedPackingIndex = Math.max(0, scene.selectedPackingIndex - 1);
    this.renderStep();
  }

  renderSummary() {
    const scene = this.scene;
    if (!scene.packingModal) return;

    const summary = scene.packingModal.querySelector(".packing-summary");
    if (!summary) return;

    const selectedItems = this.getSelectedItems();
    const countByCategory = Object.fromEntries(PACKING_CATEGORIES.map((category) => [category.key, 0]));
    selectedItems.forEach((item) => {
      countByCategory[item.category] = (countByCategory[item.category] || 0) + 1;
    });
    summary.innerHTML = `
      <div class="packing-summary-grid">
        <div><span>가방 속 짐</span><strong>${selectedItems.length}개</strong></div>
        ${PACKING_CATEGORIES.map((category) => `
          <div><span>${category.label}</span><strong>${countByCategory[category.key] || 0}개</strong></div>
        `).join("")}
      </div>
    `;
  }

  refreshSelection() {
    const scene = this.scene;
    if (!scene.packingModal) return;
    const buttons = this.getOptionButtons();
    buttons.forEach((button, index) => {
      const itemKey = button.dataset.itemKey;
      button.classList.toggle("is-selected", Boolean(itemKey && scene.packingSelectedKeys.has(itemKey)));
      button.classList.toggle("is-focused", index === scene.selectedPackingIndex);
    });

    const focused = buttons[scene.selectedPackingIndex];
    focused?.scrollIntoView({ block: "nearest", inline: "nearest" });
    this.renderSummary();
  }

  moveFocus(delta) {
    const scene = this.scene;
    const count = this.getOptionButtons().length;
    if (count <= 0) return;
    scene.selectedPackingIndex = (scene.selectedPackingIndex + delta + count) % count;
    this.refreshSelection();
  }

  moveFocusVertical(deltaRows) {
    this.moveFocus(deltaRows * this.getColumnCount());
  }

  getColumnCount() {
    const scene = this.scene;
    if (!scene.packingModal || scene.packingMode === "review") return 1;
    const grid = scene.packingModal.querySelector(".packing-grid");
    if (!grid) return 1;
    const columns = grid.querySelectorAll(".packing-item").length;
    return Math.max(1, columns || 1);
  }

  getOptionButtons() {
    const scene = this.scene;
    if (!scene.packingModal) return [];
    return Array.from(scene.packingModal.querySelectorAll(".packing-option"));
  }

  selectFocusedOption() {
    const scene = this.scene;
    if (!scene.packingModal) return false;
    const option = this.getOptionButtons()[scene.selectedPackingIndex];
    option?.click();
    return true;
  }

  handleKeyboard() {
    const scene = this.scene;
    if (!scene.packingModal || !scene.cursors || !scene.keys) return;
    const Key = Phaser.Input.Keyboard;
    if (Key.JustDown(scene.cursors.left) || Key.JustDown(scene.keys.left)) {
      this.moveFocus(-1);
    } else if (Key.JustDown(scene.cursors.right) || Key.JustDown(scene.keys.right)) {
      this.moveFocus(1);
    } else if (Key.JustDown(scene.cursors.up) || Key.JustDown(scene.keys.up)) {
      this.moveFocusVertical(-1);
    } else if (Key.JustDown(scene.cursors.down) || Key.JustDown(scene.keys.down)) {
      this.moveFocusVertical(1);
    }
  }

  completeSelection() {
    const scene = this.scene;
    const items = this.getSelectedItems();
    if (!items.length) {
      this.showAlert("❌ 여행 가방 안에 챙겨갈 소지품이 최소 1개 이상 들어있어야 짐싸기를 완료할 수 있습니다!");
      scene.playTone?.({ frequency: 220, duration: 0.12, type: "square", volume: 0.035 });
      return;
    }

    // 모달 상하 겹침 비주얼 버그를 완전히 차단하기 위해 이름표 팝업 전에 기존 가방 팝업 DOM 제거
    if (scene.packingModal) {
      scene.packingModal.remove();
      scene.packingModal = null;
    }

    this.openNameTagCustomizer();
  }

  openNameTagCustomizer() {
    const scene = this.scene;
    const stage = document.querySelector(".game-stage") || document.body;

    const modal = document.createElement("div");
    modal.className = "name-tag-modal";
    modal.innerHTML = `
      <div class="name-tag-panel">
        <div class="name-tag-header">
          <strong>🎒 나만의 여행 가방 이름표 만들기</strong>
          <span>여행가방에 붙일 이름표를 멋지게 꾸며보세요!</span>
        </div>
        
        <div class="name-tag-body">
          <div class="name-tag-controls">
            <div class="control-group">
              <label for="tag-name-input">소유자 이름</label>
              <input type="text" id="tag-name-input" value="해냄이" maxlength="8" placeholder="이름을 적어주세요" />
            </div>
            
            <div class="control-group">
              <label>이름표 색상</label>
              <div class="color-picker">
                <button type="button" class="color-btn is-yellow active" data-color="#ffd75a" aria-label="노란색 이름표"></button>
                <button type="button" class="color-btn is-blue" data-color="#79c6ff" aria-label="파란색 이름표"></button>
                <button type="button" class="color-btn is-pink" data-color="#ff9eb5" aria-label="분홍색 이름표"></button>
                <button type="button" class="color-btn is-green" data-color="#7bf09b" aria-label="초록색 이름표"></button>
              </div>
            </div>
            
            <div class="control-group">
              <label>여행 노선</label>
              <div class="route-info">
                <span>영주</span>
                <span class="arrow">➡️</span>
                <span>서울</span>
              </div>
            </div>
          </div>
          
          <div class="name-tag-preview-container">
            <label>미리보기</label>
            <div class="name-tag-preview" style="background-color: #ffd75a;">
              <div class="tag-header">LUGGAGE TAG</div>
              <div class="tag-route">
                <span class="tag-city">YEONGJU</span>
                <span class="tag-arrow">✈️</span>
                <span class="tag-city">SEOUL</span>
              </div>
              <div class="tag-divider"></div>
              <div class="tag-owner">
                <span class="tag-owner-label">PASSENGER</span>
                <strong class="tag-owner-name">해냄이</strong>
              </div>
              <div class="tag-barcode">
                <span class="barcode-line"></span>
                <span class="barcode-line"></span>
                <span class="barcode-line"></span>
                <span class="barcode-line"></span>
                <span class="barcode-line"></span>
                <span class="barcode-line"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="name-tag-footer">
          <button type="button" class="name-tag-submit-btn">가방에 이름표 달기 완료! ✨</button>
        </div>
      </div>
    `;

    stage.appendChild(modal);
    
    // 실시간 프리뷰 업데이트
    const input = modal.querySelector("#tag-name-input");
    const previewName = modal.querySelector(".tag-owner-name");
    const colorBtns = modal.querySelectorAll(".color-btn");
    const previewCard = modal.querySelector(".name-tag-preview");
    const submitBtn = modal.querySelector(".name-tag-submit-btn");

    input.addEventListener("input", (e) => {
      const name = e.target.value.trim() || "해냄이";
      previewName.textContent = name;
    });

    let selectedColor = "#ffd75a";

    colorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        colorBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedColor = btn.dataset.color;
        previewCard.style.backgroundColor = selectedColor;
      });
    });

    submitBtn.addEventListener("click", () => {
      const finalName = input.value.trim() || "해냄이";
      scene.customNameTag = {
        name: finalName,
        color: selectedColor
      };
      
      modal.remove();
      this.finishPackingSequence();
    });
  }

  finishPackingSequence() {
    const scene = this.scene;
    scene.packingItems = this.getSelectedItems().map((item) => ({ ...item }));
    this.close();
    scene.packingQuestState = "completed";
    scene.playItemPickupSound();
    scene.showFloatingItem("travel_bag", Math.max(384, (scene.scale.width || 768) / 2), Math.max(240, (scene.scale.height || 480) / 2), 116, true, { duration: 520, hold: 1000, floatY: -12 });
    scene.saveCheckpoint("packing_completed");
    scene.time.delayedCall(900, () => scene.travelEndingSystem.startPackedRoomSequence());
  }
}
