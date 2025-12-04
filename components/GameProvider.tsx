"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { 
  GameContext, 
  type GameState, 
  type GameStore, 
  type SymbolMode, 
  type ViewMode,
  createInitialState 
} from "@/lib/store";
import { generateDeck, type ValidOrder } from "@/lib/deck";

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => createInitialState(3, "emojis"));

  const setSymbolMode = useCallback((mode: SymbolMode) => {
    setState(prev => ({
      ...prev,
      symbolMode: mode,
      deck: generateDeck(prev.order, mode === "emojis"),
      // Reset selections when changing mode
      card1Index: null,
      card2Index: null,
      selectedSymbol: null,
      highlightedSymbol: null,
      highlightedCard: null,
    }));
  }, []);

  const setOrder = useCallback((order: ValidOrder) => {
    setState(prev => ({
      ...prev,
      order,
      deck: generateDeck(order, prev.symbolMode === "emojis"),
      // Reset selections when changing order
      card1Index: null,
      card2Index: null,
      selectedSymbol: null,
      highlightedSymbol: null,
      highlightedCard: null,
    }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({
      ...prev,
      viewMode: mode,
      // Reset selections when changing view
      card1Index: null,
      card2Index: null,
      selectedSymbol: null,
      highlightedSymbol: null,
      highlightedCard: null,
    }));
  }, []);

  const selectCard1 = useCallback((index: number | null) => {
    setState(prev => ({ ...prev, card1Index: index, selectedSymbol: null }));
  }, []);

  const selectCard2 = useCallback((index: number | null) => {
    setState(prev => ({ ...prev, card2Index: index, selectedSymbol: null }));
  }, []);

  const selectSymbol = useCallback((id: number | null) => {
    setState(prev => ({ ...prev, selectedSymbol: id }));
  }, []);

  const shuffleCards = useCallback(() => {
    setState(prev => {
      // Fisher-Yates shuffle
      const shuffled = [...prev.deck.cards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return {
        ...prev,
        deck: { ...prev.deck, cards: shuffled },
        card1Index: null,
        card2Index: null,
        selectedSymbol: null,
      };
    });
  }, []);

  const highlightSymbol = useCallback((id: number | null) => {
    setState(prev => ({ ...prev, highlightedSymbol: id }));
  }, []);

  const highlightCard = useCallback((index: number | null) => {
    setState(prev => ({ ...prev, highlightedCard: index }));
  }, []);

  const store: GameStore = useMemo(() => ({
    ...state,
    setSymbolMode,
    setOrder,
    setViewMode,
    selectCard1,
    selectCard2,
    selectSymbol,
    shuffleCards,
    highlightSymbol,
    highlightCard,
  }), [state, setSymbolMode, setOrder, setViewMode, selectCard1, selectCard2, selectSymbol, shuffleCards, highlightSymbol, highlightCard]);

  return (
    <GameContext.Provider value={store}>
      {children}
    </GameContext.Provider>
  );
}

