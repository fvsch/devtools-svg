/** Simplify page URL a bit, dropping the query string and hash */
const THIS_URL = document.location.origin + document.location.pathname;

/** Keep track of SVG and symbol tags we find */
const getContentData = (known => element => {
  // Keep track of original size (to show in the UI)
  const size = element.outerHTML.length;
  // Copy element code, without style on root element or <style> elements;
  // remove whitespace so we can de-duplicate instances of the same graphic
  const clean = stylelessClone(element)
    .outerHTML
    .replace(/\s+/g, " ")
    .replace(/> </g, "><");
  const duplicate = known.includes(clean);
  if (!duplicate) known.push(clean);
  return { size, clean, duplicate };
})([]);

/**
 * Keep track of remote files we’re loading
 */
const remoteDocs = [];

function stylelessClone(el) {
  const clone = el.cloneNode(true);
  clone.removeAttribute('style');
  clone.removeAttribute('class');
  Array.from(clone.querySelectorAll('style')).forEach(s => s.remove());
  // Missing a viewBox? Let's add one if we can
  if (!clone.getAttribute('viewBox')) {
    let w = parseInt(clone.getAttribute('width'), 10);
    let h = parseInt(clone.getAttribute('height'), 10);
    if (w && h) clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  return clone;
}

function getSymbols(root) {
  return Array.from(root.querySelectorAll("symbol[id]"))
    .filter(el => el.id)
    .map(el => {
      if (!el.id) return;
      const content = getContentData(el);
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
  return Array.from(root.querySelectorAll("svg"))
    .map(el => {
      // Only work on displayed SVG elements (if more performant,
      // might be a good idea to move this test after the outerHTML one)
      const { width, height } = el.getBoundingClientRect();
      if (width < 4 || height < 4) return;
      // Bail if the image contains <symbol> or <use> elements
      if (el.querySelector("symbol, use")) return;
      // Get clean-ish source, avoid working twice on similar images
      const content = getContentData(el);
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

browser.runtime.sendMessage({
  result: {
    type: "symbol",
    location: THIS_URL,
    items: getSymbols(document)
  }
});

browser.runtime.sendMessage({
  result: {
    type: "svg",
    location: THIS_URL,
    items: getVisibleSvg(document)
  }
});

Array.from(document.querySelectorAll("svg use")).forEach(el => {
  const href = el.href.baseVal.trim();
  if (!href || href.indexOf("#") <= 0) return;
  const svgUrl = new URL(href.split("#")[0], THIS_URL).href;

  if (!remoteDocs.includes(svgUrl)) {
    remoteDocs.push(svgUrl);
    fetch(svgUrl).then(resp => resp.text()).then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      if (svgDoc.documentElement.nodeName !== "svg") return;
      browser.runtime.sendMessage({
        result: {
          type: "symbol",
          location: svgUrl,
          items: getSymbols(svgDoc)
        }
      });
    });
  }
});
