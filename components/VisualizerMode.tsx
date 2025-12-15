"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGame } from "@/lib/store"
import { findCardsWithSymbol, getDeckStats } from "@/lib/deck"
import { SpotCard } from "./SpotCard"
import { Emoji } from "./Emoji"
import { IncidenceMatrix } from "./IncidenceMatrix"
import { cn } from "@/lib/utils"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronDown } from "lucide-react"

export function VisualizerMode() {
	const {
		deck,
		hardMode,
		highlightedSymbol,
		highlightedCard,
		highlightSymbol,
		highlightCard,
	} = useGame()

	const stats = getDeckStats(deck)

	const matrixSectionRef = useRef<HTMLElement | null>(null)
	const [isMatrixVisible, setIsMatrixVisible] = useState(false)
	const [isHintDismissed, setIsHintDismissed] = useState(false)
	const [isDismissStateLoaded, setIsDismissStateLoaded] = useState(false)

	const dismissHint = useCallback(() => {
		setIsHintDismissed(true)
		setIsDismissStateLoaded(true)
		try {
			window.sessionStorage.setItem("visualizerMatrixHintDismissed", "1")
		} catch {
			// ignore
		}
	}, [])

	// Load persisted dismissal state after mount.
	// We intentionally hide the hint until this is loaded to avoid a "flash then disappear"
	// when SSR renders the component without access to sessionStorage.
	useEffect(() => {
		let cancelled = false
		const load = () => {
			if (cancelled) return
			let dismissed = false
			try {
				dismissed =
					window.sessionStorage.getItem("visualizerMatrixHintDismissed") === "1"
			} catch {
				// ignore
			}
			if (cancelled) return
			setIsHintDismissed(dismissed)
			setIsDismissStateLoaded(true)
		}
		const raf = window.requestAnimationFrame(load)
		return () => {
			cancelled = true
			window.cancelAnimationFrame(raf)
		}
	}, [])

	useEffect(() => {
		const el = matrixSectionRef.current
		if (!el) return

		const obs = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				setIsMatrixVisible(Boolean(entry?.isIntersecting))
			},
			{
				threshold: 0.12,
				// Give the header some breathing room and hide the hint a bit early
				rootMargin: "-96px 0px -30% 0px",
			}
		)

		obs.observe(el)
		return () => obs.disconnect()
	}, [])

	const scrollToMatrix = useCallback(() => {
		dismissHint()
		matrixSectionRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		})
	}, [dismissHint])

	// Dismiss the hint after the first *manual* scroll intent (wheel/touch/keyboard).
	// This is more reliable than relying on scrollTop deltas (and avoids dismissing due
	// to scroll restoration).
	useEffect(() => {
		if (isHintDismissed) return

		const container = document.querySelector<HTMLElement>(
			'[data-scroll-container="main"]'
		)

		const onWheel = () => dismissHint()
		const onTouchMove = () => dismissHint()

		const onKeyDown = (e: KeyboardEvent) => {
			// Don't dismiss when typing in inputs/textareas/contenteditable elements.
			const el = e.target as HTMLElement | null
			if (el) {
				const tag = el.tagName
				if (
					tag === "INPUT" ||
					tag === "TEXTAREA" ||
					tag === "SELECT" ||
					el.isContentEditable
				) {
					return
				}
			}

			// Keys that commonly scroll the page.
			if (
				e.key === "ArrowDown" ||
				e.key === "PageDown" ||
				e.key === " " ||
				e.key === "End"
			) {
				dismissHint()
			}
		}

		if (container) {
			container.addEventListener("wheel", onWheel, { passive: true })
			container.addEventListener("touchmove", onTouchMove, { passive: true })
		} else {
			window.addEventListener("wheel", onWheel, { passive: true })
			window.addEventListener("touchmove", onTouchMove, { passive: true })
		}
		window.addEventListener("keydown", onKeyDown)

		return () => {
			if (container) {
				container.removeEventListener("wheel", onWheel)
				container.removeEventListener("touchmove", onTouchMove)
			} else {
				window.removeEventListener("wheel", onWheel)
				window.removeEventListener("touchmove", onTouchMove)
			}
			window.removeEventListener("keydown", onKeyDown)
		}
	}, [dismissHint, isHintDismissed])

	// Find cards that contain the highlighted symbol
	const cardsWithSymbol = useMemo(() => {
		if (highlightedSymbol === null) return new Set<number>()
		const cards = findCardsWithSymbol(deck, highlightedSymbol)
		return new Set(cards.map((c) => c.id))
	}, [deck, highlightedSymbol])

	// Find symbols in the highlighted card
	const symbolsInCard = useMemo(() => {
		if (highlightedCard === null) return new Set<number>()
		const card = deck.cards.find((c) => c.id === highlightedCard)
		return new Set(card?.symbols ?? [])
	}, [deck, highlightedCard])

	return (
		<div className="relative flex flex-col gap-8 w-full max-w-full">
			{/* Header */}
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">Deck Visualizer</h2>
				<p className="text-muted-foreground max-w-xl mx-auto">
					Explore the mathematical structure of the Spot It deck. Hover over
					symbols or cards to see connections.
					{/* <Link href="/article" className="text-primary hover:underline">
						Learn more about the math
					</Link> */}
				</p>
			</div>

			{/* Stats Panel */}
			<div className="flex flex-wrap justify-center gap-4">
				<StatBox label="Symbols/Card" value={stats.symbolsPerCard} />
				<StatBox
					label="Order (n)"
					value={stats.order}
					tooltip={
						<>
							<p className="font-semibold mb-1">Order = Symbols per Card − 1</p>
							<p>
								Spot It is based on a{" "}
								<span className="font-medium">finite projective plane</span> of
								order n. In projective geometry, each &ldquo;line&rdquo; (card)
								contains n + 1 &ldquo;points&rdquo; (symbols), and any two lines
								intersect at exactly one point, guaranteeing a match!
							</p>
						</>
					}
				/>
				<StatBox
					label="Formula"
					value={`n² + n + 1 = ${stats.order}² + ${stats.order} + 1`}
					wide
				/>
				<StatBox label="Total Cards & Symbols" value={stats.totalCards} />
			</div>

			<div className="grid lg:grid-cols-2 gap-8">
				{/* Symbol Legend */}
				<div>
					<h3 className="text-lg font-semibold mb-4">
						Symbols ({deck.symbols.length})
						{highlightedSymbol !== null && (
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								— appears on {cardsWithSymbol.size} cards
							</span>
						)}
					</h3>
					<div className="flex flex-wrap gap-2">
						{deck.symbols.map((symbol) => {
							const isHighlighted = highlightedSymbol === symbol.id
							const isInCard = symbolsInCard.has(symbol.id)

							return (
								<button
									key={symbol.id}
									className={cn(
										"w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
										"border hover:scale-110",
										isHighlighted &&
											"bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 scale-110",
										isInCard &&
											!isHighlighted &&
											"bg-blue-100 dark:bg-blue-900/50 border-blue-400",
										!isHighlighted &&
											!isInCard &&
											"bg-card border-border hover:border-primary/50"
									)}
									onMouseEnter={() => highlightSymbol(symbol.id)}
									onMouseLeave={() => highlightSymbol(null)}
									onClick={() =>
										highlightSymbol(
											highlightedSymbol === symbol.id ? null : symbol.id
										)
									}
								>
									{symbol.emoji ? (
										<Emoji emoji={symbol.emoji} className="w-8 h-8" />
									) : (
										symbol.label
									)}
								</button>
							)
						})}
					</div>
				</div>

				{/* Card Grid */}
				<div>
					<h3 className="text-lg font-semibold mb-4">
						Cards ({deck.cards.length})
						{highlightedCard !== null && (
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								— Card #{highlightedCard} contains {symbolsInCard.size} symbols
							</span>
						)}
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{deck.cards.map((card) => {
							const isHighlighted = highlightedCard === card.id
							const hasSymbol = cardsWithSymbol.has(card.id)

							return (
								<SpotCard
									key={card.id}
									card={card}
									symbols={deck.symbols}
									isSelected={isHighlighted}
									highlightedSymbol={highlightedSymbol}
									onClick={() =>
										highlightCard(highlightedCard === card.id ? null : card.id)
									}
									size="md"
									hardMode={hardMode}
									className={cn(
										hasSymbol && !isHighlighted && "ring-2 ring-yellow-400/50"
									)}
								/>
							)
						})}
					</div>
				</div>
			</div>

			{/* Incidence Matrix (for decks up to n=7, which has 57 cards) */}
			<section ref={matrixSectionRef} aria-label="Incidence matrix">
				<IncidenceMatrix />
			</section>

			{/* Scroll hint (shown until the matrix enters view) */}
			<div
				className={cn(
					"fixed left-1/2 -translate-x-1/2 bottom-5 z-40",
					"transition-all duration-200 ease-out",
					!isDismissStateLoaded || isMatrixVisible || isHintDismissed
						? "opacity-0 pointer-events-none translate-y-2"
						: "opacity-100 pointer-events-auto translate-y-0"
				)}
			>
				<button
					type="button"
					onClick={scrollToMatrix}
					className={cn(
						"rounded-full border bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md px-4 py-2.5",
						"shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]",
						"dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]",
						"hover:bg-card hover:border-primary/60 hover:shadow-lg transition-all duration-200",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						"group"
					)}
					aria-label="Scroll down to the incidence matrix"
				>
					<span className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
						<span>View Matrix</span>
						<ChevronDown
							className="h-4 w-4 relative top-px motion-safe:animate-bounce motion-reduce:animate-none group-hover:text-primary transition-colors"
							aria-hidden="true"
						/>
					</span>
				</button>
			</div>
		</div>
	)
}

function StatBox({
	label,
	value,
	wide = false,
	tooltip,
}: {
	label: string
	value: string | number
	wide?: boolean
	tooltip?: React.ReactNode
}) {
	const content = (
		<div
			className={cn(
				"bg-gradient-to-br from-card to-muted/30 border rounded-lg px-4 py-3 text-center",
				"shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
				"hover:shadow-md transition-shadow duration-200",
				wide ? "min-w-[200px]" : "min-w-[100px]",
				tooltip && "cursor-help"
			)}
		>
			<div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
				{label}
			</div>
			<div className="text-xl font-bold font-mono">{value}</div>
		</div>
	)

	if (tooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{content}</TooltipTrigger>
				<TooltipContent className="max-w-xs text-left">
					{tooltip}
				</TooltipContent>
			</Tooltip>
		)
	}

	return content
}
