const TOGGLE_BUTTON_ID = "toggle-button";
const EXPAND_ALL_BUTTON_ID = "expand-all";
const STATUS_TEXT_ID = "status-text";

class PopupController {
  constructor() {
    this.isEnabled = true;
    this.init();
  }

  async init() {
    await this.loadState();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadState() {
    try {
      const result = await chrome.storage.local.get(["isEnabled"]);
      this.isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    } catch (error) {
      this.isEnabled = true;
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({ isEnabled: this.isEnabled });
    } catch (error) {}
  }

  setupEventListeners() {
    const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
    const expandAllButton = document.getElementById(EXPAND_ALL_BUTTON_ID);

    if (toggleButton) {
      toggleButton.addEventListener("click", () => this.toggleExtension());
    }

    if (expandAllButton) {
      expandAllButton.addEventListener("click", () => this.expandAll());
    }
  }

  async toggleExtension() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.includes("linkedin.com")) {
        this.updateStatus("Please navigate to LinkedIn first", false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "toggle",
      });

      if (response && response.enabled !== undefined) {
        this.isEnabled = response.enabled;
        await this.saveState();
        this.updateUI();
      }
    } catch (error) {
      this.updateStatus("Error: Please refresh the page", false);
    }
  }

  async expandAll() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.includes("linkedin.com")) {
        this.updateStatus("Please navigate to LinkedIn first", false);
        return;
      }

      await chrome.tabs.sendMessage(tab.id, {
        action: "expandAll",
      });

      this.updateStatus("Expanding all posts...", true);

      setTimeout(() => {
        this.updateUI();
      }, 2000);
    } catch (error) {
      this.updateStatus("Error: Please refresh the page", false);
    }
  }

  updateUI() {
    const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
    const statusText = document.getElementById(STATUS_TEXT_ID);

    if (toggleButton) {
      toggleButton.textContent = this.isEnabled ? "Disable" : "Enable";
      toggleButton.className = this.isEnabled
        ? "btn btn-danger"
        : "btn btn-success";
    }

    if (statusText) {
      statusText.textContent = this.isEnabled
        ? "Auto-expand is ON"
        : "Auto-expand is OFF";
      statusText.className = this.isEnabled ? "text-success" : "text-danger";
      statusText.style.marginBottom = "10px";
    }
  }

  updateStatus(message, isSuccess) {
    const statusText = document.getElementById(STATUS_TEXT_ID);
    if (statusText) {
      statusText.textContent = message;
      statusText.className = isSuccess ? "text-success" : "text-danger";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
