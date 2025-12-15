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
								<h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
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
							<div className="flex items-center justify-between flex-wrap gap-4">
								<div>
									<h2 className="text-2xl font-bold tracking-tight">
										Incidence Matrix
									</h2>
									<p className="text-muted-foreground mt-1">
										{stats.totalCards} cards × {stats.totalSymbols} symbols
										{highlightedSymbol !== null && (
											<span className="ml-2">
												— Symbol appears on {cardsWithSymbol.size} cards
											</span>
										)}
										{highlightedCard !== null && (
											<span className="ml-2">
												— Card #{highlightedCard + 1} has {symbolsInCard.size}{" "}
												symbols
											</span>
										)}
									</p>
								</div>

								{/* Toggle for showing labels */}
								<div className="flex items-center gap-1.5">
									<div
										className={cn(
											"w-2.5 h-2.5 rounded-full transition-colors",
											!showMatrixLabels
												? "bg-primary"
												: "bg-muted-foreground/40"
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

							{/* Matrix */}
							<div className="overflow-x-auto border rounded-lg bg-card p-4">
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
													const isColHighlighted =
														highlightedSymbol === symbol.id

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
																		<Emoji
																			emoji={symbol.emoji}
																			className="w-5 h-5"
																		/>
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
