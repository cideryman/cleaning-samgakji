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

    this.stopCozySynthBgm();
    this.stopChapterMusic();
    this.stopSceneMusic({ resumeChapter: false });

    // Apply unique shop modifications using Phaser's rate and detune config
    let rate = 1.0;
    let detune = 0;

    if (key === "ambient_hospital_bgm") {
      rate = 0.62;
      detune = -380;
    } else if (key === "ambient_pharmacy_bgm") {
      rate = 1.16;
      detune = 160;
    } else if (key === "ambient_clothing_shop_bgm") {
      rate = 1.32;
      detune = 80;
    }

    scene.sceneBgmAudio = scene.sound.add(key, { loop: true, volume, rate, detune });
    scene.sceneBgmAudio.play();

    // Start background chord synthesis generator for buildings
    this.startShopAmbientSynth(key);
  }

  stopSceneMusic({ resumeChapter = false } = {}) {
    const scene = this.scene;
    this.stopShopAmbientSynth();
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

    this.stopCozySynthBgm();

    // If bgmIndex is 2, play the 0-Byte Cozy Synth Chiptune loop!
    if (scene.bgmIndex === 2) {
      this.playCozySynthBgm();
      // cozy synth lasts for ~135 seconds (2 mins 15s) then loops back to chapter 1 BGM
      this.cozySynthNextTrackTimer = setTimeout(() => {
        scene.bgmIndex = 1;
        this.playNextChapterTrack();
      }, 135000);
      return;
    }

    // Wrap around index limits
    if (scene.bgmIndex > 2 || scene.bgmIndex < 1) {
      scene.bgmIndex = 1;
    }

    const cachedKey = `chapter${scene.bgmIndex}_bgm`;
    if (scene.cache.audio.exists(cachedKey)) {
      scene.bgmAudio = scene.sound.add(cachedKey, { volume: 0.32 });
      scene.bgmAudio.once("complete", () => {
        scene.bgmIndex = 2; // Move to Cozy Synth BGM
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
          scene.bgmIndex = 1;
          this.playNextChapterTrack();
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
            scene.bgmIndex = 2; // Transition to Cozy Synth
            this.playNextChapterTrack();
          },
          { once: true },
        );
        scene.bgmAudio.play().catch(() => {});
      })
      .catch(() => {
        scene.bgmIndex = 2;
        this.playNextChapterTrack();
      });
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
    this.stopCozySynthBgm();
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

  // === Dynamic Web Audio Background Synth Generators ===

  startShopAmbientSynth(key) {
    this.stopShopAmbientSynth();

    const intervalTime = key === "ambient_hospital_bgm" ? 9200
                       : key === "ambient_pharmacy_bgm" ? 5400
                       : key === "ambient_clothing_shop_bgm" ? 4200
                       : null;

    if (!intervalTime) return;

    this.shopAmbientTimer = setInterval(() => {
      if (!this.isSoundEnabled()) return;

      if (key === "ambient_hospital_bgm") {
        // Soothing, slow sinusoidal D-Minor 7th chord arpeggio for Hospital
        const notes = [293.66, 349.23, 440.00, 587.33];
        notes.forEach((freq, i) => {
          this.playTone({
            frequency: freq,
            duration: 2.0,
            type: "sine",
            volume: 0.012,
            delay: i * 0.45
          });
        });
      } else if (key === "ambient_pharmacy_bgm") {
        // Cute, bubbly C-Major chord chime for Pharmacy
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          this.playTone({
            frequency: freq,
            duration: 0.32,
            type: "sine",
            volume: 0.010,
            delay: i * 0.16
          });
        });
      } else if (key === "ambient_clothing_shop_bgm") {
        // Rhythmic, trendy A-Minor chord saw-arpeggio for Clothing Shop
        const notes = [220.00, 330.00, 440.00, 659.25];
        notes.forEach((freq, i) => {
          this.playTone({
            frequency: freq,
            duration: 0.40,
            type: "triangle",
            volume: 0.016,
            delay: i * 0.14
          });
        });
      }
    }, intervalTime);
  }

  stopShopAmbientSynth() {
    if (this.shopAmbientTimer) {
      clearInterval(this.shopAmbientTimer);
      this.shopAmbientTimer = null;
    }
  }

  playCozySynthBgm() {
    this.stopCozySynthBgm();
    this.stopChapterMusic();
    this.stopSceneMusic({ resumeChapter: false });

    if (!this.isSoundEnabled()) return;

    const context = this.getAudioContext();
    if (!context) return;

    this.isCozySynthPlaying = true;
    this.cozySynthStep = 0;

    // Harmonic progression: C - G - Am - F pentatonics
    const chords = [
      { root: 130.81, treble: [261.63, 329.63, 392.00, 523.25] }, // C (C3, C4, E4, G4, C5)
      { root: 97.99,  treble: [196.00, 246.94, 293.66, 392.00] }, // G (G2, G3, B3, D4, G4)
      { root: 110.00, treble: [220.00, 277.18, 329.63, 440.00] }, // A (A2, A3, C#4, E4, A4)
      { root: 87.31,  treble: [174.61, 220.00, 261.63, 349.23] }  // F (F2, F3, A3, C4, F4)
    ];

    const stepTime = 0.40; // 150 BPM cozy moderate speed (8th notes)

    const tick = () => {
      if (!this.isCozySynthPlaying || !this.isSoundEnabled()) return;

      const chordIndex = Math.floor(this.cozySynthStep / 8) % chords.length;
      const stepInChord = this.cozySynthStep % 8;
      const currentChord = chords[chordIndex];

      // 1. Cozy Triangle Bass (played on the downbeat of every chord change)
      if (stepInChord === 0) {
        this.playTone({
          frequency: currentChord.root,
          duration: 3.0,
          type: "triangle",
          volume: 0.045
        });
      }

      // 2. Playful Arpeggios (8th note pattern)
      let noteFreq = null;
      if (stepInChord === 0) noteFreq = currentChord.treble[0];
      else if (stepInChord === 2) noteFreq = currentChord.treble[1];
      else if (stepInChord === 4) noteFreq = currentChord.treble[2];
      else if (stepInChord === 6) noteFreq = currentChord.treble[3];
      else if (stepInChord === 7 && Math.random() > 0.45) {
        noteFreq = currentChord.treble[Math.floor(Math.random() * currentChord.treble.length)] * 1.5;
      }

      if (noteFreq) {
        this.playTone({
          frequency: noteFreq,
          duration: 0.50,
          type: "sine",
          volume: 0.022
        });
      }

      // 3. Ambient Pad chords (on beat 1 and 3)
      if (stepInChord === 0 || stepInChord === 4) {
        this.playTone({
          frequency: currentChord.treble[1],
          duration: 1.4,
          type: "sine",
          volume: 0.010
        });
      }

      this.cozySynthStep++;
      this.cozySynthTimeout = setTimeout(tick, stepTime * 1000);
    };

    tick();
  }

  stopCozySynthBgm() {
    this.isCozySynthPlaying = false;
    if (this.cozySynthTimeout) {
      clearTimeout(this.cozySynthTimeout);
      this.cozySynthTimeout = null;
    }
    if (this.cozySynthNextTrackTimer) {
      clearTimeout(this.cozySynthNextTrackTimer);
      this.cozySynthNextTrackTimer = null;
    }
  }

  playPhoneRingSound() {
    if (!this.isSoundEnabled()) return;
    const context = this.getAudioContext();
    if (!context) return;

    // Synthesized rhythmic telephone ring (dual frequencies 440Hz + 480Hz vibratos)
    for (let t = 0; t < 1.25; t += 0.16) {
      this.playTone({
        frequency: 440,
        duration: 0.09,
        type: "sine",
        volume: 0.075,
        delay: t
      });
      this.playTone({
        frequency: 480,
        duration: 0.09,
        type: "sine",
        volume: 0.075,
        delay: t + 0.02
      });
    }
  }
}
