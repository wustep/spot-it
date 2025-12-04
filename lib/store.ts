"use client";

import { createContext, useContext } from "react";
import { type Deck, type ValidOrder, generateDeck } from "./deck";

export type SymbolMode = "emojis" | "numbers";
export type ViewMode = "spot-it" | "visualizer";

export interface GameState {
  // Settings
  symbolMode: SymbolMode;
  order: ValidOrder;
  viewMode: ViewMode;
  
  // Generated deck
  deck: Deck;
  
  // Spot It mode state
  card1Index: number | null;
  card2Index: number | null;
  selectedSymbol: number | null;
  
  // Visualizer state
  highlightedSymbol: number | null;
  highlightedCard: number | null;
}

export interface GameActions {
  setSymbolMode: (mode: SymbolMode) => void;
  setOrder: (order: ValidOrder) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Spot It actions
  selectCard1: (index: number | null) => void;
  selectCard2: (index: number | null) => void;
  selectSymbol: (id: number | null) => void;
  shuffleCards: () => void;
  
  // Visualizer actions
  highlightSymbol: (id: number | null) => void;
  highlightCard: (index: number | null) => void;
}

export type GameStore = GameState & GameActions;

export const GameContext = createContext<GameStore | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export function createInitialState(order: ValidOrder = 3, symbolMode: SymbolMode = "emojis"): GameState {
  return {
    symbolMode,
    order,
    viewMode: "spot-it",
    deck: generateDeck(order, symbolMode === "emojis"),
    card1Index: null,
    card2Index: null,
    selectedSymbol: null,
    highlightedSymbol: null,
    highlightedCard: null,
  };
}

