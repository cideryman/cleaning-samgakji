import { GAME_CONFIG } from "../config/GameConstants.js";
import { isNear } from "../utils/distance.js";

export default class InteractionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  handlePrimaryAction() {
    const scene = this.scene;
    if (scene.isWorldInputBlocked?.()) return;
    if (!scene.stateManager?.canInteract()) return;

    if (scene.hasTrashInSweepRange()) {
      scene.trySweep();
      return;
    }

    if (scene.tryDepositNearestRecycleBin()) return;

    if (this.isPlayerNearHospitalDoor() && !scene.isInDialogue) {
      scene.handleHospitalInteraction();
      return;
    }

    if (this.isPlayerNearPharmacyDoor() && !scene.isInDialogue) {
      scene.handlePharmacyInteraction();
      return;
    }

    if (this.isPlayerNearClothingStoreDoor() && !scene.isInDialogue) {
      scene.handleClothingStoreInteraction();
      return;
    }

    if (this.shouldPrioritizeSunisuniDialogue()) {
      scene.handleSunisuniInteraction();
      return;
    }

    if (this.shouldPrioritizeJjookDialogue()) {
      scene.handleJjookInteraction();
      return;
    }

    if (this.isPlayerNearVendingMachine() && !scene.isInDialogue) {
      scene.handleVendingMachineInteraction();
      return;
    }

    if (this.isPlayerNearJjookNpc() && !scene.isInDialogue) {
      scene.handleJjookInteraction();
      return;
    }

    if (this.isPlayerNearYebiNpc() && !scene.isInDialogue) {
      scene.showYebiQuestDialogue();
      return;
    }

    scene.trySweep();
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
}
