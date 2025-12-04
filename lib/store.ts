"use client"

import { createContext, useContext } from "react"
import { type Deck, type ValidOrder, generateDeck } from "./deck"

export type SymbolMode = "emojis" | "numbers"
export type ViewMode = "spot-it" | "visualizer"
export type SpotItSubMode = "practice" | "game" | "countdown"

export interface GameStats {
	correct: number
	wrong: number
	totalTime: number // in ms
	roundTimes: number[] // time per round in ms
	streak: number
	bestStreak: number
}

export interface GameState {
	// Settings
	symbolMode: SymbolMode
	order: ValidOrder
	viewMode: ViewMode
	hardMode: boolean // Harder card display with scattered symbols

	// Generated deck
	deck: Deck

	// Spot It mode state
	spotItSubMode: SpotItSubMode
	isPlaying: boolean
	card1Index: number | null
	card2Index: number | null
	selectedSymbol: number | null
	revealedSymbol: number | null // For countdown mode
	roundStartTime: number | null // timestamp when current round started
	countdownInterval: number // seconds between reveals in countdown mode

	// Game stats
	stats: GameStats

	// Visualizer state
	highlightedSymbol: number | null
	highlightedCard: number | null
}

export interface GameActions {
	setSymbolMode: (mode: SymbolMode) => void
	setOrder: (order: ValidOrder) => void
	setViewMode: (mode: ViewMode) => void
	setHardMode: (hard: boolean) => void

	// Spot It actions
	setSpotItSubMode: (mode: SpotItSubMode) => void
	startGame: () => void
	stopGame: () => void
	nextRound: () => void
	selectCard1: (index: number | null) => void
	selectCard2: (index: number | null) => void
	selectSymbol: (id: number | null) => void
	guessSymbol: (id: number) => boolean // returns true if correct
	revealMatch: () => void // for countdown mode
	setCountdownInterval: (seconds: number) => void
	shuffleCards: () => void
	resetStats: () => void

	// Visualizer actions
	highlightSymbol: (id: number | null) => void
	highlightCard: (index: number | null) => void
}

export type GameStore = GameState & GameActions

export const GameContext = createContext<GameStore | null>(null)

export function useGame() {
	const context = useContext(GameContext)
	if (!context) {
		throw new Error("useGame must be used within a GameProvider")
	}
	return context
}

export function createInitialStats(): GameStats {
	return {
		correct: 0,
		wrong: 0,
		totalTime: 0,
		roundTimes: [],
		streak: 0,
		bestStreak: 0,
	}
}

export function createInitialState(
	order: ValidOrder = 3,
	symbolMode: SymbolMode = "emojis"
): GameState {
	return {
		symbolMode,
		order,
		viewMode: "spot-it",
		hardMode: false,
		deck: generateDeck(order, symbolMode === "emojis"),
		spotItSubMode: "practice",
		isPlaying: false,
		card1Index: null,
		card2Index: null,
		selectedSymbol: null,
		revealedSymbol: null,
		roundStartTime: null,
		countdownInterval: 3,
		stats: createInitialStats(),
		highlightedSymbol: null,
		highlightedCard: null,
	}
}
