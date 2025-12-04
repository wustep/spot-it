"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark">("light")
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		// Check for saved preference or system preference
		const saved = localStorage.getItem("theme")
		if (saved === "dark" || saved === "light") {
			setTheme(saved)
			document.documentElement.classList.toggle("dark", saved === "dark")
		} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			setTheme("dark")
			document.documentElement.classList.add("dark")
		}
	}, [])

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light"
		setTheme(newTheme)
		localStorage.setItem("theme", newTheme)
		document.documentElement.classList.toggle("dark", newTheme === "dark")
	}

	// Avoid hydration mismatch
	if (!mounted) {
		return (
			<Button variant="outline" size="sm" className="w-20">
				<span className="opacity-0">Theme</span>
			</Button>
		)
	}

	return (
		<Button variant="outline" size="sm" onClick={toggleTheme} className="w-20">
			{theme === "light" ? "Dark" : "Light"}
		</Button>
	)
}
