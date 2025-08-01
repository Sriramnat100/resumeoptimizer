import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

//Starts up website and shows app on the screen
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
