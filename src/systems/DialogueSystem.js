import { SceneState } from "../config/SceneState.js";

export default class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.isInDialogue = false;
    this.dialogueIndex = 0;
    this.dialogueLines = [];
    this.onComplete = null;
    this.typingInterval = null;
    this.activeChoices = null;
    this.selectedChoiceIndex = 0;

    this.dialogModal = document.querySelector("#dialogModal");
    this.dialogPanel = document.querySelector(".dialog-panel");
    this.dialogName = document.querySelector(".dialog-name");
    this.dialogText = document.querySelector(".dialog-text");
    this.dialogNext = document.querySelector(".dialog-next");
    this.dialogChoices = document.querySelector(".dialog-choices");

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.dialogModal?.addEventListener("click", () => this.nextLine());
    this.scene.input.keyboard.on("keydown-SPACE", () => this.confirm());
    this.scene.input.keyboard.on("keydown-ENTER", () => this.confirm());
    this.scene.input.keyboard.on("keydown-LEFT", () => this.moveChoice(-1));
    this.scene.input.keyboard.on("keydown-RIGHT", () => this.moveChoice(1));
  }

  confirm() {
      if (!this.isInDialogue) return;
      if (this.activeChoices) {
        this.choose(this.selectedChoiceIndex);
        return;
      }
      this.nextLine();
  }

  start(dialogueLines, onComplete = null) {
    if (this.isInDialogue) return false;

    this.isInDialogue = true;
    this.dialogueIndex = 0;
    this.dialogueLines = dialogueLines;
    this.onComplete = onComplete;

    this.scene.isInDialogue = true;
    this.scene.stateManager?.set(SceneState.TALKING);
    if (this.scene.player) this.scene.player.setVelocity(0, 0);

    this.dialogModal.style.display = "flex";
    this.showLine();
    return true;
  }

  showLine() {
    const line = this.dialogueLines[this.dialogueIndex];
    this.activeChoices = null;
    this.clearChoices();
    this.dialogNext.style.opacity = "0";
    this.dialogName.textContent = line.name || "\uC54C\uB9BC";
    const usesSceneOverlay = Boolean(line.overlayKey || line.portraitKey);
    this.dialogModal?.classList.toggle("has-scene-overlay", usesSceneOverlay);
    this.scene.handleDialogueLineChange?.(line);
    this.typewrite(line.text, line.choices || null);

    // Play TTS speech output if enabled in settings
    if (this.scene.registry.get("ttsEnabled") === true) {
      this.playTTS(line.name, line.text);
    }
  }

  typewrite(fullText, choices = null) {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.dialogText.textContent = "";
    let i = 0;
    this.typingInterval = setInterval(() => {
      if (i < fullText.length) {
        this.dialogText.textContent += fullText[i];
        i += 1;
      } else {
        this.finishTyping(choices);
      }
    }, 40);
  }

  finishTyping(choices = null) {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }

    if (choices?.length) {
      this.showChoices(choices);
      return;
    }

    this.dialogNext.style.opacity = "1";
  }

  showChoices(choices) {
    this.activeChoices = choices;
    this.selectedChoiceIndex = 0;
    this.dialogNext.style.opacity = "0";
    this.dialogChoices.innerHTML = "";
    this.dialogChoices.setAttribute("aria-hidden", "false");
    this.dialogChoices.classList.add("is-visible");

    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dialog-choice";
      button.textContent = choice.label;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.choose(index);
      });
      this.dialogChoices.appendChild(button);
    });
    this.updateChoiceSelection();
  }

  clearChoices() {
    if (!this.dialogChoices) return;

    this.dialogChoices.innerHTML = "";
    this.dialogChoices.classList.remove("is-visible");
    this.dialogChoices.setAttribute("aria-hidden", "true");
  }

  moveChoice(direction) {
    if (!this.activeChoices?.length) return;

    this.selectedChoiceIndex =
      (this.selectedChoiceIndex + direction + this.activeChoices.length) % this.activeChoices.length;
    this.updateChoiceSelection();
  }

  updateChoiceSelection() {
    const buttons = Array.from(this.dialogChoices.querySelectorAll(".dialog-choice"));
    buttons.forEach((button, index) => {
      const isSelected = index === this.selectedChoiceIndex;
      button.classList.toggle("is-selected", isSelected);
      if (isSelected) button.focus({ preventScroll: true });
    });
  }

  choose(index) {
    if (!this.activeChoices?.[index]) return;

    const choice = this.activeChoices[index];
    this.activeChoices = null;
    this.clearChoices();
    this.close(false);
    choice.onSelect?.();
  }

  nextLine() {
    if (!this.isInDialogue || this.activeChoices) return;

    const currentLine = this.dialogueLines[this.dialogueIndex];
    if (this.typingInterval) {
      this.dialogText.textContent = currentLine.text;
      this.finishTyping(currentLine.choices || null);
      return;
    }

    this.dialogueIndex += 1;
    if (this.dialogueIndex < this.dialogueLines.length) {
      this.showLine();
    } else {
      this.close();
    }
  }

  close(runComplete = true) {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.typingInterval = null;
    this.clearChoices();
    this.dialogModal.style.display = "none";
    this.dialogModal?.classList.remove("has-scene-overlay");
    this.dialogModal?.style.removeProperty("--dialog-scene-left");
    this.scene.handleDialogueClose?.();
    this.isInDialogue = false;
    this.scene.isInDialogue = false;
    this.scene.stateManager?.set(SceneState.PLAYING);

    // Cancel any active TTS speech when dialog closes
    try {
      window.speechSynthesis?.cancel();
    } catch (e) {}

    const onComplete = this.onComplete;
    this.onComplete = null;
    if (runComplete) onComplete?.();
  }

  playTTS(name, text) {
    try {
      if (!window.speechSynthesis) return;

      // Cancel previous speech instantly
      window.speechSynthesis.cancel();

      // Clean dialogue choices symbols if any (not present in raw text anyway)
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";

      // Gender-specific voice mapping fallback
      const characterName = name?.trim() || "";
      const isMale = ["여비", "쭉쭉이", "의사", "약사", "옷가게 주인", "옷가게주인", "의사 선생님"].includes(characterName);
      const isFemale = ["엄마", "수니수니", "접수 직원", "접수직원"].includes(characterName);

      let pitch = 1.0;
      if (isFemale) {
        pitch = 1.25; // Higher pitch for female voice
      } else if (isMale) {
        pitch = 0.82; // Lower pitch for male voice
      }
      utterance.pitch = pitch;
      utterance.rate = 1.05; // Slightly faster for natural feel

      // Try to find native Korean male/female voice if available in the browser
      const voices = window.speechSynthesis.getVoices();
      const koVoices = voices.filter((v) => v.lang.includes("ko"));
      if (koVoices.length > 0) {
        let selectedVoice = koVoices[0];
        if (isMale) {
          const maleVoice = koVoices.find(
            (v) =>
              v.name.toLowerCase().includes("male") ||
              v.name.includes("남성") ||
              v.name.includes("Anji")
          );
          if (maleVoice) selectedVoice = maleVoice;
        } else if (isFemale) {
          const femaleVoice = koVoices.find(
            (v) =>
              v.name.toLowerCase().includes("female") ||
              v.name.includes("여성") ||
              v.name.includes("Heami") ||
              v.name.includes("Hyunyoung") ||
              v.name.includes("Yuna")
          );
          if (femaleVoice) selectedVoice = femaleVoice;
        }
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak failed:", e);
    }
  }
}
