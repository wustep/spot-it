"use client"

import { useMemo } from "react"
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
import { Info } from "lucide-react"

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
		<div className="flex flex-col gap-8 w-full max-w-full">
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
			<IncidenceMatrix />
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
				"bg-card border rounded-lg px-4 py-3 text-center",
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
