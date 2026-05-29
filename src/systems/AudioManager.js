import { TILED_MAP_CONFIG } from "../config/GameConstants.js";
import { AUDIO_ASSETS } from "../config/AssetsData.js";

export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
  }

  getAudioContext() {
    const scene = this.scene;
    if (!scene.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      scene.audioContext = new AudioContextClass();
    }

    if (scene.audioContext.state === "suspended") {
      scene.audioContext.resume();
    }

    return scene.audioContext;
  }

  isSoundEnabled() {
    return this.scene.registry.get("soundEnabled") !== false;
  }

  unlockAudio() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    const context = this.getAudioContext();
    if (context?.state === "suspended") {
      context.resume();
    }

    if (scene.sound?.context?.state === "suspended") {
      scene.sound.context.resume();
    }

    this.loadThanksAudioBuffer();
  }

  loadThanksAudioBuffer() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;
    if (scene.hasStartedAudioLoad || scene.thanksAudioBuffer) return;

    const context = this.getAudioContext();
    if (!context) return;

    scene.hasStartedAudioLoad = true;
    fetch(new URL("assets/audio/thanks.mp3", window.location.href))
      .then((response) => response.arrayBuffer())
      .then((buffer) => context.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        scene.thanksAudioBuffer = decodedBuffer;
      })
      .catch(() => {
        scene.hasStartedAudioLoad = false;
      });
  }

  loadAudioBuffer(path, assign) {
    const scene = this.scene;
    const context = this.getAudioContext();
    if (!context) return Promise.reject(new Error("AudioContext unavailable"));

    return fetch(new URL(path, window.location.href))
      .then((response) => response.arrayBuffer())
      .then((buffer) => context.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        scene[assign] = decodedBuffer;
        return decodedBuffer;
      });
  }

  playAudioBuffer(buffer) {
    const context = this.getAudioContext();
    if (!this.isSoundEnabled() || !context || !buffer) return false;

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.95;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    return true;
  }

  playTone({ frequency, duration, type = "sine", volume = 0.08, delay = 0 }) {
    if (!this.isSoundEnabled()) return;

    const context = this.getAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume();
    }

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

  playCanCleanSound() {
    this.playTone({ frequency: 880, duration: 0.07, type: "square", volume: 0.045 });
    this.playTone({ frequency: 1175, duration: 0.1, type: "triangle", volume: 0.05, delay: 0.05 });
  }

  playItemPickupSound() {
    this.playTone({ frequency: 660, duration: 0.08, type: "triangle", volume: 0.055 });
    this.playTone({ frequency: 880, duration: 0.1, type: "triangle", volume: 0.06, delay: 0.06 });
    this.playTone({ frequency: 1320, duration: 0.12, type: "sine", volume: 0.045, delay: 0.13 });
  }

  playMoneyRewardSound() {
    this.playTone({ frequency: 523, duration: 0.1, type: "triangle", volume: 0.06 });
    this.playTone({ frequency: 784, duration: 0.12, type: "triangle", volume: 0.07, delay: 0.08 });
    this.playTone({ frequency: 1046, duration: 0.16, type: "sine", volume: 0.06, delay: 0.18 });
    this.playTone({ frequency: 1568, duration: 0.2, type: "sine", volume: 0.05, delay: 0.3 });
  }

  playSpecialUseSound() {
    this.playTone({ frequency: 392, duration: 0.16, type: "triangle", volume: 0.06 });
    this.playTone({ frequency: 784, duration: 0.22, type: "triangle", volume: 0.07, delay: 0.08 });
    this.playTone({ frequency: 1175, duration: 0.24, type: "sine", volume: 0.055, delay: 0.18 });
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

  playThanksVoice() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(scene.thanksAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/thanks.mp3", "thanksAudioBuffer")
      .then(() => this.playThanksVoice())
      .catch(() => {
        this.playTone({ frequency: 659, duration: 0.16, type: "triangle", volume: 0.07 });
        this.playTone({ frequency: 880, duration: 0.18, type: "triangle", volume: 0.07, delay: 0.12 });
      });
  }

  playCollectCansVoice() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(scene.collectCansAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/collect-cans.mp3", "collectCansAudioBuffer")
      .then(() => this.playCollectCansVoice())
      .catch(() => {
        this.playTone({ frequency: 392, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 523, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
      });
  }

  playHelpVoice() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(scene.helpAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/i-will-help.mp3", "helpAudioBuffer")
      .then(() => this.playHelpVoice())
      .catch(() => {
        this.playTone({ frequency: 523, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 659, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
      });
  }

  playClearSlimeVoice() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(scene.clearSlimeAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/clear-slime.mp3", "clearSlimeAudioBuffer")
      .then(() => this.playClearSlimeVoice())
      .catch(() => {
        this.playTone({ frequency: 440, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 587, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
      });
  }

  startChapterMusic() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    this.stopSceneMusic({ resumeChapter: false });
    this.stopChapterMusic();
    scene.bgmIndex = TILED_MAP_CONFIG.chapter;
    this.playNextChapterTrack();
  }

  playSceneMusic(key, volume = 0.26) {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    if (!scene.cache.audio.exists(key)) {
      const asset = AUDIO_ASSETS.find((a) => a.key === key);
      if (asset) {
        scene.load.audio(key, asset.path);
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
          this.playSceneMusic(key, volume);
        });
        scene.load.start();
      }
      return;
    }

    this.stopChapterMusic();
    this.stopSceneMusic({ resumeChapter: false });
    scene.sceneBgmAudio = scene.sound.add(key, { loop: true, volume });
    scene.sceneBgmAudio.play();
  }

  stopSceneMusic({ resumeChapter = false } = {}) {
    const scene = this.scene;
    if (scene.sceneBgmAudio) {
      scene.sceneBgmAudio.stop();
      scene.sceneBgmAudio.destroy?.();
      scene.sceneBgmAudio = null;
    }
    if (resumeChapter) {
      this.startChapterMusic();
    }
  }

  playNextChapterTrack() {
    const scene = this.scene;
    if (!this.isSoundEnabled()) return;

    const cachedKey = `chapter${scene.bgmIndex}_bgm`;
    if (scene.cache.audio.exists(cachedKey)) {
      scene.bgmAudio = scene.sound.add(cachedKey, { volume: 0.32 });
      scene.bgmAudio.once("complete", () => {
        scene.bgmIndex += 1;
        this.playNextChapterTrack();
      });
      scene.bgmAudio.play();
      return;
    }

    const trackPaths = [
      `assets/audio/chapter${scene.bgmIndex}.mp3`,
      `assets/chapter${scene.bgmIndex}.mp3`,
    ];
    this.fetchFirstExistingTrack(trackPaths)
      .then((response) => {
        if (!response) {
          if (scene.bgmIndex !== TILED_MAP_CONFIG.chapter) {
            scene.bgmIndex = TILED_MAP_CONFIG.chapter;
            this.playNextChapterTrack();
          }
          return null;
        }
        return response.blob();
      })
      .then((blob) => {
        if (!blob) return;

        scene.bgmObjectUrl = URL.createObjectURL(blob);
        scene.bgmAudio = new Audio(scene.bgmObjectUrl);
        scene.bgmAudio.volume = 0.32;
        scene.bgmAudio.addEventListener(
          "ended",
          () => {
            this.cleanupBgmObjectUrl();
            scene.bgmIndex += 1;
            this.playNextChapterTrack();
          },
          { once: true },
        );
        scene.bgmAudio.play().catch(() => {});
      })
      .catch(() => {});
  }

  fetchFirstExistingTrack(paths) {
    const [path, ...rest] = paths;
    if (!path) {
      return Promise.resolve(null);
    }

    return fetch(new URL(path, window.location.href), { cache: "no-store" }).then((response) => {
      if (response.ok) {
        return response;
      }
      return this.fetchFirstExistingTrack(rest);
    });
  }

  stopChapterMusic() {
    const scene = this.scene;
    if (scene.bgmAudio) {
      if (typeof scene.bgmAudio.stop === "function") {
        scene.bgmAudio.stop();
        scene.bgmAudio.destroy?.();
      } else {
        scene.bgmAudio.pause();
        scene.bgmAudio.removeAttribute("src");
      }
      scene.bgmAudio = null;
    }
    this.cleanupBgmObjectUrl();
  }

  stopAudioForPageExit() {
    const scene = this.scene;
    this.stopSceneMusic({ resumeChapter: false });
    this.stopChapterMusic();
    scene.sound?.stopAll?.();
  }

  cleanupBgmObjectUrl() {
    const scene = this.scene;
    if (scene.bgmObjectUrl) {
      URL.revokeObjectURL(scene.bgmObjectUrl);
      scene.bgmObjectUrl = null;
    }
  }
}
