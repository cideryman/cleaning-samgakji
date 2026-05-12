class QuestManager {
  constructor(scene) {
    this.scene = scene;
    this.activeQuest = null;
    this.quests = {
      chapter1: { type: "money", target: 5000, current: 0, reward: 0, isComplete: false },
      chapter2: { type: "contract", dailyTarget: 5, dailyProgress: 0, contractDays: 7, rewardPerSlime: 500 }
    };
  }
  
  startContract(contractData) {
    // 계약서 UI 표시하고 동의하면 활성화
    this.activeQuest = { ...contractData, progress: 0 };
    this.scene.showContractModal(contractData, () => this.acceptContract());
  }
  
  acceptContract() {
    this.scene.isContractActive = true;
    // 슬라임 스폰 시작 등
  }
  
  updateProgress(amount) {
    if (this.activeQuest) {
      this.activeQuest.progress += amount;
      if (this.activeQuest.progress >= this.activeQuest.target) {
        this.completeQuest();
      }
    }
  }
}