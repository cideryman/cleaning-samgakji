import { GAME_CONFIG, PLAYER_TEXTURES, PLAYER_WALK_ANIMS } from "../config/GameConstants.js";

export default class PlayerController {
  constructor(scene) {
    this.scene = scene;
    this.movePath = [];
    this.currentPathIndex = 0;
    this.cleanTarget = null;
    this.interactionTarget = null;
  }

  createInput() {
    const scene = this.scene;
    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sweep: Phaser.Input.Keyboard.KeyCodes.SPACE,
      specialEnter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      devMoney: Phaser.Input.Keyboard.KeyCodes.F2,
      devTrash: Phaser.Input.Keyboard.KeyCodes.F3,
      devNextQuest: Phaser.Input.Keyboard.KeyCodes.F4,
    });

    scene.keys.sweep.on("down", () => scene.handleSpaceAction());
    scene.keys.specialEnter.on("down", () => {
      if (scene.clothingShopModal) {
        scene.selectFocusedClothingShopOption();
        return;
      }
      if (scene.packingModal) {
        scene.selectFocusedPackingOption();
        return;
      }
      if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
      scene.useYebiItem();
    });
    scene.input.on("pointerdown", (pointer, currentlyOver = []) => this.handleMouseMovePointerDown(pointer, currentlyOver));
    scene.input.on("pointermove", (pointer) => this.handleMouseMovePointerMove(pointer));
    scene.input.on("pointerup", (pointer) => this.handleMouseMovePointerUp(pointer));
    scene.input.on("pointerupoutside", (pointer) => this.handleMouseMovePointerUp(pointer));
  }

  update() {
    const scene = this.scene;
    if (!scene.player) return;

    if (
      !scene.stateManager?.canMove()
      || scene.isMissionComplete
      || scene.isInDialogue
      || scene.vendingMenuGroup
      || scene.clothingShopModal
      || scene.packingModal
      || scene.interiorSceneGroup
    ) {
      scene.player.setVelocity(0, 0);
      scene.mouseMoveTarget = null;
      scene.isMouseMoveHeld = false;
      return;
    }

    const keyboardHorizontal =
      Number(scene.cursors.right.isDown || scene.keys.right.isDown) -
      Number(scene.cursors.left.isDown || scene.keys.left.isDown);
    const keyboardVertical =
      Number(scene.cursors.down.isDown || scene.keys.down.isDown) -
      Number(scene.cursors.up.isDown || scene.keys.up.isDown);
    const isKeyboardMoving = keyboardHorizontal !== 0 || keyboardVertical !== 0;

    let horizontal = keyboardHorizontal;
    let vertical = keyboardVertical;

    if (horizontal === 0 && vertical === 0 && scene.joystickVector.lengthSq() > 0) {
      horizontal = scene.joystickVector.x;
      vertical = scene.joystickVector.y;
    }

    const velocity = new Phaser.Math.Vector2(horizontal, vertical);
    if (velocity.lengthSq() > 0) {
      scene.mouseMoveTarget = null;
      scene.isMouseMoveHeld = false;
      this.movePath = [];
      this.cleanTarget = null; // keyboard input overrides auto clean target!
      this.interactionTarget = null;
    } else {
      // 실시간 거리 체크로 청소 사정거리 내 진입 시 자동 정지 및 쓸기 트리거
      if (this.cleanTarget && this.cleanTarget.active && !this.cleanTarget.getData("cleaned")) {
        const dist = Math.hypot(this.cleanTarget.x - scene.player.x, this.cleanTarget.y - scene.player.y);
        if (dist <= 62) {
          this.movePath = [];
          scene.player.setVelocity(0, 0);
          this.autoSweepCleanTarget();
        }
      }

      if (scene.mouseMoveTarget && !isKeyboardMoving) {
        this.movePath = []; // Clear A* path when actively dragging
        const dx = scene.mouseMoveTarget.x - scene.player.x;
        const dy = scene.mouseMoveTarget.y - scene.player.y;
        if (Math.hypot(dx, dy) <= 10) {
          scene.mouseMoveTarget = null;
        } else {
          velocity.set(dx, dy);
        }
      } else if (this.movePath && this.movePath.length > 0 && !isKeyboardMoving) {
        // Follow the A* path waypoints
        const targetPoint = this.movePath[this.currentPathIndex];
        if (targetPoint) {
          const dx = targetPoint.x - scene.player.x;
          const dy = targetPoint.y - scene.player.y;
          const distance = Math.hypot(dx, dy);

          if (distance <= 12) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.movePath.length) {
              this.movePath = [];
              scene.player.setVelocity(0, 0);
              // A* 주행이 완전히 끝난 시점에 거리 미진입 등으로 남아있던 타겟 자동 청소 최종 확인 트리거!
              if (this.cleanTarget && this.cleanTarget.active && !this.cleanTarget.getData("cleaned")) {
                this.autoSweepCleanTarget();
              }
              if (this.interactionTarget) {
                this.autoTriggerInteractionTarget();
              }
            }
          } else {
            velocity.set(dx, dy);
          }
        }
      }
    }

    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      scene.lastDirection.copy(velocity);
      if (!scene.isSweeping) {
        this.updatePlayerDirection(velocity, true);
      }
    } else {
      if (!scene.isSweeping) {
        this.stopWalkAnimation();
      }
    }

    const speed = this.getPlayerSpeed();
    scene.player.setVelocity(velocity.x * speed, velocity.y * speed);
  }

  handleMouseMovePointerDown(pointer, currentlyOver = []) {
    const scene = this.scene;
    const button = pointer.event?.button ?? pointer.button;
    const pointerType = pointer.event?.pointerType || pointer.pointerType || "mouse";
    if (pointerType !== "mouse" || button !== 0) return;
    if (!scene.player?.active || scene.sceneControlSystem?.isWorldInputBlocked()) return;
    if (!scene.stateManager?.canMove()) return;
    if (scene.isMissionComplete || scene.isInDialogue || scene.vendingMenuGroup || scene.clothingShopModal || scene.packingModal || scene.interiorSceneGroup) return;
    if (currentlyOver.length > 0) return;

    const worldPoint = pointer.positionToCamera(scene.cameras.main);
    scene.mouseMoveTarget = { x: worldPoint.x, y: worldPoint.y };
    scene.isMouseMoveHeld = true;
    scene.mouseMoveStartTime = scene.time.now;
  }

  handleMouseMovePointerMove(pointer) {
    const scene = this.scene;
    if (!scene.isMouseMoveHeld) return;
    if (!scene.player?.active || scene.sceneControlSystem?.isWorldInputBlocked()) {
      scene.isMouseMoveHeld = false;
      scene.mouseMoveTarget = null;
      return;
    }
    if (scene.isMissionComplete || scene.isInDialogue || scene.vendingMenuGroup || scene.clothingShopModal || scene.packingModal || scene.interiorSceneGroup) {
      scene.isMouseMoveHeld = false;
      scene.mouseMoveTarget = null;
      return;
    }

    const worldPoint = pointer.positionToCamera(scene.cameras.main);
    scene.mouseMoveTarget = { x: worldPoint.x, y: worldPoint.y };
  }

  handleMouseMovePointerUp(pointer) {
    const scene = this.scene;
    const button = pointer.event?.button ?? pointer.button;
    const pointerType = pointer.event?.pointerType || pointer.pointerType || "mouse";
    if (pointerType !== "mouse" || button !== 0) return;
    if (!scene.isMouseMoveHeld) return;

    scene.isMouseMoveHeld = false;
    const duration = scene.time.now - scene.mouseMoveStartTime;
    if (duration > 200) {
      // Drag mode released, stop moving immediately
      scene.mouseMoveTarget = null;
      this.movePath = [];
    } else {
      // Tap/Click mode, calculate A* Path
      if (scene.pathfindingSystem) {
        const worldPoint = pointer.positionToCamera(scene.cameras.main);
        const path = scene.pathfindingSystem.findPath(scene.player.x, scene.player.y, worldPoint.x, worldPoint.y);
        if (path && path.length > 0) {
          this.movePath = path;
          this.currentPathIndex = 0;
          scene.mouseMoveTarget = null; // Unset drag target
        } else {
          this.movePath = [];
          scene.mouseMoveTarget = null;
        }
      } else {
        // Fallback to direct straight line if pathfinding isn't ready
        const worldPoint = pointer.positionToCamera(scene.cameras.main);
        scene.mouseMoveTarget = { x: worldPoint.x, y: worldPoint.y };
        this.movePath = [];
      }
    }
  }

  getPlayerSpeed() {
    const scene = this.scene;
    return scene.isSpeedBuffActive
      ? GAME_CONFIG.playerSpeed * GAME_CONFIG.speedBuffMultiplier
      : GAME_CONFIG.playerSpeed;
  }

  updatePlayerDirection(velocity, isMoving = false) {
    const scene = this.scene;
    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      this.setPlayerDirectionTexture(velocity.x < 0 ? "left" : "right", isMoving);
      scene.player.clearTint();
      return;
    }

    scene.player.setFlipX(false);
    if (velocity.y < 0) {
      this.setPlayerDirectionTexture("up", isMoving);
    } else {
      this.setPlayerDirectionTexture("down", isMoving);
    }
    scene.player.clearTint();
  }

  setPlayerDirectionTexture(directionKey, isMoving = false) {
    const scene = this.scene;
    const textureKey = PLAYER_TEXTURES[directionKey] || PLAYER_TEXTURES.down;
    if (!scene.textures.exists(textureKey)) return;

    const shouldChangeTexture = scene.playerDirectionKey !== directionKey || scene.player.texture.key !== textureKey;
    scene.playerDirectionKey = directionKey;
    if (shouldChangeTexture) {
      scene.player.setTexture(textureKey, 1);
    }
    scene.player.setDisplaySize(GAME_CONFIG.playerDisplayWidth, GAME_CONFIG.playerDisplayHeight);
    scene.playerBaseScale = { x: scene.player.scaleX, y: scene.player.scaleY };
    scene.player.setFlipX(false);

    const animKey = PLAYER_WALK_ANIMS[directionKey];
    if (isMoving && animKey && scene.anims.exists(animKey)) {
      scene.player.anims.play(animKey, true);
    } else {
      scene.player.anims.stop();
      if (scene.player.anims.currentFrame) {
        scene.player.setFrame(1);
      }
    }
  }

  stopWalkAnimation() {
    const scene = this.scene;
    if (!scene.player?.anims) return;

    scene.player.anims.stop();
    if (scene.player.anims.currentFrame) {
      scene.player.setFrame(1);
    }
  }

  startFloatingJoystick(event) {
    const scene = this.scene;
    if (scene.registry.get("joystickEnabled") === false) return;
    if (scene.isMissionComplete || scene.activeJoystickPointerId !== null) return;
    if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
    if (!this.isJoystickStartEvent(event)) return;

    event.preventDefault();
    scene.activeJoystickPointerId = event.pointerId;
    scene.joystickBase = { x: event.clientX, y: event.clientY };
    this.showJoystick(event.clientX, event.clientY);
    this.updateJoystick(event);
  }

  isJoystickStartEvent(event) {
    if (event.pointerType === "mouse") return false;
    if (event.clientX > window.innerWidth / 2) return false;

    const blockedTarget = event.target.closest?.(
      "#sweepButton, #specialButton, #fullscreenButton, #restartButton, .touch-controls, .game-header, .complete-overlay, .clothing-shop-modal, .packing-modal",
    );
    return !blockedTarget;
  }

  updateJoystick(event) {
    const scene = this.scene;
    if (scene.activeJoystickPointerId !== event.pointerId || !scene.movePad) return;

    event.preventDefault();
    const radius = GAME_CONFIG.joystickRadius;
    const dx = event.clientX - scene.joystickBase.x;
    const dy = event.clientY - scene.joystickBase.y;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;

    scene.joystickVector.set(knobX / radius, knobY / radius);
    scene.movePad.style.left = `${event.clientX}px`;
    scene.movePad.style.top = `${event.clientY}px`;
    scene.moveKnob.style.transform = "translate(-50%, -50%)";
  }

  stopJoystick(event) {
    const scene = this.scene;
    if (scene.activeJoystickPointerId !== event.pointerId) return;

    event.preventDefault();
    scene.activeJoystickPointerId = null;
    scene.joystickVector.set(0, 0);
    this.hideJoystick();
  }

  showJoystick(x, y) {
    const scene = this.scene;
    if (!scene.movePad || !scene.moveKnob) return;

    scene.movePad.style.left = `${x}px`;
    scene.movePad.style.top = `${y}px`;
    scene.movePad.classList.add("is-visible");
    scene.movePad.setAttribute("aria-hidden", "false");
    scene.moveKnob.style.transform = "translate(-50%, -50%)";
  }

  hideJoystick() {
    const scene = this.scene;
    if (!scene.movePad) return;

    scene.movePad.classList.remove("is-visible");
    scene.movePad.setAttribute("aria-hidden", "true");
    if (scene.moveKnob) {
      scene.moveKnob.style.transform = "translate(-50%, -50%)";
    }
  }

  setCleanTarget(slime) {
    const scene = this.scene;
    if (!slime || !slime.active || slime.getData("cleaned")) {
      this.cleanTarget = null;
      return;
    }

    // A* 알고리즘으로 슬라임 근처까지의 경로 계산
    if (scene.pathfindingSystem) {
      const path = scene.pathfindingSystem.findPath(scene.player.x, scene.player.y, slime.x, slime.y);
      if (path && path.length > 0) {
        this.movePath = path;
        this.currentPathIndex = 0;
        this.cleanTarget = slime;
        scene.mouseMoveTarget = null; // 드래그 타겟 무효화
      }
    }
  }

  autoSweepCleanTarget() {
    const scene = this.scene;
    const target = this.cleanTarget;
    this.cleanTarget = null; // target clear

    if (!target || !target.active || target.getData("cleaned")) return;

    // 1. 타겟 방향으로 플레이어가 쳐다보도록 방향 보정!
    const dx = target.x - scene.player.x;
    const dy = target.y - scene.player.y;
    let dirKey = "down";
    if (Math.abs(dx) > Math.abs(dy)) {
      dirKey = dx < 0 ? "left" : "right";
      scene.lastDirection.set(dx < 0 ? -1 : 1, 0);
    } else {
      dirKey = dy < 0 ? "up" : "down";
      scene.lastDirection.set(0, dy < 0 ? -1 : 1);
    }
    
    this.setPlayerDirectionTexture(dirKey, false);

    // 2. 쓸기 실행!
    scene.cleaningSystem?.trySweep();
  }

  cancelMoveTarget() {
    const scene = this.scene;
    scene.mouseMoveTarget = null;
    scene.isMouseMoveHeld = false;
    this.movePath = [];
    this.currentPathIndex = 0;
    this.cleanTarget = null;
    this.interactionTarget = null;
  }

  autoTriggerInteractionTarget() {
    const scene = this.scene;
    const target = this.interactionTarget;
    this.interactionTarget = null;

    if (!target) return;

    if (target === "hospital" && scene.interactionSystem?.isPlayerNearHospitalDoor()) {
      scene.handleHospitalInteraction();
    } else if (target === "pharmacy" && scene.interactionSystem?.isPlayerNearPharmacyDoor()) {
      scene.handlePharmacyInteraction();
    } else if (target === "clothing_store" && scene.interactionSystem?.isPlayerNearClothingStoreDoor()) {
      scene.handleClothingStoreInteraction();
    } else if (target === "vending" && scene.interactionSystem?.isPlayerNearVendingMachine()) {
      scene.handleVendingMachineInteraction();
    } else if (target.startsWith("bin_")) {
      const type = target.replace("bin_", "");
      const binData = scene.recycleBins?.find(b => b.type === type);
      scene.yebiQuestSystem?.depositRecycleItem(type, binData?.bin);
    }
  }
}
