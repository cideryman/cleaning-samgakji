import {
  PACKING_CATEGORIES,
  PACKING_CATEGORY_LABELS,
  PACKING_ITEMS,
} from "../config/PackingData.js";

export default class PackingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  open() {
    const scene = this.scene;
    this.close();
    scene.packingSelectedKeys = new Set(scene.packingItems.map((item) => item.key));
    scene.selectedPackingIndex = 0;
    scene.packingStepIndex = 0;
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
    scene.packingModal?.remove();
    scene.packingModal = null;
    scene.packingSelectedKeys = new Set();
    scene.selectedPackingIndex = 0;
    scene.packingStepIndex = 0;
    scene.packingMode = "category";
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

  renderStep() {
    const scene = this.scene;
    if (!scene.packingModal) return;

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
    }).join("");
    const reviewClass = scene.packingMode === "review" ? "clothing-shop-step is-current" : "clothing-shop-step";
    return `${steps}<span class="${reviewClass}">가방 확인</span>`;
  }

  renderCategory(body, footer) {
    const scene = this.scene;
    const category = this.getCurrentCategory();
    const selectedCount = this.getSelectedItems().filter((item) => item.category === category.key).length;
    const items = PACKING_ITEMS.filter((item) => item.category === category.key);
    const grid = document.createElement("div");
    grid.className = "clothing-shop-grid packing-grid";
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>${category.label}</strong>
        <span>필요한 만큼 골라도 돼요. 선택 ${selectedCount}개</span>
      </div>
    `;
    body.appendChild(grid);

    items.forEach((item) => {
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

    const previousCategory = PACKING_CATEGORIES[scene.packingStepIndex - 1];
    const nextCategory = PACKING_CATEGORIES[scene.packingStepIndex + 1];
    if (previousCategory) {
      this.addFooterButton(footer, `${previousCategory.label} 가기`, "previous-category", "secondary");
    }
    this.addFooterButton(
      footer,
      nextCategory ? `${nextCategory.label} 가기` : "가방 확인하기",
      "next-category",
    );
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

    const lastCategory = PACKING_CATEGORIES[PACKING_CATEGORIES.length - 1];
    this.addFooterButton(footer, `${lastCategory.label} 가기`, "previous-category", "secondary");
    this.addFooterButton(footer, "짐싸기 완료", "complete");
    this.renderSummary();
  }

  addFooterButton(footer, label, action, tone = "primary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `clothing-shop-footer-button packing-option is-${tone}`;
    button.dataset.action = action;
    button.textContent = label;
    button.addEventListener("click", () => this.handleAction(action));
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

    if (action === "complete") {
      this.completeSelection();
    }
  }

  advanceStep() {
    const scene = this.scene;
    if (scene.packingMode === "review") return;

    if (scene.packingStepIndex >= PACKING_CATEGORIES.length - 1) {
      scene.packingMode = "review";
    } else {
      scene.packingStepIndex += 1;
    }
    scene.selectedPackingIndex = 0;
    this.renderStep();
  }

  goBackStep() {
    const scene = this.scene;
    if (scene.packingMode === "review") {
      scene.packingMode = "category";
      scene.packingStepIndex = PACKING_CATEGORIES.length - 1;
    } else if (scene.packingStepIndex > 0) {
      scene.packingStepIndex -= 1;
    }
    scene.selectedPackingIndex = 0;
    this.renderStep();
  }

  toggleSelection(itemKey) {
    const scene = this.scene;
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
    const columns = window.getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
    return Math.max(1, columns || 3);
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
    scene.packingItems = this.getSelectedItems().map((item) => ({ ...item }));
    this.close();
    scene.packingQuestState = "completed";
    scene.playItemPickupSound();
    scene.showFloatingItem("travel_bag", Math.max(384, (scene.scale.width || 768) / 2), Math.max(240, (scene.scale.height || 480) / 2), 116, true, { duration: 520, hold: 1000, floatY: -12 });
    scene.saveCheckpoint("packing_completed");
    scene.time.delayedCall(900, () => scene.startPackedRoomSequence());
  }
}
