"use client"

import { useMemo } from "react"
import { type Card as CardType, type SymbolMeta } from "@/lib/deck"
import { cn } from "@/lib/utils"

interface SpotCardProps {
	card: CardType
	symbols: SymbolMeta[]
	isSelected?: boolean
	highlightedSymbol?: number | null
	sharedSymbol?: number | null
	onClick?: () => void
	onSymbolClick?: (symbolId: number) => void
	size?: "sm" | "md" | "lg" | "xl"
	hardMode?: boolean
	className?: string
}

const sizeConfig = {
	sm: {
		card: "w-24 h-24",
		symbol: "text-lg",
		symbolHard: ["text-sm", "text-lg", "text-2xl"],
	},
	md: {
		card: "w-32 h-32",
		symbol: "text-2xl",
		symbolHard: ["text-base", "text-xl", "text-3xl"],
	},
	lg: {
		card: "w-44 h-44",
		symbol: "text-3xl",
		symbolHard: ["text-lg", "text-2xl", "text-4xl"],
	},
	xl: {
		card: "w-56 h-56",
		symbol: "text-4xl",
		symbolHard: ["text-lg", "text-3xl", "text-5xl"],
	},
}

// Smaller sizes for cards with many symbols (n>=7)
const sizeConfigDense = {
	sm: {
		card: "w-24 h-24",
		symbol: "text-base",
		symbolHard: ["text-xs", "text-sm", "text-lg"],
	},
	md: {
		card: "w-32 h-32",
		symbol: "text-xl",
		symbolHard: ["text-sm", "text-base", "text-xl"],
	},
	lg: {
		card: "w-44 h-44",
		symbol: "text-2xl",
		symbolHard: ["text-sm", "text-lg", "text-2xl"],
	},
	xl: {
		card: "w-56 h-56",
		symbol: "text-3xl",
		symbolHard: ["text-base", "text-xl", "text-3xl"],
	},
}

// Seeded random for consistent positioning per card
function seededRandom(seed: number) {
	const x = Math.sin(seed * 9999) * 10000
	return x - Math.floor(x)
}

// Generate scattered positions like real Spot It cards
function generateScatteredPositions(
	symbolCount: number,
	cardId: number
): Array<{ x: number; y: number; rotation: number; sizeIndex: number }> {
	const positions: Array<{
		x: number
		y: number
		rotation: number
		sizeIndex: number
	}> = []

	// Adjust sizes based on symbol count - smaller symbols for more packed cards
	const getSizeRadii = () => {
		if (symbolCount >= 12) return [5, 7, 10] // n=11: 12 symbols
		if (symbolCount >= 8) return [5, 8, 12] // n=7: 8 symbols
		return [7, 11, 16] // smaller decks
	}
	const sizeRadii = getSizeRadii()

	// Determine sizes - ensure good variety
	const sizes: number[] = []
	const largeCount =
		symbolCount >= 8 ? 1 : Math.max(1, Math.floor(symbolCount / 4))
	const smallCount = Math.max(1, Math.floor(symbolCount / 4))

	for (let i = 0; i < symbolCount; i++) {
		if (i < largeCount) {
			sizes.push(2) // Large
		} else if (i < largeCount + smallCount) {
			sizes.push(0) // Small
		} else {
			sizes.push(1) // Medium
		}
	}

	// Shuffle sizes deterministically
	for (let i = sizes.length - 1; i > 0; i--) {
		const j = Math.floor(seededRandom(cardId * 37 + i * 13) * (i + 1))
		;[sizes[i], sizes[j]] = [sizes[j], sizes[i]]
	}

	// Place symbols with good spacing - largest first for better packing
	const sortedIndices = sizes
		.map((size, idx) => ({ size, idx }))
		.sort((a, b) => b.size - a.size)
		.map((item) => item.idx)

	const placedPositions: Array<{
		x: number
		y: number
		radius: number
	}> = []

	// Adjust gap based on symbol count
	const minGap = symbolCount >= 12 ? 1 : symbolCount >= 8 ? 1.5 : 2

	for (const i of sortedIndices) {
		const seed = cardId * 100 + i
		const sizeIndex = sizes[i]
		const myRadius = sizeRadii[sizeIndex]

		let bestX = 50
		let bestY = 50
		let bestMinDist = -1

		// Try many positions and pick best spacing
		const attempts = symbolCount >= 8 ? 150 : 100
		for (let attempt = 0; attempt < attempts; attempt++) {
			const attemptSeed = seed * 17 + attempt * 31

			// Generate position - use angle + radius for circular distribution
			const angle = seededRandom(attemptSeed) * Math.PI * 2
			// Bias toward using more of the card area
			const radiusFactor = seededRandom(attemptSeed + 1)
			const maxR = 42 - myRadius
			const r = Math.sqrt(radiusFactor) * maxR // sqrt for uniform area distribution

			const x = 50 + r * Math.cos(angle)
			const y = 50 + r * Math.sin(angle)

			// Check bounds
			const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2)
			if (distFromCenter + myRadius > 46) continue

			// Check spacing from all placed symbols - NO overlaps
			let minDist = 100
			let valid = true

			for (const other of placedPositions) {
				const dx = x - other.x
				const dy = y - other.y
				const dist = Math.sqrt(dx * dx + dy * dy)
				const minRequired = myRadius + other.radius + minGap

				if (dist < minRequired) {
					valid = false
					break
				}
				minDist = Math.min(minDist, dist - myRadius - other.radius)
			}

			if (!valid) continue

			// Pick position with best minimum distance (maximizes spacing)
			if (minDist > bestMinDist) {
				bestMinDist = minDist
				bestX = x
				bestY = y
			}
		}

		placedPositions.push({ x: bestX, y: bestY, radius: myRadius })

		// Random rotation
		const rotation = (seededRandom(seed + 2) - 0.5) * 60

		// Store in original order
		positions[i] = { x: bestX, y: bestY, rotation, sizeIndex }
	}

	return positions
}

export function SpotCard({
	card,
	symbols,
	isSelected = false,
	highlightedSymbol = null,
	sharedSymbol = null,
	onClick,
	onSymbolClick,
	size = "md",
	hardMode = false,
	className,
}: SpotCardProps) {
	// Use dense config for cards with 8+ symbols (n=7 and up)
	const isDense = card.symbols.length >= 8
	const config = isDense ? sizeConfigDense[size] : sizeConfig[size]

	// For hard mode, generate scattered positions
	const scatteredPositions = useMemo(() => {
		if (!hardMode) return null
		return generateScatteredPositions(card.symbols.length, card.id)
	}, [hardMode, card.symbols.length, card.id])

	// Simple circular layout for easy mode
	const symbolCount = card.symbols.length
	const angleStep = (2 * Math.PI) / symbolCount

	return (
		<div
			className={cn(
				"relative rounded-full bg-white dark:bg-zinc-900 border-2 flex items-center justify-center transition-all duration-200",
				onClick && "cursor-pointer",
				isSelected
					? "border-primary ring-2 ring-primary/30 scale-110"
					: "border-zinc-300 dark:border-zinc-600 hover:border-primary/50 hover:shadow-lg",
				config.card,
				className
			)}
			onClick={onClick}
		>
			{/* Symbols */}
			{card.symbols.map((symbolId, index) => {
				const symbol = symbols[symbolId]
				const isHighlighted = highlightedSymbol === symbolId
				const isShared = sharedSymbol === symbolId

				let style: React.CSSProperties
				let sizeClass: string

				if (hardMode && scatteredPositions) {
					const pos = scatteredPositions[index]
					style = {
						left: `${pos.x}%`,
						top: `${pos.y}%`,
						transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
					}
					sizeClass = config.symbolHard[pos.sizeIndex]
				} else {
					const angle = angleStep * index - Math.PI / 2
					const radius = 35
					const x = 50 + radius * Math.cos(angle)
					const y = 50 + radius * Math.sin(angle)
					style = {
						left: `${x}%`,
						top: `${y}%`,
					}
					sizeClass = config.symbol
				}

				return (
					<button
						key={symbolId}
						className={cn(
							"absolute rounded-full",
							!hardMode && "transform -translate-x-1/2 -translate-y-1/2 p-0.5",
							hardMode && "p-1",
							sizeClass,
							isShared && "scale-125 animate-pulse z-10",
							isHighlighted &&
								"scale-125 ring-2 ring-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 z-10",
							!isShared &&
								!isHighlighted &&
								onSymbolClick &&
								"hover:scale-110 transition-transform duration-150"
						)}
						style={style}
						onClick={(e) => {
							e.stopPropagation()
							onSymbolClick?.(symbolId)
						}}
						disabled={!onSymbolClick}
					>
						<span
							className={cn(
								isShared && "drop-shadow-lg",
								"select-none leading-none"
							)}
						>
							{symbol?.label ?? symbolId}
						</span>
					</button>
				)
			})}

			{/* Card ID in center (only in easy mode) */}
			{!hardMode && (
				<span className="text-xs text-muted-foreground/50 font-mono">
					#{card.id}
				</span>
			)}
		</div>
	)
}
