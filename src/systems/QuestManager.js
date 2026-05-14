class QuestManager {
  constructor(scene) {
    this.scene = scene;
    this.canQuest = {
      id: "collect_cans",
      name: "캔 모으기",
      type: "collect_cans",
      target: 20,
      current: 0,
      reward: 10000,
      isActive: false,
      isCompleted: false,
    };
    this.recycleQuest = {
      id: "recycle_master",
      name: "분리수거 전문가",
      type: "recycle",
      target: { normal: 30, can: 10 },
      current: { normal: 0, can: 0 },
      reward: 0,
      isUnlocked: false,
      isActive: false,
      isCompleted: false,
    };
    this.uiElements = {
      root: document.querySelector("#canQuestHud"),
      label: document.querySelector("#canQuestLabel"),
      bar: document.querySelector("#canQuestBar"),
    };
    this.renderGauge(20);
    this.updateUI();
  }

  renderGauge(count) {
    if (!this.uiElements.bar) return;

    this.uiElements.bar.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      this.uiElements.bar.appendChild(document.createElement("span"));
    }
  }

  startQuest() {
    const quest = this.canQuest;
    if (quest.isCompleted) return;

    quest.isActive = true;
    this.uiElements.root?.classList.remove("is-poofing");
    this.renderGauge(quest.target);
    this.updateUI();
    this.scene.showQuestToast?.("상처리 퀘스트: 캔 20개 모으기!");
    this.scene.playItemPickupSound?.();
  }

  updateQuestProgress(canCount = 1) {
    const quest = this.canQuest;
    if (!quest.isActive || quest.isCompleted) return;

    quest.current = Math.min(quest.target, quest.current + canCount);
    this.updateUI();

    if (quest.current >= quest.target) {
      this.completeQuest();
    }
  }

  completeQuest() {
    const quest = this.canQuest;
    if (quest.isCompleted) return;

    quest.isActive = false;
    quest.isCompleted = true;
    quest.current = quest.target;
    this.updateUI();

    this.scene.moneySystem?.addMoney(quest.reward);
    this.scene.playMoneyRewardSound?.();
    this.scene.showMoneyRewardAnimation?.(quest.reward);
    this.scene.showQuestToast?.(`수당 ${quest.reward.toLocaleString()}원 획득!`);
    if (this.scene.player) {
      this.scene.showCleanFeedback?.(this.scene.player.x, this.scene.player.y, true);
    }
    this.hideQuestGaugeWithPoof();

    this.scene.time.delayedCall(180, () => {
      this.scene.dialogueSystem?.start([
        {
          name: "상처리",
          text: "고마워! 캔 20개를 모으다니, 역시 해냄이야!",
        },
      ]);
    });
  }

  unlockRecycleQuest() {
    if (this.recycleQuest.isUnlocked || this.recycleQuest.isCompleted) return false;

    this.recycleQuest.isUnlocked = true;
    return true;
  }

  startRecycleQuest() {
    const quest = this.recycleQuest;
    if (!quest.isUnlocked || quest.isCompleted) return;

    quest.isActive = true;
    this.uiElements.root?.classList.remove("is-poofing");
    this.renderGauge(this.getRecycleTargetTotal());
    this.updateUI();
    this.scene.showQuestToast?.("분리수거 퀘스트 시작!");
    this.scene.playItemPickupSound?.();
  }

  depositRecycleItem(type) {
    const quest = this.recycleQuest;
    if (!quest.isActive || quest.isCompleted || !(type in quest.target)) return;

    if (quest.current[type] >= quest.target[type]) {
      this.scene.showSpeechBubble?.(this.scene.player, "이 종류는 충분해!");
      return;
    }

    quest.current[type] += 1;
    this.updateUI();

    if (this.isRecycleQuestReadyToComplete()) {
      this.completeRecycleQuest();
    }
  }

  completeRecycleQuest() {
    const quest = this.recycleQuest;
    if (quest.isCompleted) return;

    quest.isActive = false;
    quest.isCompleted = true;
    quest.current.normal = quest.target.normal;
    quest.current.can = quest.target.can;
    this.updateUI();
    this.scene.activateRecycleMasterReward?.();
    this.hideQuestGaugeWithPoof();
  }

  isRecycleQuestReadyToComplete() {
    const quest = this.recycleQuest;
    return Object.keys(quest.target).every((type) => quest.current[type] >= quest.target[type]);
  }

  getRecycleTargetTotal() {
    return Object.values(this.recycleQuest.target).reduce((sum, value) => sum + value, 0);
  }

  getRecycleCurrentTotal() {
    return Object.keys(this.recycleQuest.target).reduce((sum, type) => {
      return sum + Math.min(this.recycleQuest.current[type], this.recycleQuest.target[type]);
    }, 0);
  }

  hideQuestGaugeWithPoof() {
    const { root } = this.uiElements;
    if (!root) return;

    root.classList.remove("is-hidden");
    root.classList.add("is-poofing");
    root.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      root.classList.remove("is-poofing");
      root.classList.add("is-hidden");
    }, 460);
  }

  getQuestState() {
    if (this.canQuest.isCompleted) return "completed";
    if (this.canQuest.isActive) return "active";
    return "inactive";
  }

  getRecycleQuestState() {
    if (this.recycleQuest.isCompleted) return "completed";
    if (this.recycleQuest.isActive) return "active";
    if (this.recycleQuest.isUnlocked) return "unlocked";
    return "locked";
  }

  updateUI() {
    const { root, label, bar } = this.uiElements;
    if (!root || !label || !bar) return;

    const recycleQuest = this.recycleQuest;
    if (recycleQuest.isActive || recycleQuest.isCompleted) {
      const current = this.getRecycleCurrentTotal();
      const target = this.getRecycleTargetTotal();
      root.classList.toggle("is-hidden", false);
      root.classList.toggle("is-complete", recycleQuest.isCompleted);
      root.setAttribute("aria-hidden", "false");
      if (bar.children.length !== target) {
        this.renderGauge(target);
      }
      label.textContent = recycleQuest.isCompleted
        ? "분리수거 전문가 완료"
        : `분리수거: 일반 ${recycleQuest.current.normal}/${recycleQuest.target.normal} · 캔 ${recycleQuest.current.can}/${recycleQuest.target.can}`;
      Array.from(bar.children).forEach((dot, index) => {
        dot.classList.toggle("is-filled", index < current);
      });
      return;
    }

    const quest = this.canQuest;
    root.classList.toggle("is-hidden", !quest.isActive && !quest.isCompleted);
    root.classList.toggle("is-complete", quest.isCompleted);
    root.setAttribute("aria-hidden", String(!quest.isActive && !quest.isCompleted));

    if (quest.isCompleted) {
      label.textContent = "캔 모으기 완료";
    } else if (quest.isActive) {
      label.textContent = `캔 수집: ${quest.current} / ${quest.target}`;
    } else {
      label.textContent = "퀘스트 없음";
    }

    Array.from(bar.children).forEach((dot, index) => {
      dot.classList.toggle("is-filled", index < quest.current);
    });
  }
}
