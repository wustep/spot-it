"use client"

import { useMemo, useState } from "react"
import { useGame } from "@/lib/store"
import { cn } from "@/lib/utils"

// Colors for each "line family" (A through H)
const LINE_COLORS = [
	"#000000", // A - black
	"#6366f1", // B - indigo
	"#06b6d4", // C - cyan
	"#d946ef", // D - fuchsia
	"#ef4444", // E - red
	"#eab308", // F - yellow
	"#22c55e", // G - green
	"#6b7280", // H - gray
]

const LINE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"]

interface ProjectivePlaneProps {
	className?: string
}

// Generate the projective plane structure for order n
// Returns which "lines" (symbol groups) each point belongs to
function generateProjectivePlaneStructure(order: number) {
	const n = order
	const totalPoints = n * n + n + 1

	// For a projective plane of order n:
	// - Points are numbered 0 to n²+n
	// - Lines are numbered 0 to n²+n
	// - Each point is on exactly n+1 lines
	// - Each line contains exactly n+1 points

	// We'll use the standard construction for prime power orders
	// Points: (x, y) for x,y in GF(n), plus n+1 points at infinity
	// Lines: y = mx + b for each slope m and intercept b, plus the line at infinity

	const points: Array<{ lines: number[] }> = []

	// For the grid visualization, we arrange:
	// - The main n×n grid represents points (x, y) for x, y in 0..n-1
	// - The right column represents points at infinity (one for each slope)
	// - The bottom row represents another set of infinity points

	// Each point belongs to n+1 lines
	// Line families:
	// - Horizontal lines (y = constant): n lines, each with n points + 1 infinity point
	// - Vertical lines (x = constant): n lines, each with n points + 1 infinity point
	// - Diagonal lines with various slopes: (n-1) families of n lines each

	// Simplified model for visualization:
	// For order n, we have n+1 "line families" (like the colors A-H in the SVG)
	// Each family has n+1 lines (like numbers 1-8 in the SVG)
	// Total lines = (n+1)² - but projective plane only has n²+n+1

	// Actually, let's use the exact structure from the SVG:
	// Each cell in a 7×7 grid gets 8 symbols (one from each family A-H)
	// The pattern follows modular arithmetic

	for (let row = 0; row < n; row++) {
		for (let col = 0; col < n; col++) {
			const lines: number[] = []

			// Family 0 (A): All points in same row share the same line
			// Line number = row
			lines.push(row)

			// Family 1 (B): Diagonal with slope 1
			// Line number = (col - row) mod n
			lines.push(n + ((col - row + n) % n))

			// Family 2 (C): Diagonal with slope 2
			lines.push(2 * n + ((col - 2 * row + 2 * n) % n))

			// Family 3 (D): Diagonal with slope 3
			lines.push(3 * n + ((col - 3 * row + 3 * n) % n))

			// Family 4 (E): Diagonal with slope 4
			lines.push(4 * n + ((col - 4 * row + 4 * n) % n))

			// Family 5 (F): Diagonal with slope 5
			lines.push(5 * n + ((col - 5 * row + 5 * n) % n))

			// Family 6 (G): Diagonal with slope 6
			lines.push(6 * n + ((col - 6 * row + 6 * n) % n))

			// Family 7 (H): All points in same column share the same line
			// Line number = col
			lines.push(7 * n + col)

			points.push({ lines })
		}
	}

	// Add the n+1 "infinity" points (one for each line family except the last)
	// These are the points that complete each parallel family into a pencil
	for (let family = 0; family < n + 1; family++) {
		const lines: number[] = []
		// This infinity point is on all n lines of its family
		for (let i = 0; i < n; i++) {
			lines.push(family * n + i)
		}
		// Plus it's on the "line at infinity"
		lines.push((n + 1) * n) // The line at infinity
		points.push({ lines })
	}

	return { points, n, totalPoints }
}

export function ProjectivePlane({ className }: ProjectivePlaneProps) {
	const { deck, order } = useGame()
	const [hoveredLine, setHoveredLine] = useState<number | null>(null)
	const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

	// Only show for supported orders
	if (order > 7) {
		return (
			<div className={cn("text-center text-muted-foreground py-8", className)}>
				<p>Projective plane diagram only available for orders up to 7.</p>
				<p className="text-sm mt-1">
					Order {order} would have {order * order + order + 1} points - too many to display clearly.
				</p>
			</div>
		)
	}

	const n = order
	const cellSize = Math.min(60, 400 / n) // Adaptive cell size
	const gridSize = n * cellSize
	const padding = 40
	const totalSize = gridSize + padding * 2

	// Generate structure
	const structure = useMemo(() => generateProjectivePlaneStructure(n), [n])

	// Get which points are highlighted (share the hovered line)
	const highlightedPoints = useMemo(() => {
		if (hoveredLine === null) return new Set<number>()
		const points = new Set<number>()
		structure.points.forEach((point, idx) => {
			if (point.lines.includes(hoveredLine)) {
				points.add(idx)
			}
		})
		return points
	}, [hoveredLine, structure])

	// Get which lines are highlighted (pass through hovered point)
	const highlightedLines = useMemo(() => {
		if (hoveredPoint === null) return new Set<number>()
		return new Set(structure.points[hoveredPoint]?.lines || [])
	}, [hoveredPoint, structure])

	// Map deck cards to grid positions for emoji display
	const cardGrid = useMemo(() => {
		const grid: Array<Array<number | null>> = []
		for (let row = 0; row < n; row++) {
			grid[row] = []
			for (let col = 0; col < n; col++) {
				const idx = row * n + col
				grid[row][col] = idx < deck.cards.length ? idx : null
			}
		}
		return grid
	}, [deck.cards.length, n])

	return (
		<div className={cn("overflow-x-auto", className)}>
			<svg
				viewBox={`0 0 ${totalSize} ${totalSize + 60}`}
				className="w-full max-w-lg mx-auto"
				style={{ minWidth: 300 }}
			>
				{/* Background */}
				<rect
					x={padding}
					y={padding}
					width={gridSize}
					height={gridSize}
					fill="currentColor"
					className="text-muted/20"
					rx={4}
				/>

				{/* Grid cells */}
				{Array.from({ length: n }).map((_, row) =>
					Array.from({ length: n }).map((_, col) => {
						const pointIdx = row * n + col
						const isHighlighted = highlightedPoints.has(pointIdx)
						const isHovered = hoveredPoint === pointIdx
						const x = padding + col * cellSize
						const y = padding + row * cellSize

						return (
							<g key={`${row}-${col}`}>
								{/* Cell background */}
								<rect
									x={x + 2}
									y={y + 2}
									width={cellSize - 4}
									height={cellSize - 4}
									rx={4}
									className="transition-colors duration-150"
									fill={
										isHovered
											? "hsl(var(--primary) / 0.3)"
											: isHighlighted
											? "hsl(50 100% 85%)"
											: "hsl(var(--card))"
									}
									stroke={
										isHovered
											? "hsl(var(--primary))"
											: isHighlighted
											? "hsl(45 100% 50%)"
											: "hsl(var(--border))"
									}
									strokeWidth={isHovered ? 2 : 1}
									onMouseEnter={() => setHoveredPoint(pointIdx)}
									onMouseLeave={() => setHoveredPoint(null)}
									style={{ cursor: "pointer" }}
								/>

								{/* Line indicators (small colored dots showing which lines pass through) */}
								{structure.points[pointIdx]?.lines
									.slice(0, n + 1)
									.map((lineIdx, i) => {
										const family = Math.floor(lineIdx / n)
										const lineNum = lineIdx % n
										const isLineHighlighted =
											hoveredLine === lineIdx || highlightedLines.has(lineIdx)

										// Arrange in a small grid inside the cell
										const cols = Math.ceil(Math.sqrt(n + 1))
										const dotX = x + 8 + (i % cols) * 12
										const dotY = y + 8 + Math.floor(i / cols) * 12
										const dotSize = isLineHighlighted ? 8 : 6

										return (
											<g
												key={lineIdx}
												onMouseEnter={() => setHoveredLine(lineIdx)}
												onMouseLeave={() => setHoveredLine(null)}
												style={{ cursor: "pointer" }}
											>
												<circle
													cx={dotX}
													cy={dotY}
													r={dotSize / 2}
													fill={LINE_COLORS[family % LINE_COLORS.length]}
													opacity={isLineHighlighted ? 1 : 0.6}
													className="transition-all duration-150"
												/>
												{isLineHighlighted && (
													<text
														x={dotX}
														y={dotY}
														textAnchor="middle"
														dominantBaseline="central"
														fontSize={6}
														fill="white"
														fontWeight="bold"
													>
														{lineNum + 1}
													</text>
												)}
											</g>
										)
									})}

								{/* Point label */}
								<text
									x={x + cellSize - 8}
									y={y + cellSize - 6}
									textAnchor="end"
									fontSize={10}
									fill="currentColor"
									className="text-muted-foreground/50"
								>
									{pointIdx}
								</text>
							</g>
						)
					})
				)}

				{/* Legend */}
				<g transform={`translate(${padding}, ${gridSize + padding + 20})`}>
					<text
						x={0}
						y={0}
						fontSize={12}
						fill="currentColor"
						className="text-muted-foreground"
					>
						Line families:
					</text>
					{LINE_LABELS.slice(0, n + 1).map((label, i) => (
						<g
							key={label}
							transform={`translate(${80 + i * 35}, -5)`}
							onMouseEnter={() => setHoveredLine(i * n)}
							onMouseLeave={() => setHoveredLine(null)}
							style={{ cursor: "pointer" }}
						>
							<circle
								cx={0}
								cy={0}
								r={8}
								fill={LINE_COLORS[i]}
								opacity={hoveredLine !== null && Math.floor(hoveredLine / n) === i ? 1 : 0.7}
							/>
							<text
								x={0}
								y={1}
								textAnchor="middle"
								dominantBaseline="central"
								fontSize={10}
								fill="white"
								fontWeight="bold"
							>
								{label}
							</text>
						</g>
					))}
				</g>

				{/* Info text */}
				<text
					x={padding}
					y={gridSize + padding + 45}
					fontSize={11}
					fill="currentColor"
					className="text-muted-foreground"
				>
					{hoveredPoint !== null
						? `Point ${hoveredPoint}: on ${n + 1} lines`
						: hoveredLine !== null
						? `Line ${LINE_LABELS[Math.floor(hoveredLine / n)]}${(hoveredLine % n) + 1}: contains ${n + 1} points`
						: `${n * n} grid points + ${n + 1} points at infinity = ${structure.totalPoints} total`}
				</text>
			</svg>
		</div>
	)
}
