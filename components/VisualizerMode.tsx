"use client"

import { useMemo } from "react"
import { useGame } from "@/lib/store"
import { findCardsWithSymbol, getDeckStats } from "@/lib/deck"
import { SpotCard } from "./SpotCard"
import { Emoji } from "./Emoji"
import { cn } from "@/lib/utils"

// Calculate binomial coefficient (n choose k)
function binomial(n: number, k: number): number {
	if (k > n) return 0
	if (k === 0 || k === n) return 1
	// Use the multiplicative formula to avoid huge intermediate values
	let result = 1
	for (let i = 0; i < k; i++) {
		result = (result * (n - i)) / (i + 1)
	}
	return Math.round(result)
}

// Format large numbers with commas or scientific notation
function formatBigNumber(n: number): string {
	if (n >= 1e9) {
		return n.toExponential(2)
	}
	return n.toLocaleString()
}

export function VisualizerMode() {
	const {
		deck,
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
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">Deck Visualizer</h2>
				<p className="text-muted-foreground max-w-xl mx-auto">
					Explore the mathematical structure of the Spot It deck. Hover over
					symbols or cards to see connections.
				</p>
			</div>

			{/* Stats Panel */}
			<div className="flex flex-wrap justify-center gap-4">
				<StatBox label="Order (n)" value={stats.order} />
				<StatBox label="Total Cards" value={stats.totalCards} />
				<StatBox label="Total Symbols" value={stats.totalSymbols} />
				<StatBox label="Symbols/Card" value={stats.symbolsPerCard} />
				<StatBox
					label="Formula"
					value={`n² + n + 1 = ${stats.order}² + ${stats.order} + 1`}
					wide
				/>
			</div>

			{/* Incidence Matrix Explanation */}
			<div className="bg-muted/30 rounded-lg p-4 max-w-2xl mx-auto">
				<h3 className="font-semibold mb-2">About Spot It</h3>
				<p className="text-sm text-muted-foreground">
					Spot It is based on a <strong>finite projective plane</strong> of
					order {stats.order}. This mathematical structure guarantees that:
				</p>
				<ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
					<li>
						Every pair of cards shares <strong>exactly one</strong> symbol
					</li>
					<li>
						Every symbol appears on exactly{" "}
						<strong>{stats.symbolsPerCard}</strong> cards
					</li>
					<li>
						There are exactly <strong>{stats.totalCards}</strong> cards and
						symbols
					</li>
					<li>
						With <strong>{stats.totalSymbols}</strong> symbols and{" "}
						<strong>{stats.symbolsPerCard}</strong> per card, there are{" "}
						<strong className="font-mono">
							{formatBigNumber(
								binomial(stats.totalSymbols, stats.symbolsPerCard)
							)}
						</strong>{" "}
						possible card combinations, but we only use the ones in the
						projective plane.
					</li>
				</ul>
				{stats.order === 7 && (
					<p className="text-sm text-muted-foreground mt-2">
						<strong>Fun fact:</strong> The commercial Spot It game uses order 7
						(57 cards) but only includes 55 cards in the box — they drop 2 cards
						arbitrarily since the game still works!
					</p>
				)}
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
					<div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
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
									size="sm"
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
			<div>
				<h3 className="text-lg font-semibold mb-4">Incidence Matrix</h3>
				<div className="overflow-x-auto">
					<div className="inline-block">
						{/* Header row - symbols */}
						<div className="flex">
							<div className="w-12 h-8" /> {/* Empty corner */}
							{deck.symbols.map((symbol) => (
								<div
									key={symbol.id}
									className={cn(
										"w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-colors",
										highlightedSymbol === symbol.id &&
											"bg-yellow-100 dark:bg-yellow-900/50"
									)}
									onMouseEnter={() => highlightSymbol(symbol.id)}
									onMouseLeave={() => highlightSymbol(null)}
								>
									{symbol.emoji ? (
										<Emoji emoji={symbol.emoji} className="w-6 h-6" />
									) : (
										symbol.label
									)}
								</div>
							))}
						</div>
						{/* Card rows */}
						{deck.cards.map((card) => (
							<div key={card.id} className="flex">
								<div
									className={cn(
										"w-12 h-8 flex items-center justify-center text-xs font-mono text-muted-foreground cursor-pointer transition-colors",
										highlightedCard === card.id &&
											"bg-blue-100 dark:bg-blue-900/50"
									)}
									onMouseEnter={() => highlightCard(card.id)}
									onMouseLeave={() => highlightCard(null)}
								>
									#{card.id}
								</div>
								{deck.symbols.map((symbol) => {
									const hasSymbol = card.symbols.includes(symbol.id)
									const isRowHighlighted = highlightedCard === card.id
									const isColHighlighted = highlightedSymbol === symbol.id

									return (
										<div
											key={symbol.id}
											className={cn(
												"w-8 h-8 flex items-center justify-center border-r border-b border-border/30",
												(isRowHighlighted || isColHighlighted) && "bg-muted/50",
												isRowHighlighted && isColHighlighted && "bg-primary/20"
											)}
										>
											{hasSymbol && (
												<div
													className={cn(
														"w-3 h-3 rounded-full",
														isRowHighlighted && isColHighlighted
															? "bg-primary"
															: "bg-foreground/60"
													)}
												/>
											)}
										</div>
									)
								})}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

function StatBox({
	label,
	value,
	wide = false,
}: {
	label: string
	value: string | number
	wide?: boolean
}) {
	return (
		<div
			className={cn(
				"bg-card border rounded-lg px-4 py-3 text-center",
				wide ? "min-w-[200px]" : "min-w-[100px]"
			)}
		>
			<div className="text-xs text-muted-foreground uppercase tracking-wider">
				{label}
			</div>
			<div className="text-xl font-bold font-mono">{value}</div>
		</div>
	)
}
