import { browser } from "webextension-polyfill-ts"

const PANEL_URL: string = browser.runtime.getURL('/panel.html')

/**
 * Keep track of panel <-> background connection ports
 */
const panelPorts = {}

/**
 * Listen for connections opened by panel instances
 */
browser.runtime.onConnect.addListener(port => {
  if (port.sender.url !== PANEL_URL) {
    return
  }
  // Inject content script, saving the port
  port.onMessage.addListener(msg => {
    const { tabId, injectScript, registerPort, contentMsg } = msg
    if (typeof tabId !== 'number') {
      return
    }
    if (registerPort === true) {
      panelPorts[tabId] = port
    }
    if (typeof injectScript === 'string') {
      browser.tabs.executeScript(tabId, { file: injectScript })
    }
    // Forward all messages with a 'contentMsg' property
    // from the panel instance to the content script
    if (contentMsg) {
      //browser.tabs.sendMessage(tabId, contentMsg);
    }
  })
})

/**
 * Forward content script messages to the correct panel instance
 */
browser.runtime.onMessage.addListener((msg, sender) => {
  const { tab } = sender
  if (!tab || typeof tab !== 'object' || typeof tab.id !== 'number') {
    return
  }
  const port = panelPorts[tab.id]

  if (port && typeof port === 'object') {
    console.log('Forwarding message', msg)
    port.postMessage(msg)
  }
})
