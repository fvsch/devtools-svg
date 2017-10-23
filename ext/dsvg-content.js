/**
 * @file Content script injected by devtools-svg extension
 * (We’re keeping some state information in a few variables, declared
 * as `let` because in some cases it looks like this script is injected
 * several times and this creates issues with `const`.)
 */

// Simplify page URL a bit, dropping the query string and hash
let THIS_URL = document.location.origin + document.location.pathname;
// Keep track of remote files we’re loading
let _urls = [];
// Keep track of validated results
let _results = [];

/**
 * Extract "clean" content from SVG elements, de-duping a set of element (for a document’s scope)
 * @return {function}
 */
function contentDataExtractor() {
  const known = [];
  return function getContentData(element) {
    // Keep track of original size (to show in the UI)
    const size = element.outerHTML.length;
    // Copy element code, without style on root element or <style> elements;
    // remove whitespace so we can de-duplicate instances of the same graphic
    const clone = stylelessClone(element);
    const clean = compactWS(clone.outerHTML);
    const inner = compactWS(clone.innerHTML);
    const duplicate = known.includes(inner);
    if (!duplicate) known.push(inner);
    return { size, clean, duplicate };
  };
}

/**
 * Remove extra whitespace and inter-tag spaces
 * @param {string} str
 * @returns {string}
 */
function compactWS(str) {
  return str.replace(/\s+/g, " ").replace(/> </g, "><");
}

/**
 * Clone a SVG or symbol node to remove its inline styles
 * @param el
 * @returns {Node}
 */
function stylelessClone(el) {
  const clone = el.cloneNode(true);
  clone.removeAttribute("style");
  clone.removeAttribute("class");
  Array.from(clone.querySelectorAll("style")).forEach(s => s.remove());
  // Missing a viewBox? Let's add one if we can
  if (!clone.getAttribute("viewBox")) {
    let w = parseInt(clone.getAttribute("width"), 10);
    let h = parseInt(clone.getAttribute("height"), 10);
    if (w && h) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  return clone;
}

function getSymbols(root) {
  const dataExtractor = contentDataExtractor();
  return Array.from(root.querySelectorAll("symbol[id]"))
    .filter(el => el.id)
    .map(el => {
      if (!el.id) return;
      const content = dataExtractor(el);
      if (content.duplicate) return;
      return {
        id: el.id,
        name: "symbol#" + el.id,
        content: content.clean,
        size: content.size
      };
    })
    .filter(item => item != null);
}

function getVisibleSvg(root) {
  const dataExtractor = contentDataExtractor();
  return Array.from(root.querySelectorAll("svg"))
    .map(el => {
      // Only work on displayed SVG elements (if more performant,
      // might be a good idea to move this test after the outerHTML one)
      const { width, height } = el.getBoundingClientRect();
      if (width < 4 || height < 4) return;
      // Bail if the image contains <symbol> or <use> elements
      if (el.querySelector("symbol, use")) return;
      // Get clean-ish source, avoid working twice on similar images
      const content = dataExtractor(el);
      if (content.duplicate) return;
      // Still there? It’s a keeper. But how can we name it?
      let name = "svg" + (el.id ? "#" + el.id : "");
      if (el.className) {
        name += Array.from(el.classList).map(c => "." + c).join("");
      }
      return {
        name: name,
        content: content.clean,
        size: content.size,
        width: width,
        height: height
      };
    })
    .filter(item => item != null);
}

/**
 * Add results of looking for SVG in the page to the cache,
 * and send them to the panel
 * @param {object} config
 */
function sendResult({ type, location, action, forceUpdate }) {
  // Get a saved result or make a new one
  let result = _results
    .filter(r => r.type === type && r.location === location)
    .pop();
  if (!result || forceUpdate === true) {
    result = { type: type, location: location, items: action() };
    _results.push(result);
  }
  browser.runtime.sendMessage({ result: result });
}

/**
 * Find unknown URLs in <use xlink:href="…"/>
 * We only pick up URLs of documents, not relative ones
 * Side effects: pushes to _urls
 * @param {Node} root
 * @param {bool} forceUpdate
 * @returns {Array}
 */
function getExternalUrls(root, forceUpdate) {
  return Array.from(root.querySelectorAll("svg use"))
    .map(el => {
      const href = el.href.baseVal.trim();
      if (!href || href.indexOf("#") <= 0) return null;
      const url = new URL(href.split("#")[0], THIS_URL).href;
      const isKnown = _urls.includes(url);
      if (isKnown && !forceUpdate) {
        return null;
      } else {
        if (!isKnown) _urls.push(url);
        return url;
      }
    })
    .filter(url => !!url);
}

/**
 * Look for SVG in this document and remote ones
 * This should be okay to call several times in a session, because
 * we're caching
 */
function lookUp(forceUpdate) {
  // Current document
  sendResult({
    type: "symbol",
    location: THIS_URL,
    action: () => getSymbols(document),
    forceUpdate: forceUpdate
  });
  sendResult({
    type: "svg",
    location: THIS_URL,
    action: () => getVisibleSvg(document),
    forceUpdate: forceUpdate
  });

  // External docs
  getExternalUrls(document, forceUpdate).forEach(url => {
    fetch(url).then(resp => resp.text()).then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      if (svgDoc.documentElement.nodeName === "svg") {
        sendResult({
          type: "symbol",
          location: url,
          action: () => getSymbols(svgDoc),
          forceUpdate: false
        });
      }
    });
  });
}

/**
 * Listen for commands from the panel
 */
// browser.runtime.onMessage.addListener(msg => {
//   if (msg === "update") {
//     lookUp(false);
//   }
//   if (msg === "update-force") {
//     lookUp(true);
//   }
// });

/**
 * Start looking for SVG content right away
 * This should work when re-opening the devtools now.
 */
lookUp(false);
