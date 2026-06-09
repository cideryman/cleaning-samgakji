import { GAME_CONFIG } from "../config/GameConstants.js";
import { SunisuniQuestState } from "../config/QuestStates.js";

export default class SunisuniQuestSystem {
  constructor(scene) {
    this.scene = scene;
  }

  isFollowing() {
    return [SunisuniQuestState.GOING_HOSPITAL, SunisuniQuestState.GOING_PHARMACY].includes(this.scene.sunisuniQuestState);
  }

  adjustTargetForTrafficRules(npcSprite, targetX, targetY) {
    const scene = this.scene;
    const roadTop = 192;
    const roadBottom = 270;

    const npcY = npcSprite.y;
    const isNpcNorth = npcY < roadTop;
    const isNpcSouth = npcY > roadBottom;
    const isNpcOnRoad = npcY >= roadTop && npcY <= roadBottom;

    const isTargetNorth = targetY < roadTop;
    const isTargetSouth = targetY > roadBottom;

    const isCrossingNeeded = (isNpcNorth && isTargetSouth) || (isNpcSouth && isTargetNorth) || isNpcOnRoad;
    if (!isCrossingNeeded) {
      return { x: targetX, y: targetY, waitAtRedLight: false };
    }

    const crosswalkXs = scene.roadTrafficSystem?.getCrosswalkXs() || [472, 1144];
    const crosswalkX = crosswalkXs.reduce((best, x) => {
      return Math.abs(x - npcSprite.x) < Math.abs(best - npcSprite.x) ? x : best;
    }, crosswalkXs[0]);

    if (Math.abs(npcSprite.x - crosswalkX) > 16) {
      return { x: crosswalkX, y: npcSprite.y, waitAtRedLight: false };
    }

    const isPedestrianGreen = scene.roadTrafficSystem?.isPedestrianSignalGreen() !== false;

    if (!isPedestrianGreen) {
      if (isNpcNorth && npcSprite.y >= roadTop - 12) {
        return { x: crosswalkX, y: roadTop - 12, waitAtRedLight: true };
      }
      if (isNpcSouth && npcSprite.y <= roadBottom + 12) {
        return { x: crosswalkX, y: roadBottom + 12, waitAtRedLight: true };
      }
    }

    if (isNpcNorth) {
      return { x: crosswalkX, y: roadBottom + 16, waitAtRedLight: false };
    }
    if (isNpcSouth) {
      return { x: crosswalkX, y: roadTop - 16, waitAtRedLight: false };
    }

    return { x: crosswalkX, y: targetY, waitAtRedLight: false };
  }

  updateFollower() {
    const scene = this.scene;
    if (!this.isFollowing() || !scene.sunisuniNpc?.active || !scene.player) return;

    const distance = Phaser.Math.Distance.Between(scene.sunisuniNpc.x, scene.sunisuniNpc.y, scene.player.x, scene.player.y);
    if (distance > GAME_CONFIG.sunisuniMaxDistance) {
      scene.showSpeechBubble(scene.sunisuniNpc, "조금만 천천히 가줄래...?", 900);
    }
    if (distance <= GAME_CONFIG.sunisuniFollowDistance) {
      scene.stopNpcWalk(scene.sunisuniNpc, "sunisuni");
      return;
    }

    const adjusted = this.adjustTargetForTrafficRules(scene.sunisuniNpc, scene.player.x, scene.player.y);

    if (adjusted.waitAtRedLight) {
      scene.stopNpcWalk(scene.sunisuniNpc, "sunisuni");
      return;
    }

    const adjustedDistance = Phaser.Math.Distance.Between(scene.sunisuniNpc.x, scene.sunisuniNpc.y, adjusted.x, adjusted.y);
    if (adjustedDistance <= 4) {
      scene.stopNpcWalk(scene.sunisuniNpc, "sunisuni");
      return;
    }

    const step = (scene.game.loop.delta / 1000) * GAME_CONFIG.playerSpeed * GAME_CONFIG.sunisuniSpeedMultiplier;
    const angle = Phaser.Math.Angle.Between(scene.sunisuniNpc.x, scene.sunisuniNpc.y, adjusted.x, adjusted.y);
    const moveX = Math.cos(angle) * Math.min(step, adjustedDistance);
    const moveY = Math.sin(angle) * Math.min(step, adjustedDistance);
    scene.sunisuniNpc.x += moveX;
    scene.sunisuniNpc.y += moveY;
    this.updateDirection(moveX, moveY);
  }

  updateDirection(moveX, moveY) {
    const scene = this.scene;
    if (!scene.sunisuniNpc?.active) return;

    const directionKey = scene.getDirectionKeyFromVector(moveX, moveY, scene.sunisuniNpc.getData("directionKey") || "down");
    scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", directionKey, true);
  }

  playEffect(animKey, x, y) {
    const scene = this.scene;
    const textureByAnim = {
      sweat_drop: "sweat_effect",
      sunisuni_star: "star_effect",
      sunisuni_heart: "heart_effect",
    };
    const textureKey = textureByAnim[animKey] || "sweat_effect";
    if (!scene.anims.exists(animKey) || !scene.textures.exists(textureKey)) return;

    const effect = scene.add.sprite(x, y, textureKey);
    effect.setDisplaySize(48, 48);
    effect.setDepth(9);
    effect.play(animKey);
    scene.tweens.add({
      targets: effect,
      y: y - 18,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => effect.destroy(),
    });
  }

  sendBackToBench() {
    const scene = this.scene;
    if (!scene.sunisuniNpc?.active) return;

    scene.pauseNpcRoaming("sunisuni");
    scene.sunisuniReturningToBench = true;
    const target = scene.getMapPoint("sunisuni_start", GAME_CONFIG.sunisuniSpawn);
    scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", "down", false);
    scene.showSpeechBubble(scene.sunisuniNpc, "벤치로 가서 조금 쉴게.", 2200);
    scene.walkNpcToTarget(scene.sunisuniNpc, "sunisuni", target, {
      speed: 92,
      onComplete: () => {
        scene.sunisuniReturningToBench = false;
        scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", "down", false);
        scene.showSpeechBubble(scene.sunisuniNpc, "많이 괜찮아졌어.", 2400);
        scene.updateNpcRoaming(true);
      },
    });
  }

  handleInteraction() {
    const scene = this.scene;
    if (scene.isInDialogue || !scene.dialogueSystem || scene.sunisuniQuestState === SunisuniQuestState.LOCKED) return;
    if (this.isFollowing() && scene.interactionSystem?.handlePriorityLocationInteraction()) return;
    if (!scene.isPlayerNearSunisuniNpc()) return;

    if (scene.sunisuniQuestState === SunisuniQuestState.FOUND) {
      scene.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "아우... 배야..." },
        { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "너무 아파서 일어나기가 힘들어..." },
        {
          name: "해냄이",
          portraitKey: "haenaem_confused",
          text: "수니수니에게 뭐라고 말할까요?",
          choices: [
            { label: "괜찮으세요?", onSelect: () => this.askHospitalHelp() },
            { label: "도움이 필요하세요?", onSelect: () => this.askHospitalHelp() },
          ],
        },
      ]);
      return;
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.ACCEPTED_HELP || scene.sunisuniQuestState === SunisuniQuestState.GOING_HOSPITAL) {
      scene.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "조금만 천천히 가줄래...?" },
        { name: "해냄이", portraitKey: "haenaem_determined", text: "네, 죄송해요. 천천히 같이 걸어갈게요." },
      ]);
      return;
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.GOT_PRESCRIPTION || scene.sunisuniQuestState === SunisuniQuestState.GOING_PHARMACY) {
      scene.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "처방전을 가지고 약국으로 가요." },
      ]);
      return;
    }

    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      scene.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "해냄이 덕분에 많이 괜찮아졌어." },
        { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "약은 꼭 설명대로 먹어야 해." },
      ]);
    }
  }

  askHospitalHelp() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "혼자서는 병원까지 가기 어려울 것 같아..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "혹시 나랑 같이 가줄 수 있을까?" },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "병원에 갔다가 약국도 들러야 할 것 같아..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "어떻게 할까요?",
        choices: [
          { label: "같이 가요.", onSelect: () => this.startEscort() },
          { label: "잠깐만요...", onSelect: () => this.deferHelp() },
        ],
      },
    ]);
  }

  deferHelp() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "괜찮아... 기다릴게..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "그래도 너무 아파서 도움이 필요해..." },
    ]);
  }

  startEscort() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_determined", text: "같이 가요. 천천히 병원까지 같이 걸어갈게요." },
    ], () => {
      scene.pauseNpcRoaming("sunisuni");
      scene.sunisuniQuestState = SunisuniQuestState.GOING_HOSPITAL;
      scene.clearQuestMarker("sunisuniQuest");
      scene.setQuestMarker("sunisuniHospital", scene.sunisuniNpc, "!");
      scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", "down", false);
      scene.showQuestToast("병원으로 가요.");
      scene.showSpeechBubble(scene.sunisuniNpc, "고마워... 같이 와줘서 마음이 놓여...", 4200);
      scene.saveCheckpoint("sunisuni_escort");
    });
  }

  handleHospitalInteraction() {
    const scene = this.scene;
    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      this.startHospitalRevisitDialogue();
      return;
    }

    if (scene.sunisuniQuestState !== SunisuniQuestState.GOING_HOSPITAL) return;
    scene.sunisuniQuestState = SunisuniQuestState.HOSPITAL_RECEPTION;
    scene.playSceneMusic("ambient_hospital_bgm", 0.24);
    scene.showInteriorScene("hospital_interior", "hospital");
    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "어서 오세요. 접수를 도와드릴게요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "환자분 성함과 어디가 불편한지 알려주세요." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", text: "해냄아... 내가 너무 긴장해서 말이 잘 안 나와..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "접수처에 뭐라고 말하면 좋을까요?",
        choices: [
          { label: "배가 아파서 왔어요.", onSelect: () => this.completeHospitalReception() },
          { label: "음료수를 사러 왔어요.", onSelect: () => this.retryHospitalReception() },
          { label: "쓰레기를 버리러 왔어요.", onSelect: () => this.retryHospitalReception() },
        ],
      },
    ]);
  }

  retryHospitalReception() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "괜찮아요. 천천히 다시 말해볼까요?" },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "병원에서는 아픈 곳을 말하면 접수하기 쉬워요." },
    ], () => {
      scene.sunisuniQuestState = SunisuniQuestState.GOING_HOSPITAL;
      this.handleHospitalInteraction();
    });
  }

  completeHospitalReception() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "네, 수니수니 님 배가 아파서 오셨군요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "접수되었습니다. 잠시만 기다리면 의사 선생님을 만날 수 있어요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "안녕하세요. 어디가 어떻게 아픈지 알려주세요." },
      {
        name: "해냄이",
        portraitKey: "haenaem_determined",
        text: "수니수니 님의 상태를 의사 선생님께 말해볼까요?",
        choices: [
          { label: "배가 아파요.", onSelect: () => this.completeDoctorQuiz() },
          { label: "귀가 아파요.", onSelect: () => this.retryDoctorQuiz() },
          { label: "발이 아파요.", onSelect: () => this.retryDoctorQuiz() },
        ],
      },
    ]);
  }

  retryDoctorQuiz() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "의사", portraitKey: "hospital_doctor", text: "괜찮아요. 다시 해볼까요?" },
      { name: "의사", portraitKey: "hospital_doctor", text: "배가 아플 때는 배가 아프다고 말하면 됩니다." },
    ], () => this.completeHospitalReception());
  }

  completeDoctorQuiz() {
    const scene = this.scene;
    scene.hasPrescription = true;
    scene.sunisuniQuestState = SunisuniQuestState.GOING_PHARMACY;
    scene.clearQuestMarker("sunisuniHospital");
    scene.saveCheckpoint("sunisuni_prescription");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_determined", text: "수니수니 님이 배가 많이 아파요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "잘 말했어요. 배가 아플 때는 이렇게 아픈 곳을 알려주면 됩니다." },
      { name: "의사", portraitKey: "hospital_doctor", text: "오늘은 처방전을 줄게요. 이 처방전을 가지고 약국으로 가세요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "처방전입니다." },
    ], () => {
      scene.playItemPickupSound();
      scene.showQuestToast("처방전을 가지고 약국으로 가요.");
      scene.showFloatingItem("prescription_item", Math.max(384, (scene.scale.width || 768) / 2), Math.max(240, (scene.scale.height || 480) / 2), { width: 190, height: 142 }, true, { duration: 360, hold: 1900, floatY: -12, onComplete: () => scene.clearInteriorScene() });
    });
  }

  startHospitalRevisitDialogue() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_hospital_bgm", 0.24);
    scene.showInteriorScene("hospital_interior", "hospital");

    if (scene.hospitalRevisitUsed) {
      scene.dialogueSystem.start([
        { name: "접수 직원", portraitKey: "hospital_staff", text: "오늘 무료 건강검진을 이미 받으셨어요." },
        { name: "접수 직원", portraitKey: "hospital_staff", text: "건강 관리를 아주 잘하고 계시네요! 다음에 또 만나요." },
      ], () => scene.clearInteriorScene());
      return;
    }

    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "안녕하세요, 해냄이! 오늘은 동네 주민분들을 위해 '무료 건강검진'을 해드리는 날이에요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "키와 몸무게를 재고 몸 상태를 진찰받아볼까요? 진료실로 들어가 보세요!" },
      { name: "의사", portraitKey: "hospital_doctor", text: "안녕하세요, 해냄이! 청소를 열심히 하느라 땀을 많이 흘렸군요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "건강검진을 해보니 몸 상태가 아주 튼튼하고 건강해요!" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "와! 열심히 동네를 청소하니까 몸이 더 튼튼해진 것 같아요!" },
      { name: "의사", portraitKey: "hospital_doctor", text: "맞아요. 규칙적인 운동과 청소는 몸에 아주 좋은 약이에요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "땀을 흘린 뒤에는 꼭 시원한 물을 자주 마시고, 푹 쉬는 좋은 건강 습관도 잊지 마세요!" },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "검진이 무사히 끝났습니다! 오늘 검진은 무료 건강검진이라 비용은 0원이에요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "건강을 지키는 시원한 물을 선물로 드릴 테니 앞으로도 씩씩하게 지내봐요!" }
    ], () => this.finishFreeHealthCheckup());
  }

  finishFreeHealthCheckup() {
    const scene = this.scene;
    scene.hospitalRevisitUsed = true;
    scene.clearInteriorScene();

    // 무료 건강검진 보상으로 일시적인 스피드 버프(생수 마시기 효과) 부여
    scene.activateDrinkSpeedBuff?.();
    scene.showQuestToast("무료 건강검진 완료! 시원한 물을 마셔 걸음이 가벼워졌어요! (속도 증가)", 4000);
    scene.saveCheckpoint("free_health_checkup_completed");
  }

  closeHospitalRevisit(message) {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: message },
    ], () => scene.clearInteriorScene());
  }

  handlePharmacyInteraction() {
    const scene = this.scene;
    if (scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      this.enterPharmacyInterior("revisit");
      return;
    }

    if (scene.sunisuniQuestState !== SunisuniQuestState.GOING_PHARMACY || !scene.hasPrescription) return;
    this.enterPharmacyInterior("quest");
  }

  enterPharmacyInterior(mode = "quest") {
    const scene = this.scene;
    scene.playSceneMusic("ambient_pharmacy_bgm", 0.24);
    scene.pharmacyMapSystem?.setInteractionMode(mode);
    scene.showInteriorScene("pharmacy_interior", "pharmacy");
    scene.showQuestToast("\uCE74\uC6B4\uD130 \uC55E\uC73C\uB85C \uAC00\uC11C \uC57D\uC0AC\uC5D0\uAC8C \uB9D0\uC744 \uAC78\uC5B4\uBCF4\uC138\uC694.", 3200);
  }

  startPharmacyCounterDialogue(mode = "quest") {
    const scene = this.scene;
    if (mode === "revisit" || scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE) {
      this.startPharmacyRevisitDialogue(true);
      return;
    }

    if (scene.sunisuniQuestState !== SunisuniQuestState.GOING_PHARMACY || !scene.hasPrescription) return;
    scene.sunisuniQuestState = SunisuniQuestState.MEDICINE_PAID;
    scene.dialogueSystem.start([
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uC548\uB155\uD558\uC138\uC694. \uCC98\uBC29\uC804\uC774 \uC788\uC73C\uBA74 \uBCF4\uC5EC\uC8FC\uC138\uC694." },
      { name: "\uD574\uB0C4\uC774", portraitKey: "haenaem_determined", text: "\uB124. \uC218\uB2C8\uC218\uB2C8 \uB2D8 \uCC98\uBC29\uC804\uC774\uC5D0\uC694." },
    ], () => {
      scene.pharmacyMapSystem?.playTransferItem("prescription_item", "player", "pharmacist", {
        width: 118,
        height: 88,
        onComplete: () => this.confirmPrescriptionAtPharmacy(),
      });
    });
  }

  confirmPrescriptionAtPharmacy() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uCC98\uBC29\uC804\uC744 \uD655\uC778\uD560\uAC8C\uC694. \uC7A0\uC2DC\uB9CC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694." },
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uCC98\uBC29\uC57D\uC774 \uB098\uC654\uC2B5\uB2C8\uB2E4." },
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uC774 \uC57D\uC740 \uC218\uB2C8\uC218\uB2C8 \uB2D8\uB9CC \uB4DC\uC154\uC57C \uD574\uC694. \uB2E4\uB978 \uC0AC\uB78C\uC774 \uBA39\uC73C\uBA74 \uC548 \uB429\uB2C8\uB2E4." },
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uBC25\uC744 \uBA39\uACE0 30\uBD84 \uB4A4\uC5D0 \uB4DC\uC138\uC694. \uC774\uC81C \uC57D\uAC12 5,000\uC6D0\uC744 \uACB0\uC81C\uD574 \uC8FC\uC138\uC694." },
    ], () => this.payForMedicine());
  }

  payForMedicine() {
    const scene = this.scene;
    if (scene.moneySystem && scene.moneySystem.money < 5000) {
      scene.sunisuniQuestState = SunisuniQuestState.GOING_PHARMACY;
      scene.clearInteriorScene();
      scene.showQuestToast("\uC57D\uAC12 5,000\uC6D0\uC774 \uD544\uC694\uD574\uC694.");
      return;
    }

    scene.dialogueSystem.start([
      { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uC57D\uAC12\uC740 5,000\uC6D0\uC785\uB2C8\uB2E4. 10,000\uC6D0 \uC9C0\uD3D0\uB97C \uB0B4\uBA74 \uAC70\uC2A4\uB984\uB3C8\uC744 \uACC4\uC0B0\uD574 \uBCFC\uAE4C\uC694?" },
      {
        name: "\uD574\uB0C4\uC774",
        portraitKey: "haenaem_determined",
        text: "\uC57D\uC0AC \uC120\uC0DD\uB2D8\uAED8 10,000\uC6D0\uC744 \uB4DC\uB838\uC2B5\uB2C8\uB2E4. \uAC70\uC2A4\uB984\uB3C8\uC740 \uC5BC\uB9C8\uB97C \uBC1B\uC544\uC57C \uD560\uAE4C\uC694?",
        choices: [
          { label: "3,000\uC6D0", onSelect: () => this.handlePharmacyChangeSelection(3000) },
          { label: "5,000\uC6D0", onSelect: () => this.handlePharmacyChangeSelection(5000) },
          { label: "7,000\uC6D0", onSelect: () => this.handlePharmacyChangeSelection(7000) },
        ]
      }
    ]);
  }

  handlePharmacyChangeSelection(selectedChange) {
    const scene = this.scene;
    if (selectedChange === 5000) {
      if (!scene.moneySystem?.deductMoney(5000)) {
        scene.sunisuniQuestState = SunisuniQuestState.GOING_PHARMACY;
        scene.clearInteriorScene();
        scene.showQuestToast("\uC57D\uAC12 5,000\uC6D0\uC774 \uD544\uC694\uD574\uC694.");
        return;
      }

      scene.hasPrescription = false;
      scene.hasMedicine = true;
      scene.pharmacyMapSystem?.playTransferItem("bill_10000", "player", "pharmacist", {
        width: 132,
        height: 80,
        onComplete: () => {
          scene.pharmacyMapSystem?.playTransferItem("bill_5000", "pharmacist", "player", {
            width: 118,
            height: 72,
            onComplete: () => {
              scene.pharmacyMapSystem?.playTransferItem("medicine_bag", "pharmacist", "player", {
                width: 112,
                height: 112,
                onComplete: () => {
                  scene.dialogueSystem.start([
                    { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uB9DE\uC544\uC694. 10,000\uC6D0\uC744 \uB0C8\uC73C\uB2C8 5,000\uC6D0\uC744 \uBE80 5,000\uC6D0\uC774 \uAC70\uC2A4\uB984\uB3C8\uC785\uB2C8\uB2E4." },
                    { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uAC70\uC2A4\uB984\uB3C8 5,000\uC6D0\uACFC \uC57D\uBD09\uD22C\uB97C \uC798 \uCC59\uACA8 \uC8FC\uC138\uC694." },
                    { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uC57D\uC740 \uAF2D \uC124\uBA85\uB300\uB85C \uBA39\uC5B4\uC57C \uD574\uC694." },
                  ], () => {
                    scene.pharmacyMapSystem?.walkPlayerToExit(() => this.completeQuest());
                  });
                },
              });
            },
          });
        },
      });
    } else {
      scene.playTone?.({ frequency: 180, duration: 0.2, type: "sawtooth", volume: 0.05 });
      scene.dialogueSystem.start([
        { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "\uC544\uB2C8\uC5D0\uC694. 10,000\uC6D0\uC744 \uB0B4\uACE0 5,000\uC6D0\uC9DC\uB9AC \uC57D\uC744 \uC0AC\uB294 \uAC70\uC608\uC694." },
        { name: "\uC57D\uC0AC", portraitKey: "chemist", text: "10,000\uC6D0\uC5D0\uC11C 5,000\uC6D0\uC744 \uBE7C\uBA74 \uC5BC\uB9C8\uAC00 \uB0A8\uC744\uAE4C\uC694? \uB2E4\uC2DC \uACC4\uC0B0\uD574 \uBD10\uC694." },
      ], () => this.payForMedicine());
    }
  }

  startPharmacyRevisitDialogue(skipScene = false) {
    const scene = this.scene;
    if (!skipScene) {
      scene.playSceneMusic("ambient_pharmacy_bgm", 0.24);
      scene.pharmacyMapSystem?.setInteractionMode("revisit");
      scene.showInteriorScene("pharmacy_interior", "pharmacy");
      scene.showQuestToast("\uCE74\uC6B4\uD130 \uC55E\uC73C\uB85C \uAC00\uC11C \uC57D\uC0AC\uC5D0\uAC8C \uB9D0\uC744 \uAC78\uC5B4\uBCF4\uC138\uC694.", 3200);
      return;
    }
    scene.dialogueSystem.start([
      {
        name: "약사",
        portraitKey: "chemist",
        text: "어떻게 오셨어요?",
        choices: [
          { label: "머리가 아파요.", onSelect: () => this.startPharmacyHeadacheRoute() },
          { label: "잘못 들어왔어요.", onSelect: () => this.closePharmacyRevisit("언제든 필요할 때 들러주세요.") },
          { label: "활력수를 사고 싶어요.", onSelect: () => this.startVitalDrinkRoute() },
        ],
      },
    ]);
  }

  startPharmacyHeadacheRoute() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "병원은 다녀오셨어요? 처방전 있으신가요?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: "처방전이 없어요." },
      { name: "약사", portraitKey: "chemist", text: "정말 아프신 건 맞나요? 아파 보이지는 않는데..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "어떻게 말할까요?",
        choices: [
          { label: "아파요.", onSelect: () => this.answerPharmacyHeadache(true) },
          { label: "괜찮아요.", onSelect: () => this.answerPharmacyHeadache(false) },
        ],
      },
    ]);
  }

  answerPharmacyHeadache(isStillSick) {
    const scene = this.scene;
    if (!isStillSick) {
      scene.dialogueSystem.start([
        { name: "약사", portraitKey: "chemist", text: "괜찮다니 다행이에요." },
        { name: "약사", portraitKey: "chemist", text: "약은 필요할 때만 먹는 거예요." },
      ], () => scene.clearInteriorScene());
      return;
    }

    scene.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "처방전이 없으면 일반 의약품만 드릴 수 있어요." },
      { name: "약사", portraitKey: "chemist", text: "두통약이나 감기약도 꼭 필요한 만큼만 먹어야 해요." },
      { name: "약사", portraitKey: "chemist", text: "정말 아프면 병원에서 먼저 진료를 받아야 합니다." },
    ], () => scene.clearInteriorScene());
  }

  startVitalDrinkRoute() {
    const scene = this.scene;
    if (scene.hasReceivedPharmacyDrink) {
      scene.dialogueSystem.start([
        { name: "약사", portraitKey: "chemist", text: "활력수나 카페인이 많은 음료는 자주 마시면 몸에 좋지 않아요." },
        { name: "약사", portraitKey: "chemist", text: "오늘은 더 마시지 말고 물을 마시며 쉬어보는 게 좋겠어요." },
      ], () => scene.clearInteriorScene());
      return;
    }

    scene.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "아직 어리신데 활력수는 너무 많이 마시면 좋지 않아요." },
      { name: "약사", portraitKey: "chemist", text: "보호자랑 같이 오면 다시 이야기해볼게요." },
      { name: "엄마", portraitKey: "mother_calm", text: "왜 마시고 싶은 거야?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: "그냥... 다들 마셔서..." },
      { name: "엄마", portraitKey: "mother_worried", text: "그런 음료는 많이 마시면 몸에 안 좋아." },
      { name: "엄마", portraitKey: "mother_smile", text: "대신 엄마가 음료 하나 사줄게. 뭘 마실래?" },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "무엇을 고를까요?",
        choices: [
          { label: "생수", onSelect: () => this.choosePharmacyDrinkChoice("생수", true) },
          { label: "음료수", onSelect: () => this.choosePharmacyDrinkChoice("음료수", false) },
        ],
      },
    ]);
  }

  choosePharmacyDrinkChoice(drinkLabel, isWater) {
    const scene = this.scene;
    scene.hasReceivedPharmacyDrink = true;
    scene.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_smile", text: `${drinkLabel} 좋지. 몸을 생각해서 고르는 것도 멋진 선택이야.` },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워요. 다음엔 몸에 필요한 걸 먼저 생각해볼게요." },
    ], () => {
      scene.clearInteriorScene();
      if (isWater) {
        scene.showQuestToast("생수를 마셨어. 몸이 편안해졌어.", 2600);
        return;
      }
      scene.activateDrinkSpeedBuff();
      scene.showQuestToast("음료수를 마셨어. 잠깐 힘이 났어!", 2600);
    });
  }

  closePharmacyRevisit(message) {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: message },
    ], () => scene.clearInteriorScene());
  }

  completeQuest() {
    const scene = this.scene;
    scene.sunisuniQuestState = SunisuniQuestState.QUEST_COMPLETE;
    scene.clearInteriorScene();
    scene.clearQuestMarker("sunisuniHospital");
    scene.clearQuestMarker("sunisuniQuest");
    scene.hasMedicine = false;
    scene.hasBacchus = true;
    scene.uiManager?.showItemRewardOverlay?.({
      title: "선물 획득!",
      itemName: "활력수",
      description: "필요할 때 사용하면 잠시 이동속도가 빨라져요.",
      icon: "./assets/ui/bacchus.png",
    });
    scene.showFloatingItem("bacchus_item", Math.max(384, (scene.scale.width || 768) / 2), Math.max(228, (scene.scale.height || 480) / 2 - 34), 86, true, { hold: 900 });
    scene.updateBacchusButton();
    scene.saveCheckpoint("sunisuni_completed");
    if (scene.sunisuniNpc?.active) {
      scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", "down", false);
      scene.playSunisuniEffect("sunisuni_heart", scene.sunisuniNpc.x, scene.sunisuniNpc.y - 48);
    }
    scene.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "해냄이 덕분에 병원도 가고 약도 샀어. 정말 고마워." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "이 활력수는 같이 가준 고마운 마음이야." },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워요. 꼭 필요할 때만 아껴서 쓸게요." },
      { name: "엄마", portraitKey: "mother_smile", text: "해냄이, 아픈 친구를 차분히 도와준 모습이 정말 멋졌어." },
    ], () => scene.sendSunisuniBackToBench());
  }
}
