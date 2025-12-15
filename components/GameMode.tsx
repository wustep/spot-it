"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useGame } from "@/lib/store"
import { SpotCard } from "./SpotCard"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Emoji } from "./Emoji"
import { cn } from "@/lib/utils"

export function GameMode() {
	const {
		deck,
		gameSubMode,
		isPlaying,
		card1Index,
		card2Index,
		revealedSymbol,
		countdownInterval,
		stats,
		roundStartTime,
		hardMode,
		startGame,
		stopGame,
		nextRound,
		selectCard1,
		selectCard2,
		guessSymbol,
		revealMatch,
		setCountdownInterval,
	} = useGame()

	const card1 = card1Index !== null ? deck.cards[card1Index] : null
	const card2 = card2Index !== null ? deck.cards[card2Index] : null

	// Game mode state
	const [feedbackState, setFeedbackState] = useState<
		"none" | "correct" | "wrong"
	>("none")
	const [lastRoundTime, setLastRoundTime] = useState<number | null>(null)
	const [elapsedTime, setElapsedTime] = useState(0)

	// Live timer for game mode (update every second)
	useEffect(() => {
		if (gameSubMode !== "timed" || !isPlaying || !roundStartTime) {
			return
		}

		// Set initial time immediately
		setElapsedTime(0)

		const interval = setInterval(() => {
			setElapsedTime(Date.now() - roundStartTime)
		}, 1000)

		return () => clearInterval(interval)
	}, [gameSubMode, isPlaying, roundStartTime])

	// Handle guess in game mode
	const handleGuess = useCallback(
		(symbolId: number) => {
			const roundTime = roundStartTime ? Date.now() - roundStartTime : 0
			const correct = guessSymbol(symbolId)
			setFeedbackState(correct ? "correct" : "wrong")

			if (correct) {
				setLastRoundTime(roundTime)
				setTimeout(() => {
					setElapsedTime(0)
					nextRound()
					setFeedbackState("none")
				}, 1000)
			} else {
				setTimeout(() => {
					setFeedbackState("none")
				}, 1000)
			}
		},
		[guessSymbol, nextRound, roundStartTime]
	)

	// Countdown mode state
	const [countdown, setCountdown] = useState(countdownInterval)
	const [isRevealed, setIsRevealed] = useState(false)
	const countdownRef = useRef<NodeJS.Timeout | null>(null)

	// Countdown effect - clean interval-based approach
	useEffect(() => {
		const shouldPlay = gameSubMode === "countdown" && isPlaying

		if (!shouldPlay) {
			if (countdownRef.current) {
				clearInterval(countdownRef.current)
				countdownRef.current = null
			}
			setCountdown(countdownInterval)
			setIsRevealed(false)
			return
		}

		// Initialize
		setCountdown(countdownInterval)
		setIsRevealed(false)

		let currentCount = countdownInterval
		let revealed = false

		const tick = () => {
			if (!revealed) {
				if (currentCount > 1) {
					// Still counting down
					currentCount--
					setCountdown(currentCount)
				} else {
					// Reached 0, reveal the match
					revealed = true
					setIsRevealed(true)
					revealMatch()
				}
			} else {
				// After reveal, move to next round and reset
				revealed = false
				setIsRevealed(false)
				currentCount = countdownInterval
				setCountdown(currentCount)
				nextRound()
			}
		}

		countdownRef.current = setInterval(tick, 1000)

		return () => {
			if (countdownRef.current) {
				clearInterval(countdownRef.current)
				countdownRef.current = null
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gameSubMode, isPlaying, countdownInterval])

	// Pick random cards for practice mode
	const pickRandomCards = useCallback(() => {
		// Safety: should never happen with valid decks, but prevents a stuck state
		if (deck.cards.length < 2) {
			selectCard1(null)
			selectCard2(null)
			return
		}

		const indices = deck.cards.map((_, i) => i)
		const idx1 = Math.floor(Math.random() * indices.length)
		indices.splice(idx1, 1)
		const idx2 = Math.floor(Math.random() * indices.length)
		selectCard1(idx1)
		selectCard2(idx2 >= idx1 ? idx2 + 1 : idx2)
	}, [deck.cards, selectCard1, selectCard2])

	// Format time (whole seconds)
	const formatTime = (ms: number) => {
		const seconds = Math.floor(ms / 1000)
		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
	}

	// Format time with decimal (for averages)
	const formatTimeDecimal = (ms: number) => {
		const seconds = ms / 1000
		if (seconds < 60) return `${seconds.toFixed(1)}s`
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, "0")}`
	}

	const avgTime =
		stats.roundTimes.length > 0 ? stats.totalTime / stats.roundTimes.length : 0

	return (
		<div className="flex flex-col items-center gap-6">
			{/* Mode-specific content */}
			{gameSubMode === "practice" && (
				<PracticeMode
					deck={deck}
					card1={card1}
					card2={card2}
					card1Index={card1Index}
					card2Index={card2Index}
					hardMode={hardMode}
					selectCard1={selectCard1}
					selectCard2={selectCard2}
					pickRandomCards={pickRandomCards}
				/>
			)}

			{gameSubMode === "timed" && (
				<TimedMode
					deck={deck}
					card1={card1}
					card2={card2}
					isPlaying={isPlaying}
					revealedSymbol={revealedSymbol}
					feedbackState={feedbackState}
					stats={stats}
					elapsedTime={elapsedTime}
					lastRoundTime={lastRoundTime}
					hardMode={hardMode}
					startGame={startGame}
					stopGame={stopGame}
					handleGuess={handleGuess}
					formatTime={formatTime}
					formatTimeDecimal={formatTimeDecimal}
					avgTime={avgTime}
				/>
			)}

			{gameSubMode === "countdown" && (
				<CountdownMode
					deck={deck}
					card1={card1}
					card2={card2}
					isPlaying={isPlaying}
					revealedSymbol={revealedSymbol}
					countdown={countdown}
					countdownInterval={countdownInterval}
					isRevealed={isRevealed}
					hardMode={hardMode}
					setCountdownInterval={setCountdownInterval}
					startGame={startGame}
					stopGame={stopGame}
				/>
			)}
		</div>
	)
}

// Practice Mode Component
function PracticeMode({
	deck,
	card1,
	card2,
	card1Index,
	card2Index,
	hardMode,
	selectCard1,
	selectCard2,
	pickRandomCards,
}: {
	deck: ReturnType<typeof useGame>["deck"]
	card1: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card2: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card1Index: number | null
	card2Index: number | null
	hardMode: boolean
	selectCard1: (index: number | null) => void
	selectCard2: (index: number | null) => void
	pickRandomCards: () => void
}) {
	// Feedback state for symbol clicks
	const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none")
	const [revealedSymbol, setRevealedSymbol] = useState<number | null>(null)
	// Track which card to set next when clicking in the grid (alternates)
	const [nextCardToSet, setNextCardToSet] = useState<1 | 2>(2)

	// Auto-select cards when deck changes or cards become null
	useEffect(() => {
		if (deck.cards.length >= 2 && (!card1 || !card2)) {
			pickRandomCards()
		}
	}, [deck.cards.length, card1, card2, pickRandomCards])

	// Find the shared symbol
	const sharedSymbol =
		card1 && card2
			? (() => {
					const set1 = new Set(card1.symbols)
					for (const sym of card2.symbols) {
						if (set1.has(sym)) return sym
					}
					return null
			  })()
			: null

	// Handle symbol click
	const handleSymbolClick = (symbolId: number) => {
		if (feedback !== "none") return // Ignore clicks during feedback

		const isCorrect = symbolId === sharedSymbol
		setFeedback(isCorrect ? "correct" : "wrong")

		if (isCorrect) {
			setRevealedSymbol(symbolId)
			setTimeout(() => {
				setFeedback("none")
				setRevealedSymbol(null)
				pickRandomCards()
			}, 1000)
		} else {
			setTimeout(() => {
				setFeedback("none")
			}, 500)
		}
	}

	// Card size is always xl
	const cardSize = "xl"
	const gridCardSize = "md"

	// If cards not yet selected, show loading skeleton
	if (!card1 || !card2) {
		// Generate spiral positions for skeleton dots (like actual cards use)
		const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
		const skeletonPositions = [...Array(7)].map((_, i) => {
			const angle = GOLDEN_ANGLE * i
			const normalizedIndex = (i + 0.5) / 7
			const r = Math.sqrt(normalizedIndex) * 38
			return {
				x: 50 + r * Math.cos(angle),
				y: 50 + r * Math.sin(angle),
				size: i === 0 ? 14 : i < 3 ? 10 : 8, // Vary sizes like real cards
			}
		})

		return (
			<div className="flex flex-col items-center gap-6">
				<div className="text-center">
					<h2 className="text-2xl font-bold tracking-tight">Practice Mode</h2>
				</div>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
					{/* Skeleton Card 1 */}
					<div className="w-56 h-56 rounded-full bg-gradient-to-br from-muted to-muted/50 ring-2 ring-rose-500/30 relative overflow-hidden">
						{skeletonPositions.map((pos, i) => (
							<div
								key={i}
								className="absolute rounded-full bg-muted-foreground/20 animate-pulse"
								style={{
									left: `${pos.x}%`,
									top: `${pos.y}%`,
									width: `${pos.size}%`,
									height: `${pos.size}%`,
									transform: "translate(-50%, -50%)",
									animationDelay: `${i * 150}ms`,
								}}
							/>
						))}
					</div>

					<div className="text-3xl font-bold text-muted-foreground/30">vs</div>

					{/* Skeleton Card 2 */}
					<div className="w-56 h-56 rounded-full bg-gradient-to-br from-muted to-muted/50 ring-2 ring-sky-500/30 relative overflow-hidden">
						{skeletonPositions.map((pos, i) => (
							<div
								key={i}
								className="absolute rounded-full bg-muted-foreground/20 animate-pulse"
								style={{
									left: `${100 - pos.x}%`, // Mirror for variety
									top: `${pos.y}%`,
									width: `${pos.size}%`,
									height: `${pos.size}%`,
									transform: "translate(-50%, -50%)",
									animationDelay: `${i * 150 + 75}ms`,
								}}
							/>
						))}
					</div>
				</div>
				<p className="text-muted-foreground text-sm animate-pulse">
					Shuffling cards...
				</p>
			</div>
		)
	}

	return (
		<>
			{/* Instructions / Feedback */}
			<div className="text-center">
				{feedback === "none" && (
					<h2 className="text-2xl font-bold tracking-tight">Practice Mode</h2>
				)}
				{feedback === "correct" && (
					<h2 className="text-2xl font-bold tracking-tight text-green-500">
						Correct!
					</h2>
				)}
				{feedback === "wrong" && (
					<h2 className="text-2xl font-bold tracking-tight text-red-500">
						Try again!
					</h2>
				)}
			</div>

			{/* Comparison Area */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
				{/* Card 1 */}
				<div className="flex flex-col items-center gap-2">
					<SpotCard
						key={`card1-${card1.id}`}
						card={card1}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={revealedSymbol}
						onSymbolClick={feedback === "none" ? handleSymbolClick : undefined}
						size={cardSize}
						hardMode={hardMode}
						className="ring-2 ring-rose-500 scale-105"
					/>
				</div>

				{/* VS */}
				<div className="text-3xl font-bold text-muted-foreground/50">vs</div>

				{/* Card 2 */}
				<div className="flex flex-col items-center gap-2">
					<SpotCard
						key={`card2-${card2.id}`}
						card={card2}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={revealedSymbol}
						onSymbolClick={feedback === "none" ? handleSymbolClick : undefined}
						size={cardSize}
						hardMode={hardMode}
						className="ring-2 ring-sky-500 scale-105"
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3">
				<Button
					onClick={pickRandomCards}
					variant="secondary"
					size="icon"
					className="w-24"
					aria-label="New cards"
				>
					<Shuffle className="h-4 w-4" aria-hidden="true" />
				</Button>
			</div>

			{/* Card Grid */}
			<div className="mt-4">
				<h3 className="text-lg font-semibold mb-4 text-center">
					All Cards ({deck.cards.length})
				</h3>
				<div
					className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
				>
					{deck.cards.map((card, index) => {
						const isCard1 = card1Index === index
						const isCard2 = card2Index === index
						return (
							<SpotCard
								key={card.id}
								card={card}
								symbols={deck.symbols}
								isSelected={isCard1 || isCard2}
								onClick={() => {
									if (isCard1 || isCard2) {
										// Already selected, do nothing
										return
									}
									// Alternate between setting card1 and card2
									if (nextCardToSet === 1) {
										selectCard1(index)
										setNextCardToSet(2)
									} else {
										selectCard2(index)
										setNextCardToSet(1)
									}
								}}
								size={gridCardSize}
								hardMode={hardMode}
								className={cn(
									isCard1 && "ring-2 ring-rose-500",
									isCard2 && !isCard1 && "ring-2 ring-sky-500"
								)}
							/>
						)
					})}
				</div>
			</div>
		</>
	)
}

// Timed Mode Component
function TimedMode({
	deck,
	card1,
	card2,
	isPlaying,
	revealedSymbol,
	feedbackState,
	stats,
	elapsedTime,
	lastRoundTime,
	hardMode,
	startGame,
	stopGame,
	handleGuess,
	formatTime,
	formatTimeDecimal,
	avgTime,
}: {
	deck: ReturnType<typeof useGame>["deck"]
	card1: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card2: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	isPlaying: boolean
	revealedSymbol: number | null
	feedbackState: "none" | "correct" | "wrong"
	stats: ReturnType<typeof useGame>["stats"]
	elapsedTime: number
	lastRoundTime: number | null
	hardMode: boolean
	startGame: () => void
	stopGame: () => void
	handleGuess: (symbolId: number) => void
	formatTime: (ms: number) => string
	formatTimeDecimal: (ms: number) => string
	avgTime: number
}) {
	const cardSize = "xl"
	if (!isPlaying) {
		return (
			<div className="flex flex-col items-center gap-6">
				<div className="text-center space-y-2">
					<h2 className="text-2xl font-bold tracking-tight pb-2">Timed Mode</h2>
					<p className="text-muted-foreground max-w-md">
						Click the matching symbol as fast as you can! Track your accuracy
						and speed.
					</p>
				</div>

				{/* Previous stats */}
				{stats.correct + stats.wrong > 0 && (
					<div className="bg-card border rounded-lg p-4 space-y-3 text-center min-w-[280px]">
						<div className="text-sm text-muted-foreground font-medium">
							Last Session
						</div>
						<div className="grid grid-cols-3 gap-4 text-sm">
							<div>
								<div className="text-2xl font-bold text-green-500">
									{stats.correct}
								</div>
								<div className="text-muted-foreground">Correct</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-red-500">
									{stats.wrong}
								</div>
								<div className="text-muted-foreground">Wrong</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-yellow-500">
									{stats.bestStreak}
								</div>
								<div className="text-muted-foreground">Best Streak</div>
							</div>
						</div>
						{avgTime > 0 && (
							<div className="pt-2 border-t">
								<span className="text-muted-foreground">Avg time: </span>
								<span className="font-mono font-bold">
									{formatTimeDecimal(avgTime)}
								</span>
							</div>
						)}
					</div>
				)}

				<Button onClick={startGame} size="lg" className="text-lg px-8">
					Start
				</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center gap-4">
			{/* Stats bar */}
			<div className="flex items-center gap-6 text-sm">
				<div className="flex items-center gap-2">
					<span className="text-green-500 font-bold text-xl">
						{stats.correct}
					</span>
					<span className="text-muted-foreground">correct</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-red-500 font-bold text-xl">{stats.wrong}</span>
					<span className="text-muted-foreground">wrong</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-yellow-500 font-bold text-xl">
						{stats.streak}
					</span>
					<span className="text-muted-foreground">streak</span>
				</div>
			</div>

			{/* Timer and average */}
			<div className="flex items-center gap-6 text-sm bg-muted/50 rounded-lg px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground">Time:</span>
					<span className="font-mono font-bold text-lg min-w-[60px]">
						{formatTime(elapsedTime)}
					</span>
				</div>
				{avgTime > 0 && (
					<div className="flex items-center gap-2 border-l pl-4">
						<span className="text-muted-foreground">Avg:</span>
						<span className="font-mono font-medium">
							{formatTimeDecimal(avgTime)}
						</span>
					</div>
				)}
			</div>

			{/* Feedback with last round time */}
			<div className="h-10 flex items-center justify-center">
				{feedbackState === "correct" && lastRoundTime !== null && (
					<div className="text-green-500 font-bold text-xl animate-in fade-in zoom-in duration-200">
						{formatTimeDecimal(lastRoundTime)}
					</div>
				)}
				{feedbackState === "wrong" && (
					<div className="text-red-500 font-bold text-xl animate-in fade-in shake duration-200">
						Wrong!
					</div>
				)}
			</div>

			{/* Cards */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
				{card1 && (
					<SpotCard
						card={card1}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={revealedSymbol}
						onSymbolClick={feedbackState === "none" ? handleGuess : undefined}
						size={cardSize}
						hardMode={hardMode}
					/>
				)}
				<div className="text-3xl font-bold text-muted-foreground/50">vs</div>
				{card2 && (
					<SpotCard
						card={card2}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={revealedSymbol}
						onSymbolClick={feedbackState === "none" ? handleGuess : undefined}
						size={cardSize}
						hardMode={hardMode}
					/>
				)}
			</div>

			{/* Instructions */}
			<p className="text-muted-foreground text-sm">
				Click the symbol that appears on both cards!
			</p>

			{/* Stop button */}
			<Button onClick={stopGame} variant="outline" size="sm">
				Stop
			</Button>
		</div>
	)
}

// Countdown Mode Component
function CountdownMode({
	deck,
	card1,
	card2,
	isPlaying,
	revealedSymbol,
	countdown,
	countdownInterval,
	isRevealed,
	hardMode,
	setCountdownInterval,
	startGame,
	stopGame,
}: {
	deck: ReturnType<typeof useGame>["deck"]
	card1: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card2: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	isPlaying: boolean
	revealedSymbol: number | null
	countdown: number
	countdownInterval: number
	isRevealed: boolean
	hardMode: boolean
	setCountdownInterval: (seconds: number) => void
	startGame: () => void
	stopGame: () => void
}) {
	const cardSize = "xl"
	if (!isPlaying) {
		return (
			<div className="flex flex-col items-center gap-6">
				<div className="text-center space-y-2">
					<h2 className="text-2xl font-bold tracking-tight pb-2">
						Countdown Mode
					</h2>
					<p className="text-muted-foreground max-w-md">
						Watch and learn! Cards will automatically reveal the matching symbol
						after the countdown.
					</p>
				</div>

				{/* Interval selector */}
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">Reveal after:</span>
					<Select
						value={String(countdownInterval)}
						onValueChange={(v) => setCountdownInterval(Number(v))}
					>
						<SelectTrigger className="w-24">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="3">3 sec</SelectItem>
							<SelectItem value="5">5 sec</SelectItem>
							<SelectItem value="10">10 sec</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Button onClick={startGame} size="lg" className="text-lg px-8">
					Start
				</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center gap-6">
			{/* Countdown display - fixed height to prevent shifts */}
			<div className="h-24 flex flex-col items-center justify-center overflow-hidden">
				{isRevealed ? (
					<div
						key="revealed"
						className="flex items-center justify-center animate-in fade-in zoom-in duration-300"
					>
						<div className="text-7xl">
							{deck.symbols[revealedSymbol!]?.emoji ? (
								<Emoji
									emoji={deck.symbols[revealedSymbol!].emoji!}
									size="1em"
								/>
							) : (
								deck.symbols[revealedSymbol!]?.label
							)}
						</div>
					</div>
				) : (
					<div
						key={`countdown-${countdown}`}
						className="flex flex-col items-center animate-in fade-in duration-150"
					>
						<div
							className={cn(
								"text-6xl font-bold tabular-nums transition-colors duration-300",
								countdown <= 1 ? "text-red-500" : "text-foreground"
							)}
						>
							{countdown}
						</div>
						<div className="text-sm text-muted-foreground">seconds</div>
					</div>
				)}
			</div>

			{/* Cards */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
				{card1 && (
					<SpotCard
						card={card1}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={isRevealed ? revealedSymbol : null}
						size={cardSize}
						hardMode={hardMode}
					/>
				)}
				<div className="text-3xl font-bold text-muted-foreground/50">vs</div>
				{card2 && (
					<SpotCard
						card={card2}
						symbols={deck.symbols}
						isSelected={false}
						sharedSymbol={isRevealed ? revealedSymbol : null}
						size={cardSize}
						hardMode={hardMode}
					/>
				)}
			</div>

			{/* Stop button */}
			<Button onClick={stopGame} variant="outline">
				Stop
			</Button>
		</div>
	)
}
