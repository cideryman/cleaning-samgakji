import { GAME_CONFIG } from "../config/GameConstants.js";
import { SunisuniQuestState } from "../config/QuestStates.js";

export default class SunisuniQuestSystem {
  constructor(scene) {
    this.scene = scene;
  }

  isFollowing() {
    return [SunisuniQuestState.GOING_HOSPITAL, SunisuniQuestState.GOING_PHARMACY].includes(this.scene.sunisuniQuestState);
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

    const step = (scene.game.loop.delta / 1000) * GAME_CONFIG.playerSpeed * GAME_CONFIG.sunisuniSpeedMultiplier;
    const angle = Phaser.Math.Angle.Between(scene.sunisuniNpc.x, scene.sunisuniNpc.y, scene.player.x, scene.player.y);
    const moveX = Math.cos(angle) * Math.min(step, distance - GAME_CONFIG.sunisuniFollowDistance);
    const moveY = Math.sin(angle) * Math.min(step, distance - GAME_CONFIG.sunisuniFollowDistance);
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
        { name: "해냄이", portraitKey: "haenaem_determined", text: "천천히 같이 가야겠다." },
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
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", text: "해냄아... 내가 긴장해서 말이 잘 안 나와..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-sick", text: "내 배가 아프다고 대신 말해줄래?" },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "의사 선생님께 뭐라고 말할까요?",
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
        { name: "접수 직원", portraitKey: "hospital_staff", text: "오늘은 이미 진료를 받으셨어요." },
        { name: "접수 직원", portraitKey: "hospital_staff", text: "정말 아프면 보호자와 함께 다시 와 주세요." },
      ], () => scene.clearInteriorScene());
      return;
    }

    scene.dialogueSystem.start([
      {
        name: "접수 직원",
        portraitKey: "hospital_staff",
        text: "어디가 아프세요?",
        choices: [
          { label: "목이 아파요.", onSelect: () => this.startPretendHospitalVisit("목이") },
          { label: "머리가 아파요.", onSelect: () => this.startPretendHospitalVisit("머리가") },
          { label: "안 아파요.", onSelect: () => this.closeHospitalRevisit("아프지 않다니 다행이에요. 건강할 때도 몸을 잘 살펴보세요.") },
          { label: "잘못 들어왔어요.", onSelect: () => this.closeHospitalRevisit("괜찮아요. 필요할 때 다시 오세요.") },
        ],
      },
    ]);
  }

  startPretendHospitalVisit(symptomLabel) {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: `${symptomLabel} 아프다고 접수할게요. 진료실로 들어가세요.` },
      { name: "의사", portraitKey: "hospital_doctor", text: "안녕하세요. 어디가 얼마나 아픈지 천천히 말해볼까요?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: `음... ${symptomLabel}가 아픈 것 같기도 하고 아닌 것 같기도 해요.` },
      { name: "의사", portraitKey: "hospital_doctor", text: "음... 특별히 아픈 곳은 없어 보이는데요?" },
      { name: "의사", portraitKey: "hospital_doctor", text: "병원은 정말 아플 때 오는 곳이에요. 궁금해서 들어오는 곳은 아니랍니다." },
      { name: "의사", portraitKey: "hospital_doctor", text: "몸이 이상하면 보호자에게 먼저 말하고, 필요한 때 진료를 받는 게 좋아요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "진료는 끝났습니다." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "특별한 이상은 없으셨지만 진료비는 내셔야 해요. 1만원입니다." },
    ], () => this.finishPretendHospitalVisit());
  }

  finishPretendHospitalVisit() {
    const scene = this.scene;
    scene.hospitalRevisitUsed = true;
    scene.clearInteriorScene();

    if (scene.moneySystem?.deductMoney(10000)) {
      scene.showQuestToast("진료비 10,000원을 냈어요.", 2600);
      return;
    }

    scene.showQuestToast("진료비 10,000원이 부족해요. 다음에는 꼭 챙겨 오자.", 3200);
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
      this.startPharmacyRevisitDialogue();
      return;
    }

    if (scene.sunisuniQuestState !== SunisuniQuestState.GOING_PHARMACY || !scene.hasPrescription) return;
    scene.sunisuniQuestState = SunisuniQuestState.MEDICINE_PAID;
    scene.playSceneMusic("ambient_pharmacy_bgm", 0.24);
    scene.showInteriorScene("pharmacy_interior", "pharmacy");
    scene.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "안녕하세요. 처방전이 있으면 보여주세요." },
      { name: "약사", portraitKey: "chemist", text: "처방전을 확인할게요. 잠시만 기다려 주세요." },
      { name: "약사", portraitKey: "chemist", text: "처방약이 나왔습니다." },
      { name: "약사", portraitKey: "chemist", text: "이 약은 수니수니 님만 드셔야 해요. 다른 사람이 먹으면 안 됩니다." },
      { name: "약사", portraitKey: "chemist", text: "밥을 먹고 30분 뒤에 드세요. 이제 약값 5,000원을 결제해 주세요." },
    ], () => this.payForMedicine());
  }

  payForMedicine() {
    const scene = this.scene;
    if (!scene.moneySystem?.deductMoney(5000)) {
      scene.sunisuniQuestState = SunisuniQuestState.GOING_PHARMACY;
      scene.clearInteriorScene();
      scene.showQuestToast("약값 5,000원이 필요해요.");
      return;
    }

    scene.hasPrescription = false;
    scene.hasMedicine = true;
    scene.playVendingPaymentAnimationLike("bill_5000", () => {
      scene.showFloatingItem("medicine_bag", Math.max(384, (scene.scale.width || 768) / 2), Math.max(240, (scene.scale.height || 480) / 2), { width: 150, height: 150 }, true, {
        duration: 360,
        hold: 1900,
        floatY: -12,
        onComplete: () => {
          scene.dialogueSystem.start([
            { name: "약사", portraitKey: "chemist", text: "결제가 완료되었습니다." },
            { name: "약사", portraitKey: "chemist", text: "약 봉투를 잘 챙겨 주세요." },
            { name: "약사", portraitKey: "chemist", text: "약은 꼭 설명대로 먹어야 해요." },
          ], () => this.completeQuest());
        },
      });
    });
  }

  startPharmacyRevisitDialogue() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_pharmacy_bgm", 0.24);
    scene.showInteriorScene("pharmacy_interior", "pharmacy");
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
    scene.moneySystem?.addMoney(10000);
    scene.playMoneyRewardSound();
    scene.showMoneyRewardAnimation?.(10000, { label: "수고비", icon: "./assets/ui/10000won.png" });
    scene.showFloatingItem("bacchus_item", scene.player.x + 28, scene.player.y - 68, 58);
    scene.updateBacchusButton();
    scene.saveCheckpoint("sunisuni_completed");
    if (scene.sunisuniNpc?.active) {
      scene.setNpcDirectionTexture(scene.sunisuniNpc, "sunisuni", "down", false);
      scene.playSunisuniEffect("sunisuni_heart", scene.sunisuniNpc.x, scene.sunisuniNpc.y - 48);
    }
    scene.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "해냄이 덕분에 병원도 가고 약도 샀어." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "정말 고마워." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "이건 같이 가준 보답이야." },
      { name: "엄마", portraitKey: "mother_smile", text: "해냄이, 오늘은 청소뿐 아니라 아픈 친구도 도왔구나!" },
      { name: "엄마", portraitKey: "mother_smile", text: "스스로 생각하고 도와준 모습이 정말 멋졌어." },
    ], () => scene.sendSunisuniBackToBench());
  }
}
