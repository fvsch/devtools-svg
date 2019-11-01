function getPanelUrl() {
  return browser.runtime.getURL("./panel/panel.html");
}

/**
 * Keep track of panel <-> background connection ports
 */
const panelPorts = {};

/**
 * Listen for connections opened by panel instances
 */
browser.runtime.onConnect.addListener(port => {
  console.log("onConnect", port);

  console.log(`port.sender.url (${port.sender.url}) !== PANEL_URL (${getPanelUrl()})`)

  if (port.sender.url !== getPanelUrl()) {
    return;
  }
  // Inject content script, saving the port
  port.onMessage.addListener(msg => {
    const { tabId, injectScript, registerPort, contentMsg } = msg;
    if (typeof tabId !== "number") {
      return;
    }
    if (registerPort === true) {
      panelPorts[tabId] = port;
    }
    if (typeof injectScript === "string") {
      browser.tabs.executeScript(tabId, { file: injectScript });
    }
    // Forward all messages with a 'contentMsg' property
    // from the panel instance to the content script
    if (contentMsg) {
      //browser.tabs.sendMessage(tabId, contentMsg);
    }
  });
});

/**
 * Forward content script messages to the correct panel instance
 */
browser.runtime.onMessage.addListener((msg, sender) => {
  console.log("onMessage", { msg, sender });

  const { tab } = sender;
  if (!tab || typeof tab !== "object" || typeof tab.id !== "number") {
    return;
  }
  const port = panelPorts[tab.id];

  if (port && typeof port === "object") {
    console.log("Forwarding message", msg);
    port.postMessage(msg);
  }
});
