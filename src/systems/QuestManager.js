class QuestManager {
  constructor(scene) {
    this.scene = scene;
    this.activeQuest = {
      id: "collect_cans",
      name: "캔 모아 챌린지",
      type: "collect_cans",
      target: 20,
      current: 0,
      reward: 10000,
      isActive: false,
      isCompleted: false,
    };
    this.uiElements = {
      root: document.querySelector("#canQuestHud"),
      label: document.querySelector("#canQuestLabel"),
      bar: document.querySelector("#canQuestBar"),
    };
    this.createCanGauge();
    this.updateUI();
  }

  createCanGauge() {
    if (!this.uiElements.bar) return;

    this.uiElements.bar.innerHTML = "";
    for (let i = 0; i < this.activeQuest.target; i += 1) {
      this.uiElements.bar.appendChild(document.createElement("span"));
    }
  }

  startQuest() {
    const quest = this.activeQuest;
    if (quest.isCompleted) return;

    quest.isActive = true;
    this.uiElements.root?.classList.remove("is-poofing");
    this.updateUI();
    this.scene.showQuestToast?.("새 퀘스트: 캔 20개 모으기");
    this.scene.playItemPickupSound?.();
  }

  updateQuestProgress(canCount = 1) {
    const quest = this.activeQuest;
    if (!quest.isActive || quest.isCompleted) return;

    quest.current = Math.min(quest.target, quest.current + canCount);
    this.updateUI();

    if (quest.current >= quest.target) {
      this.completeQuest();
    }
  }

  completeQuest() {
    const quest = this.activeQuest;
    if (quest.isCompleted) return;

    quest.isActive = false;
    quest.isCompleted = true;
    quest.current = quest.target;
    this.updateUI();

    this.scene.moneySystem?.addMoney(quest.reward);
    this.scene.playMoneyRewardSound?.();
    this.scene.showMoneyRewardAnimation?.(quest.reward);
    this.scene.showQuestToast?.(`선물 ${quest.reward.toLocaleString()}원 획득!`);
    if (this.scene.player) {
      this.scene.showCleanFeedback?.(this.scene.player.x, this.scene.player.y, true);
    }
    this.hideQuestGaugeWithPoof();

    this.scene.time.delayedCall(180, () => {
      this.scene.dialogueSystem?.start([
        {
          name: "상처리",
          text: "고마워! 덕분에 캔 20개를 모았어. 여기 약속한 선물이야!",
        },
      ]);
    });
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
    if (this.activeQuest.isCompleted) return "completed";
    if (this.activeQuest.isActive) return "active";
    return "inactive";
  }

  updateUI() {
    const { root, label, bar } = this.uiElements;
    if (!root || !label || !bar) return;

    const quest = this.activeQuest;
    root.classList.toggle("is-hidden", !quest.isActive && !quest.isCompleted);
    root.classList.toggle("is-complete", quest.isCompleted);
    root.setAttribute("aria-hidden", String(!quest.isActive && !quest.isCompleted));

    if (quest.isCompleted) {
      label.textContent = "캔 모아 챌린지 완료";
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
