import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App.js";
import Store from "./utilities/store.js";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Store>
    <App />
  </Store>
);

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
