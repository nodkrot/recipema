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

// Register Service Worker for image caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}
