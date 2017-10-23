import "./base.css";
import store from "./store.js";
import Panel from "./components/Panel.html";

const svgPanel = {
  vm: null,
  store: store
};

function initPanel() {
  svgPanel.vm = new Panel({
    target: document.body
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPanel);
} else {
  initPanel();
}

export default svgPanel;
