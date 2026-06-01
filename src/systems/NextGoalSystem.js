import { GAME_CONFIG } from "../config/GameConstants.js";
import {
  CanQuestState,
  ClothesQuestState,
  JjookQuestState,
  PackingQuestState,
  RecycleQuestState,
  SunisuniQuestState,
} from "../config/QuestStates.js";

const UPDATE_INTERVAL_MS = 500;
const MIN_TEXT_CHANGE_MS = 2000;

export default class NextGoalSystem {
  constructor(scene) {
    this.scene = scene;
    this.el = document.querySelector("#nextQuestHint");
    this.refreshEvent = null;
    this.lastText = "";
    this.lastTextChangedAt = 0;
    this.pendingGoal = null;
    this.isCompact = false;
  }

  create() {
    this.updateCompactMode();
    this.hide();
    this.refreshEvent = this.scene.time.addEvent({
      delay: UPDATE_INTERVAL_MS,
      loop: true,
      callback: () => this.refresh(),
    });
    this.refresh();
  }

  destroy() {
    this.refreshEvent?.remove(false);
    this.refreshEvent = null;
    this.hide();
  }

  refresh() {
    if (!this.el) return;
    this.updateCompactMode();

    if (!this.canShow()) {
      this.pendingGoal = null;
      this.hide();
      return;
    }

    const goal = this.getCurrentGoal();
    if (!goal?.text) {
      this.pendingGoal = null;
      this.hide();
      return;
    }

    const text = this.isCompact && goal.shortText ? goal.shortText : goal.text;
    this.show(text);
  }

  canShow() {
    const scene = this.scene;
    if (scene.tutorialState && scene.tutorialState !== "completed") return false;
    if (scene.isInDialogue || scene.dialogueSystem?.isInDialogue) return false;
    if (scene.isChapterComplete || scene.isMissionComplete) return false;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.()) return false;
    if (scene.vendingMenuGroup || scene.interiorSceneGroup) return false;
    return !this.hasOpenDomModal();
  }

  hasOpenDomModal() {
    return Boolean(
      this.isVisibleElement(document.querySelector("#settingsModal"))
      || this.isVisibleElement(document.querySelector("#edu-guide-modal"))
      || document.querySelector("#rest-stats-modal.is-visible")
      || document.querySelector(".clothing-shop-modal")
      || document.querySelector(".packing-modal")
      || document.querySelector(".name-tag-modal")
    );
  }

  isVisibleElement(element) {
    if (!element) return false;
    if (element.getAttribute("aria-hidden") === "false") return true;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  show(text) {
    if (!text) return;

    if (text === this.lastText) {
      if (this.el.textContent !== text) {
        this.el.textContent = text;
      }
      this.el.classList.remove("is-hidden");
      this.el.setAttribute("aria-hidden", "false");
      return;
    }

    const now = this.scene.time.now;
    if (this.lastText && now - this.lastTextChangedAt < MIN_TEXT_CHANGE_MS) {
      this.pendingGoal = text;
      return;
    }

    this.applyText(text);
  }

  applyText(text) {
    this.pendingGoal = null;
    this.lastText = text;
    this.lastTextChangedAt = this.scene.time.now;
    this.el.textContent = text;
    this.el.classList.remove("is-hidden");
    this.el.setAttribute("aria-hidden", "false");
    this.el.classList.remove("is-pulsing");
    void this.el.offsetWidth;
    this.el.classList.add("is-pulsing");
  }

  hide() {
    if (!this.el) return;
    this.el.classList.add("is-hidden");
    this.el.setAttribute("aria-hidden", "true");
    this.el.classList.remove("is-pulsing");
    this.el.textContent = "";
  }

  updateCompactMode() {
    this.isCompact = Boolean(
      window.matchMedia?.("(pointer: coarse)").matches
      || window.matchMedia?.("(max-height: 500px)").matches
      || window.matchMedia?.("(max-width: 780px)").matches
    );
  }

  getCurrentGoal() {
    return (
      this.getActiveQuestGoal()
      || this.getReadyQuestGoal()
      || this.getUnlockGoal()
      || this.getFreePlayGoal()
    );
  }

  getActiveQuestGoal() {
    const scene = this.scene;
    const yebi = scene.yebiQuestSystem;
    const canState = yebi?.getCanQuestState?.() ?? CanQuestState.INACTIVE;
    const recycleState = yebi?.getRecycleQuestState?.() ?? RecycleQuestState.LOCKED;

    if (canState === CanQuestState.ACTIVE) {
      const current = yebi.canQuest?.current ?? 0;
      const target = yebi.canQuest?.target ?? GAME_CONFIG.canCount;
      return {
        text: `캔 ${current}/${target}개 모으기`,
        shortText: `캔 ${Math.max(0, target - current)}개`,
      };
    }

    if (recycleState === RecycleQuestState.ACTIVE) {
      const done = yebi.getRecycleQuestProgress?.() ?? 0;
      const total = yebi.getRecycleQuestTotal?.() ?? 40;
      return {
        text: `분리수거 ${done}/${total}개 하기`,
        shortText: `분리수거 ${done}/${total}`,
      };
    }

    if (scene.jjookQuestState === JjookQuestState.WALLET_MISSING) {
      return { text: "쭉쭉이 지갑 찾기", shortText: "지갑 찾기" };
    }

    if (scene.jjookQuestState === JjookQuestState.WALLET_FOUND) {
      return { text: "쭉쭉이에게 지갑 주기", shortText: "지갑 주기" };
    }

    if ([SunisuniQuestState.ACCEPTED_HELP, SunisuniQuestState.GOING_HOSPITAL, SunisuniQuestState.HOSPITAL_RECEPTION].includes(scene.sunisuniQuestState)) {
      return { text: "수니수니와 병원 가기", shortText: "병원 가기" };
    }

    if ([SunisuniQuestState.GOT_PRESCRIPTION, SunisuniQuestState.GOING_PHARMACY].includes(scene.sunisuniQuestState)) {
      return { text: "약국으로 가기", shortText: "약국 가기" };
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.MEDICINE_PAID || scene.hasMedicine) {
      return { text: "수니수니에게 약 전하기", shortText: "약 전하기" };
    }

    if (scene.clothesQuestState === ClothesQuestState.SHOPPING) {
      return { text: "옷가게로 가기", shortText: "옷가게" };
    }

    if (scene.packingQuestState === PackingQuestState.GOING_BUS_STOP) {
      return { text: "버스정류장으로 가기", shortText: "정류장 가기" };
    }

    return null;
  }

  getReadyQuestGoal() {
    const scene = this.scene;
    const yebi = scene.yebiQuestSystem;
    const canState = yebi?.getCanQuestState?.() ?? CanQuestState.INACTIVE;
    const recycleState = yebi?.getRecycleQuestState?.() ?? RecycleQuestState.LOCKED;

    if (canState === CanQuestState.INACTIVE && recycleState === RecycleQuestState.LOCKED) {
      return { text: "여비에게 말 걸기", shortText: "여비와 대화" };
    }

    if (recycleState === RecycleQuestState.UNLOCKED) {
      return { text: "분리수거장으로 가기", shortText: "분리수거장" };
    }

    if (scene.jjookQuestState === JjookQuestState.LOCKED && scene.hasAnnouncedJjookQuest) {
      return { text: "쭉쭉이에게 말 걸기", shortText: "쭉쭉이" };
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.FOUND) {
      return { text: "수니수니에게 말 걸기", shortText: "수니수니" };
    }

    if ([ClothesQuestState.READY, ClothesQuestState.DECLINED].includes(scene.clothesQuestState)) {
      return { text: "쭉쭉이와 옷가게 얘기하기", shortText: "옷가게 얘기" };
    }

    if ([PackingQuestState.OFFERED, PackingQuestState.DECLINED].includes(scene.packingQuestState)) {
      return { text: "쭉쭉이와 짐싸기 얘기하기", shortText: "짐싸기 얘기" };
    }

    return null;
  }

  getUnlockGoal() {
    const scene = this.scene;
    const money = scene.moneySystem?.money ?? 0;
    const yebi = scene.yebiQuestSystem;
    const recycleState = yebi?.getRecycleQuestState?.() ?? RecycleQuestState.LOCKED;

    if (recycleState === RecycleQuestState.LOCKED && money < GAME_CONFIG.recycleQuestUnlockMoney) {
      return this.moneyGoal(GAME_CONFIG.recycleQuestUnlockMoney);
    }

    if (recycleState === RecycleQuestState.COMPLETED && scene.jjookQuestState === JjookQuestState.LOCKED && money < GAME_CONFIG.jjookQuestUnlockMoney) {
      return this.moneyGoal(GAME_CONFIG.jjookQuestUnlockMoney);
    }

    if (scene.jjookQuestState === JjookQuestState.COMPLETED && scene.sunisuniQuestState === SunisuniQuestState.LOCKED && money < GAME_CONFIG.sunisuniQuestUnlockMoney) {
      return this.moneyGoal(GAME_CONFIG.sunisuniQuestUnlockMoney);
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE && scene.clothesQuestState === ClothesQuestState.LOCKED && money < GAME_CONFIG.clothesQuestUnlockMoney) {
      return this.moneyGoal(GAME_CONFIG.clothesQuestUnlockMoney);
    }

    return null;
  }

  moneyGoal(targetMoney) {
    return {
      text: `${targetMoney.toLocaleString()}원 모으기`,
      shortText: `${targetMoney.toLocaleString()}원`,
    };
  }

  getFreePlayGoal() {
    const inventory = this.scene.recyclingInventory ?? {};
    const hasRecyclables = (inventory.normal ?? 0) + (inventory.can ?? 0) + (inventory.plastic ?? 0) > 0;
    if (hasRecyclables) {
      return { text: "모은 쓰레기 분리수거하기", shortText: "분리수거하기" };
    }
    return { text: "쓰레기 줍고 돈 모으기", shortText: "청소하기" };
  }
}
