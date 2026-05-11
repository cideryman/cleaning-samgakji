class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.isInDialogue = false;
    this.dialogueIndex = 0;
    this.dialogueLines = [];
    this.onComplete = null;
    this.typingInterval = null;
    
    this.dialogModal = document.querySelector("#dialogModal");
    this.dialogName = document.querySelector(".dialog-name");
    this.dialogText = document.querySelector(".dialog-text");
    this.dialogNext = document.querySelector(".dialog-next");
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.dialogModal.addEventListener("click", () => this.nextLine());
    this.scene.input.keyboard.on("keydown-SPACE", () => {
      if (this.isInDialogue) this.nextLine();
    });
  }
  
  start(dialogueLines, onComplete = null) {
    if (this.isInDialogue) return;
    
    this.isInDialogue = true;
    this.dialogueIndex = 0;
    this.dialogueLines = dialogueLines;
    this.onComplete = onComplete;
    
    this.scene.isInDialogue = true;
    if (this.scene.player) this.scene.player.setVelocity(0, 0);
    
    this.dialogModal.style.display = "flex";
    this.showLine();
  }
  
  showLine() {
    const line = this.dialogueLines[this.dialogueIndex];
    this.dialogName.textContent = line.name || "???";
    this.typewrite(line.text);
  }
  
  typewrite(fullText) {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.dialogText.textContent = "";
    let i = 0;
    this.typingInterval = setInterval(() => {
      if (i < fullText.length) {
        this.dialogText.textContent += fullText[i];
        i++;
      } else {
        clearInterval(this.typingInterval);
        this.typingInterval = null;
        this.dialogNext.style.opacity = "1";
      }
    }, 40);
  }
  
  nextLine() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
      this.dialogText.textContent = this.dialogueLines[this.dialogueIndex].text;
      this.dialogNext.style.opacity = "1";
      return;
    }
    
    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueLines.length) {
      this.dialogNext.style.opacity = "0";
      this.showLine();
    } else {
      this.close();
    }
  }
  
  close() {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.dialogModal.style.display = "none";
    this.isInDialogue = false;
    this.scene.isInDialogue = false;
    if (this.onComplete) this.onComplete();
  }
}