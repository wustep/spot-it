"use client"

import { Suspense } from "react"
import Link from "next/link"
import { GameProvider } from "@/components/GameProvider"
import { DebugPanel } from "@/components/DebugPanel"
import { GameMode } from "@/components/GameMode"
import { VisualizerMode } from "@/components/VisualizerMode"
import { ArticlePage } from "@/components/ArticlePage"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useGame } from "@/lib/store"
import { BookOpen } from "lucide-react"

function MainContent() {
	const { viewMode } = useGame()

	// Article page has its own layout
	if (viewMode === "article") {
		return <ArticlePage />
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
			{/* Header */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-bold tracking-tight">Spot It!</h1>
							<p className="text-xs text-muted-foreground">
								Dobble Deck Visualizer
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Link
								href="/article"
								className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
							>
								<BookOpen className="w-4 h-4" />
								<span className="hidden sm:inline">Article</span>
							</Link>
							<ThemeToggle />
						</div>
					</div>
				</div>
			</header>

			{/* Main Layout */}
			<div className="container mx-auto px-4 py-6">
				<div className="flex flex-col lg:flex-row gap-6">
					{/* Debug Panel - Sidebar on large screens */}
					<aside className="lg:w-80 flex-shrink-0">
						<div className="lg:sticky lg:top-24">
							<DebugPanel />
						</div>
					</aside>

					{/* Main Content */}
					<main className="flex-1 min-w-0">
						{viewMode === "game" ? <GameMode /> : <VisualizerMode />}
					</main>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
				<p>
					Built with Next.js • Based on{" "}
					<a
						href="https://en.wikipedia.org/wiki/Projective_plane"
						target="_blank"
						rel="noopener noreferrer"
						className="underline hover:text-foreground"
					>
						Finite Projective Planes
					</a>
				</p>
			</footer>
		</div>
	)
}

export default function Home() {
	return (
		<Suspense fallback={<div className="min-h-screen" />}>
			<GameProvider>
				<MainContent />
			</GameProvider>
		</Suspense>
	)
}
