import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App.js";
import Store from "./utilities/store.js";
import { registerSW } from 'virtual:pwa-register';
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Store>
    <App />
  </Store>
);

// Register Service Worker using vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration) {
    console.log('Service Worker registered successfully:', registration?.scope);
  },
  onRegisterError(error) {
    console.log('Service Worker registration failed:', error);
  }
});
