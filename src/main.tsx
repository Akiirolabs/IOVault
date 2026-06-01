/**
 * Application entry point.
 * Mounts the React app into index.html's #root and loads global styles.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
