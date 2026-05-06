const GAME_CONFIG = {
  worldWidth: 1536,
  worldHeight: 960,
  playerSpeed: 135,
  waveSize: 5,
  totalGoal: 20,
  broomUpgradeGoal: 10,
  playerDisplaySize: 50,
  slimeDisplaySize: 54,
  broomItemDisplaySize: 52,
  baseSweepWidth: 112,
  baseSweepHeight: 84,
  upgradedSweepMultiplier: 2,
  sweepCooldownMs: 420,
  feedbackSparkleCount: 14,
  slimeSpawnMinDistance: 72,
};

class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.totalCleanedCount = 0;
    this.waveCleanedCount = 0;
    this.currentWave = 0;
    this.hasBroomUpgrade = false;
    this.hasDroppedBroomUpgrade = false;
    this.isMissionComplete = false;
    this.lastDirection = new Phaser.Math.Vector2(1, 0);
    this.joystickVector = new Phaser.Math.Vector2(0, 0);
    this.activeJoystickPointerId = null;
    this.canSweep = true;
    this.audioContext = null;
  }

  create() {
    this.resetRunState();

    this.cleanProgressEls = Array.from(document.querySelectorAll("#cleanProgress span"));
    this.missionCountEl = document.querySelector("#missionCount");
    this.broomRangeEls = Array.from(document.querySelectorAll("#broomStatus img"));
    this.sweepButton = document.querySelector("#sweepButton");
    this.movePad = document.querySelector("#movePad");
    this.moveKnob = document.querySelector("#moveKnob");
    this.fullscreenButton = document.querySelector("#fullscreenButton");
    this.completeOverlay = document.querySelector("#completeOverlay");
    this.restartButton = document.querySelector("#restartButton");
    this.restartHandler = () => this.restartGame();
    this.sweepHandler = (event) => {
      event?.preventDefault();
      this.trySweep();
    };
    this.moveStartHandler = (event) => this.startJoystick(event);
    this.moveUpdateHandler = (event) => this.updateJoystick(event);
    this.moveStopHandler = (event) => this.stopJoystick(event);
    this.fullscreenHandler = (event) => this.toggleFullscreen(event);
    this.fullscreenChangeHandler = () => this.handleFullscreenChange();
    this.restartButton?.addEventListener("click", this.restartHandler);
    this.sweepButton?.addEventListener("click", this.sweepHandler);
    this.movePad?.addEventListener("pointerdown", this.moveStartHandler);
    window.addEventListener("pointermove", this.moveUpdateHandler);
    window.addEventListener("pointerup", this.moveStopHandler);
    window.addEventListener("pointercancel", this.moveStopHandler);
    this.fullscreenButton?.addEventListener("click", this.fullscreenHandler);
    document.addEventListener("fullscreenchange", this.fullscreenChangeHandler);
    document.addEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    if (this.moveKnob) {
      this.moveKnob.style.transform = "translate(0, 0)";
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.restartButton?.removeEventListener("click", this.restartHandler);
      this.sweepButton?.removeEventListener("click", this.sweepHandler);
      this.movePad?.removeEventListener("pointerdown", this.moveStartHandler);
      window.removeEventListener("pointermove", this.moveUpdateHandler);
      window.removeEventListener("pointerup", this.moveStopHandler);
      window.removeEventListener("pointercancel", this.moveStopHandler);
      this.fullscreenButton?.removeEventListener("click", this.fullscreenHandler);
      document.removeEventListener("fullscreenchange", this.fullscreenChangeHandler);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
    });

    this.createMap();
    this.createPlayer();
    this.trashSlimes = this.physics.add.staticGroup();
    this.spawnTrashWave();
    this.createInput();
    this.updateHud();

    this.physics.add.collider(this.player, this.walls);
  }

  resetRunState() {
    this.totalCleanedCount = 0;
    this.waveCleanedCount = 0;
    this.currentWave = 0;
    this.hasBroomUpgrade = false;
    this.hasDroppedBroomUpgrade = false;
    this.isMissionComplete = false;
    this.lastDirection.set(1, 0);
    this.joystickVector.set(0, 0);
    this.activeJoystickPointerId = null;
    this.canSweep = true;
  }

  update() {
    this.handleMovement();
  }

  createMap() {
    this.physics.world.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);

    this.add.rectangle(768, 480, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight, 0x6c7a55);
    this.add.rectangle(768, 480, 1396, 820, 0x9acb87);

    this.add.rectangle(585, 420, 980, 118, 0xd8c59a);
    this.add.rectangle(652, 392, 122, 386, 0xd8c59a);
    this.add.rectangle(835, 300, 760, 104, 0xd8c59a).setAngle(-18);
    this.add.rectangle(1012, 512, 560, 78, 0xcbbd95).setAngle(-14);
    this.add.rectangle(570, 625, 650, 82, 0xcbbd95).setAngle(-18);
    this.add.ellipse(650, 420, 194, 154, 0xd8c59a);

    this.add.rectangle(1090, 690, 410, 258, 0xb8c1bd);
    this.add.rectangle(1090, 690, 342, 190, 0x8e9b98);
    this.add.rectangle(1090, 575, 240, 18, 0xe8f3ef);
    this.add.rectangle(1325, 480, 210, 860, 0x52645d);
    this.add.rectangle(1364, 480, 80, 860, 0x303a37);
    this.add.rectangle(1394, 480, 6, 820, 0xffffff).setAngle(-12);

    this.add.rectangle(370, 226, 360, 86, 0x6c7a55);
    this.add.rectangle(330, 710, 310, 82, 0x6c7a55);
    this.add.rectangle(934, 226, 130, 52, 0x6c7a55);

    this.add.rectangle(502, 350, 170, 84, 0xb2d18d);
    this.add.rectangle(246, 526, 270, 148, 0xb2d18d);
    this.add.rectangle(1030, 418, 310, 132, 0xb2d18d);
    this.add.rectangle(1028, 496, 286, 110, 0xc6e2a3);

    this.createTrees();

    this.walls = this.physics.add.staticGroup();
    this.addWall(768, 30, GAME_CONFIG.worldWidth, 60);
    this.addWall(768, 930, GAME_CONFIG.worldWidth, 60);
    this.addWall(30, 480, 60, GAME_CONFIG.worldHeight);
    this.addWall(1506, 480, 60, GAME_CONFIG.worldHeight);
    this.addWall(370, 226, 360, 86);
    this.addWall(330, 710, 310, 82);
    this.addWall(1090, 690, 410, 258);
    this.addWall(1325, 480, 210, 860);
    this.addWall(934, 226, 130, 52);
  }

  addWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0x6c7a55);
    wall.setVisible(false);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createTrees() {
    const treePositions = [
      [180, 205],
      [225, 655],
      [402, 566],
      [516, 246],
      [744, 210],
      [806, 520],
      [930, 370],
      [1165, 330],
      [1224, 560],
      [690, 705],
    ];

    treePositions.forEach(([x, y]) => {
      this.add.circle(x, y, 34, 0x5f8b57);
      this.add.circle(x - 16, y + 8, 24, 0x4f7b4c);
      this.add.rectangle(x, y + 32, 12, 24, 0x8d5a24);
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(170, 424, "player");
    this.player.setDisplaySize(GAME_CONFIG.playerDisplaySize, GAME_CONFIG.playerDisplaySize);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(72, 76);
    this.player.body.setOffset(28, 30);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  spawnTrashWave() {
    this.waveCleanedCount = 0;
    this.currentWave += 1;
    const positions = this.createRandomSlimePositions();

    positions.forEach(([x, y]) => {
      const slime = this.trashSlimes.create(x, y, "trash_slime");
      slime.setDisplaySize(GAME_CONFIG.slimeDisplaySize, GAME_CONFIG.slimeDisplaySize);
      slime.refreshBody();
      slime.setDepth(4);
      slime.setData("cleaned", false);
      slime.setAlpha(0);
      slime.setScale(0.35);
      this.tweens.add({
        targets: slime,
        alpha: 1,
        scaleX: GAME_CONFIG.slimeDisplaySize / slime.width,
        scaleY: GAME_CONFIG.slimeDisplaySize / slime.height,
        duration: 220,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: slime,
            y: y - 5,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        },
      });
    });

    this.updateHud();
  }

  createRandomSlimePositions() {
    const positions = [];
    const spawnAreas = [
      { left: 150, right: 1040, top: 360, bottom: 470 },
      { left: 540, right: 760, top: 238, bottom: 610 },
      { left: 680, right: 1250, top: 220, bottom: 356 },
      { left: 300, right: 870, top: 570, bottom: 704 },
      { left: 860, right: 1250, top: 460, bottom: 565 },
      { left: 160, right: 460, top: 488, bottom: 620 },
    ];

    let attempts = 0;
    while (positions.length < GAME_CONFIG.waveSize && attempts < 200) {
      attempts += 1;
      const area = spawnAreas[attempts % spawnAreas.length];
      const x = Phaser.Math.Between(area.left, area.right);
      const y = Phaser.Math.Between(area.top, area.bottom);
      const isFarEnough = positions.every(([otherX, otherY]) => {
        return Phaser.Math.Distance.Between(x, y, otherX, otherY) >= GAME_CONFIG.slimeSpawnMinDistance;
      });

      if (isFarEnough && !this.isBlockedSpawnPoint(x, y)) {
        positions.push([x, y]);
      }
    }

    while (positions.length < GAME_CONFIG.waveSize) {
      const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
      positions.push([
        Phaser.Math.Between(area.left, area.right),
        Phaser.Math.Between(area.top, area.bottom),
      ]);
    }

    return positions;
  }

  isBlockedSpawnPoint(x, y) {
    const blockedAreas = [
      { left: 190, right: 550, top: 175, bottom: 277 },
      { left: 175, right: 485, top: 665, bottom: 760 },
      { left: 875, right: 1295, top: 558, bottom: 824 },
      { left: 1210, right: 1435, top: 80, bottom: 900 },
      { left: 865, right: 1002, top: 184, bottom: 278 },
      { left: 48, right: 90, top: 70, bottom: 890 },
      { left: 1446, right: 1490, top: 70, bottom: 890 },
    ];

    return blockedAreas.some((area) => {
      return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    });
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sweep: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.keys.sweep.on("down", () => this.trySweep());
  }

  handleMovement() {
    let horizontal =
      Number(this.cursors.right.isDown || this.keys.right.isDown) -
      Number(this.cursors.left.isDown || this.keys.left.isDown);
    let vertical =
      Number(this.cursors.down.isDown || this.keys.down.isDown) -
      Number(this.cursors.up.isDown || this.keys.up.isDown);

    if (horizontal === 0 && vertical === 0 && this.joystickVector.lengthSq() > 0) {
      horizontal = this.joystickVector.x;
      vertical = this.joystickVector.y;
    }

    const velocity = new Phaser.Math.Vector2(horizontal, vertical);
    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.lastDirection.copy(velocity);
    }

    this.player.setVelocity(
      velocity.x * GAME_CONFIG.playerSpeed,
      velocity.y * GAME_CONFIG.playerSpeed,
    );
  }

  startJoystick(event) {
    if (this.isMissionComplete || this.activeJoystickPointerId !== null) return;

    event.preventDefault();
    this.activeJoystickPointerId = event.pointerId;
    this.movePad?.setPointerCapture?.(event.pointerId);
    this.updateJoystick(event);
  }

  updateJoystick(event) {
    if (this.activeJoystickPointerId !== event.pointerId || !this.movePad) return;

    event.preventDefault();
    const rect = this.movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width * 0.34;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;

    this.joystickVector.set(knobX / radius, knobY / radius);
    this.moveKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  stopJoystick(event) {
    if (this.activeJoystickPointerId !== event.pointerId) return;

    event.preventDefault();
    this.activeJoystickPointerId = null;
    this.joystickVector.set(0, 0);
    if (this.moveKnob) {
      this.moveKnob.style.transform = "translate(0, 0)";
    }
  }

  trySweep() {
    if (!this.canSweep || this.isMissionComplete) return;

    this.canSweep = false;
    this.time.delayedCall(GAME_CONFIG.sweepCooldownMs, () => {
      this.canSweep = true;
    });

    const multiplier = this.hasBroomUpgrade ? GAME_CONFIG.upgradedSweepMultiplier : 1;
    const width = GAME_CONFIG.baseSweepWidth * multiplier;
    const height = GAME_CONFIG.baseSweepHeight * multiplier;
    const offset = 42 * multiplier;
    const sweepX = this.player.x + this.lastDirection.x * offset;
    const sweepY = this.player.y + this.lastDirection.y * offset;

    const sweepZone = this.add.zone(sweepX, sweepY, width, height);
    this.physics.add.existing(sweepZone);
    sweepZone.body.setAllowGravity(false);

    this.playSweepSound();
    this.showSweepEffect(sweepX, sweepY, width, height);

    this.physics.overlap(sweepZone, this.trashSlimes, (_, slime) => {
      this.cleanTrash(slime);
    });

    this.time.delayedCall(80, () => sweepZone.destroy());
  }

  showSweepEffect(x, y, width, height) {
    const sweepFlash = this.add.ellipse(x, y, width, height, 0xfff3a3, 0.42);
    sweepFlash.setStrokeStyle(5, 0xf2c94c, 0.9);
    sweepFlash.setDepth(6);

    const broomGhost = this.add.image(x, y, "broom_item");
    broomGhost.setDisplaySize(58, 58);
    broomGhost.setAlpha(0.75);
    broomGhost.setDepth(7);
    broomGhost.setRotation(this.lastDirection.angle() + 0.8);
    const broomGhostScale = broomGhost.scaleX;

    this.tweens.add({
      targets: sweepFlash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => sweepFlash.destroy(),
    });

    this.tweens.add({
      targets: broomGhost,
      alpha: 0,
      angle: broomGhost.angle + 38,
      scaleX: broomGhostScale * 1.18,
      scaleY: broomGhostScale * 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => broomGhost.destroy(),
    });

    for (let i = 0; i < 7; i += 1) {
      const dust = this.add.circle(
        x + Phaser.Math.Between(-width / 3, width / 3),
        y + Phaser.Math.Between(-height / 3, height / 3),
        Phaser.Math.Between(3, 6),
        0xffffff,
        0.8,
      );
      dust.setDepth(7);
      this.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-18, 18),
        y: dust.y + Phaser.Math.Between(-18, 18),
        alpha: 0,
        duration: 260,
        onComplete: () => dust.destroy(),
      });
    }
  }

  cleanTrash(slime) {
    if (slime.getData("cleaned")) return;

    slime.setData("cleaned", true);
    const slimeX = slime.x;
    const slimeY = slime.y;
    slime.body.enable = false;
    this.totalCleanedCount += 1;
    this.waveCleanedCount += 1;

    this.playCleanSound();
    this.showSlimePop(slime);
    this.showCleanFeedback(slimeX, slimeY);
    this.updateHud();

    if (
      this.totalCleanedCount === GAME_CONFIG.broomUpgradeGoal &&
      !this.hasDroppedBroomUpgrade
    ) {
      this.dropBroomUpgrade();
    }

    if (this.totalCleanedCount >= GAME_CONFIG.totalGoal) {
      this.time.delayedCall(360, () => this.showMissionComplete());
      return;
    }

    if (this.waveCleanedCount >= GAME_CONFIG.waveSize) {
      this.time.delayedCall(720, () => this.spawnTrashWave());
    }
  }

  showSlimePop(slime) {
    this.tweens.killTweensOf(slime);
    slime.setDepth(8);

    this.tweens.add({
      targets: slime,
      y: slime.y - 18,
      scaleX: 1.2,
      scaleY: 0.8,
      alpha: 0,
      duration: 220,
      ease: "Back.easeIn",
      onComplete: () => slime.destroy(),
    });
  }

  showCleanFeedback(x, y) {
    const cleanRing = this.add.circle(x, y, 8, 0xffffff, 0);
    cleanRing.setStrokeStyle(4, 0xffffff, 0.95);
    cleanRing.setDepth(6);

    this.tweens.add({
      targets: cleanRing,
      alpha: 0,
      radius: 34,
      duration: 320,
      ease: "Cubic.easeOut",
      onComplete: () => cleanRing.destroy(),
    });

    for (let i = 0; i < GAME_CONFIG.feedbackSparkleCount; i += 1) {
      const sparkle = this.add.circle(x, y, Phaser.Math.Between(3, 5), 0xfff3a3, 1);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: x + Phaser.Math.Between(-42, 42),
        y: y + Phaser.Math.Between(-42, 42),
        alpha: 0,
        duration: 460,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  dropBroomUpgrade() {
    this.hasDroppedBroomUpgrade = true;

    const itemX = 650;
    const itemY = 420;
    const item = this.physics.add.sprite(itemX, itemY, "broom_item");
    item.setDisplaySize(GAME_CONFIG.broomItemDisplaySize, GAME_CONFIG.broomItemDisplaySize);
    item.body.setSize(78, 78);
    item.body.setOffset(25, 25);
    item.setImmovable(true);
    item.setDepth(4);
    item.setAlpha(0);
    const itemScale = item.scaleX;
    item.setScale(itemScale * 0.35);

    for (let i = 0; i < 18; i += 1) {
      const sparkle = this.add.circle(itemX, itemY, Phaser.Math.Between(3, 6), 0xfff3a3, 1);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: itemX + Phaser.Math.Between(-58, 58),
        y: itemY + Phaser.Math.Between(-48, 48),
        alpha: 0,
        duration: 620,
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    this.tweens.add({
      targets: item,
      alpha: 1,
      scaleX: itemScale,
      scaleY: itemScale,
      duration: 360,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: item,
      y: itemY - 14,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.physics.add.overlap(this.player, item, () => {
      if (this.hasBroomUpgrade) return;
      this.hasBroomUpgrade = true;
      item.destroy();
      this.showCleanFeedback(this.player.x, this.player.y);
      this.showUpgradePulse();
      this.updateHud();
    });
  }

  showMissionComplete() {
    if (this.isMissionComplete) return;

    this.isMissionComplete = true;
    this.player.setVelocity(0, 0);
    this.playMissionCompleteSound();

    const flowerPositions = [
      [820, 510],
      [910, 486],
      [1010, 500],
      [1110, 522],
      [930, 430],
      [1048, 422],
      [780, 610],
      [910, 630],
      [1040, 620],
      [1170, 620],
      [690, 420],
      [610, 520],
    ];

    flowerPositions.forEach(([x, y], index) => {
      const flower = this.add.image(x, y, "flower");
      flower.setDepth(3);
      flower.setScale(0.15);
      flower.setAlpha(0);

      this.tweens.add({
        targets: flower,
        alpha: 1,
        scale: 1,
        duration: 360,
        delay: index * 90,
        ease: "Back.easeOut",
      });
    });

    for (let i = 0; i < 38; i += 1) {
      const sparkle = this.add.circle(
        Phaser.Math.Between(620, 1220),
        Phaser.Math.Between(400, 675),
        Phaser.Math.Between(3, 6),
        0xfff3a3,
        1,
      );
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(18, 42),
        alpha: 0,
        duration: Phaser.Math.Between(520, 900),
        delay: Phaser.Math.Between(0, 420),
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    const pulse = this.add.rectangle(960, 540, 620, 310, 0xfff3a3, 0.18);
    pulse.setDepth(2);
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => pulse.destroy(),
    });

    this.updateHud();
    this.showCompleteOverlay();
  }

  showCompleteOverlay() {
    this.completeOverlay?.classList.add("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "false");
  }

  restartGame() {
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.restartButton?.removeEventListener("click", this.restartHandler);
    this.scene.restart();
  }

  toggleFullscreen(event) {
    event?.preventDefault();

    const target = document.querySelector(".game-shell") || document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
      return;
    }

    if (target.requestFullscreen) {
      target
        .requestFullscreen()
        .then(() => this.lockLandscapeOrientation())
        .catch(() => this.toggleAppFitMode());
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      this.lockLandscapeOrientation();
    } else {
      this.toggleAppFitMode();
    }
  }

  handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
    }

    this.time.delayedCall(80, () => this.scale.refresh());
  }

  toggleAppFitMode() {
    document.body.classList.toggle("app-fit-mode");
    if (document.body.classList.contains("app-fit-mode")) {
      this.lockLandscapeOrientation();
    } else {
      this.unlockScreenOrientation();
    }

    window.scrollTo(0, 1);
    this.scale.refresh();
  }

  lockLandscapeOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.lock) return;

    orientation.lock("landscape").catch(() => {
      // Some mobile browsers, especially iOS Safari, do not allow web pages to lock orientation.
    });
  }

  unlockScreenOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.unlock) return;

    orientation.unlock();
  }

  showUpgradePulse() {
    const pulse = this.add.ellipse(
      this.player.x,
      this.player.y,
      GAME_CONFIG.baseSweepWidth * GAME_CONFIG.upgradedSweepMultiplier,
      GAME_CONFIG.baseSweepHeight * GAME_CONFIG.upgradedSweepMultiplier,
      0xfff3a3,
      0.24,
    );
    pulse.setStrokeStyle(5, 0xf2c94c, 0.9);
    pulse.setDepth(6);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => pulse.destroy(),
    });
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  playTone({ frequency, duration, type = "sine", volume = 0.08, delay = 0 }) {
    const context = this.getAudioContext();
    if (!context) return;

    const startTime = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  playSweepSound() {
    this.playTone({ frequency: 520, duration: 0.08, type: "triangle", volume: 0.05 });
    this.playTone({ frequency: 260, duration: 0.11, type: "sawtooth", volume: 0.025, delay: 0.03 });
  }

  playCleanSound() {
    this.playTone({ frequency: 740, duration: 0.09, type: "square", volume: 0.045 });
    this.playTone({ frequency: 980, duration: 0.12, type: "triangle", volume: 0.055, delay: 0.06 });
  }

  playMissionCompleteSound() {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      this.playTone({
        frequency,
        duration: 0.24,
        type: "triangle",
        volume: 0.07,
        delay: index * 0.12,
      });
    });
  }

  updateHud() {
    const visibleWaveCount = this.isMissionComplete
      ? GAME_CONFIG.waveSize
      : this.waveCleanedCount;

    this.cleanProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < visibleWaveCount);
    });

    if (this.missionCountEl) {
      this.missionCountEl.textContent = `${this.totalCleanedCount}/${GAME_CONFIG.totalGoal}`;
    }

    this.broomRangeEls?.forEach((bar, index) => {
      bar.classList.toggle("is-active", index === 0 || this.hasBroomUpgrade);
    });
  }
}
