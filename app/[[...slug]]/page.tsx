"use client"

import { Suspense, useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GameProvider } from "@/components/GameProvider"
import { DebugPanel } from "@/components/DebugPanel"
import { EmojiPreloader } from "@/components/EmojiPreloader"
import { GameMode } from "@/components/GameMode"
import { VisualizerMode } from "@/components/VisualizerMode"
import { MatrixMode } from "@/components/MatrixMode"
import { ArticlePage } from "@/components/ArticlePage"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import { useGame } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Eye, Gamepad2, Settings2, Timer } from "lucide-react"

function ControlPanelButton() {
	const [isOpen, setIsOpen] = useState(false)
	const [isPinned, setIsPinned] = useState(false)
	const timeoutRef = useRef<number | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const handleMouseEnter = useCallback(() => {
		if (timeoutRef.current) {
			window.clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		if (!isPinned) {
			setIsOpen(true)
		}
	}, [isPinned])

	const handleMouseLeave = useCallback(() => {
		if (!isPinned) {
			timeoutRef.current = window.setTimeout(() => {
				setIsOpen(false)
			}, 150)
		}
	}, [isPinned])

	const handleClick = useCallback(() => {
		if (isPinned) {
			// Unpinning - close the panel
			setIsPinned(false)
			setIsOpen(false)
		} else {
			// Pinning - keep it open
			setIsPinned(true)
			setIsOpen(true)
		}
	}, [isPinned])

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	const showPanel = isOpen || isPinned

	return (
		<div
			ref={containerRef}
			className="relative"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Button
				variant="outline"
				size="icon"
				aria-expanded={showPanel}
				onClick={handleClick}
				className={`hover:bg-primary hover:text-primary-foreground hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary ${
					showPanel
						? "bg-primary text-primary-foreground border-primary dark:bg-primary dark:text-primary-foreground dark:border-primary"
						: ""
				}`}
			>
				<Settings2 className="h-4 w-4" />
				<span className="sr-only">Control Panel</span>
			</Button>

			{/* Dropdown Panel */}
			<div
				className={`
					absolute right-0 top-full z-50 pt-2
					transition-all duration-200 ease-out
					${
						showPanel
							? "opacity-100 translate-y-0 pointer-events-auto"
							: "opacity-0 -translate-y-2 pointer-events-none"
					}
				`}
			>
				<DebugPanel />
			</div>
		</div>
	)
}

function Landing() {
	const MODE_COPY = {
		practice: {
			description: "Match cards freely and explore the deck.",
		},
		timed: {
			description: "Race the clock and test your speed.",
		},
		visualizer: {
			description: "Visualize how the deck is constructed.",
		},
	} as const

	const [highlightedMode, setHighlightedMode] = useState<
		keyof typeof MODE_COPY | null
	>(null)

	const highlightTimeoutRef = useRef<number | null>(null)

	const scheduleHighlightMode = useRef(
		(mode: keyof typeof MODE_COPY | null) => {
			if (highlightTimeoutRef.current !== null) {
				window.clearTimeout(highlightTimeoutRef.current)
			}
			highlightTimeoutRef.current = window.setTimeout(() => {
				setHighlightedMode(mode)
			}, 140)
		}
	).current

	useEffect(() => {
		return () => {
			if (highlightTimeoutRef.current !== null) {
				window.clearTimeout(highlightTimeoutRef.current)
			}
		}
	}, [])

	const primaryHover =
		"hover:bg-primary hover:text-primary-foreground hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				{/* Large gradient orb */}
				<div className="absolute top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-gradient-to-b from-primary/30 to-primary/5 dark:from-primary/15 dark:to-primary/5 rounded-full blur-3xl" />
				{/* Subtle grid pattern */}
				<div
					className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
					style={{
						backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
						backgroundSize: "32px 32px",
					}}
				/>
			</div>

			<div className="container mx-auto px-4 py-10 relative">
				<div className="flex items-center justify-end">
					<ThemeToggle />
				</div>

				<div className="mt-10 flex flex-col items-center text-center">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
						<Logo size={40} />
						Spot it!
					</h1>
					<p className="mt-2 text-muted-foreground h-6">
						{highlightedMode
							? MODE_COPY[highlightedMode].description
							: "Choose a mode to get started."}
					</p>

					<div className="mt-10 w-full max-w-xl grid gap-4">
						<Link
							href="/practice"
							className="w-full group"
							onMouseEnter={() => scheduleHighlightMode("practice")}
							onMouseLeave={() => scheduleHighlightMode(null)}
							onFocus={() => scheduleHighlightMode("practice")}
							onBlur={() => scheduleHighlightMode(null)}
						>
							<Button
								variant="outline"
								className={`w-full h-16 text-lg ${primaryHover}`}
							>
								<span className="inline-flex items-center justify-center gap-2">
									<Gamepad2
										className="h-5 w-5 transition-transform group-hover:scale-110"
										aria-hidden="true"
									/>
									Practice
								</span>
							</Button>
						</Link>
						<Link
							href="/timed"
							className="w-full group"
							onMouseEnter={() => scheduleHighlightMode("timed")}
							onMouseLeave={() => scheduleHighlightMode(null)}
							onFocus={() => scheduleHighlightMode("timed")}
							onBlur={() => scheduleHighlightMode(null)}
						>
							<Button
								variant="outline"
								className={`w-full h-16 text-lg ${primaryHover}`}
							>
								<span className="inline-flex items-center justify-center gap-2">
									<Timer
										className="h-5 w-5 transition-transform group-hover:scale-110"
										aria-hidden="true"
									/>
									Timed
								</span>
							</Button>
						</Link>
						<Link
							href="/visualizer"
							className="w-full group"
							onMouseEnter={() => scheduleHighlightMode("visualizer")}
							onMouseLeave={() => scheduleHighlightMode(null)}
							onFocus={() => scheduleHighlightMode("visualizer")}
							onBlur={() => scheduleHighlightMode(null)}
						>
							<Button
								variant="outline"
								className={`w-full h-16 text-lg ${primaryHover}`}
							>
								<span className="inline-flex items-center justify-center gap-2">
									<Eye
										className="h-5 w-5 transition-transform group-hover:scale-110"
										aria-hidden="true"
									/>
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
	const router = useRouter()
	const { viewMode, gameSubMode } = useGame()

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

	// Matrix mode has its own full-width layout
	if (viewMode === "matrix") {
		return <MatrixMode />
	}

	return (
		<div className="h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
			{/* Header */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.015)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_3px_8px_rgba(0,0,0,0.08)]">
				<div className="container mx-auto px-3 sm:px-4 py-4">
					<div className="flex items-center gap-3">
						<div className="min-w-0">
							<Link href="/" className="inline-flex items-center gap-2">
								<Logo size={28} className="hidden min-[500px]:inline-block" />
								<h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
									Spot it!
								</h1>
							</Link>
						</div>

						<div className="flex-1 min-w-0 flex justify-center">
							{(() => {
								const navValue =
									viewMode === "visualizer" ? "visualizer" : gameSubMode

								const navigateTo = (v: string) => {
									if (v === "practice") router.push("/practice")
									else if (v === "timed") router.push("/timed")
									else if (v === "countdown") router.push("/countdown")
									else if (v === "visualizer") router.push("/visualizer")
								}

								return (
									<>
										{/* Desktop/tablet: tabs */}
										<div className="hidden sm:block">
											<Tabs value={navValue} onValueChange={navigateTo}>
												<TabsList className="mx-auto">
													<TabsTrigger value="practice" className="gap-2">
														<Gamepad2 className="h-4 w-4" aria-hidden="true" />
														Practice
													</TabsTrigger>
													<TabsTrigger value="timed" className="gap-2">
														<Timer className="h-4 w-4" aria-hidden="true" />
														Timed
													</TabsTrigger>
													<TabsTrigger value="visualizer" className="gap-2">
														<Eye className="h-4 w-4" aria-hidden="true" />
														Visualizer
													</TabsTrigger>
												</TabsList>
											</Tabs>
										</div>

										{/* Mobile: compact select */}
										<div className="sm:hidden w-full flex justify-center">
											<Select value={navValue} onValueChange={navigateTo}>
												<SelectTrigger
													size="default"
													aria-label="Select mode"
													className="w-full max-w-[12rem]"
												>
													{navValue === "practice" && (
														<Gamepad2 className="h-4 w-4" aria-hidden="true" />
													)}
													{navValue === "timed" && (
														<Timer className="h-4 w-4" aria-hidden="true" />
													)}
													{navValue === "visualizer" && (
														<Eye className="h-4 w-4" aria-hidden="true" />
													)}
													<SelectValue placeholder="Mode" />
												</SelectTrigger>
												<SelectContent align="center">
													<SelectItem value="practice">Practice</SelectItem>
													<SelectItem value="timed">Timed</SelectItem>
													<SelectItem value="visualizer">Visualizer</SelectItem>
													{navValue === "countdown" && (
														<SelectItem value="countdown">Countdown</SelectItem>
													)}
												</SelectContent>
											</Select>
										</div>
									</>
								)
							})()}
						</div>

						<div className="shrink-0 flex items-center gap-2">
							<ControlPanelButton />
							<ThemeToggle />
						</div>
					</div>
				</div>
			</header>

			{/* Scrollable content area (keeps scrollbar out of the navbar) */}
			<div
				className="flex-1 min-h-0 overflow-y-auto"
				data-scroll-container="main"
			>
				{/* Main Layout */}
				<div className="container mx-auto px-4 py-6">
					<main className="flex justify-center min-h-0">
						{viewMode === "game" ? <GameMode /> : <VisualizerMode />}
					</main>
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
