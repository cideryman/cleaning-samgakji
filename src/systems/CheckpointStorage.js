import {
  ClothesQuestState,
  JjookQuestState,
  PackingQuestState,
  SunisuniQuestState,
} from "../config/QuestStates.js";

const PROFILE_KEY = "samgakji_save_profile";
const PROFILE_VERSION = 2;
const CHAPTER_KEY_PREFIX = "samgakji_save_chapter_";
const SAVE_VERSION = 2;
const DEFAULT_EDUCATION_GUIDE_SEEN = {
  hospital: false,
  pharmacy: false,
  clothing: false,
  vending: false,
  crosswalk: false,
  recycling: false,
  busStop: false,
};

export default class CheckpointStorage {
  // --- 1️⃣ 마스터 프로필 관리 API ---
  static loadProfile() {
    try {
      const raw = window.localStorage?.getItem(PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static writeProfile(profile) {
    try {
      window.localStorage?.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch {
      return false;
    }
  }

  static updateProfileOnSave(chapterId) {
    let profile = this.loadProfile();
    if (!profile) {
      profile = {
        version: PROFILE_VERSION,
        currentChapter: chapterId,
        unlockedChapters: ["chapter1"],
        lastSavedAt: Date.now()
      };
    } else {
      profile.lastSavedAt = Date.now();
      profile.currentChapter = chapterId;
      if (!profile.unlockedChapters.includes(chapterId)) {
        profile.unlockedChapters.push(chapterId);
      }
    }
    this.writeProfile(profile);
  }

  static unlockChapter(chapterId) {
    let profile = this.loadProfile();
    if (!profile) {
      profile = {
        version: PROFILE_VERSION,
        currentChapter: "chapter1",
        unlockedChapters: ["chapter1", chapterId],
        lastSavedAt: Date.now()
      };
    } else {
      if (!profile.unlockedChapters.includes(chapterId)) {
        profile.unlockedChapters.push(chapterId);
      }
    }
    this.writeProfile(profile);
  }

  // --- 2️⃣ 하위 호환성 마이그레이션 (v1 -> v2) ---
  static migrateLegacySave() {
    try {
      const legacyRaw = window.localStorage?.getItem("samgakji_checkpoint_v1");
      if (!legacyRaw) return;

      const legacyData = JSON.parse(legacyRaw);
      if (!legacyData || legacyData.version !== 1) return;

      // 마스터 프로필 생성
      const profile = {
        version: PROFILE_VERSION,
        currentChapter: "chapter1",
        unlockedChapters: ["chapter1"],
        lastSavedAt: Date.now()
      };
      this.writeProfile(profile);

      // 레거시 데이터를 새로운 챕터 1 격리 형식으로 포팅 및 마이그레이션
      const migratedChapterData = {
        ...legacyData,
        version: SAVE_VERSION,
        chapterId: "chapter1"
      };
      this.write("chapter1", migratedChapterData);

      // 레거시 세이브 삭제 (중복 마이그레이션 방지)
      window.localStorage?.removeItem("samgakji_checkpoint_v1");
      console.log("Successfully migrated legacy save data (v1) to multi-chapter save format (v2).");
    } catch (e) {
      console.warn("Save migration failed:", e);
    }
  }

  // --- 3️⃣ 표준 씬 세이브 / 로드 중개 API (하위 호환 100% 보장) ---
  static hasSave(chapterId = "chapter1") {
    // 혹시 모를 레거시 세이브 존재 시 우선 마이그레이션 선행
    this.migrateLegacySave();
    
    const profile = this.loadProfile();
    if (!profile) return false;
    return Boolean(window.localStorage?.getItem(`${CHAPTER_KEY_PREFIX}${chapterId}`));
  }

  static load(chapterId = null) {
    this.migrateLegacySave();
    
    const profile = this.loadProfile();
    const activeChapter = chapterId || profile?.currentChapter || "chapter1";
    try {
      const raw = window.localStorage?.getItem(`${CHAPTER_KEY_PREFIX}${activeChapter}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data?.version === SAVE_VERSION ? data : null;
    } catch {
      return null;
    }
  }

  static clear() {
    try {
      const profile = this.loadProfile();
      if (profile?.unlockedChapters) {
        profile.unlockedChapters.forEach((ch) => {
          window.localStorage?.removeItem(`${CHAPTER_KEY_PREFIX}${ch}`);
        });
      }
      window.localStorage?.removeItem(`${CHAPTER_KEY_PREFIX}chapter1`);
      window.localStorage?.removeItem(`${CHAPTER_KEY_PREFIX}chapter2`);
      window.localStorage?.removeItem(PROFILE_KEY);
      window.localStorage?.removeItem("samgakji_checkpoint_v1"); // 만약을 위한 레거시 최종 소멸
    } catch {
      // Ignore private mode or storage permission failures.
    }
  }

  static savePrologueCompleted(chapterId = "chapter1") {
    const data = {
      version: SAVE_VERSION,
      chapterId,
      checkpointId: "prologue_complete",
      savedAt: Date.now(),
      tutorialState: "intro",
      money: 0,
      totalCleanedCount: 0,
      cleanedCanCount: 0,
      recyclingInventory: { normal: 0, can: 0, plastic: 0 },
      flags: {},
      drinkInventory: [],
      educationGuideSeen: this.normalizeEducationGuideSeen(),
      quests: {
        canQuest: { isActive: false, isCompleted: false, current: 0 },
        recycleQuest: {
          isUnlocked: false,
          isActive: false,
          isCompleted: false,
          current: { normal: 0, can: 0, plastic: 0 },
        },
        jjookQuestState: JjookQuestState.LOCKED,
        sunisuniQuestState: SunisuniQuestState.LOCKED,
        clothesQuestState: ClothesQuestState.LOCKED,
        travelPrepItems: [],
        packingQuestState: PackingQuestState.LOCKED,
        packingItems: [],
      },
    };
    this.updateProfileOnSave(chapterId);
    return this.write(chapterId, data);
  }

  static saveSceneCheckpoint(scene, checkpointId, chapterId = "chapter1") {
    if (!scene) return null;

    const canQuest = scene.yebiQuestSystem?.canQuest;
    const recycleQuest = scene.yebiQuestSystem?.recycleQuest;
    const data = {
      version: SAVE_VERSION,
      chapterId,
      checkpointId,
      savedAt: Date.now(),
      tutorialState: scene.tutorialState ?? "intro",
      money: scene.moneySystem?.money ?? 0,
      totalCleanedCount: scene.totalCleanedCount ?? 0,
      cleanedCanCount: scene.cleanedCanCount ?? 0,
      recyclingInventory: { ...(scene.recyclingInventory ?? { normal: 0, can: 0, plastic: 0 }) },
      educationGuideSeen: this.normalizeEducationGuideSeen(scene.educationGuideSeen),
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
        shownSpecialOverlays: scene.shownSpecialOverlays ?? {},
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
        jjookQuestState: scene.jjookQuestState ?? JjookQuestState.LOCKED,
        sunisuniQuestState: scene.sunisuniQuestState ?? SunisuniQuestState.LOCKED,
        clothesQuestState: scene.clothesQuestState ?? ClothesQuestState.LOCKED,
        travelPrepItems: Array.isArray(scene.travelPrepItems) ? [...scene.travelPrepItems] : [],
        packingQuestState: scene.packingQuestState ?? PackingQuestState.LOCKED,
        packingItems: Array.isArray(scene.packingItems) ? [...scene.packingItems] : [],
      },
    };
    this.updateProfileOnSave(chapterId);
    return this.write(chapterId, data);
  }

  static write(chapterId, data) {
    try {
      window.localStorage?.setItem(`${CHAPTER_KEY_PREFIX}${chapterId}`, JSON.stringify(data));
      return data;
    } catch {
      return null;
    }
  }

  static applyToScene(scene, data = this.load()) {
    if (!scene || !data) return false;

    scene.restoredCheckpointId = data.checkpointId;
    scene.tutorialState = this.inferTutorialState(data);
    scene.totalCleanedCount = data.totalCleanedCount ?? 0;
    scene.cleanedCanCount = data.cleanedCanCount ?? 0;
    scene.recyclingInventory = { normal: 0, can: 0, plastic: 0, ...(data.recyclingInventory ?? {}) };
    scene.educationGuideSeen = this.normalizeEducationGuideSeen(data.educationGuideSeen);

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
    scene.shownSpecialOverlays = flags.shownSpecialOverlays ?? {};
    scene.drinkInventory = Array.isArray(data.drinkInventory) ? [...data.drinkInventory] : [];

    if (scene.moneySystem) {
      scene.moneySystem.money = data.money ?? 0;
      scene.moneySystem.updateUI();
    }

    this.applyQuestData(scene, data.quests ?? {});
    if (scene.tutorialSystem) {
      scene.tutorialSystem.state = scene.tutorialState;
      if (scene.tutorialState === "completed") {
        scene.tutorialSystem.clearGraphics?.();
      }
    }
    this.applyNpcState(scene, data);

    scene.updateBacchusButton?.();
    scene.updateTravelPrepHud?.();
    scene.updateHud?.();
    scene.yebiQuestSystem?.updateUI();
    this.hideCompletedQuestHud(scene);
    return true;
  }

  static inferTutorialState(data) {
    if (data?.tutorialState) return data.tutorialState;
    if (data?.checkpointId === "prologue_complete") return "intro";

    const quests = data?.quests ?? {};
    const hasQuestProgress = Boolean(
      quests.canQuest?.isActive
      || quests.canQuest?.isCompleted
      || quests.recycleQuest?.isUnlocked
      || quests.recycleQuest?.isActive
      || quests.recycleQuest?.isCompleted
      || Boolean(quests.jjookQuestState && quests.jjookQuestState !== JjookQuestState.LOCKED)
      || Boolean(quests.sunisuniQuestState && quests.sunisuniQuestState !== SunisuniQuestState.LOCKED)
      || Boolean(quests.clothesQuestState && quests.clothesQuestState !== ClothesQuestState.LOCKED)
      || Boolean(quests.packingQuestState && quests.packingQuestState !== PackingQuestState.LOCKED)
    );

    if (
      hasQuestProgress
      || (data?.totalCleanedCount ?? 0) > 0
      || (data?.cleanedCanCount ?? 0) > 0
      || (data?.checkpointId && data.checkpointId !== "prologue_complete")
    ) {
      return "completed";
    }

    return "intro";
  }

  static normalizeEducationGuideSeen(loadedSeen = {}) {
    const safeLoadedSeen = loadedSeen && typeof loadedSeen === "object" && !Array.isArray(loadedSeen)
      ? loadedSeen
      : {};
    return Object.assign({}, DEFAULT_EDUCATION_GUIDE_SEEN, safeLoadedSeen);
  }

  static applyQuestData(scene, quests) {
    const canQuest = scene.yebiQuestSystem?.canQuest;
    if (canQuest && quests.canQuest) {
      canQuest.isActive = Boolean(quests.canQuest.isActive);
      canQuest.isCompleted = Boolean(quests.canQuest.isCompleted);
      canQuest.current = Math.min(canQuest.target, quests.canQuest.current ?? 0);
    }

    const recycleQuest = scene.yebiQuestSystem?.recycleQuest;
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

    scene.jjookQuestState = quests.jjookQuestState ?? JjookQuestState.LOCKED;
    scene.sunisuniQuestState = quests.sunisuniQuestState ?? SunisuniQuestState.LOCKED;
    scene.clothesQuestState = quests.clothesQuestState ?? ClothesQuestState.LOCKED;
    scene.travelPrepItems = Array.isArray(quests.travelPrepItems) ? [...quests.travelPrepItems] : [];
    scene.packingQuestState = quests.packingQuestState ?? PackingQuestState.LOCKED;
    scene.packingItems = Array.isArray(quests.packingItems) ? [...quests.packingItems] : [];
  }

  static applyNpcState(scene, data) {
    const quests = data.quests ?? {};
    const canActive = Boolean(quests.canQuest?.isActive);
    const canCompleted = Boolean(quests.canQuest?.isCompleted);
    const recycleUnlocked = Boolean(quests.recycleQuest?.isUnlocked || quests.recycleQuest?.isActive || quests.recycleQuest?.isCompleted);
    scene.hasAnnouncedRecycleQuest = scene.hasAnnouncedRecycleQuest || recycleUnlocked;
    scene.hasAnnouncedJjookQuest = scene.hasAnnouncedJjookQuest || scene.jjookQuestState !== JjookQuestState.LOCKED;
    scene.hasAnnouncedSunisuniQuest = scene.hasAnnouncedSunisuniQuest || scene.sunisuniQuestState !== SunisuniQuestState.LOCKED;
    scene.hasAnnouncedClothesQuest = scene.hasAnnouncedClothesQuest || scene.clothesQuestState !== ClothesQuestState.LOCKED;

    if (canActive || canCompleted || recycleUnlocked) {
      scene.moveYebiToRecyclingCenter?.();
    }

    if (scene.jjookQuestState !== JjookQuestState.LOCKED) {
      scene.createJjookQuestObjects?.();
      scene.clearQuestMarker?.("jjookQuest");
    }

    if (scene.sunisuniQuestState !== SunisuniQuestState.LOCKED && scene.sunisuniNpc) {
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
    } else if (scene.tutorialState === "completed" && !quests.canQuest?.isCompleted) {
      scene.yebiQuestSystem?.markCanQuestAvailable();
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.FOUND) {
      scene.setQuestMarker?.("sunisuniQuest", scene.sunisuniNpc, "!");
    } else if (scene.sunisuniQuestState === SunisuniQuestState.GOING_HOSPITAL) {
      scene.setQuestMarker?.("sunisuniHospital", scene.sunisuniNpc, "!");
    }

    if ((scene.hasDroppedBroomUpgrade || canCompleted) && !scene.hasBroomUpgrade) {
      scene.dropBroomUpgrade?.();
    }

    if (scene.clothesQuestState === ClothesQuestState.READY || scene.clothesQuestState === ClothesQuestState.DECLINED) {
      scene.setQuestMarker?.("clothesQuest", scene.jjookNpc, "!");
    } else if (scene.clothesQuestState === ClothesQuestState.SHOPPING) {
      scene.isJjookClothesEscortActive = true;
      scene.setQuestMarker?.("clothesShop", scene.mapObjects?.clothing_store || {
        active: true,
        x: 580,
        y: 174,
        displayHeight: 96,
      }, "!");
    } else if (
      scene.clothesQuestState === ClothesQuestState.COMPLETED
      && [PackingQuestState.OFFERED, PackingQuestState.DECLINED].includes(scene.packingQuestState)
    ) {
      scene.setQuestMarker?.("packingQuest", scene.jjookNpc, "!");
    } else if (
      scene.clothesQuestState === ClothesQuestState.COMPLETED
      && scene.packingQuestState === PackingQuestState.GOING_BUS_STOP
    ) {
      scene.travelEndingSystem?.createBusStopObjects?.();
      scene.isJjookBusEscortActive = true;
      scene.travelEndingSystem?.updateBusRouteGuide?.();
    }
  }

  static hideCompletedQuestHud(scene) {
    const root = scene.yebiQuestSystem?.uiElements?.root;
    if (!root) return;
    const canDone = scene.yebiQuestSystem?.canQuest?.isCompleted;
    const recycleDone = scene.yebiQuestSystem?.recycleQuest?.isCompleted;
    if (recycleDone || (canDone && !scene.yebiQuestSystem?.recycleQuest?.isActive)) {
      root.classList.add("is-hidden");
      root.setAttribute("aria-hidden", "true");
    }
  }
}
