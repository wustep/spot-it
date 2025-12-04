"use client";

import { useGame } from "@/lib/store";
import { findSharedSymbol } from "@/lib/deck";
import { SpotCard } from "./SpotCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SpotItMode() {
  const {
    deck,
    card1Index,
    card2Index,
    selectedSymbol,
    selectCard1,
    selectCard2,
    selectSymbol,
    shuffleCards,
  } = useGame();

  const card1 = card1Index !== null ? deck.cards[card1Index] : null;
  const card2 = card2Index !== null ? deck.cards[card2Index] : null;

  // Find the shared symbol between selected cards
  const sharedSymbol =
    card1 && card2 ? findSharedSymbol(card1, card2) : null;

  // Pick random cards for comparison
  const pickRandomCards = () => {
    const indices = deck.cards.map((_, i) => i);
    const idx1 = Math.floor(Math.random() * indices.length);
    indices.splice(idx1, 1);
    const idx2 = Math.floor(Math.random() * indices.length);
    selectCard1(idx1);
    selectCard2(idx2 >= idx1 ? idx2 + 1 : idx2);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Instructions / Status */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Find the Matching Symbol!
        </h2>
        <p className="text-muted-foreground">
          {!card1 && !card2 && "Select two cards to compare, or click the button below"}
          {card1 && !card2 && "Now select a second card"}
          {card1 && card2 && sharedSymbol !== null && (
            <span className="text-primary font-medium">
              The shared symbol is: {deck.symbols[sharedSymbol]?.label}
            </span>
          )}
        </p>
      </div>

      {/* Comparison Area */}
      <div className="flex items-center gap-8">
        {/* Card 1 */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Card 1</span>
          {card1 ? (
            <SpotCard
              card={card1}
              symbols={deck.symbols}
              isSelected={true}
              sharedSymbol={sharedSymbol}
              highlightedSymbol={selectedSymbol}
              onClick={() => selectCard1(null)}
              onSymbolClick={selectSymbol}
              size="lg"
            />
          ) : (
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
              Select a card
            </div>
          )}
        </div>

        {/* VS */}
        <div className="text-4xl font-bold text-muted-foreground/50">
          vs
        </div>

        {/* Card 2 */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Card 2</span>
          {card2 ? (
            <SpotCard
              card={card2}
              symbols={deck.symbols}
              isSelected={true}
              sharedSymbol={sharedSymbol}
              highlightedSymbol={selectedSymbol}
              onClick={() => selectCard2(null)}
              onSymbolClick={selectSymbol}
              size="lg"
            />
          ) : (
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
              Select a card
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={pickRandomCards} variant="default">
          🎲 Random Pair
        </Button>
        <Button onClick={shuffleCards} variant="outline">
          🔀 Shuffle
        </Button>
        <Button
          onClick={() => {
            selectCard1(null);
            selectCard2(null);
          }}
          variant="outline"
        >
          ✕ Clear
        </Button>
      </div>

      {/* Card Grid */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-4 text-center">
          All Cards ({deck.cards.length})
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
          {deck.cards.map((card, index) => {
            const isCard1 = card1Index === index;
            const isCard2 = card2Index === index;
            return (
              <SpotCard
                key={card.id}
                card={card}
                symbols={deck.symbols}
                isSelected={isCard1 || isCard2}
                highlightedSymbol={selectedSymbol}
                onClick={() => {
                  if (isCard1) {
                    selectCard1(null);
                  } else if (isCard2) {
                    selectCard2(null);
                  } else if (card1Index === null) {
                    selectCard1(index);
                  } else if (card2Index === null) {
                    selectCard2(index);
                  } else {
                    // Both selected, replace card2
                    selectCard2(index);
                  }
                }}
                size="sm"
                className={cn(
                  isCard1 && "ring-2 ring-blue-500",
                  isCard2 && "ring-2 ring-green-500"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

