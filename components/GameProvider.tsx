"use client"

import {
	useState,
	useCallback,
	useMemo,
	useEffect,
	useRef,
	type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import {
	GameContext,
	type GameState,
	type GameStore,
	type SymbolStyle,
	type ViewMode,
	type GameSubMode,
	createInitialState,
	createInitialStats,
} from "@/lib/store"
import {
	VALID_ORDERS,
	generateDeck,
	findSharedSymbol,
	type ValidOrder,
} from "@/lib/deck"

// Helper to update URL without navigation
function updateURL(viewMode: ViewMode, gameSubMode: GameSubMode) {
	let newURL = "/"
	if (viewMode === "home") {
		newURL = "/"
	} else if (viewMode === "game") {
		if (gameSubMode === "practice") newURL = "/practice"
		else if (gameSubMode === "timed") newURL = "/timed"
		else if (gameSubMode === "countdown") newURL = "/countdown"
		else newURL = "/practice"
	} else if (viewMode === "article") {
		newURL = "/article"
	} else if (viewMode === "article-full") {
		newURL = "/article/full"
	} else if (viewMode === "visualizer") {
		newURL = "/visualizer"
	} else if (viewMode === "matrix") {
		newURL = "/matrix"
	}
	window.history.replaceState({}, "", newURL)
}

// Parse path to extract mode and submode
function parsePathname(pathname: string): {
	viewMode: ViewMode
	gameSubMode: GameSubMode
} {
	const segments = pathname.split("/").filter(Boolean)

	if (segments.length === 0) {
		return { viewMode: "home", gameSubMode: "practice" }
	}

	// Top-level routes
	if (segments[0] === "practice") {
		return { viewMode: "game", gameSubMode: "practice" }
	}
	if (segments[0] === "timed") {
		return { viewMode: "game", gameSubMode: "timed" }
	}
	// Hidden mode (no UI link), but still routable
	if (segments[0] === "countdown") {
		return { viewMode: "game", gameSubMode: "countdown" }
	}

	if (segments[0] === "visualizer") {
		return { viewMode: "visualizer", gameSubMode: "practice" }
	}

	if (segments[0] === "matrix") {
		return { viewMode: "matrix", gameSubMode: "practice" }
	}

	if (segments[0] === "article") {
		if (segments[1] === "full") {
			return { viewMode: "article-full", gameSubMode: "practice" }
		}
		return { viewMode: "article", gameSubMode: "practice" }
	}

	// Back-compat: old routes
	if (segments[0] === "game" && segments[1]) {
		const submode = segments[1]
		if (
			submode === "practice" ||
			submode === "timed" ||
			submode === "countdown"
		) {
			return { viewMode: "game", gameSubMode: submode }
		}
	}

	// Default
	return { viewMode: "game", gameSubMode: "practice" }
}

const CONTROL_PANEL_STORAGE_KEY_V2 = "spotit:controlPanelSettings:v2"
const CONTROL_PANEL_STORAGE_KEY_V1 = "spotit:controlPanelSettings:v1"

type ControlPanelSettings = {
	symbolStyle: SymbolStyle
	order: ValidOrder
	hardMode: boolean
}

function isValidOrder(n: unknown): n is ValidOrder {
	return (
		typeof n === "number" && (VALID_ORDERS as readonly number[]).includes(n)
	)
}

function isValidSymbolStyle(v: unknown): v is SymbolStyle {
	return (
		v === "openmoji" || v === "twemoji" || v === "system" || v === "numbers"
	)
}

function parseSettingsFromUnknown(
	parsed: unknown
): Partial<ControlPanelSettings> {
	if (!parsed || typeof parsed !== "object") return {}
	const obj = parsed as Record<string, unknown>
	const out: Partial<ControlPanelSettings> = {}

	if (isValidSymbolStyle(obj.symbolStyle)) out.symbolStyle = obj.symbolStyle
	if (isValidOrder(obj.order)) out.order = obj.order
	if (typeof obj.hardMode === "boolean") out.hardMode = obj.hardMode

	return out
}

function loadControlPanelSettings(): Partial<ControlPanelSettings> {
	if (typeof window === "undefined") return {}
	try {
		// Prefer v2
		const rawV2 = window.localStorage.getItem(CONTROL_PANEL_STORAGE_KEY_V2)
		if (rawV2) {
			return parseSettingsFromUnknown(JSON.parse(rawV2))
		}

		// Migrate v1 -> v2 (symbolMode + emojiStyle)
		const rawV1 = window.localStorage.getItem(CONTROL_PANEL_STORAGE_KEY_V1)
		if (!rawV1) return {}
		const parsedV1: unknown = JSON.parse(rawV1)
		if (!parsedV1 || typeof parsedV1 !== "object") return {}
		const obj = parsedV1 as Record<string, unknown>

		const migrated: Partial<ControlPanelSettings> = {}
		if (obj.symbolMode === "numbers") {
			migrated.symbolStyle = "numbers"
		} else if (
			obj.emojiStyle === "openmoji" ||
			obj.emojiStyle === "twemoji" ||
			obj.emojiStyle === "system"
		) {
			migrated.symbolStyle = obj.emojiStyle
		}
		if (isValidOrder(obj.order)) migrated.order = obj.order
		if (typeof obj.hardMode === "boolean") migrated.hardMode = obj.hardMode

		// Best-effort write migrated value back as v2 (fill defaults)
		saveControlPanelSettings({
			symbolStyle: migrated.symbolStyle ?? "openmoji",
			order: migrated.order ?? 7,
			hardMode: migrated.hardMode ?? false,
		})

		return migrated
	} catch {
		return {}
	}
}

function saveControlPanelSettings(settings: ControlPanelSettings) {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(
			CONTROL_PANEL_STORAGE_KEY_V2,
			JSON.stringify(settings)
		)
	} catch {
		// Ignore write errors (e.g. private mode / quota)
	}
}

export function GameProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname()

	// Track if we've completed initial hydration - don't save to localStorage until then
	const hasMountedRef = useRef(false)

	// Initialize state from URL path (runs on server with no localStorage access)
	const [state, setState] = useState<GameState>(() => {
		const saved = loadControlPanelSettings()
		const initialState = createInitialState(saved.order ?? 7, saved.symbolStyle)
		// Use saved value if available, otherwise keep createInitialState's default (true)
		if (typeof saved.hardMode === "boolean") {
			initialState.hardMode = saved.hardMode
		}
		const { viewMode, gameSubMode } = parsePathname(pathname)
		initialState.viewMode = viewMode
		initialState.gameSubMode = gameSubMode
		return initialState
	})

	// After hydration, sync state from localStorage (client-side only)
	// This ensures we pick up the correct saved values that weren't available during SSR
	useEffect(() => {
		const saved = loadControlPanelSettings()
		setState((prev) => {
			let needsUpdate = false
			const updates: Partial<GameState> = {}

			if (typeof saved.hardMode === "boolean" && saved.hardMode !== prev.hardMode) {
				updates.hardMode = saved.hardMode
				needsUpdate = true
			}
			if (saved.order && saved.order !== prev.order) {
				updates.order = saved.order
				updates.deck = generateDeck(saved.order, prev.symbolStyle !== "numbers")
				needsUpdate = true
			}
			if (saved.symbolStyle && saved.symbolStyle !== prev.symbolStyle) {
				updates.symbolStyle = saved.symbolStyle
				updates.deck = generateDeck(prev.order, saved.symbolStyle !== "numbers")
				needsUpdate = true
			}

			if (needsUpdate) {
				return { ...prev, ...updates }
			}
			return prev
		})
		hasMountedRef.current = true
	}, [])

	// Persist Control Panel settings - but only after initial mount to avoid
	// overwriting saved values with SSR defaults
	useEffect(() => {
		if (!hasMountedRef.current) return
		saveControlPanelSettings({
			symbolStyle: state.symbolStyle,
			order: state.order,
			hardMode: state.hardMode,
		})
	}, [state.symbolStyle, state.order, state.hardMode])

	// Sync state to URL when viewMode or gameSubMode changes
	useEffect(() => {
		updateURL(state.viewMode, state.gameSubMode)
	}, [state.viewMode, state.gameSubMode])

	// Sync state from URL when navigating (e.g. clicking Links)
	useEffect(() => {
		const { viewMode, gameSubMode } = parsePathname(pathname)
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setState((prev) => {
			// On first load we already initialize from the pathname, so avoid
			// clobbering state (and racing child effects) unless the mode changed.
			if (prev.viewMode === viewMode && prev.gameSubMode === gameSubMode) {
				return prev
			}

			return {
				...prev,
				viewMode,
				gameSubMode,
				// Reset selections when navigating
				isPlaying: false,
				card1Index: null,
				card2Index: null,
				selectedSymbol: null,
				revealedSymbol: null,
				highlightedSymbol: null,
				highlightedCard: null,
				roundStartTime: null,
			deck:
				viewMode === "visualizer" || viewMode === "matrix"
					? generateDeck(prev.order, prev.symbolStyle !== "numbers")
					: prev.deck,
			}
		})
	}, [pathname])

	const setSymbolStyle = useCallback((style: SymbolStyle) => {
		setState((prev) => ({
			...prev,
			symbolStyle: style,
			deck: generateDeck(prev.order, style !== "numbers"),
			// Reset selections when changing symbol style
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

	const setOrder = useCallback((order: ValidOrder) => {
		setState((prev) => ({
			...prev,
			order,
			deck: generateDeck(order, prev.symbolStyle !== "numbers"),
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
			// Reset deck to original order when switching to visualizer or matrix
			deck:
				mode === "visualizer" || mode === "matrix"
					? generateDeck(prev.order, prev.symbolStyle !== "numbers")
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
			setSymbolStyle,
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
			setSymbolStyle,
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
