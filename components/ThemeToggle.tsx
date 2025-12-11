"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark">("light")
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
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
			<Button variant="outline" size="icon">
				<span className="h-4 w-4" />
			</Button>
		)
	}

	return (
		<Button variant="outline" size="icon" onClick={toggleTheme}>
			{theme === "light" ? (
				<Moon className="h-4 w-4" />
			) : (
				<Sun className="h-4 w-4" />
			)}
		</Button>
	)
}
