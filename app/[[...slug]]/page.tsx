"use client"

import { Suspense } from "react"
import Link from "next/link"
import { GameProvider } from "@/components/GameProvider"
import { DebugPanel } from "@/components/DebugPanel"
import { EmojiPreloader } from "@/components/EmojiPreloader"
import { GameMode } from "@/components/GameMode"
import { VisualizerMode } from "@/components/VisualizerMode"
import { ArticlePage } from "@/components/ArticlePage"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useGame } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Eye, Gamepad2 } from "lucide-react"

function Landing() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
			<div className="container mx-auto px-4 py-10">
				<div className="flex items-center justify-end">
					<ThemeToggle />
				</div>

				<div className="mt-10 flex flex-col items-center text-center">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
						Spot it!
					</h1>
					<p className="mt-2 text-muted-foreground">
						Choose a mode to get started.
					</p>

					<div className="mt-10 w-full max-w-xl grid gap-4">
						<Link href="/game/practice" className="w-full">
							<Button className="w-full h-16 text-lg">
								<span className="inline-flex items-center justify-center gap-2">
									<Gamepad2 className="h-5 w-5" aria-hidden="true" />
									Game
								</span>
							</Button>
						</Link>
						<Link href="/visualizer" className="w-full">
							<Button variant="outline" className="w-full h-16 text-lg">
								<span className="inline-flex items-center justify-center gap-2">
									<Eye className="h-5 w-5" aria-hidden="true" />
									Visualizer
								</span>
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

function MainContent() {
	const { viewMode } = useGame()

	if (viewMode === "home") {
		return <Landing />
	}

	// Article pages have their own layout
	if (viewMode === "article") {
		return <ArticlePage showBackButton={true} />
	}
	if (viewMode === "article-full") {
		return <ArticlePage showBackButton={false} />
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
			{/* Header */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-bold tracking-tight">Spot it!</h1>
						</div>
						<div className="flex items-center gap-2">
							<nav className="flex items-center gap-2 mr-2">
								<Link href="/game/practice">
									<Button
										variant={viewMode === "game" ? "default" : "outline"}
										size="sm"
									>
										<span className="inline-flex items-center gap-2">
											<Gamepad2 className="h-4 w-4" aria-hidden="true" />
											Game
										</span>
									</Button>
								</Link>
								<Link href="/visualizer">
									<Button
										variant={viewMode === "visualizer" ? "default" : "outline"}
										size="sm"
									>
										<span className="inline-flex items-center gap-2">
											<Eye className="h-4 w-4" aria-hidden="true" />
											Visualizer
										</span>
									</Button>
								</Link>
							</nav>
							<ThemeToggle />
						</div>
					</div>
				</div>
			</header>

			{/* Main Layout */}
			<div className="container mx-auto px-4 py-6">
				<div className="flex flex-col lg:flex-row gap-6 lg:justify-center">
					{/* Debug Panel - Sidebar on large screens, centered on mobile */}
					<aside className="lg:w-80 flex-shrink-0 flex justify-center lg:justify-start">
						<div className="lg:sticky lg:top-24 w-full max-w-sm">
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
				<EmojiPreloader />
				<MainContent />
			</GameProvider>
		</Suspense>
	)
}
