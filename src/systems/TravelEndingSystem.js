import { GAME_CONFIG } from "../config/GameConstants.js";
import { SceneState } from "../config/SceneState.js";
import { EXTERNAL_ASSETS } from "../config/AssetsData.js";

const TRAVEL_ALLOWANCE_REWARD = 20000;

export default class TravelEndingSystem {
  constructor(scene) {
    this.scene = scene;
    this.isFinalEndingStarting = false;
    this.isFinalEndingTransitioning = false;
    this.finalEndingLoadTimer = null;
  }

  getBusStopPoint() {
    return this.scene.getMapPoint("bus_stop", GAME_CONFIG.busStop);
  }

  createPermanentBusStopObjects() {
    const scene = this.scene;
    this.cleanupPermanentBusStopObjects();

    const stop = this.getBusStopPoint();
    if (!stop) return null;

    scene.permanentBusStopObjects = [];
    const waitingSpot = scene.add.ellipse(stop.x, stop.y + 42, 104, 32, 0xf7d96f, 0.26);
    waitingSpot.setStrokeStyle(2, 0x21352c, 0.32);
    waitingSpot.setDepth(scene.getWorldDepth(stop.y + 42, -0.35));
    scene.permanentBusStopObjects.push(waitingSpot);

    if (scene.mapObjects?.bus_stop_sign?.active) {
      const sign = scene.mapObjects.bus_stop_sign;
      sign.setDisplaySize(57, 108);
      sign.setDepth(scene.getWorldDepth(sign.y, 0.02));
    } else if (scene.textures.exists("bus_stop_sign")) {
      const sign = scene.add.image(stop.x - 58, stop.y + 32, "bus_stop_sign");
      sign.setOrigin(0.5, 1);
      sign.setDisplaySize(57, 108);
      sign.setDepth(scene.getWorldDepth(stop.y + 32, 0.02));
      scene.permanentBusStopObjects.push(sign);
    }

    return stop;
  }

  cleanupPermanentBusStopObjects() {
    const scene = this.scene;
    scene.permanentBusStopObjects?.forEach((object) => object?.destroy?.());
    scene.permanentBusStopObjects = [];
  }

  createBusStopObjects() {
    const scene = this.scene;
    this.cleanupBusStopSequence();

    if (!scene.permanentBusStopObjects?.length) {
      return this.createPermanentBusStopObjects();
    }

    return this.getBusStopPoint();
  }

  startBusStopBoardingSequence() {
    const scene = this.scene;
    const stop = this.createBusStopObjects();
    if (!stop) {
      this.startTravelHomeSequence();
      return;
    }

    scene.packingQuestState = "going_bus_stop";
    scene.stateManager?.set(SceneState.PLAYING);
    scene.saveCheckpoint("packing_bus_stop");
    scene.pauseNpcRoaming("jjook");
    scene.stopJjookIdleTween();
    scene.showQuestToast("직접 버스정류장으로 걸어가요.", 3600);
    scene.showSpeechBubble(scene.jjookNpc || scene.player, "뒤에서 따라갈게!", 2600);

    if (scene.jjookNpc?.active) {
      scene.isJjookBusEscortActive = true;
      scene.nextBusEscortWaitToastAt = 0;
      scene.tweens.killTweensOf(scene.jjookNpc);
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
    }
    this.updateQuestRouteGuide();
  }

  getBusArrivalPoint() {
    const stop = this.getBusStopPoint();
    return stop ? { x: stop.x - 20, y: stop.y + 52 } : null;
  }

  updateQuestRouteGuide() {
    this.scene.routeGuideSystem?.update();
  }

  updateBusRouteGuide() {
    this.updateQuestRouteGuide();
  }

  checkBusStopArrival() {
    const scene = this.scene;
    if (scene.packingQuestState !== "going_bus_stop" || scene.travelBus) return;
    if (!scene.player || scene.isInDialogue || scene.interiorSceneGroup) return;

    const stop = this.getBusStopPoint();
    const arrivalPoint = this.getBusArrivalPoint();
    if (!stop || !arrivalPoint) return;

    const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, arrivalPoint.x, arrivalPoint.y);
    if (distance > 78) return;

    if (scene.isJjookBusEscortActive && scene.jjookNpc?.active) {
      const jjookDistance = Phaser.Math.Distance.Between(
        scene.jjookNpc.x,
        scene.jjookNpc.y,
        arrivalPoint.x + 46,
        arrivalPoint.y,
      );
      if (jjookDistance > 64) {
        if (scene.time.now > scene.nextBusEscortWaitToastAt) {
          scene.showQuestToast("쭉쭉이를 기다렸다가 같이 버스를 타요.", 2600);
          scene.showSpeechBubble(scene.jjookNpc, "금방 갈게!", 1500);
          scene.nextBusEscortWaitToastAt = scene.time.now + 3200;
        }
        return;
      }
    }

    this.startBusArrivalSequence(stop);
  }

  startBusArrivalSequence(stop) {
    const scene = this.scene;
    if (!stop) {
      this.startTravelHomeSequence();
      return;
    }

    scene.packingQuestState = "boarding_bus";
    scene.isJjookBusEscortActive = false;
    scene.stateManager?.set(SceneState.CUTSCENE);
    scene.player?.setVelocity(0, 0);
    scene.playerController?.stopWalkAnimation?.();
    scene.pauseNpcRoaming("jjook");
    scene.showQuestToast("버스가 오고 있어요.", 3000);
    scene.showSpeechBubble(scene.jjookNpc || scene.player, "버스 온다!", 2200);

    const busY = stop.y - 14;
    const startX = stop.x - 840;
    const stopX = stop.x - 112;
    scene.travelBus = scene.add.sprite(startX, busY, "bus_right", 0);
    scene.travelBus.setOrigin(0.5, 0.5);
    scene.travelBus.setDisplaySize(244, 122);
    scene.travelBus.setDepth(scene.getWorldDepth(busY + 54, 0.2));
    if (scene.anims.exists("bus_right_drive")) {
      scene.travelBus.anims.play("bus_right_drive");
    }

    scene.tweens.add({
      targets: scene.travelBus,
      x: stopX,
      duration: 4200,
      ease: "Sine.easeOut",
      onUpdate: () => scene.travelBus?.setDepth(scene.getWorldDepth(busY + 54, 0.2)),
      onComplete: () => {
        scene.showQuestToast("버스가 도착했어요.", 1800);
        scene.travelBus?.anims?.stop();
        scene.travelBus?.setFrame(3);
        const pauseEvent = scene.time.delayedCall(1300, () => this.boardTravelBus());
        scene.travelBusSequenceEvents.push(pauseEvent);
      },
    });
  }

  boardTravelBus() {
    const scene = this.scene;
    document.body.classList.add("epilogue-scene-active");
    scene.showQuestToast("버스를 타고 집으로 가요.", 2600);
    scene.player?.setVisible(false);
    scene.jjookNpc?.setVisible(false);

    scene.cameras.main.fadeOut(650, 0, 0, 0);
    const transitionEvent = scene.time.delayedCall(700, () => {
      this.cleanupBusStopSequence();
      scene.player?.setVisible(true);
      scene.jjookNpc?.setVisible(true);
      scene.packingQuestState = "traveling_home";
      scene.stateManager?.set(SceneState.PLAYING);
      scene.cameras.main.fadeIn(420, 0, 0, 0);
      this.startTravelHomeSequence();
    });
    scene.travelBusSequenceEvents.push(transitionEvent);
  }

  cleanupBusStopSequence() {
    const scene = this.scene;
    scene.travelBusSequenceEvents?.forEach((event) => event?.remove?.(false));
    scene.travelBusSequenceEvents = [];
    scene.travelBusStopObjects?.forEach((object) => object?.destroy?.());
    scene.travelBusStopObjects = [];
    scene.routeGuideSystem?.destroy();
    scene.isJjookBusEscortActive = false;
    if (scene.travelBus) {
      scene.tweens.killTweensOf(scene.travelBus);
      scene.travelBus.destroy();
      scene.travelBus = null;
    }
  }

  transitionWithFade(nextSequenceCallback) {
    const scene = this.scene;
    scene.dialogueSystem.close?.();
    scene.cameras.main.fadeOut(850, 0, 0, 0);
    
    const onFadeOutComplete = () => {
      scene.cameras.main.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onFadeOutComplete);
      nextSequenceCallback();
      scene.time.delayedCall(150, () => {
        scene.cameras.main.fadeIn(850, 0, 0, 0);
      });
    };
    
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onFadeOutComplete);
  }

  startTravelHomeSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_bus_bgm", 0.26);
    scene.showInteriorScene("ending_bus_home", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "버스 타고 집으로 돌아가니까, 진짜 여행 준비가 시작된 느낌이네!" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "응! 약국에서 똑똑하게 계산하고 옷가게에서 멋진 스마트 영수증 받은 거 생각나? 너무 뿌듯해." },
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "너 진짜 계산 천재더라! 오늘 산 새 옷이랑 필요한 짐들을 집에서 야무지게 골라보자." },
    ], () => this.transitionWithFade(() => this.startPackingRoomScene()));
  }

  startPackingRoomScene() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_packing_room", "home");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_travel_bag", text: "방 안에 가방을 활짝 펼쳐두니까, 가슴이 콩닥콩닥 설레기 시작해." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "정답은 따로 없지만, 가방 안에는 진짜 필요한 짐만 넣고 지갑이나 교통카드는 안주머니에 소중히 보관해야지!" },
      { name: "해냄이", portraitKey: "haenaem_smile", text: "자, 여행 가방을 내 손으로 직접 차근차근 꾸려볼까?" }
    ], () => scene.openPackingMenu());
  }

  startPackedRoomSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_packed_room", "home");
    const itemMessage = scene.packingItems.length
      ? `${scene.packingItems.map((item) => item.label).join(", ")}까지 빼놓지 않고 예쁘게 챙겨 넣었어!`
      : "여행 가방을 아주 가볍고 실용적으로 잘 준비했어.";
    
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_travel_bag", text: itemMessage },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "내 이름이 박힌 멋진 여행가방 이름표도 달았고... 이제 진짜 떠나는구나." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "스스로 준비해서 가는 첫 번째 서울 여행, 씩씩하게 잘 다녀올 수 있을 거야!" }
    ], () => this.transitionWithFade(() => this.startMotherAllowanceSequence()));
  }

  startMotherAllowanceSequence() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_smile", text: "어머, 우리 해냄이가 스스로 서울 갈 준비를 이렇게나 꼼꼼히 끝냈네!" },
      { name: "엄마", portraitKey: "mother_calm", text: "삼각지 동네 청소도 앞장서서 하고, 혼자서 장보기도 해내다니 엄마는 참 대견하단다." },
      { name: "엄마", portraitKey: "mother_allowance", text: "이건 해냄이가 흘린 멋진 땀방울을 칭찬하며 엄마가 주는 선물, 특별 보너스 용돈이란다!" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "우와, 진짜요? 정말 고마워요, 엄마! 잘 쓰고 안전하게 다녀올게요!" },
    ], () => {
      scene.moneySystem?.addMoney(TRAVEL_ALLOWANCE_REWARD);
      scene.showMoneyRewardAnimation(TRAVEL_ALLOWANCE_REWARD, {
        label: "보너스 용돈",
        icon: "./assets/ui/10000won.png",
        framed: false,
      });
      scene.playItemPickupSound();
      scene.saveCheckpoint("travel_allowance");
      scene.time.delayedCall(900, () => this.transitionWithFade(() => this.startTravelMorningSequence()));
    });
  }

  startTravelMorningSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_morning_room", "home");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_determined", text: "가방도 든든하게 챙겼고, 엄마 배웅과 용돈도 다 받았어!" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "기차를 타러 나가는 발걸음이 너무나도 가벼워. 자, 역으로 가자!" },
    ], () => this.transitionWithFade(() => this.startStationSequence()));
  }

  startStationSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_train_bgm", 0.26);
    scene.showInteriorScene("ending_yeongju_station", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "와아... 기차역 플랫폼에 서니까 아침 공기가 시원해서 정말 가슴이 뻥 뚫려!" },
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "응, 예전에는 기차를 타는 게 무서웠는데, 지금은 직접 티켓도 예매하고 준비해서 그런지 자신감이 솟아나." },
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "맞아, 우리 준비 철저히 했잖아! 기차가 들어오면 천천히 안전선 뒤에서 타자." }
    ], () => this.transitionWithFade(() => this.startTrainArrivalSequence()));
  }

  startTrainArrivalSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_train_bgm", 0.28);
    scene.showInteriorScene("ending_train_arrival", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "기차가 덜컹거리며 들어온다! 가방 꽉 잡고 놓치지 말고 천천히 오르자." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "좋았어! 드디어 서울로 힘차게 출발한다!" },
    ], () => this.transitionWithFade(() => this.startSeoulArrivalSequence()));
  }

  startSeoulArrivalSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_seoul_station_bgm", 0.26);
    scene.showInteriorScene("ending_seoul_station", "travel");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "와아... 드디어 서울역이다! 빌딩들도 엄청나게 높고 사람이 정말 많아." },
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "정말 번잡하지만 두려워할 필요 전혀 없어! 우리에겐 길 찾기 훈련 실력이 있잖아." },
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "천천히 안내 표지판을 보며 내 손을 잡고 함께 움직여보자!" }
    ], () => this.transitionWithFade(() => this.startTravelMemorySequence()));
  }

  startTravelMemorySequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_gyeongbokgung_bgm", 0.26);
    scene.showInteriorScene("ending_gyeongbokgung", "travel");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_touched", text: "경복궁의 넓은 앞마당을 내 발로 직접 밟고 서니까 감격스러워... 직접 준비해서 왔기에 백 배는 더 소중하고 자랑스러워." },
    ], () => {
      this.transitionWithFade(() => {
        scene.playSceneMusic("ambient_amusement_park_bgm", 0.26);
        scene.showInteriorScene("ending_amusement_park", "travel");
        scene.dialogueSystem.start([
          { name: "쭉쭉이", portraitKey: "jjook_playful", text: "신나는 놀이공원까지 완벽정복! 오늘 흘린 땀방울과 웃음소리는 평생 기억에 남을 거야." },
          { name: "해냄이", portraitKey: "haenaem_touched", text: "응. 다 삼각지에서 함께 걷고, 쓸고, 계산하고, 짐 싼 훈련 덕분이야. 다음 여행도 완전 자신 있어!" },
        ], () => this.transitionWithFade(() => this.startPhoneCallSequence()));
      });
    });
  }

  startPhoneCallSequence() {
    const scene = this.scene;
    scene.audioManager.playPhoneRingSound();

    scene.dialogueSystem.start([
      {
        name: "알림",
        portraitKey: "jjook_travel_bag",
        text: "📱 따르릉... 따르릉... 주머니에서 진동이 울립니다.\n엄마로부터 전화가 걸려왔습니다.",
      },
      {
        name: "알림",
        portraitKey: "jjook_travel_bag",
        text: "전화를 받으시겠습니까?",
        choices: [
          { label: "📞 전화 수락하기", onSelect: () => this.handlePhoneCallDialogue() },
          { label: "🔇 나중에 받기", onSelect: () => this.declinePhoneCall() },
        ],
      },
    ]);
  }

  declinePhoneCall() {
    const scene = this.scene;
    scene.audioManager?.stopPhoneRingSound?.();
    this.showPhoneCallResumeButton();
  }

  handlePhoneCallDialogue() {
    const scene = this.scene;
    this.hidePhoneCallResumeButton();
    // Soft tone signifying line connected
    scene.audioManager.playTone({ frequency: 587.33, duration: 0.18, type: "sine", volume: 0.05 });
    
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_smile", text: "여보세요? 엄마!" },
      { name: "엄마", portraitKey: "mother_smile", text: "해냄아! 서울역이랑 경복궁에는 잘 도착했니? 재미있게 놀고 있어?" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "네! 쭉쭉이랑 경복궁도 가고 놀이공원도 왔어요. 사람들이 진짜 많아서 살짝 떨렸지만요." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "삼각지에서 연습했던 대로 표지판도 읽고 차근차근 걸었더니 하나도 헤매지 않고 잘 왔어요!" },
      { name: "엄마", portraitKey: "mother_smile", text: "어휴, 우리 해냄이가 스스로 부딪히며 서울 여행을 멋지게 주도하고 있구나. 엄마는 목소리만 들어도 정말 든든해." },
      { name: "엄마", portraitKey: "mother_calm", text: "약국이랑 옷가게에서 잔돈 계산도 또박또박 해내더니, 이제는 완전한 어른이 다 되었네." },
      { name: "해냄이", portraitKey: "haenaem_smile", text: "엄마가 믿어주고 응원 용돈도 듬뿍 챙겨주신 덕분이에요. 다녀가서 삼각지 이웃분들 선물도 사갈게요!" },
      { name: "엄마", portraitKey: "mother_smile", text: "선물은 무슨, 우리 해냄이가 안전하고 웃는 얼굴로 영주행 기차 타고 돌아오는 게 가장 큰 선물이란다. 재밌게 즐기고 이따 역에서 만나자." },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "응! 사랑해요 엄마, 이따 저녁에 뵈어요!" }
    ], () => {
      // Sound representing hanging up
      scene.audioManager.playTone({ frequency: 440.00, duration: 0.25, type: "sine", volume: 0.03 });
      scene.time.delayedCall(400, () => this.transitionToChapterOneEnding());
    });
  }

  transitionToChapterOneEnding() {
    if (this.isFinalEndingTransitioning || this.isFinalEndingStarting) return;

    const scene = this.scene;
    this.isFinalEndingTransitioning = true;

    let isSettled = false;
    let fallbackTimer = null;
    const finish = () => {
      if (isSettled) return;
      isSettled = true;
      this.isFinalEndingTransitioning = false;
      fallbackTimer?.remove(false);
      scene.cameras.main.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finish);
      this.finishChapterOneEnding();
    };

    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finish);
    fallbackTimer = scene.time.delayedCall(1200, finish);

    try {
      scene.cameras.main.fadeOut(850, 0, 0, 0);
    } catch {
      finish();
    }
  }

  finishChapterOneEnding() {
    if (this.isFinalEndingStarting) return;
    this.isFinalEndingStarting = true;
    const scene = this.scene;
    scene.packingQuestState = "ending_complete";
    scene.isChapterComplete = true;
    scene.saveCheckpoint("chapter1_ending_complete");
    this.showChapterOneEndingScene();
  }

  showChapterOneEndingScene() {
    const scene = this.scene;
    scene.clearInteriorScene();
    scene.stopSceneMusic();
    scene.stopChapterMusic();
    scene.playSceneMusic("chapter1_ending_bgm", 0.34);
    scene.stateManager?.set(SceneState.CUTSCENE);
    scene.player?.setVelocity(0, 0);
    scene.playerController?.stopWalkAnimation?.();

    const showEnding = (isReady = true) => {
      if (isReady && scene.textures.exists("ending_chapter1_final")) {
        scene.interiorSceneSystem?.show("ending_chapter1_final", "ending");
      } else {
        this.showFinalEndingFallback();
      }

      if (!scene.interiorSceneGroup || scene.interiorSceneType !== "ending") {
        this.showFinalEndingFallback();
      }

      scene.cameras.main.fadeIn(850, 0, 0, 0);
      
      const addPromptWhenReady = () => {
        if (scene.interiorSceneGroup && scene.interiorSceneType === "ending") {
          const viewportWidth = Math.max(768, scene.scale.width || 768);
          const viewportHeight = Math.max(480, scene.scale.height || 480);
          const centerX = viewportWidth / 2;
          const promptY = Math.min(viewportHeight - 46, viewportHeight * 0.9);
          const promptBack = scene.add.rectangle(centerX, promptY, Math.min(560, viewportWidth - 56), 54, 0x21352c, 0.72);
          promptBack.setScrollFactor(0);
          promptBack.setDepth(74);
          promptBack.setStrokeStyle(3, 0xf7d96f, 0.9);
          const prompt = scene.add.text(centerX, promptY, "스페이스 또는 화면 터치로 시작화면으로", {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#fff3d0",
            fontStyle: "bold",
            align: "center",
          }).setOrigin(0.5);
          prompt.setScrollFactor(0);
          prompt.setDepth(75);
          scene.interiorSceneGroup.addMultiple([promptBack, prompt]);

          scene.input.keyboard.once("keydown-SPACE", () => this.returnToStartScreenFromEnding());
          scene.input.once("pointerdown", () => this.returnToStartScreenFromEnding());
        } else {
          scene.time.delayedCall(100, addPromptWhenReady);
        }
      };
      
      addPromptWhenReady();
    };

    let didShowEnding = false;
    const showEndingOnce = (isReady = true) => {
      if (didShowEnding) return;
      didShowEnding = true;
      showEnding(isReady);
    };

    scene.time.delayedCall(4200, () => showEndingOnce(false));
    this.loadFinalEndingTexture(showEndingOnce);
  }

  loadFinalEndingTexture(onReady) {
    const scene = this.scene;
    const key = "ending_chapter1_final";
    if (scene.textures.exists(key)) {
      onReady(true);
      return;
    }

    const asset = EXTERNAL_ASSETS.find((a) => a.key === key);
    if (!asset) {
      onReady(false);
      return;
    }

    let isSettled = false;
    let handleComplete = null;
    const settle = (isReady) => {
      if (isSettled) return;
      isSettled = true;
      this.finalEndingLoadTimer?.remove(false);
      this.finalEndingLoadTimer = null;
      if (handleComplete) {
        scene.load.off(Phaser.Loader.Events.COMPLETE, handleComplete);
      }
      onReady(isReady || scene.textures.exists(key));
    };

    handleComplete = () => settle(scene.textures.exists(key));

    const enqueueLoad = () => {
      try {
        if (!scene.textures.exists(key)) {
          scene.load.image(key, asset.path);
        }
        scene.load.once(Phaser.Loader.Events.COMPLETE, handleComplete);
        if (!scene.load.isLoading?.()) {
          scene.load.start();
        }
      } catch {
        settle(false);
      }
    };

    this.finalEndingLoadTimer?.remove(false);
    this.finalEndingLoadTimer = scene.time.delayedCall(3500, () => settle(false));

    if (scene.load.isLoading?.()) {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        if (scene.textures.exists(key)) {
          settle(true);
        } else {
          enqueueLoad();
        }
      });
      return;
    }

    enqueueLoad();
  }

  showFinalEndingFallback() {
    const scene = this.scene;
    scene.interiorSceneSystem?.clear?.();
    document.body.classList.add("interior-scene-active");
    document.body.dataset.interiorScene = "ending";
    scene.interiorSceneGroup = scene.add.group();
    scene.interiorSceneType = "ending";

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const back = scene.add.rectangle(centerX, centerY, viewportWidth * 2, viewportHeight * 2, 0x101818, 1);
    back.setScrollFactor(0);
    back.setDepth(58);
    const title = scene.add.text(centerX, centerY - 24, "챕터 1 완료", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#fff3d0",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(60);
    const message = scene.add.text(centerX, centerY + 34, "삼각지에서 배운 준비가 서울 여행으로 이어졌어요.", {
      fontFamily: "Arial",
      fontSize: "21px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: Math.min(620, viewportWidth - 80) },
    }).setOrigin(0.5);
    message.setScrollFactor(0);
    message.setDepth(60);
    scene.interiorSceneGroup.addMultiple([back, title, message]);
  }

  returnToStartScreenFromEnding() {
    const scene = this.scene;
    if (scene.packingQuestState !== "ending_complete") return;
    scene.stopSceneMusic();
    scene.stopChapterMusic();
    scene.clearInteriorScene();
    document.body.classList.remove("epilogue-scene-active");
    document.body.classList.add("start-screen");
    scene.scene.start("StartScene");
  }

  showPhoneCallResumeButton() {
    if (this.phoneCallResumeButton) return;
    const scene = this.scene;

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    const container = scene.add.container(centerX, centerY).setDepth(65);
    
    const glow = scene.add.circle(0, 0, 72, 0xff5a5a, 0.4);
    glow.setStrokeStyle(3, 0xff8e8e, 0.8);
    
    scene.tweens.add({
      targets: glow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const phoneImage = scene.add.image(0, -10, "mother_phone");
    phoneImage.setDisplaySize(116, 116);
    
    phoneImage.setInteractive({ useHandCursor: true });
    phoneImage.on("pointerover", () => {
      phoneImage.setScale(phoneImage.scaleX * 1.1);
      scene.playTone?.({ frequency: 660, duration: 0.08, type: "sine", volume: 0.02 });
    });
    phoneImage.on("pointerout", () => {
      phoneImage.setScale(phoneImage.scaleX / 1.1);
    });

    const label = scene.add.text(0, 72, "📞 전화 받기", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#cc3333",
      padding: { x: 14, y: 8 },
      align: "center"
    }).setOrigin(0.5);
    
    label.setInteractive({ useHandCursor: true });

    const triggerReceive = () => {
      this.hidePhoneCallResumeButton();
      scene.audioManager?.stopPhoneRingSound?.();
      this.handlePhoneCallDialogue();
    };

    phoneImage.on("pointerdown", triggerReceive);
    label.on("pointerdown", triggerReceive);

    container.add([glow, phoneImage, label]);
    
    this.phoneCallResumeButton = container;
    scene.interiorSceneGroup?.add(container);
  }

  hidePhoneCallResumeButton() {
    if (this.phoneCallResumeButton) {
      this.phoneCallResumeButton.destroy();
      this.phoneCallResumeButton = null;
    }
  }
}
