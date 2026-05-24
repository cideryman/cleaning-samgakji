const SAVE_KEY = "samgakji_checkpoint_v1";
const SAVE_VERSION = 1;

export default class CheckpointStorage {
  static hasSave() {
    return Boolean(this.load());
  }

  static load() {
    try {
      const raw = window.localStorage?.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data?.version === SAVE_VERSION ? data : null;
    } catch {
      return null;
    }
  }

  static clear() {
    try {
      window.localStorage?.removeItem(SAVE_KEY);
    } catch {
      // Ignore private mode or storage permission failures.
    }
  }

  static savePrologueCompleted() {
    const data = {
      version: SAVE_VERSION,
      checkpointId: "prologue_complete",
      savedAt: Date.now(),
      money: 0,
      totalCleanedCount: 0,
      cleanedCanCount: 0,
      recyclingInventory: { normal: 0, can: 0, plastic: 0 },
      flags: {},
      drinkInventory: [],
      quests: {
        canQuest: { isActive: false, isCompleted: false, current: 0 },
        recycleQuest: {
          isUnlocked: false,
          isActive: false,
          isCompleted: false,
          current: { normal: 0, can: 0, plastic: 0 },
        },
        jjookQuestState: "locked",
        sunisuniQuestState: "locked",
        clothesQuestState: "locked",
        travelPrepItems: [],
        packingQuestState: "locked",
        packingItems: [],
      },
    };
    return this.write(data);
  }

  static saveSceneCheckpoint(scene, checkpointId) {
    if (!scene) return null;

    const canQuest = scene.questManager?.canQuest;
    const recycleQuest = scene.questManager?.recycleQuest;
    const data = {
      version: SAVE_VERSION,
      checkpointId,
      savedAt: Date.now(),
      money: scene.moneySystem?.money ?? 0,
      totalCleanedCount: scene.totalCleanedCount ?? 0,
      cleanedCanCount: scene.cleanedCanCount ?? 0,
      recyclingInventory: { ...(scene.recyclingInventory ?? { normal: 0, can: 0, plastic: 0 }) },
      flags: {
        hasBroomUpgrade: Boolean(scene.hasBroomUpgrade),
        hasDroppedBroomUpgrade: Boolean(scene.hasDroppedBroomUpgrade),
        isRecycleMaster: Boolean(scene.isRecycleMaster),
        hasUnlockedYebi: Boolean(scene.hasUnlockedYebi),
        hasUsedYebi: Boolean(scene.hasUsedYebi),
        hasBacchus: Boolean(scene.hasBacchus),
        hospitalRevisitUsed: Boolean(scene.hospitalRevisitUsed),
        hasReceivedPharmacyDrink: Boolean(scene.hasReceivedPharmacyDrink),
        hasAnnouncedRecycleQuest: Boolean(scene.hasAnnouncedRecycleQuest),
        hasAnnouncedJjookQuest: Boolean(scene.hasAnnouncedJjookQuest),
        hasAnnouncedSunisuniQuest: Boolean(scene.hasAnnouncedSunisuniQuest),
        hasAnnouncedClothesQuest: Boolean(scene.hasAnnouncedClothesQuest),
        hasWallet: Boolean(scene.hasWallet),
        hasPrescription: Boolean(scene.hasPrescription),
        hasMedicine: Boolean(scene.hasMedicine),
        isChapterComplete: Boolean(scene.isChapterComplete),
      },
      drinkInventory: [...(scene.drinkInventory ?? [])],
      quests: {
        canQuest: canQuest ? {
          isActive: Boolean(canQuest.isActive),
          isCompleted: Boolean(canQuest.isCompleted),
          current: canQuest.current ?? 0,
        } : null,
        recycleQuest: recycleQuest ? {
          isUnlocked: Boolean(recycleQuest.isUnlocked),
          isActive: Boolean(recycleQuest.isActive),
          isCompleted: Boolean(recycleQuest.isCompleted),
          current: { ...(recycleQuest.current ?? { normal: 0, can: 0, plastic: 0 }) },
        } : null,
        jjookQuestState: scene.jjookQuestState ?? "locked",
        sunisuniQuestState: scene.sunisuniQuestState ?? "locked",
        clothesQuestState: scene.clothesQuestState ?? "locked",
        travelPrepItems: Array.isArray(scene.travelPrepItems) ? [...scene.travelPrepItems] : [],
        packingQuestState: scene.packingQuestState ?? "locked",
        packingItems: Array.isArray(scene.packingItems) ? [...scene.packingItems] : [],
      },
    };
    return this.write(data);
  }

  static write(data) {
    try {
      window.localStorage?.setItem(SAVE_KEY, JSON.stringify(data));
      return data;
    } catch {
      return null;
    }
  }

  static applyToScene(scene, data = this.load()) {
    if (!scene || !data) return false;

    scene.restoredCheckpointId = data.checkpointId;
    scene.totalCleanedCount = data.totalCleanedCount ?? 0;
    scene.cleanedCanCount = data.cleanedCanCount ?? 0;
    scene.recyclingInventory = { normal: 0, can: 0, plastic: 0, ...(data.recyclingInventory ?? {}) };

    const flags = data.flags ?? {};
    scene.hasBroomUpgrade = Boolean(flags.hasBroomUpgrade);
    scene.hasDroppedBroomUpgrade = Boolean(flags.hasDroppedBroomUpgrade);
    scene.isRecycleMaster = Boolean(flags.isRecycleMaster);
    scene.hasUnlockedYebi = Boolean(flags.hasUnlockedYebi);
    scene.hasUsedYebi = Boolean(flags.hasUsedYebi);
    scene.hasBacchus = Boolean(flags.hasBacchus);
    scene.hospitalRevisitUsed = Boolean(flags.hospitalRevisitUsed);
    scene.hasReceivedPharmacyDrink = Boolean(flags.hasReceivedPharmacyDrink);
    scene.hasAnnouncedRecycleQuest = Boolean(flags.hasAnnouncedRecycleQuest);
    scene.hasAnnouncedJjookQuest = Boolean(flags.hasAnnouncedJjookQuest);
    scene.hasAnnouncedSunisuniQuest = Boolean(flags.hasAnnouncedSunisuniQuest);
    scene.hasAnnouncedClothesQuest = Boolean(flags.hasAnnouncedClothesQuest);
    scene.hasWallet = Boolean(flags.hasWallet);
    scene.hasPrescription = Boolean(flags.hasPrescription);
    scene.hasMedicine = Boolean(flags.hasMedicine);
    scene.isChapterComplete = Boolean(flags.isChapterComplete);
    scene.drinkInventory = Array.isArray(data.drinkInventory) ? [...data.drinkInventory] : [];

    if (scene.moneySystem) {
      scene.moneySystem.money = data.money ?? 0;
      scene.moneySystem.updateUI();
    }

    this.applyQuestData(scene, data.quests ?? {});
    this.applyNpcState(scene, data);

    scene.updateBacchusButton?.();
    scene.updateTravelPrepHud?.();
    scene.updateHud?.();
    scene.questManager?.updateUI();
    this.hideCompletedQuestHud(scene);
    return true;
  }

  static applyQuestData(scene, quests) {
    const canQuest = scene.questManager?.canQuest;
    if (canQuest && quests.canQuest) {
      canQuest.isActive = Boolean(quests.canQuest.isActive);
      canQuest.isCompleted = Boolean(quests.canQuest.isCompleted);
      canQuest.current = Math.min(canQuest.target, quests.canQuest.current ?? 0);
    }

    const recycleQuest = scene.questManager?.recycleQuest;
    if (recycleQuest && quests.recycleQuest) {
      recycleQuest.isUnlocked = Boolean(quests.recycleQuest.isUnlocked);
      recycleQuest.isActive = Boolean(quests.recycleQuest.isActive);
      recycleQuest.isCompleted = Boolean(quests.recycleQuest.isCompleted);
      recycleQuest.current = {
        normal: Math.min(recycleQuest.target.normal, quests.recycleQuest.current?.normal ?? 0),
        can: Math.min(recycleQuest.target.can, quests.recycleQuest.current?.can ?? 0),
        plastic: Math.min(recycleQuest.target.plastic, quests.recycleQuest.current?.plastic ?? 0),
      };
    }

    scene.jjookQuestState = quests.jjookQuestState ?? "locked";
    scene.sunisuniQuestState = quests.sunisuniQuestState ?? "locked";
    scene.clothesQuestState = quests.clothesQuestState ?? "locked";
    scene.travelPrepItems = Array.isArray(quests.travelPrepItems) ? [...quests.travelPrepItems] : [];
    scene.packingQuestState = quests.packingQuestState ?? "locked";
    scene.packingItems = Array.isArray(quests.packingItems) ? [...quests.packingItems] : [];
  }

  static applyNpcState(scene, data) {
    const quests = data.quests ?? {};
    const canActive = Boolean(quests.canQuest?.isActive);
    const canCompleted = Boolean(quests.canQuest?.isCompleted);
    const recycleUnlocked = Boolean(quests.recycleQuest?.isUnlocked || quests.recycleQuest?.isActive || quests.recycleQuest?.isCompleted);
    scene.hasAnnouncedRecycleQuest = scene.hasAnnouncedRecycleQuest || recycleUnlocked;
    scene.hasAnnouncedJjookQuest = scene.hasAnnouncedJjookQuest || scene.jjookQuestState !== "locked";
    scene.hasAnnouncedSunisuniQuest = scene.hasAnnouncedSunisuniQuest || scene.sunisuniQuestState !== "locked";
    scene.hasAnnouncedClothesQuest = scene.hasAnnouncedClothesQuest || scene.clothesQuestState !== "locked";

    if (canActive || canCompleted || recycleUnlocked) {
      scene.moveYebiToRecyclingCenter?.();
    }

    if (scene.jjookQuestState !== "locked") {
      scene.createJjookQuestObjects?.();
      scene.clearQuestMarker?.("jjookQuest");
    }

    if (scene.sunisuniQuestState !== "locked" && scene.sunisuniNpc) {
      scene.sunisuniNpc.setVisible(true);
      scene.sunisuniNpc.setActive(true);
      scene.setSunisuniWaitingPose?.();
      scene.clearQuestMarker?.("sunisuniQuest");
      scene.clearQuestMarker?.("sunisuniHospital");
    }

    if (quests.recycleQuest?.isActive) {
      scene.setQuestMarker?.("recycleQuest", scene.yebiNpc, "!");
    } else if (quests.canQuest?.isActive) {
      scene.setQuestMarker?.("canQuest", scene.yebiNpc, "!");
    }

    if (scene.sunisuniQuestState === "sunisuni_found") {
      scene.setQuestMarker?.("sunisuniQuest", scene.sunisuniNpc, "!");
    } else if (scene.sunisuniQuestState === "going_hospital") {
      scene.setQuestMarker?.("sunisuniHospital", scene.sunisuniNpc, "!");
    }

    if (scene.hasDroppedBroomUpgrade && !scene.hasBroomUpgrade) {
      scene.dropBroomUpgrade?.();
    }

    if (scene.clothesQuestState === "ready" || scene.clothesQuestState === "declined") {
      scene.setQuestMarker?.("clothesQuest", scene.jjookNpc, "!");
    } else if (scene.clothesQuestState === "shopping") {
      scene.isJjookClothesEscortActive = true;
      scene.setQuestMarker?.("clothesShop", scene.mapObjects?.clothing_store || {
        active: true,
        x: 580,
        y: 174,
        displayHeight: 96,
      }, "!");
    } else if (scene.clothesQuestState === "completed" && ["offered", "declined"].includes(scene.packingQuestState)) {
      scene.setQuestMarker?.("packingQuest", scene.jjookNpc, "!");
    } else if (scene.clothesQuestState === "completed" && scene.packingQuestState === "going_bus_stop") {
      scene.createTravelBusStopObjects?.();
    }
  }

  static hideCompletedQuestHud(scene) {
    const root = scene.questManager?.uiElements?.root;
    if (!root) return;
    const canDone = scene.questManager?.canQuest?.isCompleted;
    const recycleDone = scene.questManager?.recycleQuest?.isCompleted;
    if (recycleDone || (canDone && !scene.questManager?.recycleQuest?.isActive)) {
      root.classList.add("is-hidden");
      root.setAttribute("aria-hidden", "true");
    }
  }
}
