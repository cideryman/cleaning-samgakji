import { GAME_CONFIG } from "../config/GameConstants.js";
import { isNear } from "../utils/distance.js";

export default class InteractionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  handlePrimaryAction() {
    const scene = this.scene;
    if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
    if (!scene.stateManager?.canInteract()) return;

    if (this.handlePriorityLocationInteraction()) return;

    if (this.isAnyTrashNearPlayer(88)) {
      scene.trySweep();
      return;
    }

    if (scene.tryDepositNearestRecycleBin()) return;

    scene.trySweep();
  }

  handlePriorityLocationInteraction() {
    const scene = this.scene;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.()) return false;

    if (this.isPlayerNearHospitalDoor()) {
      scene.handleHospitalInteraction();
      return true;
    }

    if (this.isPlayerNearPharmacyDoor()) {
      scene.handlePharmacyInteraction();
      return true;
    }

    if (this.isPlayerNearClothingStoreDoor()) {
      scene.handleClothingStoreInteraction();
      return true;
    }

    return false;
  }

  isPlayerNearJjookNpc() {
    const scene = this.scene;
    if (scene.isJjookFollowActive) return false;
    return isNear(scene.player, scene.jjookNpc, 120);
  }

  shouldPrioritizeJjookDialogue() {
    const scene = this.scene;
    return !scene.isInDialogue
      && !scene.isJjookFollowActive
      && scene.jjookQuestState !== "locked"
      && scene.jjookQuestState !== "completed"
      && this.isPlayerNearJjookNpc();
  }

  isPlayerNearSunisuniNpc() {
    const scene = this.scene;
    if (!scene.player || !scene.sunisuniNpc?.active || !scene.sunisuniNpc.visible) return false;
    return isNear(scene.player, scene.sunisuniNpc, 120);
  }

  shouldPrioritizeSunisuniDialogue() {
    const scene = this.scene;
    return !scene.isInDialogue
      && scene.sunisuniQuestState !== "locked"
      && scene.sunisuniQuestState !== "quest_complete"
      && this.isPlayerNearSunisuniNpc();
  }

  isPlayerNearHospitalDoor() {
    const scene = this.scene;
    if (!scene.player || !["going_hospital", "quest_complete"].includes(scene.sunisuniQuestState)) return false;
    const door = scene.getMapPoint?.("hospital_door", GAME_CONFIG.hospitalDoor) || GAME_CONFIG.hospitalDoor;
    const dx = Math.abs(scene.player.x - door.x);
    const dy = Math.abs(scene.player.y - door.y);
    return dx <= 72 && dy <= 56;
  }

  isPlayerNearPharmacyDoor() {
    const scene = this.scene;
    if (!scene.player || !["going_pharmacy", "quest_complete"].includes(scene.sunisuniQuestState)) return false;
    const door = scene.getMapPoint?.("pharmacy_door", GAME_CONFIG.pharmacyDoor) || GAME_CONFIG.pharmacyDoor;
    const dx = Math.abs(scene.player.x - door.x);
    const dy = Math.abs(scene.player.y - door.y);
    return dx <= 68 && dy <= 54;
  }

  isPlayerNearClothingStoreDoor() {
    const scene = this.scene;
    if (!scene.player || !["shopping", "completed"].includes(scene.clothesQuestState)) return false;
    const door = scene.getMapPoint?.("clothing_store_door", GAME_CONFIG.clothingStoreDoor) || GAME_CONFIG.clothingStoreDoor;
    const dx = Math.abs(scene.player.x - door.x);
    const dy = Math.abs(scene.player.y - door.y);
    return dx <= 78 && dy <= 58;
  }

  isPlayerNearVendingMachine() {
    const scene = this.scene;
    if (!scene.player || !scene.vendingMachine) return false;

    const usePoint = scene.getMapPoint?.("vending_use", {
      x: scene.vendingMachine.x,
      y: scene.vendingMachine.y + 6,
    }) || { x: scene.vendingMachine.x, y: scene.vendingMachine.y + 6 };
    const dx = Math.abs(scene.player.x - usePoint.x);
    const dy = Math.abs(scene.player.y - usePoint.y);
    return dx <= 82 && dy <= 74;
  }

  isPlayerNearYebiNpc() {
    const scene = this.scene;
    return isNear(scene.player, scene.yebiNpc, 120);
  }

  isAnyTrashNearPlayer(maxDistance = 88) {
    const scene = this.scene;
    if (!scene.player || !scene.trashSlimes) return false;

    let near = false;
    scene.trashSlimes.getChildren().forEach((slime) => {
      if (slime.active && !slime.getData("cleaned")) {
        const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, slime.x, slime.y);
        if (dist <= maxDistance) {
          near = true;
        }
      }
    });
    return near;
  }
}
