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

// Soft boundary penalty - quadratic increase as we approach edge
function boundaryPenalty(
	x: number,
	y: number,
	radius: number,
	maxRadius: number = 48
): number {
	const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2)
	const maxDist = maxRadius - radius
	const softZone = maxDist * 0.85 // Allow symbols closer to edge

	if (distFromCenter <= softZone) return 0

	// Quadratic penalty as we approach edge
	const overflow = (distFromCenter - softZone) / (maxDist - softZone)
	return overflow * overflow * 25 // Reduced penalty strength
}

// Clamp position to circular bounds
function clampToCircle(
	x: number,
	y: number,
	radius: number,
	maxRadius: number = 48
): { x: number; y: number } {
	const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2)
	const maxAllowed = maxRadius - radius
	if (distFromCenter <= maxAllowed) return { x, y }

	const scale = maxAllowed / distFromCenter
	return {
		x: 50 + (x - 50) * scale,
		y: 50 + (y - 50) * scale,
	}
}

// Force-directed relaxation to improve symbol distribution
function relaxPositions(
	positions: Array<{ x: number; y: number; radius: number; idx: number }>,
	iterations: number = 8
): void {
	for (let iter = 0; iter < iterations; iter++) {
		// Damping decreases with iterations for fine-tuning
		const damping = 0.6 * (1 - iter / (iterations * 1.5))

		for (let i = 0; i < positions.length; i++) {
			let forceX = 0
			let forceY = 0

			// Repulsion from other symbols
			for (let j = 0; j < positions.length; j++) {
				if (i === j) continue

				const dx = positions[i].x - positions[j].x
				const dy = positions[i].y - positions[j].y
				const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
				const minDist = positions[i].radius + positions[j].radius + 2

				if (dist < minDist * 1.8) {
					// Repulsion strength increases as symbols get closer
					const strength = Math.pow((minDist * 1.8 - dist) / minDist, 1.5)
					forceX += (dx / dist) * strength * 4
					forceY += (dy / dist) * strength * 4
				}
			}

			// Very soft attraction to center (only prevents extreme edge clustering)
			const distFromCenter = Math.sqrt(
				(positions[i].x - 50) ** 2 + (positions[i].y - 50) ** 2
			)
			if (distFromCenter > 35) {
				const centerPull = 0.015 * ((distFromCenter - 35) / 15)
				forceX -= (positions[i].x - 50) * centerPull
				forceY -= (positions[i].y - 50) * centerPull
			}

			// Apply forces with damping
			positions[i].x += forceX * damping
			positions[i].y += forceY * damping

			// Keep within bounds
			const clamped = clampToCircle(
				positions[i].x,
				positions[i].y,
				positions[i].radius
			)
			positions[i].x = clamped.x
			positions[i].y = clamped.y
		}
	}
}

// Dynamic size assignment based on card ID for variety
function assignDynamicSizes(
	symbolCount: number,
	cardId: number
): { sizes: number[]; sizeRadii: number[] } {
	const seed = cardId * 41

	// Base size radii adjusted by density
	const baseSizeRadii =
		symbolCount >= 8
			? [4.5, 6.5, 9] // Dense cards
			: [6, 10, 14] // Sparse cards

	// Dynamic ratios for variety between cards
	const largeRatio = 0.08 + seededRandom(seed) * 0.12 // 8-20% large
	const smallRatio = 0.15 + seededRandom(seed + 1) * 0.15 // 15-30% small

	const sizes: number[] = []

	// Assign sizes with randomness based on card ID
	for (let i = 0; i < symbolCount; i++) {
		const roll = seededRandom(seed + i * 7 + 100)
		if (roll < largeRatio) {
			sizes.push(2) // Large
		} else if (roll < largeRatio + smallRatio) {
			sizes.push(0) // Small
		} else {
			sizes.push(1) // Medium
		}
	}

	// Ensure at least one large symbol for visual interest
	if (!sizes.includes(2) && symbolCount >= 3) {
		const largeIdx = Math.floor(seededRandom(seed + 200) * symbolCount)
		sizes[largeIdx] = 2
	}

	// Ensure at least one small symbol for contrast
	if (!sizes.includes(0) && symbolCount >= 4) {
		let smallIdx = Math.floor(seededRandom(seed + 201) * symbolCount)
		// Don't overwrite the large symbol
		if (sizes[smallIdx] === 2) {
			smallIdx = (smallIdx + 1) % symbolCount
		}
		sizes[smallIdx] = 0
	}

	return { sizes, sizeRadii: baseSizeRadii }
}

// Generate base positions using Fermat spiral (sunflower pattern)
// with occasional center placement for authentic look
function generateSpiralPositions(
	symbolCount: number,
	cardId: number
): Array<{ baseX: number; baseY: number }> {
	const positions: Array<{ baseX: number; baseY: number }> = []

	// Rotation offset based on card ID for variety
	const rotationOffset = seededRandom(cardId * 7) * Math.PI * 2

	// Use more of the card area - push symbols closer to edges
	const maxRadius = symbolCount >= 8 ? 42 : 40

	for (let i = 0; i < symbolCount; i++) {
		// Fermat spiral: r = sqrt(i), theta = golden_angle * i
		const angle = GOLDEN_ANGLE * i + rotationOffset
		// Normalize radius so symbols spread from center to edge
		const normalizedIndex = (i + 0.5) / symbolCount
		const r = Math.sqrt(normalizedIndex) * maxRadius

		const baseX = 50 + r * Math.cos(angle)
		const baseY = 50 + r * Math.sin(angle)

		positions.push({ baseX, baseY })
	}

	// Occasionally place a symbol near center (40% of cards)
	// This mimics real Spot It cards which often have a prominent center symbol
	if (seededRandom(cardId * 11) < 0.4 && symbolCount >= 4) {
		const centerIdx = Math.floor(seededRandom(cardId * 13) * symbolCount)
		const centerJitter = 6 // Small offset from exact center
		positions[centerIdx] = {
			baseX: 50 + (seededRandom(cardId * 17) - 0.5) * centerJitter,
			baseY: 50 + (seededRandom(cardId * 19) - 0.5) * centerJitter,
		}
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

	// Get dynamic sizes for this specific card
	const { sizes, sizeRadii } = assignDynamicSizes(symbolCount, cardId)

	// Shuffle sizes deterministically while maintaining variety
	const shuffledSizes = [...sizes]
	for (let i = shuffledSizes.length - 1; i > 0; i--) {
		const j = Math.floor(seededRandom(cardId * 37 + i * 13) * (i + 1))
		;[shuffledSizes[i], shuffledSizes[j]] = [shuffledSizes[j], shuffledSizes[i]]
	}

	// Get base spiral positions for even distribution
	const basePositions = generateSpiralPositions(symbolCount, cardId)

	// Jitter amount based on density
	const jitterAmount = symbolCount >= 8 ? 8 : 12

	// Place symbols using spiral base + jitter
	const placedPositions: Array<{
		x: number
		y: number
		radius: number
		idx: number
	}> = []

	// Sort by size (largest first) for better packing
	const sortedIndices = shuffledSizes
		.map((size, idx) => ({ size, idx }))
		.sort((a, b) => b.size - a.size)
		.map((item) => item.idx)

	// Min gap between symbols
	const minGap = symbolCount >= 8 ? 1 : 1.5

	for (const i of sortedIndices) {
		const seed = cardId * 100 + i
		const sizeIndex = shuffledSizes[i]
		const myRadius = sizeRadii[sizeIndex]
		const base = basePositions[i]

		let bestX = base.baseX
		let bestY = base.baseY
		let bestScore = -Infinity

		// Try positions around the base with jitter
		const attempts = 80 // Increased attempts for better placement
		for (let attempt = 0; attempt < attempts; attempt++) {
			const attemptSeed = seed * 17 + attempt * 31

			// Add jitter to base position
			const jitterX = (seededRandom(attemptSeed) - 0.5) * jitterAmount * 2
			const jitterY = (seededRandom(attemptSeed + 1) - 0.5) * jitterAmount * 2

			const x = base.baseX + jitterX
			const y = base.baseY + jitterY

			// Check bounds - stay within card circle (with some slack for soft boundary)
			const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2)
			const maxDist = 48 - myRadius
			if (distFromCenter > maxDist * 1.05) continue

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

			// Score: balance distance from other symbols, staying near base, and soft boundary
			const distFromBase = Math.sqrt(
				(x - base.baseX) ** 2 + (y - base.baseY) ** 2
			)
			const edgePenalty = boundaryPenalty(x, y, myRadius)

			// Prefer positions that maintain good spacing but stay close-ish to base
			const score = minDist * 2 - distFromBase * 0.3 - edgePenalty

			if (score > bestScore) {
				bestScore = score
				bestX = x
				bestY = y
			}
		}

		// Clamp to card bounds
		const clamped = clampToCircle(bestX, bestY, myRadius)
		bestX = clamped.x
		bestY = clamped.y

		placedPositions.push({ x: bestX, y: bestY, radius: myRadius, idx: i })

		// Random rotation - less extreme for dense cards
		const maxRotation = symbolCount >= 8 ? 50 : 60
		const rotation = (seededRandom(seed + 2) - 0.5) * maxRotation

		positions[i] = { x: bestX, y: bestY, rotation, sizeIndex }
	}

	// Apply force-directed relaxation for smoother distribution
	relaxPositions(placedPositions, symbolCount >= 8 ? 6 : 8)

	// Update final positions after relaxation
	for (const placed of placedPositions) {
		positions[placed.idx].x = placed.x
		positions[placed.idx].y = placed.y
	}

	return positions
}

// Generate organic easy mode positions (slight variations from perfect circle)
function generateEasyModePositions(
	symbolCount: number,
	cardId: number
): Array<{ x: number; y: number }> {
	const positions: Array<{ x: number; y: number }> = []
	const baseRadius = 36 // Increased to use more card space

	for (let i = 0; i < symbolCount; i++) {
		const baseAngle = ((2 * Math.PI) / symbolCount) * i - Math.PI / 2
		const seed = cardId * 100 + i

		// Subtle per-symbol variation for organic feel
		const angleJitter = (seededRandom(seed) - 0.5) * 0.12
		const radiusJitter = (seededRandom(seed + 1) - 0.5) * 5

		const angle = baseAngle + angleJitter
		const radius = baseRadius + radiusJitter

		positions.push({
			x: 50 + radius * Math.cos(angle),
			y: 50 + radius * Math.sin(angle),
		})
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

	// For easy mode, generate organic positions (slight variations from perfect circle)
	const easyModePositions = useMemo(() => {
		if (hardMode) return null
		return generateEasyModePositions(card.symbols.length, card.id)
	}, [hardMode, card.symbols.length, card.id])

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
				} else if (easyModePositions) {
					const pos = easyModePositions[index]
					style = {
						left: `${pos.x}%`,
						top: `${pos.y}%`,
					}
					sizeClass = config.symbol
				} else {
					// Fallback (should not happen)
					const angle = ((2 * Math.PI) / symbolCount) * index - Math.PI / 2
					const radius = 35
					style = {
						left: `${50 + radius * Math.cos(angle)}%`,
						top: `${50 + radius * Math.sin(angle)}%`,
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
							if (onSymbolClick) {
								e.stopPropagation()
								onSymbolClick(symbolId)
							}
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
