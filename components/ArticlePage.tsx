"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
	generateDeck,
	findSharedSymbol,
	findCardsWithSymbol,
	type Deck,
} from "@/lib/deck"
import { SpotCard } from "./SpotCard"
import { Emoji } from "./Emoji"
import { cn } from "@/lib/utils"

// Calculate binomial coefficient (n choose k)
function binomial(n: number, k: number): number {
	if (k > n) return 0
	if (k === 0 || k === n) return 1
	let result = 1
	for (let i = 0; i < k; i++) {
		result = (result * (n - i)) / (i + 1)
	}
	return Math.round(result)
}

// Format large numbers with commas
function formatBigNumber(n: number): string {
	if (n >= 1e9) {
		return n.toExponential(2)
	}
	return n.toLocaleString()
}

interface ArticlePageProps {
	showBackButton?: boolean
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

// Interactive Symbol Grid component for article
function SymbolGrid({
	deck,
	highlightedSymbol,
	setHighlightedSymbol,
}: {
	deck: Deck
	highlightedSymbol: number | null
	setHighlightedSymbol: (id: number | null) => void
}) {
	return (
		<div className="flex flex-wrap gap-2 justify-center">
			{deck.symbols.map((symbol) => {
				const isHighlighted = highlightedSymbol === symbol.id

				return (
					<button
						key={symbol.id}
						className={cn(
							"w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
							"border hover:scale-110",
							isHighlighted &&
								"bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 scale-110",
							!isHighlighted && "bg-card border-border hover:border-primary/50"
						)}
						onMouseEnter={() => setHighlightedSymbol(symbol.id)}
						onMouseLeave={() => setHighlightedSymbol(null)}
						onClick={() =>
							setHighlightedSymbol(
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
	)
}

// Mini Card Grid component for article
function MiniCardGrid({
	deck,
	highlightedSymbol,
	cardsWithSymbol,
}: {
	deck: Deck
	highlightedSymbol: number | null
	cardsWithSymbol: Set<number>
}) {
	return (
		<div className="grid grid-cols-4 sm:grid-cols-7 gap-2 justify-items-center">
			{deck.cards.map((card) => {
				const hasSymbol = cardsWithSymbol.has(card.id)

				return (
					<SpotCard
						key={card.id}
						card={card}
						symbols={deck.symbols}
						highlightedSymbol={highlightedSymbol}
						size="sm"
						className={cn(hasSymbol && "ring-2 ring-yellow-400")}
					/>
				)
			})}
		</div>
	)
}

// Incidence Matrix component for article
function IncidenceMatrix({
	deck,
	highlightedSymbol,
	setHighlightedSymbol,
	highlightedCard,
	setHighlightedCard,
}: {
	deck: Deck
	highlightedSymbol: number | null
	setHighlightedSymbol: (id: number | null) => void
	highlightedCard: number | null
	setHighlightedCard: (id: number | null) => void
}) {
	return (
		<div className="overflow-x-auto">
			<div className="inline-block">
				{/* Header row - symbols */}
				<div className="flex">
					<div className="w-10 h-8" /> {/* Empty corner */}
					{deck.symbols.map((symbol) => (
						<div
							key={symbol.id}
							className={cn(
								"w-6 h-8 flex items-center justify-center text-xs cursor-pointer transition-colors",
								highlightedSymbol === symbol.id &&
									"bg-yellow-100 dark:bg-yellow-900/50"
							)}
							onMouseEnter={() => setHighlightedSymbol(symbol.id)}
							onMouseLeave={() => setHighlightedSymbol(null)}
						>
							{symbol.emoji ? (
								<Emoji emoji={symbol.emoji} className="w-4 h-4" />
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
								"w-10 h-6 flex items-center justify-center text-xs font-mono text-muted-foreground cursor-pointer transition-colors",
								highlightedCard === card.id && "bg-blue-100 dark:bg-blue-900/50"
							)}
							onMouseEnter={() => setHighlightedCard(card.id)}
							onMouseLeave={() => setHighlightedCard(null)}
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
										"w-6 h-6 flex items-center justify-center border-r border-b border-border/30",
										(isRowHighlighted || isColHighlighted) && "bg-muted/50",
										isRowHighlighted && isColHighlighted && "bg-primary/20"
									)}
								>
									{hasSymbol && (
										<div
											className={cn(
												"w-2 h-2 rounded-full",
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
	)
}

export function ArticlePage({ showBackButton = true }: ArticlePageProps) {
	// Using order 7 (8 symbols per card) as the main example
	const order = 7
	const totalCards = order * order + order + 1 // 57
	const symbolsPerCard = order + 1 // 8
	const totalSymbols = totalCards // 57
	const possibleCombinations = binomial(totalSymbols, symbolsPerCard)

	// Generate the main example deck (order 7) for interactive demo
	const mainDeck = useMemo(() => generateDeck(7, true), [])

	// Generate a small example deck (order 3) for visualizer components
	const smallDeck = useMemo(() => generateDeck(3, true), [])

	// Interactive card matching state
	const [cardIndices, setCardIndices] = useState({ idx1: 0, idx2: 1 })
	const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none")
	const [revealedSymbol, setRevealedSymbol] = useState<number | null>(null)

	const card1 = mainDeck.cards[cardIndices.idx1]
	const card2 = mainDeck.cards[cardIndices.idx2]
	const sharedSymbol = findSharedSymbol(card1, card2)

	const pickNewCards = useCallback(() => {
		const len = mainDeck.cards.length
		const idx1 = Math.floor(Math.random() * len)
		let idx2 = Math.floor(Math.random() * (len - 1))
		if (idx2 >= idx1) idx2++
		setCardIndices({ idx1, idx2 })
		setRevealedSymbol(null)
		setFeedback("none")
	}, [mainDeck.cards.length])

	const handleSymbolClick = useCallback(
		(symbolId: number) => {
			if (feedback !== "none") return

			const isCorrect = symbolId === sharedSymbol
			setFeedback(isCorrect ? "correct" : "wrong")

			if (isCorrect) {
				setRevealedSymbol(symbolId)
				setTimeout(() => {
					pickNewCards()
				}, 1000)
			} else {
				setTimeout(() => {
					setFeedback("none")
				}, 500)
			}
		},
		[feedback, sharedSymbol, pickNewCards]
	)

	// State for visualizer exploration
	const [highlightedSymbol, setHighlightedSymbol] = useState<number | null>(
		null
	)
	const [highlightedCard, setHighlightedCard] = useState<number | null>(null)

	// Find cards that contain the highlighted symbol
	const cardsWithSymbol = useMemo(() => {
		if (highlightedSymbol === null) return new Set<number>()
		const cards = findCardsWithSymbol(smallDeck, highlightedSymbol)
		return new Set(cards.map((c) => c.id))
	}, [smallDeck, highlightedSymbol])

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{showBackButton && (
					<div className="mb-8">
						<Link href="/practice">
							<Button variant="ghost" size="sm" className="gap-2">
								<ArrowLeft className="w-4 h-4" />
								Back
							</Button>
						</Link>
					</div>
				)}

				<article className="prose prose-zinc dark:prose-invert max-w-none">
					<h1 className="text-3xl font-bold">
						The Mathematics Behind Spot it!
					</h1>

					<p className="lead text-lg text-muted-foreground">
						Spot it! (also known as Dobble) is a card game where every pair of
						cards shares exactly one matching symbol. This seemingly simple
						property is guaranteed by a beautiful mathematical structure called
						a <strong>finite projective plane</strong>.
					</p>

					<h2 className="text-2xl font-semibold mt-10">
						Try It: Find the Match
					</h2>

					<p>
						Pick any two cards from a Spot it! deck — they will always share{" "}
						<em>exactly one</em> symbol. Click the matching symbol below:
					</p>

					{/* Interactive card example */}
					<div className="not-prose my-8">
						{/* Feedback */}
						<div className="text-center mb-4 h-8">
							{feedback === "correct" && (
								<span className="text-xl font-bold text-green-500">
									Correct!
								</span>
							)}
							{feedback === "wrong" && (
								<span className="text-xl font-bold text-red-500">
									Try again!
								</span>
							)}
							{feedback === "none" && (
								<span className="text-sm text-muted-foreground">
									Click the matching symbol on either card
								</span>
							)}
						</div>

						<div className="flex flex-wrap items-center justify-center gap-8">
							<SpotCard
								card={card1}
								symbols={mainDeck.symbols}
								sharedSymbol={revealedSymbol}
								onSymbolClick={
									feedback === "none" ? handleSymbolClick : undefined
								}
								size="lg"
								className="ring-2 ring-rose-500"
							/>
							<div className="text-2xl font-bold text-muted-foreground">vs</div>
							<SpotCard
								card={card2}
								symbols={mainDeck.symbols}
								sharedSymbol={revealedSymbol}
								onSymbolClick={
									feedback === "none" ? handleSymbolClick : undefined
								}
								size="lg"
								className="ring-2 ring-sky-500"
							/>
						</div>
					</div>

					<p>
						In a standard Spot it! deck (order 7), there are{" "}
						<strong>{totalCards} cards</strong> and{" "}
						<strong>{totalSymbols} unique symbols</strong>. Each card displays
						exactly <strong>{symbolsPerCard} symbols</strong>.
					</p>

					{/* Stats Panel */}
					<div className="not-prose my-8">
						<div className="flex flex-wrap justify-center gap-4">
							<StatBox label="Order (n)" value={order} />
							<StatBox label="Total Cards" value={totalCards} />
							<StatBox label="Total Symbols" value={totalSymbols} />
							<StatBox label="Symbols/Card" value={symbolsPerCard} />
						</div>
					</div>

					<h2 className="text-2xl font-semibold mt-10">
						Finite Projective Planes
					</h2>

					<p>
						The structure that makes Spot It work is a{" "}
						<strong>finite projective plane of order n</strong>. Think of it as
						a special kind of geometry where:
					</p>

					<ul>
						<li>
							<strong>Points</strong> are symbols
						</li>
						<li>
							<strong>Lines</strong> are cards
						</li>
						<li>
							Every two lines intersect at exactly one point (any two cards
							share exactly one symbol)
						</li>
						<li>
							Every two points lie on exactly one line (any two symbols appear
							together on exactly one card)
						</li>
					</ul>

					<p>For a projective plane of order n:</p>

					<div className="not-prose my-6 bg-muted/30 rounded-lg p-6">
						<div className="grid sm:grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-sm text-muted-foreground mb-1">
									Total Cards & Symbols
								</div>
								<div className="text-xl font-mono font-bold">n² + n + 1</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">
									Symbols per Card
								</div>
								<div className="text-xl font-mono font-bold">n + 1</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">
									Cards per Symbol
								</div>
								<div className="text-xl font-mono font-bold">n + 1</div>
							</div>
						</div>
					</div>

					<h2 className="text-2xl font-semibold mt-10">
						Explore the Structure
					</h2>

					<p>
						Below is a smaller deck (order 3) to help visualize the structure.
						Hover over any symbol to see which cards contain it:
					</p>

					{/* Symbol Grid */}
					<div className="not-prose my-8">
						<h3 className="text-lg font-semibold mb-4 text-center">
							All {smallDeck.symbols.length} Symbols
							{highlightedSymbol !== null && (
								<span className="ml-2 text-sm font-normal text-muted-foreground">
									— appears on {cardsWithSymbol.size} cards
								</span>
							)}
						</h3>
						<SymbolGrid
							deck={smallDeck}
							highlightedSymbol={highlightedSymbol}
							setHighlightedSymbol={setHighlightedSymbol}
						/>
					</div>

					{/* Card Grid */}
					<div className="not-prose my-8">
						<h3 className="text-lg font-semibold mb-4 text-center">
							All {smallDeck.cards.length} Cards
						</h3>
						<MiniCardGrid
							deck={smallDeck}
							highlightedSymbol={highlightedSymbol}
							cardsWithSymbol={cardsWithSymbol}
						/>
					</div>

					<p>
						Notice how each symbol appears on exactly <strong>4 cards</strong>{" "}
						(n + 1 = 3 + 1 = 4), and each card contains exactly{" "}
						<strong>4 symbols</strong>. This perfect symmetry is what makes the
						&ldquo;exactly one match&rdquo; property work.
					</p>

					<h2 className="text-2xl font-semibold mt-10">The Incidence Matrix</h2>

					<p>
						The relationship between cards and symbols can be visualized as a
						matrix where rows are cards, columns are symbols, and a dot means
						&ldquo;this card contains this symbol&rdquo;:
					</p>

					{/* Incidence Matrix */}
					<div className="not-prose my-8 flex justify-center">
						<div className="border rounded-lg p-4 bg-card">
							<IncidenceMatrix
								deck={smallDeck}
								highlightedSymbol={highlightedSymbol}
								setHighlightedSymbol={setHighlightedSymbol}
								highlightedCard={highlightedCard}
								setHighlightedCard={setHighlightedCard}
							/>
						</div>
					</div>

					<p>
						Hover over rows and columns to explore. Notice that any two rows
						share exactly one column with dots — proving any two cards share
						exactly one symbol!
					</p>

					<h2 className="text-2xl font-semibold mt-10">
						Why Only Certain Sizes Work
					</h2>

					<p>
						Finite projective planes only exist when the order n is a{" "}
						<strong>prime power</strong> (a number of the form p<sup>k</sup>{" "}
						where p is prime). This means valid deck sizes are limited:
					</p>

					<div className="not-prose my-8">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[2, 3, 4, 5, 7, 8, 9, 11].map((n) => (
								<div
									key={n}
									className={cn(
										"border rounded-lg p-3 text-center transition-colors",
										n === 7 ? "bg-primary/10 border-primary" : "bg-card"
									)}
								>
									<div className="text-xs text-muted-foreground">Order {n}</div>
									<div className="font-bold">{n + 1} symbols/card</div>
									<div className="text-sm text-muted-foreground">
										{n * n + n + 1} cards
									</div>
								</div>
							))}
						</div>
					</div>

					<p>
						Notice that order 6 is missing — 6 is not a prime power (it&apos;s 2
						× 3), so a projective plane of order 6 doesn&apos;t exist. This
						means you{" "}
						<strong>
							cannot create a valid Spot it! deck with 7 symbols per card
						</strong>
						! The jump from 6 to 8 symbols per card is mathematically
						unavoidable.
					</p>

					<h2 className="text-2xl font-semibold mt-10">
						The Combinatorial Miracle
					</h2>

					<p>
						To appreciate how special this structure is, consider the
						alternative. With {totalSymbols} symbols and {symbolsPerCard} per
						card, the number of possible card combinations is:
					</p>

					<div className="not-prose my-8 bg-muted/50 rounded-lg p-6 text-center">
						<div className="text-sm text-muted-foreground mb-1">
							C({totalSymbols}, {symbolsPerCard}) =
						</div>
						<div className="text-3xl font-bold font-mono text-primary">
							{formatBigNumber(possibleCombinations)}
						</div>
						<div className="text-sm text-muted-foreground mt-2">
							possible card combinations
						</div>
					</div>

					<p>
						Yet the projective plane picks exactly <strong>{totalCards}</strong>{" "}
						of these combinations that guarantee every pair shares exactly one
						symbol. Finding such a set by trial and error would be
						computationally infeasible — the mathematical structure gives it to
						us directly.
					</p>

					<h2 className="text-2xl font-semibold mt-10">The Commercial Game</h2>

					<p>
						The commercial Spot it! game uses order 7 ({symbolsPerCard} symbols
						per card), which should give {totalCards} cards. However, the actual
						game only includes <strong>55 cards</strong> in the box — they
						arbitrarily remove 2 cards for manufacturing reasons.
					</p>

					<p>
						The game still works perfectly because any subset of a projective
						plane maintains the &ldquo;exactly one shared symbol&rdquo;
						property! You can remove cards, but you can never add new ones
						without breaking the magic.
					</p>

					<h2 className="text-2xl font-semibold mt-10">Try It Yourself</h2>

					<p>
						Use the{" "}
						<Link
							href="/visualizer"
							className="text-primary hover:underline font-medium"
						>
							Visualizer
						</Link>{" "}
						to explore decks of different sizes interactively. Or jump into{" "}
						<Link
							href="/practice"
							className="text-primary hover:underline font-medium"
						>
							Practice Mode
						</Link>{" "}
						to test your pattern recognition speed!
					</p>

					<div className="not-prose mt-10 flex flex-wrap gap-4">
						<Link href="/practice">
							<Button size="lg">Play the Game</Button>
						</Link>
						<Link href="/visualizer">
							<Button variant="outline" size="lg">
								Open Visualizer
							</Button>
						</Link>
					</div>
				</article>
			</div>
		</div>
	)
}
