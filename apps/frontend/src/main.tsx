import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { AuthProviderWrapper } from "./auth/AuthProvider.js";

const storedTheme = localStorage.getItem("greenops-theme");
if (storedTheme === "dark") {
	document.documentElement.classList.add("dark");
}

// biome-ignore lint/style/noNonNullAssertion: root element exists in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<AuthProviderWrapper>
			<App />
		</AuthProviderWrapper>
	</React.StrictMode>,
);
