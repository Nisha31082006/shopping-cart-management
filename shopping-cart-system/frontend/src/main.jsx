import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// StrictMode is intentionally not used: in development it runs effects twice,
// which would print "Shopping Cart System Loaded" two times in the console.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
