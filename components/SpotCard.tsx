"use client"

import { useMemo } from "react"
import { type Card as CardType, type SymbolMeta } from "@/lib/deck"
import { cn } from "@/lib/utils"
import { Emoji } from "./Emoji"

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
		symbol: "text-xl",
		symbolHard: ["text-lg", "text-xl", "text-3xl"],
	},
	md: {
		card: "w-32 h-32",
		symbol: "text-2xl",
		symbolHard: ["text-xl", "text-2xl", "text-3xl"],
	},
	lg: {
		card: "w-44 h-44",
		symbol: "text-3xl",
		symbolHard: ["text-2xl", "text-3xl", "text-5xl"],
	},
	xl: {
		card: "w-56 h-56",
		symbol: "text-4xl",
		symbolHard: ["text-3xl", "text-4xl", "text-5xl"],
	},
}

// Smaller sizes for cards with many symbols (n>=7 has 8 symbols, n>=9 has 10 symbols)
const sizeConfigDense = {
	sm: {
		card: "w-24 h-24",
		symbol: "text-base",
		symbolHard: ["text-base", "text-lg", "text-xl"],
	},
	md: {
		card: "w-32 h-32",
		symbol: "text-xl",
		symbolHard: ["text-lg", "text-xl", "text-2xl"],
	},
	lg: {
		card: "w-44 h-44",
		symbol: "text-2xl",
		symbolHard: ["text-xl", "text-2xl", "text-3xl"],
	},
	xl: {
		card: "w-56 h-56",
		symbol: "text-3xl",
		symbolHard: ["text-2xl", "text-3xl", "text-4xl"],
	},
}

// Seeded random for consistent positioning per card
function seededRandom(seed: number) {
	const x = Math.sin(seed * 9999) * 10000
	return x - Math.floor(x)
}

// Golden angle for optimal spiral distribution
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Generate base positions using Fermat spiral (sunflower pattern)
// This gives mathematically optimal packing
function generateSpiralPositions(
	symbolCount: number,
	cardId: number
): Array<{ baseX: number; baseY: number }> {
	const positions: Array<{ baseX: number; baseY: number }> = []

	// Rotation offset based on card ID for variety
	const rotationOffset = seededRandom(cardId * 7) * Math.PI * 2

	// Use more of the card area for dense cards
	const maxRadius = symbolCount >= 8 ? 39 : 38

	for (let i = 0; i < symbolCount; i++) {
		// Fermat spiral: r = sqrt(i), theta = golden_angle * i
		const angle = GOLDEN_ANGLE * i + rotationOffset
		// Normalize radius so symbols spread from center to edge
		// Use i+0.5 to avoid center point and edge crowding
		const normalizedIndex = (i + 0.5) / symbolCount
		const r = Math.sqrt(normalizedIndex) * maxRadius

		const baseX = 50 + r * Math.cos(angle)
		const baseY = 50 + r * Math.sin(angle)

		positions.push({ baseX, baseY })
	}

	return positions
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
		if (symbolCount >= 8) return [4.5, 6.5, 9] // n>=7: 8+ symbols
		return [6, 10, 14] // smaller decks - more size variety
	}
	const sizeRadii = getSizeRadii()

	// Determine sizes - for dense cards, use more uniform sizes
	const sizes: number[] = []

	if (symbolCount >= 8) {
		// For 8+ symbols: balanced distribution
		const largeCount = 1
		const smallCount = 2
		for (let i = 0; i < symbolCount; i++) {
			if (i < largeCount) {
				sizes.push(2)
			} else if (i < largeCount + smallCount) {
				sizes.push(0)
			} else {
				sizes.push(1)
			}
		}
	} else {
		// For smaller decks: more variety
		const largeCount = Math.max(1, Math.floor(symbolCount / 4))
		const smallCount = Math.max(1, Math.floor(symbolCount / 4))
		for (let i = 0; i < symbolCount; i++) {
			if (i < largeCount) {
				sizes.push(2)
			} else if (i < largeCount + smallCount) {
				sizes.push(0)
			} else {
				sizes.push(1)
			}
		}
	}

	// Shuffle sizes deterministically
	for (let i = sizes.length - 1; i > 0; i--) {
		const j = Math.floor(seededRandom(cardId * 37 + i * 13) * (i + 1))
		;[sizes[i], sizes[j]] = [sizes[j], sizes[i]]
	}

	// Get base spiral positions for even distribution
	const basePositions = generateSpiralPositions(symbolCount, cardId)

	// Jitter amount based on density
	const getJitter = () => {
		if (symbolCount >= 8) return 8 // Less jitter for dense cards
		return 12 // More chaos for smaller decks
	}
	const jitterAmount = getJitter()

	// Place symbols using spiral base + jitter
	const placedPositions: Array<{ x: number; y: number; radius: number }> = []

	// Sort by size (largest first) for better packing
	const sortedIndices = sizes
		.map((size, idx) => ({ size, idx }))
		.sort((a, b) => b.size - a.size)
		.map((item) => item.idx)

	// Min gap between symbols
	const minGap = symbolCount >= 8 ? 1 : 1.5

	for (const i of sortedIndices) {
		const seed = cardId * 100 + i
		const sizeIndex = sizes[i]
		const myRadius = sizeRadii[sizeIndex]
		const base = basePositions[i]

		let bestX = base.baseX
		let bestY = base.baseY
		let bestScore = -Infinity

		// Try positions around the base with jitter
		const attempts = 60
		for (let attempt = 0; attempt < attempts; attempt++) {
			const attemptSeed = seed * 17 + attempt * 31

			// Add jitter to base position
			const jitterX = (seededRandom(attemptSeed) - 0.5) * jitterAmount * 2
			const jitterY = (seededRandom(attemptSeed + 1) - 0.5) * jitterAmount * 2

			const x = base.baseX + jitterX
			const y = base.baseY + jitterY

			// Check bounds - stay within card circle
			const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2)
			const maxDist = 46 - myRadius
			if (distFromCenter > maxDist) continue

			// Check spacing from all placed symbols
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

			// Score: balance distance from other symbols and staying near base
			const distFromBase = Math.sqrt(
				(x - base.baseX) ** 2 + (y - base.baseY) ** 2
			)
			// Prefer positions that maintain good spacing but stay close-ish to base
			const score = minDist * 2 - distFromBase * 0.3

			if (score > bestScore) {
				bestScore = score
				bestX = x
				bestY = y
			}
		}

		// Clamp to card bounds
		const finalDistFromCenter = Math.sqrt((bestX - 50) ** 2 + (bestY - 50) ** 2)
		const maxAllowed = 46 - myRadius
		if (finalDistFromCenter > maxAllowed) {
			const scale = maxAllowed / finalDistFromCenter
			bestX = 50 + (bestX - 50) * scale
			bestY = 50 + (bestY - 50) * scale
		}

		placedPositions.push({ x: bestX, y: bestY, radius: myRadius })

		// Random rotation - less extreme for dense cards
		const maxRotation = symbolCount >= 8 ? 50 : 60
		const rotation = (seededRandom(seed + 2) - 0.5) * maxRotation

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
	// Use appropriate config based on symbol density
	const symbolCount = card.symbols.length
	const config = symbolCount >= 8 ? sizeConfigDense[size] : sizeConfig[size]

	// For hard mode, generate scattered positions
	const scatteredPositions = useMemo(() => {
		if (!hardMode) return null
		return generateScatteredPositions(card.symbols.length, card.id)
	}, [hardMode, card.symbols.length, card.id])

	// Simple circular layout for easy mode
	const angleStep = (2 * Math.PI) / symbolCount

	return (
		<div
			className={cn(
				"relative rounded-full bg-white dark:bg-zinc-900 border-2 shadow-sm flex items-center justify-center transition-all duration-200",
				onClick && "cursor-pointer",
				isSelected
					? "ring-2 ring-primary/30 scale-110"
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
						key={`${card.id}-${index}`}
						className={cn(
							"absolute rounded-full",
							!hardMode && "transform -translate-x-1/2 -translate-y-1/2 p-0.5",
							hardMode && "p-0.5",
							sizeClass,
							isShared && "scale-125 animate-pulse",
							isHighlighted &&
								"scale-125 ring-2 ring-yellow-400 bg-yellow-100 dark:bg-yellow-900/50",
							!isShared &&
								!isHighlighted &&
								onSymbolClick &&
								"hover:scale-125 transition-transform duration-150"
						)}
						style={style}
						onClick={(e) => {
							e.stopPropagation()
							onSymbolClick?.(symbolId)
						}}
						disabled={!onSymbolClick}
					>
						{symbol?.emoji ? (
							<Emoji
								emoji={symbol.emoji}
								size="1.2em"
								className={cn(isShared && "drop-shadow-lg")}
							/>
						) : (
							<span
								className={cn(
									isShared && "drop-shadow-lg",
									"select-none leading-none"
								)}
							>
								{symbol?.label ?? symbolId}
							</span>
						)}
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
