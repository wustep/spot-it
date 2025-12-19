"use client"

import { useState } from "react"
import { useGame } from "@/lib/store"
import { Emoji } from "./Emoji"
import { cn } from "@/lib/utils"

interface IncidenceMatrixProps {
	showTitle?: boolean
	className?: string
	// When used from VisualizerMode, these props control selection state
	pinnedSymbol?: number | null
	pinnedCard?: number | null
	hoveredSymbol?: number | null
	hoveredCard?: number | null
	onHoverSymbol?: (id: number | null) => void
	onHoverCard?: (id: number | null) => void
	onPinSymbol?: (id: number) => void
	onPinCard?: (id: number) => void
}

export function IncidenceMatrix({
	showTitle = true,
	className,
	pinnedSymbol: externalPinnedSymbol,
	pinnedCard: externalPinnedCard,
	hoveredSymbol: externalHoveredSymbol,
	hoveredCard: externalHoveredCard,
	onHoverSymbol,
	onHoverCard,
	onPinSymbol,
	onPinCard,
}: IncidenceMatrixProps) {
	const {
		deck,
		symbolStyle,
		highlightedSymbol: globalHighlightedSymbol,
		highlightedCard: globalHighlightedCard,
		highlightSymbol: globalHighlightSymbol,
		highlightCard: globalHighlightCard,
	} = useGame()

	// Use external props if provided, otherwise fall back to global state
	const isControlled = onHoverSymbol !== undefined
	const activeSymbol = isControlled
		? externalPinnedSymbol ?? externalHoveredSymbol
		: globalHighlightedSymbol
	const activeCard = isControlled
		? externalPinnedCard ?? externalHoveredCard
		: globalHighlightedCard

	const [showMatrixLabels, setShowMatrixLabels] = useState(false)
	const isEmojiMode = symbolStyle !== "numbers"

	// Handlers that work in both controlled and uncontrolled modes
	const handleSymbolHover = (id: number | null) => {
		if (isControlled) {
			onHoverSymbol?.(id)
		} else {
			globalHighlightSymbol(id)
		}
	}

	const handleCardHover = (id: number | null) => {
		if (isControlled) {
			onHoverCard?.(id)
		} else {
			globalHighlightCard(id)
		}
	}

	const handleSymbolClick = (id: number) => {
		if (isControlled) {
			onPinSymbol?.(id)
		}
	}

	const handleCardClick = (id: number) => {
		if (isControlled) {
			onPinCard?.(id)
		}
	}

	return (
		<div className={className}>
			<div className="flex items-center justify-between mb-4">
				{showTitle && (
					<h3 className="text-lg font-semibold">Incidence Matrix</h3>
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
							{deck.symbols.map((symbol, index) => {
								const isActive = activeSymbol === symbol.id
								const isPinned =
									isControlled && externalPinnedSymbol === symbol.id

								return (
									<div
										key={symbol.id}
										className={cn(
											"relative w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-colors",
											index !== 0 && "border-l border-border/30",
											isActive && "bg-yellow-200 dark:bg-yellow-900/70",
											isPinned && "ring-1 ring-inset ring-purple-600"
										)}
										onMouseEnter={() => handleSymbolHover(symbol.id)}
										onMouseLeave={() => handleSymbolHover(null)}
										onClick={() => handleSymbolClick(symbol.id)}
									>
										{symbol.emoji ? (
											<Emoji emoji={symbol.emoji} className="w-6 h-6" />
										) : (
											symbol.label
										)}
									</div>
								)
							})}
						</div>
					</div>
					{/* Card rows */}
					{deck.cards.map((card, cardIndex) => {
						const isCardActive = activeCard === card.id
						const isCardPinned = isControlled && externalPinnedCard === card.id

						return (
							<div key={card.id} className="flex">
								<div
									className={cn(
										"relative w-12 h-8 flex items-center justify-center text-xs font-mono text-muted-foreground cursor-pointer transition-colors",
										isCardActive && "bg-blue-100 dark:bg-blue-900/50",
										isCardPinned && "ring-1 ring-inset ring-purple-600"
									)}
									onMouseEnter={() => handleCardHover(card.id)}
									onMouseLeave={() => handleCardHover(null)}
									onClick={() => handleCardClick(card.id)}
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
										const isRowHighlighted = isCardActive
										const isColHighlighted = activeSymbol === symbol.id

										return (
											<div
												key={symbol.id}
												className={cn(
													"w-8 h-8 flex items-center justify-center border-t border-border/30",
													index !== 0 && "border-l border-border/30",
													(isRowHighlighted || isColHighlighted) &&
														"bg-muted/70",
													isRowHighlighted &&
														isColHighlighted &&
														"bg-primary/20"
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
						)
					})}
				</div>
			</div>
		</div>
	)
}
