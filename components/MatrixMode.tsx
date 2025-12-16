"use client"

import Link from "next/link"
import { useGame } from "@/lib/store"
import { getDeckStats } from "@/lib/deck"
import { ThemeToggle } from "./ThemeToggle"
import { DebugPanel } from "./DebugPanel"
import { IncidenceMatrix } from "./IncidenceMatrix"
import { Logo } from "./Logo"

export function MatrixMode() {
	const { deck } = useGame()

	const stats = getDeckStats(deck)

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
			{/* Header */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-3 sm:px-4 py-4">
					<div className="flex items-center gap-3">
						<div className="min-w-0">
							<Link href="/" className="inline-flex items-center gap-2">
								<Logo size={28} className="hidden min-[500px]:inline-block" />
								<h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap text-[var(--primary-dark)] dark:text-[var(--primary-dark)]">
									Spot it!
								</h1>
							</Link>
						</div>

						<div className="flex-1 min-w-0 flex justify-center">
							<Link
								href="/visualizer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								← Back to Visualizer
							</Link>
						</div>

						<div className="shrink-0">
							<ThemeToggle />
						</div>
					</div>
				</div>
			</header>

			{/* Main content */}
			<div className="flex-1 container mx-auto px-4 py-6">
				<div className="flex flex-col gap-6">
					{/* Control Panel at top */}
					<aside className="flex justify-center">
						<div className="w-full max-w-sm">
							<DebugPanel />
						</div>
					</aside>

					{/* Matrix content */}
					<main className="min-w-0">
						<div className="space-y-6">
							{/* Header */}
							<div>
								<h2 className="text-2xl font-bold tracking-tight">
									Incidence Matrix
								</h2>
								<p className="text-muted-foreground mt-1">
									{stats.totalCards} cards × {stats.totalSymbols} symbols
								</p>
							</div>

							{/* Matrix */}
							<div className="border rounded-lg bg-card p-4">
								<IncidenceMatrix showTitle={false} />
							</div>
						</div>
					</main>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
				<p>
					Built by{" "}
					<Link
						href="https://wustep.me"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary"
					>
						Stephen Wu
					</Link>
				</p>
			</footer>
		</div>
	)
}
