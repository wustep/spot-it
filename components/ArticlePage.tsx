"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useGame } from "@/lib/store"
import { generateDeck, findSharedSymbol } from "@/lib/deck"
import { SpotCard } from "./SpotCard"

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

export function ArticlePage() {
	const { symbolMode } = useGame()

	// Using order 7 (8 symbols per card) as the example
	const order = 7
	const totalCards = order * order + order + 1 // 57
	const symbolsPerCard = order + 1 // 8
	const totalSymbols = totalCards // 57
	const possibleCombinations = binomial(totalSymbols, symbolsPerCard)

	// Generate a small example deck for demonstrations
	const exampleDeck = useMemo(
		() => generateDeck(3, symbolMode === "emojis"),
		[symbolMode]
	)

	// Pick two example cards to show shared symbol
	const card1 = exampleDeck.cards[0]
	const card2 = exampleDeck.cards[1]
	const sharedSymbol = findSharedSymbol(card1, card2)

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-3xl mx-auto px-4 py-8">
				<div className="mb-8">
					<Link href="/game/practice">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft className="w-4 h-4" />
							Back
						</Button>
					</Link>
				</div>

				<article className="prose prose-zinc dark:prose-invert max-w-none">
					<h1 className="text-2xl font-bold">The Mathematics Behind Spot It</h1>

					<p className="lead">
						Spot It (also known as Dobble) is a card game where every pair of
						cards shares exactly one matching symbol. This seemingly simple
						property is guaranteed by a beautiful mathematical structure called
						a <strong>finite projective plane</strong>.
					</p>

					<h2>How the Game Works</h2>

					<p>
						Pick any two cards — they will always share <em>exactly one</em>{" "}
						symbol. Try it yourself:
					</p>

					{/* Interactive card example */}
					<div className="not-prose my-6">
						<div className="flex flex-wrap items-center justify-center gap-8">
							<SpotCard
								card={card1}
								symbols={exampleDeck.symbols}
								sharedSymbol={sharedSymbol}
								size="lg"
							/>
							<div className="text-2xl font-bold text-muted-foreground">vs</div>
							<SpotCard
								card={card2}
								symbols={exampleDeck.symbols}
								sharedSymbol={sharedSymbol}
								size="lg"
							/>
						</div>
						<p className="text-center text-sm text-muted-foreground mt-4">
							The matching symbol is highlighted with a pulse animation
						</p>
					</div>

					<p>
						In a standard Spot It deck, there are{" "}
						<strong>{totalCards} cards</strong> and{" "}
						<strong>{totalSymbols} unique symbols</strong>. Each card displays
						exactly <strong>{symbolsPerCard} symbols</strong>.
					</p>

					<h2>The Math: Finite Projective Planes</h2>

					<p>
						The structure that makes Spot It work is a{" "}
						<strong>finite projective plane of order n</strong>. For order{" "}
						{order}, this gives us:
					</p>

					<ul>
						<li>
							<strong>Total cards/symbols:</strong> n² + n + 1 = {order}² +{" "}
							{order} + 1 = <strong>{totalCards}</strong>
						</li>
						<li>
							<strong>Symbols per card:</strong> n + 1 = {order} + 1 ={" "}
							<strong>{symbolsPerCard}</strong>
						</li>
						<li>
							<strong>Cards each symbol appears on:</strong> n + 1 ={" "}
							<strong>{symbolsPerCard}</strong>
						</li>
					</ul>

					<p>
						In a projective plane, &ldquo;cards&rdquo; correspond to <em>lines</em>{" "}
						and &ldquo;symbols&rdquo; correspond to <em>points</em>. The key
						properties are:
					</p>

					<ul>
						<li>
							Any two lines intersect at exactly one point (any two cards share
							one symbol)
						</li>
						<li>
							Any two points lie on exactly one line (any two symbols appear
							together on one card)
						</li>
						<li>
							Every line contains the same number of points (every card has the
							same number of symbols)
						</li>
					</ul>

					<h2>Why Only Certain Deck Sizes Exist</h2>

					<p>
						Finite projective planes only exist when the order n is a{" "}
						<strong>prime power</strong> (a number of the form p<sup>k</sup>{" "}
						where p is prime). This means:
					</p>

					<div className="not-prose my-6">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[2, 3, 4, 5, 7, 8, 9, 11].map((n) => (
								<div
									key={n}
									className="bg-card border rounded-lg p-3 text-center"
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
						Notice that order 6 is missing — 6 is not a prime power (it&apos;s 2 ×
						3), so a projective plane of order 6 doesn&apos;t exist. This means you{" "}
						<strong>
							cannot create a valid Spot It deck with 7 symbols per card
						</strong>
						. The jump from 6 to 8 symbols per card is unavoidable!
					</p>

					<h2>The Combinatorial Explosion</h2>

					<p>
						To appreciate how special this structure is, consider the
						alternative. With {totalSymbols} symbols and {symbolsPerCard} per
						card, there are:
					</p>

					<div className="not-prose my-6 bg-muted/50 rounded-lg p-4 text-center">
						<div className="text-sm text-muted-foreground mb-1">
							C({totalSymbols}, {symbolsPerCard}) =
						</div>
						<div className="text-2xl font-bold font-mono">
							{formatBigNumber(possibleCombinations)}
						</div>
						<div className="text-sm text-muted-foreground mt-1">
							possible card combinations
						</div>
					</div>

					<p>
						Yet the projective plane picks exactly <strong>{totalCards}</strong>{" "}
						of these combinations that guarantee every pair shares exactly one
						symbol. Finding such a set by brute force would be computationally
						infeasible — the mathematical structure gives it to us directly.
					</p>

					<h2>The Commercial Game</h2>

					<p>
						The commercial Spot It game uses order 7 ({symbolsPerCard} symbols
						per card), which should give {totalCards} cards. However, the actual
						game only includes <strong>55 cards</strong> in the box — they
						arbitrarily remove 2 cards. The game still works because any subset
						of a projective plane maintains the &ldquo;exactly one shared symbol&rdquo;
						property!
					</p>

					<h2>Try It Yourself</h2>

					<p>
						Use the{" "}
						<Link href="/visualizer" className="text-primary hover:underline">
							Visualizer
						</Link>{" "}
						to explore the full structure interactively. Hover over symbols to
						see which cards contain them, or hover over cards to see their
						symbols highlighted in the incidence matrix.
					</p>

					<div className="not-prose mt-8 flex gap-4">
						<Link href="/game/practice">
							<Button>Play the Game</Button>
						</Link>
						<Link href="/visualizer">
							<Button variant="outline">Open Visualizer</Button>
						</Link>
					</div>
				</article>
			</div>
		</div>
	)
}
