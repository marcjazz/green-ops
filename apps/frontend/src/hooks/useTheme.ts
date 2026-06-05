import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "greenops-theme";

function getStoredTheme(): Theme {
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "dark" || stored === "light") return stored;
	}
	return "light";
}

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>(getStoredTheme);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem(STORAGE_KEY, newTheme);
		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(theme === "dark" ? "light" : "dark");
	}, [theme, setTheme]);

	useEffect(() => {
		const stored = getStoredTheme();
		if (stored === "dark") {
			document.documentElement.classList.add("dark");
		}
	}, []);

	return { theme, setTheme, toggleTheme };
}
