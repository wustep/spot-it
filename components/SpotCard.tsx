"use client";

import { type Card as CardType, type SymbolMeta } from "@/lib/deck";
import { cn } from "@/lib/utils";

interface SpotCardProps {
  card: CardType;
  symbols: SymbolMeta[];
  isSelected?: boolean;
  highlightedSymbol?: number | null;
  sharedSymbol?: number | null;
  onClick?: () => void;
  onSymbolClick?: (symbolId: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    card: "w-24 h-24",
    symbol: "text-lg",
    gap: "gap-1",
  },
  md: {
    card: "w-36 h-36",
    symbol: "text-2xl",
    gap: "gap-1.5",
  },
  lg: {
    card: "w-48 h-48",
    symbol: "text-3xl",
    gap: "gap-2",
  },
};

export function SpotCard({
  card,
  symbols,
  isSelected = false,
  highlightedSymbol = null,
  sharedSymbol = null,
  onClick,
  onSymbolClick,
  size = "md",
  className,
}: SpotCardProps) {
  const config = sizeConfig[size];

  // Position symbols in a circular layout
  const symbolCount = card.symbols.length;
  const angleStep = (2 * Math.PI) / symbolCount;

  return (
    <div
      className={cn(
        "relative rounded-full bg-card border-2 flex items-center justify-center cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary ring-2 ring-primary/30 scale-105"
          : "border-border hover:border-primary/50 hover:shadow-lg",
        config.card,
        className
      )}
      onClick={onClick}
    >
      {/* Symbols arranged in a circle */}
      {card.symbols.map((symbolId, index) => {
        const symbol = symbols[symbolId];
        const angle = angleStep * index - Math.PI / 2; // Start from top
        const radius = 35; // Percentage from center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        const isHighlighted = highlightedSymbol === symbolId;
        const isShared = sharedSymbol === symbolId;

        return (
          <button
            key={symbolId}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 rounded-full p-0.5",
              config.symbol,
              isShared && "scale-125 animate-pulse",
              isHighlighted && "scale-125 ring-2 ring-yellow-400 bg-yellow-100 dark:bg-yellow-900/50",
              !isShared && !isHighlighted && "hover:scale-110"
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSymbolClick?.(symbolId);
            }}
          >
            <span className={cn(
              isShared && "drop-shadow-lg",
            )}>
              {symbol?.label ?? symbolId}
            </span>
          </button>
        );
      })}

      {/* Card ID in center (subtle) */}
      <span className="text-xs text-muted-foreground/50 font-mono">
        #{card.id}
      </span>
    </div>
  );
}

