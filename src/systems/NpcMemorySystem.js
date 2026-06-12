import {
  CanQuestState,
  ClothesQuestState,
  JjookQuestState,
  PackingQuestState,
  RecycleQuestState,
  SunisuniQuestState,
} from "../config/QuestStates.js";

const NPC_KEYS = new Set(["yebi", "jjook", "sunisuni"]);
const DIRECT_MEMORY_COOLDOWN_MS = 12000;
const AMBIENT_MEMORY_COOLDOWN_MS = 22000;

export default class NpcMemorySystem {
  constructor(scene) {
    this.scene = scene;
    this.lastSpeechByNpc = new Map();
    this.nextDirectMemoryAtByNpc = new Map();
    this.nextAmbientMemoryAtByNpc = new Map();
  }

  getMemorySpeech(npcKey) {
    if (!NPC_KEYS.has(npcKey) || !this.canShowAmbientMemory()) return null;

    if (npcKey === "yebi") return this.getYebiMemorySpeech();
    if (npcKey === "jjook") return this.getJjookMemorySpeech();
    if (npcKey === "sunisuni") return this.getSunisuniMemorySpeech();
    return null;
  }

  getAmbientSpeech(npcKey, fallbackSpeech) {
    if (!NPC_KEYS.has(npcKey) || !this.canShowAmbientMemory()) return fallbackSpeech;
    if (this.isAmbientMemoryCoolingDown(npcKey)) return fallbackSpeech;

    const memoryText = this.getMemorySpeech(npcKey);
    if (!memoryText) return fallbackSpeech;

    this.markAmbientMemoryShown(npcKey);
    return memoryText;
  }

  showDirectMemoryDialogue(npcKey) {
    const scene = this.scene;
    if (!this.canShowDirectMemory(npcKey)) return false;
    if (this.isDirectMemoryCoolingDown(npcKey)) return false;

    const memoryText = this.getMemorySpeech(npcKey);
    if (!memoryText) return false;

    const npcMeta = this.getNpcMeta(npcKey);
    if (!npcMeta) return false;

    scene.dialogueSystem?.start([
      {
        name: npcMeta.name,
        portraitKey: npcMeta.portraitKey,
        portraitSingle: npcMeta.portraitSingle,
        text: memoryText,
      },
      {
        name: "해냄이",
        portraitKey: "haenaem_touched",
        text: this.getHaenaemReply(npcKey, memoryText),
      },
    ]);
    this.markDirectMemoryShown(npcKey);
    return true;
  }

  getQuestSafeMemoryDialogueLine(npcKey) {
    if (!this.canShowQuestSafeMemory(npcKey)) return null;
    if (this.isDirectMemoryCoolingDown(npcKey)) return null;

    const npcMeta = this.getNpcMeta(npcKey);
    const memoryText = this.getMemorySpeech(npcKey);
    if (!npcMeta || !memoryText) return null;

    this.markDirectMemoryShown(npcKey);

    return {
      name: npcMeta.name,
      portraitKey: npcMeta.portraitKey,
      portraitSingle: npcMeta.portraitSingle,
      text: memoryText,
    };
  }

  canShowQuestSafeMemory(npcKey) {
    const scene = this.scene;
    if (scene.isInDialogue || !scene.dialogueSystem) return false;
    if (!this.canShowAmbientMemory()) return false;

    if (npcKey === "jjook") {
      if (scene.jjookQuestState !== JjookQuestState.COMPLETED) return false;
      if (scene.isJjookFollowActive || scene.isJjookClothesEscortActive || scene.isJjookBusEscortActive) return false;
      if ([ClothesQuestState.READY, ClothesQuestState.DECLINED, ClothesQuestState.SHOPPING].includes(scene.clothesQuestState)) return false;
      if ([PackingQuestState.OFFERED, PackingQuestState.DECLINED, PackingQuestState.GOING_BUS_STOP, PackingQuestState.BOARDING_BUS].includes(scene.packingQuestState)) return false;
      return true;
    }

    if (npcKey === "yebi") {
      const canState = scene.yebiQuestSystem?.getQuestState?.();
      const recycleState = scene.yebiQuestSystem?.getRecycleQuestState?.();
      return canState === CanQuestState.COMPLETED
        && [RecycleQuestState.ACTIVE, RecycleQuestState.COMPLETED].includes(recycleState)
        && !scene.yebiQuestSystem?.isRecycleDemoActive;
    }

    // Sunisuni's hospital/pharmacy flow is story-critical, so memory dialogue stays direct-only.
    return false;
  }

  canShowDirectMemory(npcKey) {
    const scene = this.scene;
    if (scene.isInDialogue || !scene.dialogueSystem) return false;
    if (!this.canShowAmbientMemory()) return false;

    if (npcKey === "yebi") {
      const canState = scene.yebiQuestSystem?.getQuestState?.();
      const recycleState = scene.yebiQuestSystem?.getRecycleQuestState?.();
      return canState === CanQuestState.COMPLETED
        && recycleState === RecycleQuestState.COMPLETED
        && !scene.yebiQuestSystem?.isRecycleDemoActive;
    }

    if (npcKey === "jjook") {
      if (scene.jjookQuestState !== JjookQuestState.COMPLETED) return false;
      if (scene.isJjookFollowActive || scene.isJjookClothesEscortActive || scene.isJjookBusEscortActive) return false;
      if (scene.clothesQuestState !== ClothesQuestState.COMPLETED) return false;
      return [PackingQuestState.COMPLETED, PackingQuestState.ENDING_COMPLETE].includes(scene.packingQuestState);
    }

    if (npcKey === "sunisuni") {
      return scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE
        && !scene.sunisuniReturningToBench;
    }

    return false;
  }

  isDirectMemoryCoolingDown(npcKey) {
    return (this.scene.time?.now ?? 0) < (this.nextDirectMemoryAtByNpc.get(npcKey) || 0);
  }

  markDirectMemoryShown(npcKey) {
    this.nextDirectMemoryAtByNpc.set(npcKey, (this.scene.time?.now ?? 0) + DIRECT_MEMORY_COOLDOWN_MS);
  }

  isAmbientMemoryCoolingDown(npcKey) {
    return (this.scene.time?.now ?? 0) < (this.nextAmbientMemoryAtByNpc.get(npcKey) || 0);
  }

  markAmbientMemoryShown(npcKey) {
    this.nextAmbientMemoryAtByNpc.set(npcKey, (this.scene.time?.now ?? 0) + AMBIENT_MEMORY_COOLDOWN_MS);
  }

  getNpcMeta(npcKey) {
    return {
      yebi: { name: "여비", portraitKey: "yeobi" },
      jjook: { name: "쭉쭉이", portraitKey: "jjook_smile" },
      sunisuni: { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true },
    }[npcKey] || null;
  }

  getHaenaemReply(npcKey, memoryText = "") {
    if (npcKey === "yebi") return "여비가 알려준 덕분에 분리수거가 더 쉬워졌어요.";
    if (npcKey === "jjook") return "같이 도와줘서 나도 더 힘이 났어.";
    if (npcKey === "sunisuni") {
      if (memoryText.includes("약")) return "약은 꼭 설명대로 드셔야 해요.";
      if (memoryText.includes("쉬")) return "무리하지 말고 천천히 쉬세요.";
      return "괜찮아지셔서 정말 다행이에요.";
    }
    return "기억해줘서 고마워요.";
  }

  getYebiMemorySpeech() {
    const scene = this.scene;
    const candidates = [];
    const canQuest = scene.yebiQuestSystem?.canQuest;
    const recycleState = scene.yebiQuestSystem?.getRecycleQuestState?.();
    const totalRecycledCount = scene.totalRecycledCount ?? 0;
    const hasSeenSpecialResource = Object.values(scene.shownSpecialOverlays ?? {}).some(Boolean);

    if (canQuest?.isCompleted) {
      candidates.push("해냄아, 캔을 모으는 실력이 정말 좋아졌네!");
    }

    if (recycleState === RecycleQuestState.COMPLETED) {
      candidates.push("이제 분리수거장도 제법 잘 쓰는구나.");
    }

    if (totalRecycledCount >= 6) {
      candidates.push("삼각지가 깨끗해지는 게 보여. 해냄이 덕분이야.");
    }

    if (hasSeenSpecialResource) {
      candidates.push("깨끗한 재활용품을 알아보는 눈이 생겼구나!");
    }

    return this.pickForNpc("yebi", candidates);
  }

  getJjookMemorySpeech() {
    const scene = this.scene;
    const candidates = [];

    if (scene.jjookQuestState === JjookQuestState.COMPLETED) {
      candidates.push("지난번에 지갑 찾아줘서 정말 고마웠어!");
    }

    if (scene.isJjookFollowActive) {
      candidates.push("같이 플로깅하니까 훨씬 재밌다!");
    }

    if ([ClothesQuestState.READY, ClothesQuestState.SHOPPING, ClothesQuestState.COMPLETED].includes(scene.clothesQuestState)) {
      candidates.push("서울 여행 준비하니까 두근두근하지 않아?");
    }

    if ([PackingQuestState.GOING_BUS_STOP, PackingQuestState.BOARDING_BUS, PackingQuestState.TRAVELING_HOME, PackingQuestState.COMPLETED, PackingQuestState.ENDING_COMPLETE].includes(scene.packingQuestState)) {
      candidates.push("이제 진짜 여행 가는 느낌이 난다!");
    }

    return this.pickForNpc("jjook", candidates);
  }

  getSunisuniMemorySpeech() {
    const scene = this.scene;
    const candidates = [];

    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      candidates.push(
        "병원 같이 가줘서 아직도 고마워.",
        "그때 약국까지 같이 가줘서 마음이 놓였어.",
        "요즘은 천천히 쉬면서 지내고 있어.",
        "오늘은 배가 많이 괜찮아졌어.",
        "약은 설명해준 대로 잘 챙겨 먹고 있어.",
      );
    } else if ([SunisuniQuestState.GOING_PHARMACY, SunisuniQuestState.MEDICINE_PAID].includes(scene.sunisuniQuestState)) {
      candidates.push("처방전 들고 약국까지 같이 가줘서 마음이 놓여.");
    } else if ([SunisuniQuestState.ACCEPTED_HELP, SunisuniQuestState.GOING_HOSPITAL, SunisuniQuestState.HOSPITAL_RECEPTION, SunisuniQuestState.GOT_PRESCRIPTION].includes(scene.sunisuniQuestState)) {
      candidates.push("병원까지 천천히 같이 가줘서 고마워.");
    }

    return this.pickForNpc("sunisuni", candidates);
  }

  pickForNpc(npcKey, candidates) {
    if (!candidates.length) return null;

    const lastSpeech = this.lastSpeechByNpc.get(npcKey);
    const filtered = candidates.length > 1
      ? candidates.filter((speech) => speech !== lastSpeech)
      : candidates;
    const speech = this.pickRandom(filtered.length ? filtered : candidates);
    this.lastSpeechByNpc.set(npcKey, speech);
    return speech;
  }

  pickRandom(candidates) {
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  canShowAmbientMemory() {
    const scene = this.scene;
    if (scene.tutorialState && scene.tutorialState !== "completed") return false;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.()) return false;
    if (scene.settingsModal?.classList?.contains("is-visible")) return false;
    if (scene.uiManager?.restModalEl?.classList?.contains("is-visible")) return false;
    if (scene.educationalGuideSystem?.isModalOpen?.()) return false;
    if (scene.packingQuestState === PackingQuestState.ENDING_COMPLETE || scene.isChapterComplete) return false;
    return true;
  }

  // 엄마는 현재 맵 위 NPC가 아니라 스토리/전화 전용 인물입니다.
  // 추후 필요하면 StoryMemoryLine 같은 별도 흐름으로 분리해서 다룹니다.
}
