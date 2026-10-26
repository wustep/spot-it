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
import { SpotCard } from "@/components/SpotCard"
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
import { ChevronRight, Eye, Gamepad2, Settings2, Timer } from "lucide-react"

function ControlPanelButton() {
	const [isOpen, setIsOpen] = useState(false)
	const [isPinned, setIsPinned] = useState(false)
	const timeoutRef = useRef<number | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const closePanel = useCallback(() => {
		setIsPinned(false)
		setIsOpen(false)
	}, [])

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

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && (isOpen || isPinned)) {
				closePanel()
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [isOpen, isPinned, closePanel])

	// Close on click outside (but not on Radix portals like dropdowns)
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Element
			// Check if click is inside a Radix portal (dropdown, tooltip, etc.)
			const isInsideRadixPortal = target.closest(
				"[data-radix-popper-content-wrapper], [data-radix-select-viewport], [role='listbox']"
			)
			if (
				containerRef.current &&
				!containerRef.current.contains(target) &&
				!isInsideRadixPortal &&
				(isOpen || isPinned)
			) {
				closePanel()
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [isOpen, isPinned, closePanel])

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

const MODES = [
	{
		href: "/practice",
		label: "Practice",
		description: "Match cards freely and explore the deck.",
		Icon: Gamepad2,
	},
	{
		href: "/timed",
		label: "Timed",
		description: "Race the clock and test your speed.",
		Icon: Timer,
	},
	{
		href: "/visualizer",
		label: "Visualizer",
		description: "Visualize how the deck is constructed.",
		Icon: Eye,
	},
] as const

// Two real cards from the deck, overlapped, with their one shared symbol lit
function HeroCards() {
	const { deck, hardMode } = useGame()
	const [a, b] = [deck.cards[0], deck.cards[deck.cards.length - 1]]
	if (!a || !b) return null
	const shared = a.symbols.find((s) => b.symbols.includes(s)) ?? null

	return (
		<div className="relative h-[14rem] w-[17rem] sm:h-[20rem] sm:w-[27rem] shrink-0">
			<SpotCard
				card={a}
				symbols={deck.symbols}
				sharedSymbol={shared}
				dimOthers={false}
				size="xl"
				hardMode={hardMode}
				className="absolute left-0 top-0 w-44 h-44 sm:w-64 sm:h-64 border-[3px] border-card-a -rotate-6"
			/>
			<SpotCard
				card={b}
				symbols={deck.symbols}
				sharedSymbol={shared}
				dimOthers={false}
				size="xl"
				hardMode={hardMode}
				className="absolute right-0 bottom-0 w-44 h-44 sm:w-64 sm:h-64 border-[3px] border-card-b rotate-6"
			/>
		</div>
	)
}

function Landing() {
	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			{/* Faint dot grid, like the felt of a game table */}
			<div
				aria-hidden="true"
				className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.06] text-primary"
				style={{
					backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
					backgroundSize: "28px 28px",
				}}
			/>

			<div className="container mx-auto px-4 py-6 sm:py-10 relative">
				<div className="flex items-center justify-end">
					<ThemeToggle />
				</div>

				<div className="mt-6 sm:mt-12 md:mt-0 md:min-h-[calc(100svh-8rem)] flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 lg:gap-24">
					<HeroCards />

					<div className="w-full max-w-md flex flex-col items-center md:items-start text-center md:text-left">
						<h1 className="font-display text-4xl sm:text-5xl font-bold leading-none flex items-center gap-3 text-[var(--primary-dark)]">
							<Logo size={44} />
							Spot it!
						</h1>
						<p className="mt-3 text-lg text-muted-foreground max-w-sm">
							Every pair of cards shares exactly one symbol. Can you spot
							it first?
						</p>

						<nav aria-label="Modes" className="mt-8 w-full grid gap-3">
							{MODES.map(({ href, label, description, Icon }) => (
								<Link
									key={href}
									href={href}
									className="group flex items-center gap-4 rounded-2xl border bg-card px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(61,51,70,0.05)] transition-[border-color,box-shadow,translate] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_10px_24px_-12px_rgba(61,51,70,0.35)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
								>
									<span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/12 text-[var(--primary-dark)] transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
										<Icon className="h-5 w-5" aria-hidden="true" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-base font-bold leading-snug">
											{label}
										</span>
										<span className="block text-sm text-muted-foreground">
											{description}
										</span>
									</span>
									<ChevronRight
										className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
										aria-hidden="true"
									/>
								</Link>
							))}
						</nav>

						<Link
							href="/article"
							className="mt-6 text-sm font-semibold text-[var(--primary-dark)] underline decoration-primary/40 hover:decoration-primary"
						>
							The mathematics behind Spot it!
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
						<div className="min-w-0 flex items-center">
							<Link href="/" className="inline-flex items-center gap-2">
								<Logo size={28} className="hidden min-[500px]:inline-block" />
								<h1 className="font-display text-xl sm:text-2xl font-bold leading-none whitespace-nowrap pt-1 text-[var(--primary-dark)]">
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
				<div className="container mx-auto px-4 pt-8 pb-6 sm:py-6">
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
