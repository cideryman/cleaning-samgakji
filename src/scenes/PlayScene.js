const GAME_CONFIG = {
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
    this.touchTarget = null;
    this.activeTouchId = null;
    this.canSweep = true;
    this.audioContext = null;
  }

  create() {
    this.cleanProgressEls = Array.from(document.querySelectorAll("#cleanProgress span"));
    this.missionCountEl = document.querySelector("#missionCount");
    this.broomRangeEls = Array.from(document.querySelectorAll("#broomStatus img"));
    this.sweepButton = document.querySelector("#sweepButton");
    this.fullscreenButton = document.querySelector("#fullscreenButton");
    this.completeOverlay = document.querySelector("#completeOverlay");
    this.restartButton = document.querySelector("#restartButton");
    this.restartHandler = () => this.restartGame();
    this.sweepHandler = (event) => {
      event?.preventDefault();
      this.trySweep();
    };
    this.fullscreenHandler = (event) => this.toggleFullscreen(event);
    this.restartButton?.addEventListener("click", this.restartHandler);
    this.sweepButton?.addEventListener("click", this.sweepHandler);
    this.fullscreenButton?.addEventListener("click", this.fullscreenHandler);
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.restartButton?.removeEventListener("click", this.restartHandler);
      this.sweepButton?.removeEventListener("click", this.sweepHandler);
      this.fullscreenButton?.removeEventListener("click", this.fullscreenHandler);
    });

    this.createMap();
    this.createPlayer();
    this.trashSlimes = this.physics.add.staticGroup();
    this.spawnTrashWave();
    this.createInput();
    this.updateHud();

    this.physics.add.collider(this.player, this.walls);
  }

  update() {
    this.handleMovement();
  }

  createMap() {
    this.add.rectangle(384, 240, 768, 480, 0x9acb87);
    this.add.rectangle(384, 228, 640, 112, 0xd8c59a);
    this.add.rectangle(548, 306, 96, 168, 0xd8c59a);
    this.add.rectangle(548, 314, 280, 180, 0xc6e2a3);
    this.add.rectangle(548, 314, 252, 152, 0xb2d18d);

    this.walls = this.physics.add.staticGroup();
    this.addWall(384, 28, 768, 56);
    this.addWall(384, 452, 768, 56);
    this.addWall(28, 240, 56, 480);
    this.addWall(740, 240, 56, 480);
    this.addWall(254, 118, 220, 40);
    this.addWall(240, 376, 140, 40);
  }

  addWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0x6c7a55);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(108, 224, "player");
    this.player.setDisplaySize(GAME_CONFIG.playerDisplaySize, GAME_CONFIG.playerDisplaySize);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(72, 76);
    this.player.body.setOffset(28, 30);
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
      { left: 126, right: 708, top: 202, bottom: 264 },
      { left: 126, right: 708, top: 294, bottom: 418 },
      { left: 454, right: 676, top: 244, bottom: 392 },
      { left: 126, right: 708, top: 104, bottom: 164 },
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
      { left: 180, right: 424, top: 118, bottom: 168 },
      { left: 206, right: 394, top: 334, bottom: 426 },
      { left: 82, right: 132, top: 78, bottom: 428 },
      { left: 716, right: 742, top: 78, bottom: 428 },
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

    this.input.on("pointerdown", (pointer) => this.startTouchMove(pointer));
    this.input.on("pointermove", (pointer) => this.updateTouchMove(pointer));
    this.input.on("pointerup", (pointer) => this.stopTouchMove(pointer));
    this.input.on("pointerupoutside", (pointer) => this.stopTouchMove(pointer));
  }

  handleMovement() {
    let horizontal =
      Number(this.cursors.right.isDown || this.keys.right.isDown) -
      Number(this.cursors.left.isDown || this.keys.left.isDown);
    let vertical =
      Number(this.cursors.down.isDown || this.keys.down.isDown) -
      Number(this.cursors.up.isDown || this.keys.up.isDown);

    const velocity = new Phaser.Math.Vector2(horizontal, vertical);
    if (velocity.lengthSq() === 0 && this.touchTarget) {
      const touchVector = new Phaser.Math.Vector2(
        this.touchTarget.x - this.player.x,
        this.touchTarget.y - this.player.y,
      );

      if (touchVector.length() > 18) {
        touchVector.normalize();
        horizontal = touchVector.x;
        vertical = touchVector.y;
        velocity.set(horizontal, vertical);
      }
    }

    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.lastDirection.copy(velocity);
    }

    this.player.setVelocity(
      velocity.x * GAME_CONFIG.playerSpeed,
      velocity.y * GAME_CONFIG.playerSpeed,
    );
  }

  startTouchMove(pointer) {
    if (this.isMissionComplete || !this.isTouchPointer(pointer)) return;

    this.activeTouchId = pointer.id;
    this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
  }

  updateTouchMove(pointer) {
    if (this.activeTouchId !== pointer.id || !this.touchTarget) return;

    this.touchTarget.set(pointer.x, pointer.y);
  }

  stopTouchMove(pointer) {
    if (this.activeTouchId !== pointer.id) return;

    this.activeTouchId = null;
    this.touchTarget = null;
  }

  isTouchPointer(pointer) {
    return pointer?.event?.pointerType === "touch" || this.sys.game.device.input.touch;
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

    const item = this.physics.add.sprite(548, 314, "broom_item");
    item.setDisplaySize(GAME_CONFIG.broomItemDisplaySize, GAME_CONFIG.broomItemDisplaySize);
    item.body.setSize(78, 78);
    item.body.setOffset(25, 25);
    item.setImmovable(true);
    item.setDepth(4);
    item.setAlpha(0);
    const itemScale = item.scaleX;
    item.setScale(itemScale * 0.35);

    for (let i = 0; i < 18; i += 1) {
      const sparkle = this.add.circle(548, 314, Phaser.Math.Between(3, 6), 0xfff3a3, 1);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: 548 + Phaser.Math.Between(-58, 58),
        y: 314 + Phaser.Math.Between(-48, 48),
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
      y: 300,
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
      [488, 270],
      [548, 260],
      [608, 274],
      [504, 324],
      [582, 320],
      [654, 334],
      [520, 382],
      [598, 372],
      [672, 390],
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
        Phaser.Math.Between(456, 684),
        Phaser.Math.Between(252, 398),
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

    const pulse = this.add.rectangle(548, 314, 280, 180, 0xfff3a3, 0.18);
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
      return;
    }

    if (target.requestFullscreen) {
      target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    }
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
