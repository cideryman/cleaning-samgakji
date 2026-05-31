import {
  CLOTHING_SHOP_CATEGORIES,
  CLOTHING_SHOP_CATEGORY_LABELS,
  CLOTHING_SHOP_ITEMS,
} from "../config/ClothingShopData.js";

export default class ClothingShopSystem {
  constructor(scene) {
    this.scene = scene;
  }

  open() {
    const scene = this.scene;
    this.close();
    scene.clothingShopSelectedKeys = new Set();
    scene.selectedClothingShopIndex = 0;
    scene.clothingShopStepIndex = 0;
    scene.clothingShopMode = "category";

    const stage = document.querySelector(".game-stage") || document.body;
    const modal = document.createElement("div");
    modal.className = "clothing-shop-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "옷가게");
    modal.innerHTML = `
      <div class="clothing-shop-panel">
        <div class="clothing-shop-header">
          <strong>삼각옷방</strong>
          <span>마음에 드는 것을 고른 뒤 한 번에 계산해요.</span>
        </div>
        <div class="shop-alert-box"></div>
        <div class="clothing-shop-progress"></div>
        <div class="clothing-shop-body"></div>
        <div class="clothing-shop-summary"></div>
        <div class="clothing-shop-footer"></div>
      </div>
    `;
    scene.clothingShopModal = modal;
    stage.appendChild(modal);
    this.renderStep();
  }

  close() {
    const scene = this.scene;
    this.hideAlert();
    scene.clothingShopModal?.remove();
    scene.clothingShopModal = null;
    scene.clothingShopSelectedKeys = new Set();
    scene.selectedClothingShopIndex = 0;
    scene.clothingShopStepIndex = 0;
    scene.clothingShopMode = "category";

    // Restore focus to Phaser game canvas
    scene.game.canvas?.focus?.();
  }

  showAlert(message) {
    const alertBox = this.scene.clothingShopModal?.querySelector(".shop-alert-box");
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.style.display = "flex";
    
    alertBox.style.animation = "none";
    alertBox.offsetHeight; // trigger reflow
    alertBox.style.animation = "";

    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
    }, 5000);
  }

  hideAlert() {
    const alertBox = this.scene.clothingShopModal?.querySelector(".shop-alert-box");
    if (alertBox) {
      alertBox.style.display = "none";
    }
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  getShopIconFile(textureKey) {
    return `${textureKey.replace(/^shop_/, "").replaceAll("_", "-")}.png`;
  }

  hasTravelPrepItem(itemKey) {
    return this.scene.travelPrepItems.some((entry) => entry.key === itemKey);
  }

  getCurrentCategory() {
    const scene = this.scene;
    return CLOTHING_SHOP_CATEGORIES[scene.clothingShopStepIndex] || CLOTHING_SHOP_CATEGORIES[0];
  }

  getSelectedItems() {
    const scene = this.scene;
    return CLOTHING_SHOP_ITEMS.filter((item) => scene.clothingShopSelectedKeys.has(item.key));
  }

  getSelectedTotal() {
    return this.getSelectedItems().reduce((sum, item) => sum + item.price, 0);
  }

  formatMoney(amount) {
    return `${Math.max(0, amount).toLocaleString()}원`;
  }

  renderStep() {
    const scene = this.scene;
    if (!scene.clothingShopModal) return;

    this.hideAlert();

    const progress = scene.clothingShopModal.querySelector(".clothing-shop-progress");
    const body = scene.clothingShopModal.querySelector(".clothing-shop-body");
    const footer = scene.clothingShopModal.querySelector(".clothing-shop-footer");
    if (!progress || !body || !footer) return;

    body.className = "clothing-shop-body";
    body.innerHTML = "";
    footer.innerHTML = "";
    progress.innerHTML = this.renderProgress();
    this.bindProgressButtons(progress);

    if (scene.clothingShopMode === "receipt") {
      progress.innerHTML = ""; // 진행 단계 숨기기
      this.renderReceipt(body, footer);
    } else if (scene.clothingShopMode === "review") {
      this.renderReview(body, footer);
    } else {
      this.renderCategory(body, footer);
    }

    this.refreshSelection();
  }

  renderProgress() {
    const scene = this.scene;
    const steps = CLOTHING_SHOP_CATEGORIES.map((category, index) => {
      const isDone = index < scene.clothingShopStepIndex || scene.clothingShopMode === "review";
      const isCurrent = index === scene.clothingShopStepIndex && scene.clothingShopMode !== "review";
      const className = ["clothing-shop-step", isDone ? "is-done" : "", isCurrent ? "is-current" : ""]
        .filter(Boolean)
        .join(" ");
      return `<span class="${className}">${category.label}</span>`;
    }).join("<span style='margin: 0 4px; color: #a48b73;'>➔</span>");

    const reviewClass = scene.clothingShopMode === "review"
      ? "clothing-shop-step is-current"
      : "clothing-shop-step";
    return `${steps}<span style='margin: 0 4px; color: #a48b73;'>➔</span><span class="${reviewClass}">계산하기</span>`;
  }

  bindProgressButtons(progress) {
    progress.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "category") {
          this.goToCategory(Number(button.dataset.categoryIndex || 0));
          return;
        }
        if (action === "review") {
          this.goToReview();
        }
      });
    });
  }

  renderCategory(body, footer) {
    const scene = this.scene;
    const category = this.getCurrentCategory();
    const selectedCount = this.getSelectedItems().filter((item) => item.category === category.key).length;
    const items = CLOTHING_SHOP_ITEMS.filter((item) => item.category === category.key);
    const grid = document.createElement("div");
    grid.className = "clothing-shop-grid";
    grid.setAttribute("aria-label", `${category.label} ${selectedCount}개 선택`);
    body.appendChild(grid);

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "clothing-shop-item clothing-shop-option";
      button.dataset.action = "toggle";
      button.dataset.itemKey = item.key;
      if (this.hasTravelPrepItem(item.key)) {
        button.classList.add("is-owned");
        button.setAttribute("aria-label", `${item.label}, 이미 준비한 물건`);
      }
      button.innerHTML = `
        <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
        <span class="item-label">${item.label}</span>
        <span class="item-price">${item.price.toLocaleString()}원</span>
        ${this.hasTravelPrepItem(item.key) ? '<span class="item-status">이미 준비</span>' : ""}
      `;
      button.addEventListener("click", () => this.toggleSelection(item.key));
      grid.appendChild(button);
    });

    const nextCategory = CLOTHING_SHOP_CATEGORIES[scene.clothingShopStepIndex + 1];
    if (scene.clothingShopStepIndex > 0) {
      this.addFooterButton(footer, "이전", "previous-category", "secondary");
    }
    this.addFooterButton(
      footer,
      nextCategory ? "다음" : "확인하기",
      "next-category",
    );
    this.addFooterButton(footer, "계산하기", "review", "secondary");
    this.addFooterButton(footer, "나가기", "close", "secondary");
    this.renderSummary();
  }

  renderReview(body, footer) {
    const selectedItems = this.getSelectedItems();
    body.classList.add("is-review");
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>마지막 확인</strong>
        <span>방향키로 고른 뒤 Space 또는 터치하면 선택을 뺄 수 있어요.</span>
      </div>
      <div class="clothing-shop-review-list"></div>
    `;
    const list = body.querySelector(".clothing-shop-review-list");

    if (selectedItems.length === 0) {
      list.innerHTML = '<div class="clothing-shop-empty">고른 옷이 없어요. 이전으로 돌아가서 골라볼까요?</div>';
    } else {
      selectedItems.forEach((item) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "clothing-shop-review-item clothing-shop-option";
        row.dataset.action = "remove";
        row.dataset.itemKey = item.key;
        row.innerHTML = `
          <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
          <span class="review-name">${item.label}</span>
          <span class="review-category">${CLOTHING_SHOP_CATEGORY_LABELS[item.category] || item.category}</span>
          <span class="review-price">${item.price.toLocaleString()}원</span>
          <span class="review-remove">선택 취소</span>
        `;
        row.addEventListener("click", () => this.removeSelection(item.key));
        list.appendChild(row);
      });
    }

    this.addFooterButton(footer, "계산하기", "checkout");
    this.addFooterButton(footer, "이전", "previous-category", "secondary");
    this.addFooterButton(footer, "나가기", "close", "secondary");
    this.renderSummary();
  }

  addFooterButton(footer, label, action, tone = "primary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `clothing-shop-footer-button clothing-shop-option is-${tone}`;
    button.dataset.action = action;
    button.textContent = label;
    // iOS Safari 300ms 탭 딜레이 및 인풋 충돌 방지를 위해 pointerdown 바인딩 처리
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleAction(action);
    });
    footer.appendChild(button);
    return button;
  }

  handleAction(action) {
    if (action === "next-category") {
      this.advanceStep();
      return;
    }

    if (action === "previous-category") {
      this.goBackStep();
      return;
    }

    if (action === "checkout") {
      this.checkoutSelection();
      return;
    }

    if (action === "review") {
      this.goToReview();
      return;
    }

    if (action === "close") {
      this.finishVisit();
      return;
    }

    if (action.startsWith("choice-")) {
      const selectedValue = parseInt(action.replace("choice-", ""), 10);
      this.handleReceiptChangeSelection(selectedValue);
      return;
    }

    if (action === "close-receipt") {
      this.scene.clothingShopMode = "review";
      this.renderStep();
      return;
    }
  }

  advanceStep() {
    const scene = this.scene;
    if (scene.clothingShopMode === "review") return;

    if (scene.clothingShopStepIndex >= CLOTHING_SHOP_CATEGORIES.length - 1) {
      scene.clothingShopMode = "review";
    } else {
      scene.clothingShopStepIndex += 1;
    }
    scene.selectedClothingShopIndex = 0;
    this.renderStep();
  }

  goToCategory(index) {
    const scene = this.scene;
    scene.clothingShopMode = "category";
    scene.clothingShopStepIndex = Phaser.Math.Clamp(index, 0, CLOTHING_SHOP_CATEGORIES.length - 1);
    scene.selectedClothingShopIndex = 0;
    this.renderStep();
  }

  goToReview() {
    const scene = this.scene;
    scene.clothingShopMode = "review";
    scene.selectedClothingShopIndex = 0;
    this.renderStep();
  }

  goBackStep() {
    const scene = this.scene;
    if (scene.clothingShopMode === "review") {
      scene.clothingShopMode = "category";
      scene.clothingShopStepIndex = CLOTHING_SHOP_CATEGORIES.length - 1;
    } else if (scene.clothingShopStepIndex > 0) {
      scene.clothingShopStepIndex -= 1;
    }
    scene.selectedClothingShopIndex = 0;
    this.renderStep();
  }

  toggleSelection(itemKey) {
    const scene = this.scene;
    const item = CLOTHING_SHOP_ITEMS.find((candidate) => candidate.key === itemKey);
    if (!item) return;

    if (this.hasTravelPrepItem(item.key)) {
      this.showAlert("💡 이미 준비하여 지참하고 있는 물건입니다.");
      scene.playTone?.({ frequency: 220, duration: 0.12, type: "square", volume: 0.035 });
      return;
    }

    if (scene.clothingShopSelectedKeys.has(item.key)) {
      scene.clothingShopSelectedKeys.delete(item.key);
    } else {
      scene.clothingShopSelectedKeys.add(item.key);
    }
    this.renderStep();
  }

  removeSelection(itemKey) {
    const scene = this.scene;
    scene.clothingShopSelectedKeys.delete(itemKey);
    scene.selectedClothingShopIndex = Math.max(0, scene.selectedClothingShopIndex - 1);
    this.renderStep();
  }

  checkoutSelection() {
    const scene = this.scene;
    const items = this.getSelectedItems().filter((item) => !this.hasTravelPrepItem(item.key));
    if (!items.length) {
      this.showAlert("💡 먼저 구매할 옷을 최소 1개 이상 선택해 주세요!");
      scene.playTone?.({ frequency: 220, duration: 0.12, type: "square", volume: 0.035 });
      return;
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const balance = scene.moneySystem?.money ?? 0;
    if (balance < totalPrice) {
      scene.clothingShopMode = "review";
      this.showNotEnoughMoney(totalPrice);
      this.renderStep();
      return;
    }

    // 낸 돈 계산 (소지금 balance 한도 내에서 totalPrice보다 큰 5,000원 단위 현실적인 지불금 결정)
    let paidCash = Math.ceil(totalPrice / 5000) * 5000;
    if (paidCash === totalPrice) {
      paidCash += 5000; // 항상 거스름돈이 있도록 보장
    }
    // 소지금을 초과하는 경우 1,000원 단위로 낮추어 안전성 확보
    if (paidCash > balance) {
      paidCash = Math.ceil(totalPrice / 1000) * 1000;
      if (paidCash === totalPrice) paidCash += 1000;
      if (paidCash > balance) paidCash = balance; // 완전히 털어서 딱 지불하는 한도 설정
    }

    scene.clothingShopReceiptData = {
      items: [...items],
      totalPrice: totalPrice,
      paidCash: paidCash,
      correctChange: paidCash - totalPrice
    };

    scene.clothingShopMode = "receipt";
    this.renderStep();
  }

  renderReceipt(body, footer) {
    const scene = this.scene;
    const receiptData = scene.clothingShopReceiptData;
    if (!receiptData) return;

    const { items, totalPrice, paidCash, correctChange } = receiptData;

    body.className = "clothing-shop-body is-receipt-mode";
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>🧾 스마트 영수증 & 거스름돈 확인</strong>
        <span>거스름돈을 계산하고 확인하여 결제를 끝마쳐봐요!</span>
      </div>
      <div class="receipt-container">
        <div class="receipt-paper">
          <div class="receipt-brand">삼각옷방 영수증</div>
          <div class="receipt-info">
            <span>일자: ${new Date().toISOString().split('T')[0]}</span>
            <span>결제: 현금 지불</span>
          </div>
          <hr class="receipt-divider" />
          <div class="receipt-items">
            ${items.map(item => `
              <div class="receipt-item-row">
                <span>${item.label}</span>
                <strong>${item.price.toLocaleString()}원</strong>
              </div>
            `).join('')}
          </div>
          <hr class="receipt-divider" />
          <div class="receipt-totals">
            <div class="receipt-total-row">
              <span>총 금액 (Total)</span>
              <strong>${totalPrice.toLocaleString()}원</strong>
            </div>
            <div class="receipt-total-row">
              <span>받은 돈 (Cash)</span>
              <strong>${paidCash.toLocaleString()}원</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="receipt-question">
        <p>받은 돈은 <strong>${paidCash.toLocaleString()}원</strong>이고, 옷의 총금액은 <strong>${totalPrice.toLocaleString()}원</strong>입니다.</p>
        <p>돌려받아야 할 <strong>거스름돈</strong>은 얼마일까요? 아래에서 올바른 금액을 선택해 보세요.</p>
      </div>
    `;

    // 보기 옵션 만들기 (정답에 천원 단위를 가감하여 출제)
    let wrong1 = correctChange + 2000;
    if (correctChange - 2000 > 0) {
      wrong1 = correctChange - 2000;
    }
    const wrong2 = correctChange + 3000;
    const choices = Array.from(new Set([correctChange, wrong1, wrong2])).sort((a, b) => a - b);

    footer.innerHTML = "";
    choices.forEach((value) => {
      this.addFooterButton(footer, `${value.toLocaleString()}원`, `choice-${value}`);
    });
    this.addFooterButton(footer, "취소하기", "close-receipt", "secondary");
  }

  handleReceiptChangeSelection(selectedChange) {
    const scene = this.scene;
    const receiptData = scene.clothingShopReceiptData;
    if (!receiptData) return;

    const { items, totalPrice, paidCash, correctChange } = receiptData;

    if (selectedChange === correctChange) {
      if (!scene.moneySystem?.deductMoney(totalPrice)) {
        scene.clothingShopMode = "review";
        this.showNotEnoughMoney(totalPrice);
        this.renderStep();
        return;
      }

      items.forEach((item) => {
        scene.travelPrepItems.push({
          key: item.key,
          category: item.category,
          label: item.label,
          texture: item.texture,
          price: item.price,
        });
      });
      scene.playItemPickupSound();
      const previewItem = items[items.length - 1];
      scene.showFloatingItem(previewItem.texture, scene.scale.width / 2, scene.scale.height / 2 - 24, 86, true, { duration: 420 });
      this.updateTravelPrepHud();
      scene.showQuestToast(`정답입니다! 거스름돈 ${correctChange.toLocaleString()}원을 받았습니다.`, 4000);

      this.close();

      if (scene.clothesQuestState === "completed") {
        scene.clearInteriorScene();
        scene.saveCheckpoint("clothes_extra_items_bought");
        return;
      }

      // Let the DOM receipt modal fully close before the quest dialogue/camera flow starts.
      // This avoids a same-frame clash between the shop overlay, interior scene, and Jjook dialogue.
      scene.time.delayedCall(120, () => scene.completeClothesShoppingQuest());
    } else {
      scene.playTone?.({ frequency: 180, duration: 0.2, type: "sawtooth", volume: 0.05 });
      scene.showQuestToast(`아닙니다! 다시 계산해 볼까요? (${paidCash.toLocaleString()} - ${totalPrice.toLocaleString()} = ?)`, 5000);
    }
  }

  showNotEnoughMoney(totalPrice) {
    const scene = this.scene;
    const balance = scene.moneySystem?.money ?? 0;
    const shortfall = Math.max(0, totalPrice - balance);
    this.showAlert(`❌ 소지하고 계신 돈이 ${shortfall.toLocaleString()}원 부족합니다! 장바구니에서 일부 상품을 제외해 주세요.`);
    scene.playTone?.({ frequency: 220, duration: 0.15, type: "square", volume: 0.035 });
  }

  refreshSelection() {
    const scene = this.scene;
    if (!scene.clothingShopModal) return;
    const buttons = this.getOptionButtons();
    buttons.forEach((button, index) => {
      const itemKey = button.dataset.itemKey;
      button.classList.toggle("is-selected", Boolean(itemKey && scene.clothingShopSelectedKeys.has(itemKey)));
      button.classList.toggle("is-focused", index === scene.selectedClothingShopIndex);
    });

    const focused = buttons[scene.selectedClothingShopIndex];
    focused?.scrollIntoView({ block: "nearest", inline: "nearest" });
    this.renderSummary();
  }

  moveFocus(delta) {
    const scene = this.scene;
    const count = this.getOptionButtons().length;
    if (count <= 0) return;
    scene.selectedClothingShopIndex = (scene.selectedClothingShopIndex + delta + count) % count;
    this.refreshSelection();
  }

  moveFocusVertical(deltaRows) {
    this.moveFocus(deltaRows * this.getColumnCount());
  }

  getColumnCount() {
    const scene = this.scene;
    if (!scene.clothingShopModal || scene.clothingShopMode === "review") return 1;
    const grid = scene.clothingShopModal.querySelector(".clothing-shop-grid");
    if (!grid) return 1;
    const columns = window.getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
    return Math.max(1, columns || 3);
  }

  getOptionButtons() {
    const scene = this.scene;
    if (!scene.clothingShopModal) return [];
    return Array.from(scene.clothingShopModal.querySelectorAll(".clothing-shop-option:not(.is-owned)"));
  }

  renderSummary() {
    const scene = this.scene;
    if (!scene.clothingShopModal) return;

    const summary = scene.clothingShopModal.querySelector(".clothing-shop-summary");
    if (!summary) return;

    const selectedItems = this.getSelectedItems();
    const totalPrice = this.getSelectedTotal();
    const balance = scene.moneySystem?.money ?? 0;
    const shortfall = Math.max(0, totalPrice - balance);
    const remaining = Math.max(0, balance - totalPrice);
    const overBudgetClass = shortfall > 0 ? "is-over-budget" : "is-in-budget";

    summary.innerHTML = `
      <div class="clothing-shop-money-grid ${overBudgetClass}">
        <div><span>고른 옷</span><strong>${selectedItems.length}개</strong></div>
        <div><span>합계</span><strong>${this.formatMoney(totalPrice)}</strong></div>
        <div><span>내 잔고</span><strong>${this.formatMoney(balance)}</strong></div>
        <div><span>${shortfall > 0 ? "부족" : "남는 돈"}</span><strong>${this.formatMoney(shortfall > 0 ? shortfall : remaining)}</strong></div>
      </div>
    `;
  }

  selectFocusedOption() {
    const scene = this.scene;
    if (!scene.clothingShopModal) return false;
    const option = this.getOptionButtons()[scene.selectedClothingShopIndex];
    option?.click();
    return true;
  }

  handleKeyboard() {
    const scene = this.scene;
    if (!scene.clothingShopModal || !scene.cursors || !scene.keys) return;
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

  finishVisit() {
    const scene = this.scene;
    this.close();
    scene.clearInteriorScene();
    if (scene.clothesQuestState === "completed") {
      return;
    }

    scene.isJjookClothesEscortActive = true;
    const message = scene.travelPrepItems.length > 0
      ? "좋아! 나머지는 다음에 또 골라보자."
      : "괜찮아! 보는 것도 준비야. 다음에 다시 골라보자.";
    scene.showSpeechBubble(scene.jjookNpc || scene.player, message, 2600);
  }

  updateTravelPrepHud() {
    const scene = this.scene;
    const items = Array.isArray(scene.travelPrepItems) ? scene.travelPrepItems : [];
    if (!scene.travelPrepHudEl) return;

    if (!items.length) {
      scene.isTravelPrepFanOpen = false;
      scene.travelPrepHudEl.classList.remove("is-visible", "is-open");
      scene.travelPrepHudEl.setAttribute("aria-hidden", "true");
      scene.travelPrepFanEl?.replaceChildren();
      scene.travelPrepFanEl?.setAttribute("aria-hidden", "true");
      if (scene.travelPrepCountEl) scene.travelPrepCountEl.textContent = "0";
      return;
    }

    scene.travelPrepHudEl.classList.add("is-visible");
    scene.travelPrepHudEl.setAttribute("aria-hidden", "false");
    scene.travelPrepHudEl.setAttribute("aria-label", `준비한 옷 ${items.length}개 보기`);
    if (scene.travelPrepBagIconEl) scene.travelPrepBagIconEl.src = "./assets/shop-icons/paper-bag.png";
    if (scene.travelPrepCountEl) scene.travelPrepCountEl.textContent = String(items.length);
    this.renderTravelPrepFan();
  }

  toggleTravelPrepFan() {
    const scene = this.scene;
    if (!scene.travelPrepItems?.length) return;
    scene.isTravelPrepFanOpen = !scene.isTravelPrepFanOpen;
    this.renderTravelPrepFan();
  }

  renderTravelPrepFan() {
    const scene = this.scene;
    if (!scene.travelPrepFanEl || !scene.travelPrepHudEl) return;
    const items = Array.isArray(scene.travelPrepItems) ? scene.travelPrepItems : [];
    scene.travelPrepFanEl.replaceChildren();
    const useGridLayout = items.length > 5;
    scene.travelPrepHudEl.classList.toggle("is-open", scene.isTravelPrepFanOpen && items.length > 0);
    scene.travelPrepHudEl.classList.toggle("is-grid", useGridLayout);
    scene.travelPrepHudEl.classList.toggle("is-fan", !useGridLayout);
    scene.travelPrepFanEl.setAttribute("aria-hidden", scene.isTravelPrepFanOpen ? "false" : "true");

    const maxGridColumns = 5;
    items.forEach((item, index) => {
      let x = 0;
      let y = 0;
      let rotation = 0;

      if (useGridLayout) {
        const row = Math.floor(index / maxGridColumns);
        const rows = Math.ceil(items.length / maxGridColumns);
        const rowStart = row * maxGridColumns;
        const rowCount = Math.min(maxGridColumns, items.length - rowStart);
        const col = index - rowStart;
        x = -16 - (rowCount - 1 - col) * 62;
        y = -108 - (rows - 1 - row) * 66;
      } else {
        const spread = items.length <= 1 ? 0 : 70;
        const startAngle = items.length <= 1 ? 235 : 198;
        const angle = startAngle + (items.length <= 1 ? 0 : (spread * index) / (items.length - 1));
        const radians = Phaser.Math.DegToRad(angle);
        x = Math.cos(radians) * 96;
        y = Math.sin(radians) * 96;
        rotation = angle - 238;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "travel-prep-fan-item";
      button.style.setProperty("--fan-x", `${x.toFixed(1)}px`);
      button.style.setProperty("--fan-y", `${y.toFixed(1)}px`);
      button.style.setProperty("--fan-rotation", `${rotation.toFixed(1)}deg`);
      button.style.setProperty("--fan-delay", `${Math.min(index, 8) * 24}ms`);
      button.setAttribute("aria-label", `${item.label} 준비됨`);
      button.innerHTML = `
        <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
        <span>${item.label}</span>
      `;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        scene.showQuestToast(`${item.label} 준비했어요.`);
      });
      scene.travelPrepFanEl.appendChild(button);
    });
  }
}
