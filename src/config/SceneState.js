export const SceneState = {
  PLAYING: "playing",
  TALKING: "talking",
  CLEANING: "cleaning",
  CUTSCENE: "cutscene",
  SHOP: "shop",
  MENU: "menu",
};

export class StateManager {
  constructor(initialState = SceneState.PLAYING) {
    this.current = initialState;
  }

  set(state) {
    this.current = state;
  }

  is(state) {
    return this.current === state;
  }

  isPlaying() {
    return this.current === SceneState.PLAYING;
  }

  isTalking() {
    return this.current === SceneState.TALKING;
  }

  canMove() {
    return this.current === SceneState.PLAYING || this.current === SceneState.CLEANING;
  }

  canInteract() {
    return this.current === SceneState.PLAYING;
  }
}
