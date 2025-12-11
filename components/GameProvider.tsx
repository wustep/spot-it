"use client"

import {
	useState,
	useCallback,
	useMemo,
	useEffect,
	type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import {
	GameContext,
	type GameState,
	type GameStore,
	type SymbolMode,
	type EmojiStyle,
	type ViewMode,
	type GameSubMode,
	createInitialState,
	createInitialStats,
} from "@/lib/store"
import { generateDeck, findSharedSymbol, type ValidOrder } from "@/lib/deck"

// Helper to update URL without navigation
function updateURL(viewMode: ViewMode, gameSubMode: GameSubMode) {
	let newURL = "/"
	if (viewMode === "game") {
		newURL = `/game/${gameSubMode}`
	} else if (viewMode === "article") {
		newURL = "/article"
	} else {
		newURL = "/visualizer"
	}
	window.history.replaceState({}, "", newURL)
}

// Parse path to extract mode and submode
function parsePathname(pathname: string): {
	viewMode: ViewMode
	gameSubMode: GameSubMode
} {
	const segments = pathname.split("/").filter(Boolean)

	if (segments[0] === "visualizer") {
		return { viewMode: "visualizer", gameSubMode: "practice" }
	}

	if (segments[0] === "article") {
		return { viewMode: "article", gameSubMode: "practice" }
	}

	if (segments[0] === "game" && segments[1]) {
		const submode = segments[1]
		if (submode === "practice" || submode === "timed" || submode === "countdown") {
			return { viewMode: "game", gameSubMode: submode }
		}
	}

	// Default
	return { viewMode: "game", gameSubMode: "practice" }
}

export function GameProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname()

	// Initialize state from URL path
	const [state, setState] = useState<GameState>(() => {
		const initialState = createInitialState(3, "emojis")
		const { viewMode, gameSubMode } = parsePathname(pathname)
		initialState.viewMode = viewMode
		initialState.gameSubMode = gameSubMode
		return initialState
	})

	// Sync state to URL when viewMode or gameSubMode changes
	useEffect(() => {
		updateURL(state.viewMode, state.gameSubMode)
	}, [state.viewMode, state.gameSubMode])

	const setSymbolMode = useCallback((mode: SymbolMode) => {
		setState((prev) => ({
			...prev,
			symbolMode: mode,
			deck: generateDeck(prev.order, mode === "emojis"),
			// Reset selections when changing mode
			isPlaying: false,
			card1Index: null,
			card2Index: null,
			selectedSymbol: null,
			revealedSymbol: null,
			highlightedSymbol: null,
			highlightedCard: null,
			stats: createInitialStats(),
		}))
	}, [])

	const setEmojiStyle = useCallback((style: EmojiStyle) => {
		setState((prev) => ({
			...prev,
			emojiStyle: style,
		}))
	}, [])

	const setOrder = useCallback((order: ValidOrder) => {
		setState((prev) => ({
			...prev,
			order,
			deck: generateDeck(order, prev.symbolMode === "emojis"),
			// Reset selections when changing order
			isPlaying: false,
			card1Index: null,
			card2Index: null,
			selectedSymbol: null,
			revealedSymbol: null,
			highlightedSymbol: null,
			highlightedCard: null,
			stats: createInitialStats(),
		}))
	}, [])

	const setViewMode = useCallback((mode: ViewMode) => {
		setState((prev) => ({
			...prev,
			viewMode: mode,
			// Reset deck to original order when switching to visualizer
			deck:
				mode === "visualizer"
					? generateDeck(prev.order, prev.symbolMode === "emojis")
					: prev.deck,
			// Reset selections when changing view
			isPlaying: false,
			card1Index: null,
			card2Index: null,
			selectedSymbol: null,
			revealedSymbol: null,
			highlightedSymbol: null,
			highlightedCard: null,
		}))
	}, [])

	const setHardMode = useCallback((hard: boolean) => {
		setState((prev) => ({
			...prev,
			hardMode: hard,
		}))
	}, [])

	const setGameSubMode = useCallback((mode: GameSubMode) => {
		setState((prev) => ({
			...prev,
			gameSubMode: mode,
			isPlaying: false,
			card1Index: null,
			card2Index: null,
			selectedSymbol: null,
			revealedSymbol: null,
			roundStartTime: null,
		}))
	}, [])

	// Pick two random different cards
	const pickRandomPair = useCallback((deckLength: number) => {
		const idx1 = Math.floor(Math.random() * deckLength)
		let idx2 = Math.floor(Math.random() * (deckLength - 1))
		if (idx2 >= idx1) idx2++
		return { idx1, idx2 }
	}, [])

	const startGame = useCallback(() => {
		setState((prev) => {
			const { idx1, idx2 } = pickRandomPair(prev.deck.cards.length)
			return {
				...prev,
				isPlaying: true,
				card1Index: idx1,
				card2Index: idx2,
				selectedSymbol: null,
				revealedSymbol: null,
				roundStartTime: Date.now(),
				stats: createInitialStats(),
			}
		})
	}, [pickRandomPair])

	const stopGame = useCallback(() => {
		setState((prev) => ({
			...prev,
			isPlaying: false,
			card1Index: null,
			card2Index: null,
			selectedSymbol: null,
			revealedSymbol: null,
			roundStartTime: null,
		}))
	}, [])

	const nextRound = useCallback(() => {
		setState((prev) => {
			const { idx1, idx2 } = pickRandomPair(prev.deck.cards.length)
			return {
				...prev,
				card1Index: idx1,
				card2Index: idx2,
				selectedSymbol: null,
				revealedSymbol: null,
				roundStartTime: Date.now(),
			}
		})
	}, [pickRandomPair])

	const selectCard1 = useCallback((index: number | null) => {
		setState((prev) => ({ ...prev, card1Index: index, selectedSymbol: null }))
	}, [])

	const selectCard2 = useCallback((index: number | null) => {
		setState((prev) => ({ ...prev, card2Index: index, selectedSymbol: null }))
	}, [])

	const selectSymbol = useCallback((id: number | null) => {
		setState((prev) => ({ ...prev, selectedSymbol: id }))
	}, [])

	const guessSymbol = useCallback((id: number): boolean => {
		let isCorrect = false
		setState((prev) => {
			if (prev.card1Index === null || prev.card2Index === null) return prev

			const card1 = prev.deck.cards[prev.card1Index]
			const card2 = prev.deck.cards[prev.card2Index]
			const sharedSymbol = findSharedSymbol(card1, card2)

			isCorrect = sharedSymbol === id
			const roundTime = prev.roundStartTime
				? Date.now() - prev.roundStartTime
				: 0

			const newStats = { ...prev.stats }
			if (isCorrect) {
				newStats.correct++
				newStats.streak++
				newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak)
				newStats.totalTime += roundTime
				newStats.roundTimes = [...newStats.roundTimes, roundTime]
			} else {
				newStats.wrong++
				newStats.streak = 0
			}

			return {
				...prev,
				selectedSymbol: id,
				// Only reveal the answer on correct guess
				revealedSymbol: isCorrect ? sharedSymbol : null,
				stats: newStats,
			}
		})
		return isCorrect
	}, [])

	const revealMatch = useCallback(() => {
		setState((prev) => {
			if (prev.card1Index === null || prev.card2Index === null) return prev

			const card1 = prev.deck.cards[prev.card1Index]
			const card2 = prev.deck.cards[prev.card2Index]
			const sharedSymbol = findSharedSymbol(card1, card2)

			return {
				...prev,
				revealedSymbol: sharedSymbol,
			}
		})
	}, [])

	const setCountdownInterval = useCallback((seconds: number) => {
		setState((prev) => ({ ...prev, countdownInterval: seconds }))
	}, [])

	const shuffleCards = useCallback(() => {
		setState((prev) => {
			// Fisher-Yates shuffle
			const shuffled = [...prev.deck.cards]
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
			}
			return {
				...prev,
				deck: { ...prev.deck, cards: shuffled },
				card1Index: null,
				card2Index: null,
				selectedSymbol: null,
				revealedSymbol: null,
			}
		})
	}, [])

	const resetStats = useCallback(() => {
		setState((prev) => ({
			...prev,
			stats: createInitialStats(),
		}))
	}, [])

	const highlightSymbol = useCallback((id: number | null) => {
		setState((prev) => ({ ...prev, highlightedSymbol: id }))
	}, [])

	const highlightCard = useCallback((index: number | null) => {
		setState((prev) => ({ ...prev, highlightedCard: index }))
	}, [])

	const store: GameStore = useMemo(
		() => ({
			...state,
			setSymbolMode,
			setEmojiStyle,
			setOrder,
			setViewMode,
			setHardMode,
			setGameSubMode,
			startGame,
			stopGame,
			nextRound,
			selectCard1,
			selectCard2,
			selectSymbol,
			guessSymbol,
			revealMatch,
			setCountdownInterval,
			shuffleCards,
			resetStats,
			highlightSymbol,
			highlightCard,
		}),
		[
			state,
			setSymbolMode,
			setEmojiStyle,
			setOrder,
			setViewMode,
			setHardMode,
			setGameSubMode,
			startGame,
			stopGame,
			nextRound,
			selectCard1,
			selectCard2,
			selectSymbol,
			guessSymbol,
			revealMatch,
			setCountdownInterval,
			shuffleCards,
			resetStats,
			highlightSymbol,
			highlightCard,
		]
	)

	return <GameContext.Provider value={store}>{children}</GameContext.Provider>
}
