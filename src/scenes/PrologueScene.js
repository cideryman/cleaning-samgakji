import DialogueSystem from "../systems/DialogueSystem.js";
import PortraitManager from "../systems/PortraitManager.js";

const BACKGROUND_EDGE_COLORS = {
  prologue_room_messy: "#705e52",
  prologue_room_window: "#2b2b2e",
  prologue_desk: "#683f1f",
  prologue_travel: "#4c4744",
  prologue_entrance: "#473e2a",
};

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super("PrologueScene");
    this.dialogueSystem = null;
    this.portraitManager = null;
    this.background = null;
    this.currentBgm = null;
    this.isTransitioningToGame = false;
  }

  create() {
    document.body.classList.add("start-screen");
    document.body.classList.add("prologue-scene-active");
    this.dialogueSystem = new DialogueSystem(this);
    this.portraitManager = new PortraitManager(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.showRoomOpening();
  }

  showRoomOpening() {
    this.setBackground("prologue_room_messy");
    this.playBgm("prologue_room_bgm", 0.22);

    this.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_sleepy_phone", text: "여름 방학이다..." },
      { name: "해냄이", portraitKey: "haenaem_dazed", text: "오늘은 아무것도 안 하고 쉬고 싶었는데..." },
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "어? 전화 왔다." },
    ], () => this.showFriendCall());
  }

  showFriendCall() {
    this.setBackground("prologue_room_window");
    this.playBgm("prologue_summer_bgm", 0.24);

    this.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "해냄아! 다음 주에 서울 여행 갈래?" },
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "경복궁도 가고, 놀이공원도 가자. 여름 방학이잖아!" },
      { name: "해냄이", portraitKey: "haenaem_phone", text: "좋아! 나도 갈래. 생각만 해도 신난다!" },
      { name: "쭉쭉이", portraitKey: "jjook_playful", text: "그럼 간식 살 돈도 조금 챙겨 와. 여행은 준비가 중요하지!" },
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "앗... 그러고 보니 내 돈이 얼마나 있었지?" },
    ], () => this.showWalletCheck());
  }

  showWalletCheck() {
    this.setBackground("prologue_desk");

    this.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_confused", text: "지갑을 열어보니..." },
      { name: "해냄이", portraitKey: "haenaem_sweat", text: "2,300원..." },
      { name: "해냄이", portraitKey: "haenaem_confused", text: "서울 여행을 가기엔 너무 부족한데?" },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "엄마한테 한번 말해봐야겠다." },
    ], () => this.showMotherCall());
  }

  showMotherCall() {
    this.setBackground("prologue_room_window");

    this.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_worried", text: "해냄아, 목소리가 왜 그래? 무슨 일 있어?" },
      { name: "해냄이", portraitKey: "haenaem_phone", text: "쭉쭉이가 서울 여행 가자고 했는데... 돈이 부족해." },
      { name: "엄마", portraitKey: "mother_calm", text: "그랬구나. 그럼 좋은 방법이 있어." },
      { name: "엄마", portraitKey: "mother_calm", text: "엄마가 맡은 삼각지 근처가 요즘 조금 지저분하더라." },
      { name: "엄마", portraitKey: "mother_smile", text: "네가 청소를 도와주면 용돈처럼 청소 수당을 줄게. 해볼래?" },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "좋아. 내가 직접 벌어서 여행 준비할래!" },
    ], () => this.showTravel());
  }

  showTravel() {
    this.setBackground("prologue_travel");

    this.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_touched", text: "버스를 타고 삼각지로 가는 길." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "처음 해보는 일이지만, 하나씩 해보면 될 거야." },
    ], () => this.showArrival());
  }

  showArrival() {
    this.setBackground("prologue_entrance");
    this.playBgm("prologue_park_bgm", 0.24);

    this.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_smile", text: "여기가 삼각지야. 작은 쓰레기부터 천천히 치워보자." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "응. 깨끗하게 만들고, 여행 돈도 모아볼게!" },
    ], () => this.startMainGame());
  }

  setBackground(textureKey) {
    const edgeColor = BACKGROUND_EDGE_COLORS[textureKey] || "#2b2b2e";
    this.cameras.main.setBackgroundColor(edgeColor);
    document.body.style.setProperty("--prologue-bg", edgeColor);

    this.background?.destroy();
    this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, textureKey);
    this.background.setDepth(0);
    this.fitToScreen(this.background);
  }

  fitToScreen(image) {
    const source = this.textures.get(image.texture.key).getSourceImage();
    const scale = Math.max(this.scale.width / source.width, this.scale.height / source.height);
    image.setScale(scale);
  }

  playBgm(key, volume) {
    if (this.registry.get("soundEnabled") === false) return;
    this.currentBgm?.stop();
    this.currentBgm?.destroy();
    this.currentBgm = this.sound.add(key, { loop: true, volume });
    this.currentBgm.play();
  }

  startMainGame() {
    if (this.isTransitioningToGame) return;

    this.isTransitioningToGame = true;
    this.cameras.main.fadeOut(900, 0, 0, 0);
    if (this.currentBgm) {
      this.tweens.add({
        targets: this.currentBgm,
        volume: 0,
        duration: 900,
        ease: "Sine.easeInOut",
      });
    }
    this.time.delayedCall(980, () => {
      this.cleanup();
      this.scene.start("PlayScene");
    });
  }

  handleDialogueLineChange(line) {
    this.portraitManager?.show(line);
  }

  handleDialogueClose() {
    this.portraitManager?.clear();
  }

  cleanup() {
    this.currentBgm?.stop();
    this.currentBgm?.destroy();
    this.currentBgm = null;
    document.body.classList.remove("prologue-scene-active");
    document.body.style.removeProperty("--prologue-bg");
    this.portraitManager?.destroy();
    this.portraitManager = null;
  }
}
