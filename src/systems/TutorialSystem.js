import { GAME_CONFIG } from "../config/GameConstants.js";
import { isNear } from "../utils/distance.js";

export const TUTORIAL_STATE = {
  INACTIVE: "inactive",
  MOVE: "move",
  SWEEP: "sweep",
  DEPOSIT: "deposit",
  NPC: "npc",
  COMPLETED: "completed",
};

export default class TutorialSystem {
  constructor(scene) {
    this.scene = scene;
    this.graphics = null;
    this.state = TUTORIAL_STATE.INACTIVE;
    
    // Coordinates
    this.startPoint = { x: 170, y: 424 };
    this.moveTarget = { x: 312, y: 424 }; // Spotlight position for Phase 1
    
    // Tutorial Objects
    this.tutorialSlime = null;
    this.guideCard = null;
    this.rescueBox = null;
    
    // Inactivity timers (15 seconds = 15000ms)
    this.inactivityTimeLimit = 15000;
    this.lastInputTime = 0;
    this.inactivityTimer = null;
    
    // Graphic animation offsets
    this.bobOffset = 0;
    this.bobTween = null;
  }

  create() {
    const scene = this.scene;
    this.state = scene.tutorialState || TUTORIAL_STATE.INACTIVE;
    
    // Setup graphic overlay
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(3);
    
    // Setup input listeners to reset activity timer
    scene.input.on("pointerdown", () => this.resetInactivityTimer());
    scene.input.on("pointermove", () => this.resetInactivityTimer());
    if (scene.input.keyboard) {
      scene.input.keyboard.on("keydown", () => this.resetInactivityTimer());
    }
  }

  start() {
    const scene = this.scene;
    if (scene.tutorialState === "completed") {
      this.state = TUTORIAL_STATE.COMPLETED;
      return;
    }

    this.state = TUTORIAL_STATE.MOVE;
    scene.tutorialState = TUTORIAL_STATE.MOVE;
    
    // Disable normal random roam while inside tutorial
    scene.clearNpcRoaming?.();

    // Create the premium guide card element
    this.createGuideCard();
    this.updateGuideText(
      "반갑습니다, 해냄이!",
      "W, A, S, D 키보드 방향키나 마우스를 원형이 있는 곳까지 클릭해 걸어가 보세요!"
    );

    // Create Floor Target Ring
    this.createTargetSpotlight();
    
    // Reset and start the inactivity timer
    this.resetInactivityTimer();
  }

  update(time, delta) {
    if (this.state === TUTORIAL_STATE.INACTIVE || this.state === TUTORIAL_STATE.COMPLETED) {
      this.clearGraphics();
      return;
    }

    const scene = this.scene;
    
    // Draw the active target ring or route dots depending on state
    this.drawVisualGuides();

    // Phase transitions
    if (this.state === TUTORIAL_STATE.MOVE) {
      // Check if player reached the target spot
      if (scene.player && Phaser.Math.Distance.Between(scene.player.x, scene.player.y, this.moveTarget.x, this.moveTarget.y) < 32) {
        this.transitionToSweepPhase();
      }
    } else if (this.state === TUTORIAL_STATE.SWEEP) {
      // Check if the tutorial slime was successfully swept
      if (this.tutorialSlime && (!this.tutorialSlime.active || this.tutorialSlime.getData("cleaned"))) {
        this.transitionToDepositPhase();
      }
    } else if (this.state === TUTORIAL_STATE.DEPOSIT) {
      // Check if player completed depositing
      if (scene.recyclingInventory && (scene.recyclingInventory.normal > 0 || scene.moneySystem.money > 0)) {
        // Wait, if they got the money reward, they successfully deposited!
        this.transitionToNpcPhase();
      }
    }
  }

  // --- Visual Guides rendering ---

  createTargetSpotlight() {
    const scene = this.scene;
    this.bobOffset = 0;
    if (this.bobTween) this.bobTween.stop();
    this.bobTween = scene.tweens.add({
      targets: this,
      bobOffset: 8,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  drawVisualGuides() {
    this.clearGraphics();
    
    const scene = this.scene;
    if (!scene.player) return;

    if (this.state === TUTORIAL_STATE.MOVE) {
      // Draw a gold shining pulse circle at the destination
      this.graphics.lineStyle(4, 0xffd75a, 0.9);
      this.graphics.fillStyle(0xffd75a, 0.22);
      this.graphics.strokeCircle(this.moveTarget.x, this.moveTarget.y, 28 + this.bobOffset);
      this.graphics.fillCircle(this.moveTarget.x, this.moveTarget.y, 28 + this.bobOffset);
      
      // Draw bounce hand icon overlay
      this.graphics.fillStyle(0xffeb3b, 0.9);
      this.graphics.fillTriangle(
        this.moveTarget.x, this.moveTarget.y - 48 + this.bobOffset,
        this.moveTarget.x - 12, this.moveTarget.y - 68 + this.bobOffset,
        this.moveTarget.x + 12, this.moveTarget.y - 68 + this.bobOffset
      );
    } 
    else if (this.state === TUTORIAL_STATE.SWEEP) {
      if (this.tutorialSlime && this.tutorialSlime.active) {
        // Draw a pulse circle around the slime
        this.graphics.lineStyle(3, 0xffeb3b, 0.85);
        this.graphics.fillStyle(0xffeb3b, 0.15);
        this.graphics.strokeCircle(this.tutorialSlime.x, this.tutorialSlime.y, 36 + this.bobOffset);
        this.graphics.fillCircle(this.tutorialSlime.x, this.tutorialSlime.y, 36 + this.bobOffset);
      }
    } 
    else if (this.state === TUTORIAL_STATE.DEPOSIT) {
      // Draw dot line to the nearest recycle bin
      const binPoint = scene.getYebiRecyclePosition();
      this.graphics.lineStyle(4, 0xffeb3b, 0.8);
      
      // Draw a line of dots between player and bin
      const playerPos = new Phaser.Math.Vector2(scene.player.x, scene.player.y);
      const binPos = new Phaser.Math.Vector2(binPoint.x, binPoint.y);
      const distance = playerPos.distance(binPos);
      const dotCount = Math.floor(distance / 24);
      
      for (let i = 1; i < dotCount; i++) {
        const t = i / dotCount;
        const x = Phaser.Math.Interpolation.Linear([playerPos.x, binPos.x], t);
        const y = Phaser.Math.Interpolation.Linear([playerPos.y, binPos.y], t);
        this.graphics.fillStyle(0xffeb3b, 0.85);
        this.graphics.fillCircle(x, y, 4 + Math.sin((scene.time.now / 150) + i) * 2);
      }

      // Draw a shine ring over the recycling center
      this.graphics.lineStyle(3, 0xffd75a, 0.9);
      this.graphics.strokeCircle(binPoint.x, binPoint.y, 42 + this.bobOffset);
    }
  }

  clearGraphics() {
    if (this.graphics) {
      this.graphics.clear();
    }
  }

  // --- Phase Transitions ---

  transitionToSweepPhase() {
    const scene = this.scene;
    this.state = TUTORIAL_STATE.SWEEP;
    scene.tutorialState = TUTORIAL_STATE.SWEEP;

    // Spawn 1 highlighted slime right in front of the player (e.g. at x: 420, y: 424)
    if (scene.createTrashSprite) {
      this.tutorialSlime = scene.createTrashSprite(420, 424, "normal");
      this.tutorialSlime.setInteractive();
    }

    this.updateGuideText(
      "쓸기 조작 배우기",
      "쓰레기가 나타났어요!\n슬라임 가까이 다가가서 [Spacebar]를 누르면 빗자루질로 쓸 수 있어요!"
    );

    // Make mobile sweep button flash/highlight
    const sweepBtn = document.getElementById("sweepButton");
    if (sweepBtn) {
      sweepBtn.classList.add("is-upgraded");
      sweepBtn.style.outline = "4px solid #fff3a3";
    }

    this.resetInactivityTimer();
  }

  transitionToDepositPhase() {
    const scene = this.scene;
    this.state = TUTORIAL_STATE.DEPOSIT;
    scene.tutorialState = TUTORIAL_STATE.DEPOSIT;

    // Give 1 normal trash directly to inventory just in case
    if (scene.recyclingInventory) {
      scene.recyclingInventory.normal = 1;
      scene.updateHud();
    }

    this.updateGuideText(
      "분리수거 제출 배우기",
      "쓰레기를 주웠어요! 분리수거장에 가서 버려볼까요?\n화면에 보이는 점선을 따라 수거함 앞에 다가가서 [Spacebar]를 눌러보세요!"
    );

    // Clear highlight outline on sweep
    const sweepBtn = document.getElementById("sweepButton");
    if (sweepBtn) {
      sweepBtn.classList.remove("is-upgraded");
      sweepBtn.style.outline = "";
    }

    this.resetInactivityTimer();
  }

  transitionToNpcPhase() {
    const scene = this.scene;
    this.state = TUTORIAL_STATE.NPC;
    scene.tutorialState = TUTORIAL_STATE.NPC;

    this.updateGuideText(
      "NPC와 대화하기",
      "참 잘하셨어요! 보상으로 100원을 얻었습니다.\n이제 물음표가 떠 있는 여비(Yeobi) NPC를 마우스로 클릭하여 대화해 보세요!"
    );

    // Add gold marker over Yebi NPC
    if (scene.yebiNpc) {
      scene.setQuestMarker("tutorialQuest", scene.yebiNpc, "?");
    }

    this.resetInactivityTimer();
  }

  complete() {
    if (this.state === TUTORIAL_STATE.COMPLETED) return;

    const scene = this.scene;
    this.state = TUTORIAL_STATE.COMPLETED;
    scene.tutorialState = TUTORIAL_STATE.COMPLETED;
    
    // Clear elements
    this.clearGraphics();
    this.removeGuideCard();
    this.removeRescueBox();
    scene.clearQuestMarker("tutorialQuest");
    
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }

    // Spawn the standard game trash wave of 30 slimes!
    if (scene.spawnTrashWave) {
      scene.spawnTrashWave();
    }

    // Save checkpoint
    scene.saveCheckpoint("tutorial_completed");

    // Enable normal roaming
    scene.updateNpcRoaming(true);
  }

  // --- Inactivity timer & Rescue box ---

  resetInactivityTimer() {
    this.lastInputTime = Date.now();
    this.removeRescueBox();

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    if (this.state !== TUTORIAL_STATE.INACTIVE) {
      this.inactivityTimer = setTimeout(() => this.triggerRescueGuide(), this.inactivityTimeLimit);
    }
  }

  triggerRescueGuide() {
    let hint = "";
    if (this.state !== TUTORIAL_STATE.COMPLETED) {
      switch (this.state) {
        case TUTORIAL_STATE.MOVE:
          hint = "W, A, S, D 방향키나 마우스 클릭을 이용해 노란 원 방향으로 캐릭터를 움직여 보세요!";
          break;
        case TUTORIAL_STATE.SWEEP:
          hint = "슬라임 가까이 서서 키보드의 스페이스바(Space)를 눌러 빗자루질을 해보세요!";
          break;
        case TUTORIAL_STATE.DEPOSIT:
          hint = "오른쪽 끝 분리수거함 앞으로 다가가서 스페이스바(Space)를 눌러 쓰레기를 넣어보세요!";
          break;
        case TUTORIAL_STATE.NPC:
          hint = "물음표가 떠 있는 여비 NPC를 마우스로 직접 클릭하여 대화를 걸어 보세요!";
          break;
      }
    } else {
      const scene = this.scene;
      if (scene.isInDialogue || scene.interiorSceneGroup) return;

      if (scene.sunisuniQuestState === "going_hospital" && scene.isPlayerNearHospitalDoor?.()) {
        hint = "병원 문 앞에 다가서서 [Spacebar] 키를 누르면 병원 안으로 들어갈 수 있어요!";
      } else if (scene.sunisuniQuestState === "going_pharmacy" && scene.isPlayerNearPharmacyDoor?.()) {
        hint = "약국 문 앞에 다가서서 [Spacebar] 키를 누르면 약국 안으로 들어갈 수 있어요!";
      } else if (scene.clothesQuestState === "shopping" && scene.isPlayerNearClothingStoreDoor?.()) {
        hint = "옷가게 문 앞에 다가서서 [Spacebar] 키를 누르면 옷가게 안으로 들어갈 수 있어요!";
      } else if (scene.jjookQuestState === "wallet_missing") {
        hint = "도로 아래쪽 화단이나 길가 주변에서 반짝반짝 빛나는 갈색 지갑을 찾아보세요!";
      }
    }

    if (hint) {
      this.createRescueBox(hint);
    }
  }

  // --- DOM overlays ---

  createGuideCard() {
    if (document.getElementById("tutorial-guide-card")) return;

    this.guideCard = document.createElement("div");
    this.guideCard.id = "tutorial-guide-card";
    this.guideCard.className = "tutorial-card";
    document.body.appendChild(this.guideCard);
  }

  updateGuideText(title, text) {
    if (!this.guideCard) {
      this.createGuideCard();
    }
    this.guideCard.innerHTML = `
      <strong>${title}</strong>
      <p>${text}</p>
    `;
    // Announce to Screen Readers for accessibility
    this.guideCard.setAttribute("aria-live", "assertive");
  }

  removeGuideCard() {
    if (this.guideCard && this.guideCard.parentNode) {
      this.guideCard.parentNode.removeChild(this.guideCard);
    }
    this.guideCard = null;
  }

  createRescueBox(text) {
    this.removeRescueBox();

    this.rescueBox = document.createElement("div");
    this.rescueBox.id = "tutorial-rescue-box";
    this.rescueBox.className = "rescue-guide-box";
    this.rescueBox.innerHTML = `<span>💡 도움: ${text}</span>`;
    document.body.appendChild(this.rescueBox);
  }

  removeRescueBox() {
    if (this.rescueBox && this.rescueBox.parentNode) {
      this.rescueBox.parentNode.removeChild(this.rescueBox);
    }
    this.rescueBox = null;
  }

  destroy() {
    this.state = TUTORIAL_STATE.INACTIVE;
    this.clearGraphics();
    this.removeGuideCard();
    this.removeRescueBox();
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
}
