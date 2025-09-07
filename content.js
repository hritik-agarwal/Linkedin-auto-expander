class LinkedInAutoExpander {
  constructor() {
    this.observer = null;
    this.isEnabled = true;
    this.init();
  }

  async init() {
    const result = await chrome.storage.local.get(["isEnabled"]);
    this.isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    if (!this.isEnabled) return;
    this.setupMutationObserver();
  }

  destroyObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  setupMutationObserver() {
    this.destroyObserver();
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.clickAllMoreButtons();
            }
          });
        }
      });
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.clickAllMoreButtons();
  }

  clickAllMoreButtons() {
    Array.from(document.querySelectorAll("button"))
      .filter((btn) => {
        const spans = btn.querySelectorAll("span");
        if (spans.length !== 1) return false;
        const text = spans[0].innerText.trim().toLowerCase();
        return text === "…more" || text === "… show more";
      })
      .forEach((btn) => {
        const postContainer = btn.closest("div, span");
        if (postContainer) postContainer.style.outline = "none";
        btn.click();
      });
  }

  async toggle() {
    this.isEnabled = !this.isEnabled;
    await chrome.storage.local.set({ isEnabled: this.isEnabled });
    if (this.isEnabled) this.setupMutationObserver();
    else this.destroyObserver();
    return this.isEnabled;
  }
}

const autoExpander = new LinkedInAutoExpander();

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "toggle") {
    autoExpander.toggle().then((isEnabled) => {
      sendResponse({ enabled: isEnabled });
    });
    return true;
  }

  if (request.action === "expandAll") {
    autoExpander.clickAllMoreButtons();
    sendResponse({ success: true });
  }
});
