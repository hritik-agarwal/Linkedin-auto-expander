class LinkedInAutoExpander {
  constructor() {
    this.observer = null;
    this.isEnabled = true;
    this.init();
  }

  async init() {
    await this.loadState();
    this.setupMutationObserver();
    this.expandExistingContent();
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

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleNewContent(node);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  handleNewContent(node) {
    setTimeout(() => {
      this.clickShowMoreButtons(node);
    }, 1000);
  }

  expandExistingContent() {
    if (!this.isEnabled) return;

    setTimeout(() => {
      this.clickShowMoreButtons(document.body);
    }, 1000);
  }

  clickShowMoreButtons(container) {
    const showMoreButtons = container.querySelectorAll(
      "button.feed-shared-inline-show-more-text__see-more-less-toggle"
    );

    showMoreButtons.forEach((button, index) => {
      setTimeout(() => {
        this.clickButton(button);
      }, index * 100);
    });
  }

  clickButton(button) {
    if (!this.isValidShowMoreButton(button)) return;

    try {
      button.click();
    } catch (error) {}
  }

  isValidShowMoreButton(button) {
    return (
      button &&
      button.tagName === "BUTTON" &&
      button.classList.contains(
        "feed-shared-inline-show-more-text__see-more-less-toggle"
      ) &&
      button.getAttribute("type") === "button"
    );
  }

  expandAllManually() {
    setTimeout(() => {
      this.clickShowMoreButtons(document.body);
    }, 1000);
  }

  async toggle() {
    this.isEnabled = !this.isEnabled;
    await this.saveState();

    if (this.isEnabled) {
      this.expandExistingContent();
    }

    return this.isEnabled;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

const autoExpander = new LinkedInAutoExpander();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    autoExpander.toggle().then((isEnabled) => {
      sendResponse({ enabled: isEnabled });
    });
    return true;
  } else if (request.action === "expandAll") {
    autoExpander.expandAllManually();
    sendResponse({ success: true });
  }
});
