export default class DialogueManager {
  constructor(scene, { dialogueSystem = null, actionHandlers = {}, dataUrl = "src/data/dialogues.json" } = {}) {
    this.scene = scene;
    this.dialogueSystem = dialogueSystem;
    this.actionHandlers = { ...actionHandlers };
    this.dataUrl = dataUrl;
    this.dialogues = new Map();
    this.loadPromise = null;

    const cachedData = this.scene?.cache?.json?.get?.("dialogues");
    if (cachedData) this.loadData(cachedData);
  }

  setDialogueSystem(dialogueSystem) {
    this.dialogueSystem = dialogueSystem;
  }

  setActionHandlers(actionHandlers = {}) {
    this.actionHandlers = { ...actionHandlers };
  }

  addActionHandlers(actionHandlers = {}) {
    this.actionHandlers = { ...this.actionHandlers, ...actionHandlers };
  }

  loadData(data) {
    const entries = this.normalizeData(data);
    this.dialogues.clear();

    entries.forEach((entry) => {
      if (!entry?.id) return;
      this.dialogues.set(entry.id, {
        ...entry,
        audio: entry.audio ?? null,
      });
    });

    return this;
  }

  async load(dataUrl = this.dataUrl) {
    if (this.dialogues.size > 0) return this;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = fetch(dataUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load dialogue data: ${response.status}`);
        return response.json();
      })
      .then((data) => this.loadData(data));

    return this.loadPromise;
  }

  get(id) {
    return this.dialogues.get(id) || null;
  }

  has(id) {
    return this.dialogues.has(id);
  }

  buildLines(startId, options = {}) {
    const lines = [];
    const visited = new Set();
    let currentId = startId;

    while (currentId) {
      if (visited.has(currentId)) {
        console.warn(`Dialogue loop detected at "${currentId}".`);
        break;
      }

      const entry = this.get(currentId);
      if (!entry) {
        console.warn(`Dialogue id "${currentId}" was not found.`);
        break;
      }

      visited.add(currentId);
      lines.push(this.toDialogueLine(entry, options));

      if (entry.choices?.length) break;
      currentId = entry.next || null;
    }

    return lines;
  }

  async start(startId, onComplete = null, options = {}) {
    await this.load();
    return this.startLoaded(startId, onComplete, options);
  }

  startLoaded(startId, onComplete = null, options = {}) {
    const dialogueSystem = options.dialogueSystem || this.dialogueSystem;
    if (!dialogueSystem) {
      console.warn("DialogueManager.startLoaded needs a DialogueSystem instance.");
      return false;
    }

    const lines = this.buildLines(startId, {
      ...options,
      dialogueSystem,
      onComplete,
    });

    if (!lines.length) return false;
    return dialogueSystem.start(lines, onComplete);
  }

  runAction(action, context = {}, actionHandlers = this.actionHandlers) {
    if (!action) return undefined;

    const handler = actionHandlers?.[action];
    if (!handler) {
      console.warn(`Dialogue action "${action}" has no handler.`);
      return undefined;
    }

    return handler({
      action,
      manager: this,
      scene: this.scene,
      ...context,
    });
  }

  normalizeData(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.dialogues)) return data.dialogues;
    if (data?.dialogues && typeof data.dialogues === "object") return Object.values(data.dialogues);
    if (data && typeof data === "object") return Object.values(data);
    return [];
  }

  toDialogueLine(entry, options = {}) {
    const { choices, ...line } = entry;
    const dialogueLine = {
      ...line,
      name: entry.name || entry.speaker || "알림",
      text: entry.text || "",
      audio: entry.audio ?? null,
    };

    if (choices?.length) {
      dialogueLine.choices = choices.map((choice) => this.toDialogueChoice(choice, entry, options));
    }

    return dialogueLine;
  }

  toDialogueChoice(choice, entry, options = {}) {
    const actionHandlers = options.actionHandlers || this.actionHandlers;
    const dialogueSystem = options.dialogueSystem || this.dialogueSystem;
    const onComplete = options.onComplete || null;

    return {
      ...choice,
      label: choice.label || "",
      action: choice.action || null,
      next: choice.next || null,
      onSelect: () => {
        const result = this.runAction(
          choice.action,
          {
            choice,
            line: entry,
            next: choice.next || null,
          },
          actionHandlers,
        );

        if (result === false) return;
        if (choice.next && dialogueSystem) {
          this.startLoaded(choice.next, onComplete, {
            ...options,
            dialogueSystem,
            actionHandlers,
          });
        } else {
          onComplete?.({
            choice,
            line: entry,
            action: choice.action || null,
          });
        }
      },
    };
  }
}
