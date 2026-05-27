export const QuestState = {
  LOCKED: "locked",
  UNLOCKED: "unlocked",
  READY: "ready",
  ACTIVE: "active",
  COMPLETED: "completed",
};

export const JjookQuestState = {
  LOCKED: QuestState.LOCKED,
  WALLET_MISSING: "wallet_missing",
  WALLET_FOUND: "wallet_found",
  COMPLETED: QuestState.COMPLETED,
};

export const CanQuestState = {
  INACTIVE: "inactive",
  ACTIVE: QuestState.ACTIVE,
  COMPLETED: QuestState.COMPLETED,
};

export const SunisuniQuestState = {
  LOCKED: QuestState.LOCKED,
  FOUND: "sunisuni_found",
  GOING_HOSPITAL: "going_hospital",
  GOING_PHARMACY: "going_pharmacy",
  QUEST_COMPLETE: "quest_complete",
};

export const ClothesQuestState = {
  LOCKED: QuestState.LOCKED,
  READY: QuestState.READY,
  DECLINED: "declined",
  SHOPPING: "shopping",
  COMPLETED: QuestState.COMPLETED,
};

export const PackingQuestState = {
  LOCKED: QuestState.LOCKED,
  OFFERED: "offered",
  DECLINED: "declined",
  GOING_BUS_STOP: "going_bus_stop",
  BOARDING_BUS: "boarding_bus",
  TRAVELING_HOME: "traveling_home",
  COMPLETED: QuestState.COMPLETED,
  ENDING_COMPLETE: "ending_complete",
};

export const RecycleQuestState = {
  LOCKED: QuestState.LOCKED,
  UNLOCKED: QuestState.UNLOCKED,
  ACTIVE: QuestState.ACTIVE,
  COMPLETED: QuestState.COMPLETED,
};
