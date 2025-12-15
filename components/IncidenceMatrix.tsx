"use client"

import { useMemo, useState } from "react"
import { useGame } from "@/lib/store"
import { Emoji } from "./Emoji"
import { cn } from "@/lib/utils"

interface IncidenceMatrixProps {
	showTitle?: boolean
	className?: string
}

export function IncidenceMatrix({
	showTitle = true,
	className,
}: IncidenceMatrixProps) {
	const {
		deck,
		symbolStyle,
		highlightedSymbol,
		highlightedCard,
		highlightSymbol,
		highlightCard,
	} = useGame()

	const [showMatrixLabels, setShowMatrixLabels] = useState(false)
	const isEmojiMode = symbolStyle !== "numbers"

	// Find cards that contain the highlighted symbol
	const cardsWithSymbol = useMemo(() => {
		if (highlightedSymbol === null) return new Set<number>()
		const cards = deck.cards.filter((c) => c.symbols.includes(highlightedSymbol))
		return new Set(cards.map((c) => c.id))
	}, [deck, highlightedSymbol])

	// Find symbols in the highlighted card
	const symbolsInCard = useMemo(() => {
		if (highlightedCard === null) return new Set<number>()
		const card = deck.cards.find((c) => c.id === highlightedCard)
		return new Set(card?.symbols ?? [])
	}, [deck, highlightedCard])

	return (
		<div className={className}>
			<div className="flex items-center justify-between mb-4">
				{showTitle && (
					<h3 className="text-lg font-semibold">
						Incidence Matrix
						{highlightedSymbol !== null && (
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								— Symbol appears on {cardsWithSymbol.size} cards
							</span>
						)}
						{highlightedCard !== null && (
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								— Card #{highlightedCard + 1} has {symbolsInCard.size} symbols
							</span>
						)}
					</h3>
				)}
				<div className="flex items-center gap-1.5">
					<div
						className={cn(
							"w-2.5 h-2.5 rounded-full transition-colors",
							!showMatrixLabels ? "bg-primary" : "bg-muted-foreground/40"
						)}
					/>
					<button
						onClick={() => setShowMatrixLabels(!showMatrixLabels)}
						className={cn(
							"w-10 h-5 rounded-full transition-colors relative",
							showMatrixLabels ? "bg-primary" : "bg-muted-foreground/30"
						)}
						aria-label="Toggle symbol display in matrix"
					>
						<span
							className={cn(
								"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
								showMatrixLabels ? "left-5" : "left-0.5"
							)}
						/>
					</button>
					<span
						className={cn(
							"transition-opacity flex items-center justify-center w-4 h-4",
							showMatrixLabels ? "opacity-100" : "opacity-40"
						)}
					>
						{isEmojiMode ? (
							<Emoji emoji="😀" className="w-4 h-4" />
						) : (
							<span className="text-xs font-mono font-bold">1</span>
						)}
					</span>
				</div>
			</div>
			<div className="overflow-x-auto">
				<div className="inline-block">
					{/* Header row - symbols */}
					<div className="flex">
						<div className="w-12 h-8" /> {/* Empty corner */}
						<div className="flex bg-muted/50 rounded-t-md border-x border-t border-border/40">
							{deck.symbols.map((symbol, index) => (
								<div
									key={symbol.id}
									className={cn(
										"w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-colors",
										index !== 0 && "border-l border-border/30",
										highlightedSymbol === symbol.id &&
											"bg-yellow-200 dark:bg-yellow-900/70"
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
					</div>
					{/* Card rows */}
					{deck.cards.map((card, cardIndex) => (
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
								#{card.id + 1}
							</div>
							<div
								className={cn(
									"flex border-x border-border/40 bg-muted/30",
									cardIndex === deck.cards.length - 1 &&
										"border-b rounded-b-md"
								)}
							>
								{deck.symbols.map((symbol, index) => {
									const hasSymbol = card.symbols.includes(symbol.id)
									const isRowHighlighted = highlightedCard === card.id
									const isColHighlighted = highlightedSymbol === symbol.id

									return (
										<div
											key={symbol.id}
											className={cn(
												"w-8 h-8 flex items-center justify-center border-t border-border/30",
												index !== 0 && "border-l border-border/30",
												(isRowHighlighted || isColHighlighted) && "bg-muted/70",
												isRowHighlighted && isColHighlighted && "bg-primary/20"
											)}
										>
											{hasSymbol &&
												(showMatrixLabels ? (
													symbol.emoji ? (
														<Emoji emoji={symbol.emoji} className="w-5 h-5" />
													) : (
														<span className="text-xs font-mono font-medium text-foreground/80">
															{symbol.label}
														</span>
													)
												) : (
													<div
														className={cn(
															"w-3 h-3 rounded-full",
															isRowHighlighted && isColHighlighted
																? "bg-primary"
																: "bg-foreground/60"
														)}
													/>
												))}
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

