import { GAME_CONFIG } from "../config/GameConstants.js";
import { isNear } from "../utils/distance.js";

export default class InteractionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  handlePrimaryAction() {
    const scene = this.scene;
    if (!scene.stateManager?.canInteract()) return;

    if (scene.tryDepositNearestRecycleBin()) return;

    if (this.isPlayerNearHospitalDoor() && !scene.isInDialogue) {
      scene.handleHospitalInteraction();
      return;
    }

    if (this.isPlayerNearPharmacyDoor() && !scene.isInDialogue) {
      scene.handlePharmacyInteraction();
      return;
    }

    if (this.shouldPrioritizeSunisuniDialogue()) {
      scene.handleSunisuniInteraction();
      return;
    }

    if (scene.hasTrashInSweepRange()) {
      scene.trySweep();
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
    return isNear(scene.player, scene.jjookNpc, 120);
  }

  shouldPrioritizeJjookDialogue() {
    const scene = this.scene;
    return !scene.isInDialogue
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
    return Phaser.Math.Distance.Between(
      scene.player.x,
      scene.player.y,
      GAME_CONFIG.hospitalDoor.x,
      GAME_CONFIG.hospitalDoor.y,
    ) < 155;
  }

  isPlayerNearPharmacyDoor() {
    const scene = this.scene;
    if (!scene.player || !["going_pharmacy", "quest_complete"].includes(scene.sunisuniQuestState)) return false;
    return Phaser.Math.Distance.Between(
      scene.player.x,
      scene.player.y,
      GAME_CONFIG.pharmacyDoor.x,
      GAME_CONFIG.pharmacyDoor.y,
    ) < 155;
  }

  isPlayerNearVendingMachine() {
    const scene = this.scene;
    if (!scene.player || !scene.vendingMachine) return false;

    const dx = Math.abs(scene.player.x - scene.vendingMachine.x);
    const dy = Math.abs(scene.player.y - (scene.vendingMachine.y + 6));
    return dx <= 82 && dy <= 74;
  }

  isPlayerNearYebiNpc() {
    const scene = this.scene;
    return isNear(scene.player, scene.yebiNpc, 120);
  }
}
