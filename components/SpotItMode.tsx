"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useGame } from "@/lib/store"
import { SpotCard } from "./SpotCard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function SpotItMode() {
	const {
		deck,
		spotItSubMode,
		setSpotItSubMode,
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
		if (spotItSubMode !== "game" || !isPlaying || !roundStartTime) {
			return
		}

		// Set initial time immediately
		setElapsedTime(0)

		const interval = setInterval(() => {
			setElapsedTime(Date.now() - roundStartTime)
		}, 1000)

		return () => clearInterval(interval)
	}, [spotItSubMode, isPlaying, roundStartTime])

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
				}, 800)
			} else {
				setTimeout(() => {
					setFeedbackState("none")
				}, 500)
			}
		},
		[guessSymbol, nextRound, roundStartTime]
	)

	// Countdown mode state
	const [countdown, setCountdown] = useState(countdownInterval)
	const [countdownPhase, setCountdownPhase] = useState<
		"counting" | "revealed" | "transitioning"
	>("counting")
	const countdownRef = useRef<NodeJS.Timeout | null>(null)
	const isActiveRef = useRef(false)

	// Countdown effect - simpler interval-based approach
	useEffect(() => {
		const shouldPlay = spotItSubMode === "countdown" && isPlaying

		if (!shouldPlay) {
			if (countdownRef.current) {
				clearInterval(countdownRef.current)
				countdownRef.current = null
			}
			isActiveRef.current = false
			return
		}

		// Initialize on start
		if (!isActiveRef.current) {
			isActiveRef.current = true
			setCountdown(countdownInterval)
			setCountdownPhase("counting")
		}

		let currentCount = countdownInterval
		let phase: "counting" | "revealed" | "transitioning" = "counting"

		const tick = () => {
			if (phase === "counting") {
				if (currentCount > 1) {
					// Still counting down, decrement
					currentCount--
					setCountdown(currentCount)
				} else {
					// Was showing 1, now reveal the match
					phase = "revealed"
					setCountdownPhase("revealed")
					revealMatch()
				}
			} else if (phase === "revealed") {
				// After 1 tick of showing, transition to next round
				phase = "transitioning"
				setCountdownPhase("transitioning")
				// Reset countdown immediately so it doesn't flash "1" during transition
				currentCount = countdownInterval
				setCountdown(currentCount)
				// Load next round
				nextRound()
			} else if (phase === "transitioning") {
				// Start counting again
				phase = "counting"
				setCountdownPhase("counting")
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
	}, [spotItSubMode, isPlaying, countdownInterval])

	// Pick random cards for practice mode
	const pickRandomCards = () => {
		const indices = deck.cards.map((_, i) => i)
		const idx1 = Math.floor(Math.random() * indices.length)
		indices.splice(idx1, 1)
		const idx2 = Math.floor(Math.random() * indices.length)
		selectCard1(idx1)
		selectCard2(idx2 >= idx1 ? idx2 + 1 : idx2)
	}

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
			{/* Sub-mode selector */}
			<div className="w-full max-w-md">
				<Tabs
					value={spotItSubMode}
					onValueChange={(v) => setSpotItSubMode(v as typeof spotItSubMode)}
				>
					<TabsList className="w-full">
						<TabsTrigger value="practice" className="flex-1">
							Practice
						</TabsTrigger>
						<TabsTrigger value="game" className="flex-1">
							Timed
						</TabsTrigger>
						<TabsTrigger value="countdown" className="flex-1">
							Countdown
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Mode-specific content */}
			{spotItSubMode === "practice" && (
				<PracticeMode
					deck={deck}
					card1={card1}
					card2={card2}
					card1Index={card1Index}
					card2Index={card2Index}
					hardMode={hardMode}
					selectCard2={selectCard2}
					pickRandomCards={pickRandomCards}
				/>
			)}

			{spotItSubMode === "game" && (
				<GameMode
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

			{spotItSubMode === "countdown" && (
				<CountdownMode
					deck={deck}
					card1={card1}
					card2={card2}
					isPlaying={isPlaying}
					revealedSymbol={revealedSymbol}
					countdown={countdown}
					countdownInterval={countdownInterval}
					countdownPhase={countdownPhase}
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
	selectCard2,
	pickRandomCards,
}: {
	deck: ReturnType<typeof useGame>["deck"]
	card1: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card2: ReturnType<typeof useGame>["deck"]["cards"][number] | null
	card1Index: number | null
	card2Index: number | null
	hardMode: boolean
	selectCard2: (index: number | null) => void
	pickRandomCards: () => void
}) {
	// Feedback state for symbol clicks
	const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none")
	const [revealedSymbol, setRevealedSymbol] = useState<number | null>(null)

	// Auto-select cards when deck changes or cards become null
	useEffect(() => {
		if (!card1 || !card2) {
			pickRandomCards()
		}
	}, [deck, card1, card2]) // eslint-disable-line react-hooks/exhaustive-deps

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

	// Determine card size based on symbols per card
	const symbolsPerCard = deck.cards[0]?.symbols.length ?? 4
	const getCardSize = () => {
		if (symbolsPerCard >= 12) return "xl" // n=11
		if (symbolsPerCard >= 8) return hardMode ? "xl" : "lg" // n=7
		return hardMode ? "xl" : "lg"
	}
	const cardSize = getCardSize()
	const gridCardSize = hardMode ? "md" : "sm"

	// If cards not yet selected, show loading
	if (!card1 || !card2) {
		return (
			<div className="text-center text-muted-foreground">Loading cards...</div>
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
			<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
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
				<Button onClick={pickRandomCards} variant="secondary">
					New Cards
				</Button>
			</div>

			{/* Card Grid */}
			<div className="mt-4">
				<h3 className="text-lg font-semibold mb-4 text-center">
					All Cards ({deck.cards.length})
				</h3>
				<div
					className={cn(
						"grid gap-3",
						hardMode
							? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
							: "grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9"
					)}
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
									if (isCard1) {
										// Already card1, do nothing (can't deselect)
										return
									} else if (isCard2) {
										// Already card2, do nothing (can't deselect)
										return
									} else {
										// Select this as card2 (replacing the current card2)
										selectCard2(index)
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

// Game Mode Component
function GameMode({
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
	const cardSize = hardMode ? "xl" : "lg"
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
						{formatTime(lastRoundTime)}
					</div>
				)}
				{feedbackState === "wrong" && (
					<div className="text-red-500 font-bold text-xl animate-in fade-in shake duration-200">
						Wrong!
					</div>
				)}
			</div>

			{/* Cards */}
			<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
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
	countdownPhase,
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
	countdownPhase: "counting" | "revealed" | "transitioning"
	hardMode: boolean
	setCountdownInterval: (seconds: number) => void
	startGame: () => void
	stopGame: () => void
}) {
	const cardSize = hardMode ? "xl" : "lg"
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
							<SelectItem value="1">1 sec</SelectItem>
							<SelectItem value="2">2 sec</SelectItem>
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

	const isRevealed = countdownPhase === "revealed"
	const isTransitioning = countdownPhase === "transitioning"

	return (
		<div className="flex flex-col items-center gap-6">
			{/* Countdown display - fixed height to prevent shifts */}
			<div className="h-24 flex flex-col items-center justify-center">
				{isRevealed ? (
					<div className="flex items-center justify-center animate-in fade-in zoom-in duration-300">
						<div className="text-7xl">
							{deck.symbols[revealedSymbol!]?.label}
						</div>
					</div>
				) : (
					<div
						className={cn(
							"flex flex-col items-center transition-all duration-300",
							isTransitioning && "opacity-50 scale-95"
						)}
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

			{/* Cards - fixed container to prevent shifts */}
			<div
				className={cn(
					"flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4 transition-opacity duration-300",
					isTransitioning && "opacity-50"
				)}
			>
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
