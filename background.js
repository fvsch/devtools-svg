const PANEL_URL = browser.runtime.getURL("/panel/panel.html");

/**
 * Keep track of panel <-> background connection ports
 */
const panelPorts = {};

/**
 * Listen for connections opened by panel instances
 */
browser.runtime.onConnect.addListener(port => {
  if (port.sender.url !== PANEL_URL) {
    return;
  }
  // Inject content script, saving the port
  port.onMessage.addListener(msg => {
    const { tabId, injectScript, registerPort } = msg;
    if (typeof tabId !== "number") {
      return;
    }
    if (registerPort === true) {
      panelPorts[tabId] = port;
    }
    if (typeof injectScript === "string") {
      browser.tabs.executeScript(tabId, { file: injectScript });
    }
  });
});

/**
 * Forward content script messages to the correct panel instance
 */
browser.runtime.onMessage.addListener((msg, sender) => {
  const { tab } = sender;
  if (!tab || typeof tab !== "object" || typeof sender.tab.id !== "number") {
    return;
  }
  const port = panelPorts[sender.tab.id];
  if (port && typeof port === "object") {
    port.postMessage(msg);
  }
});
