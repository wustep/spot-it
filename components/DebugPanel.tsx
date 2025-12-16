"use client"

import { useState } from "react"
import { useGame } from "@/lib/store"
import { VALID_ORDERS, getOrderInfo } from "@/lib/deck"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Emoji } from "./Emoji"
import { RotateCcw } from "lucide-react"

export function DebugPanel() {
	const [spinKey, setSpinKey] = useState(0)
	const {
		symbolStyle,
		setSymbolStyle,
		order,
		setOrder,
		viewMode,
		hardMode,
		setHardMode,
	} = useGame()

	const handleResetToDefaults = () => {
		setSpinKey((k) => k + 1)
		setOrder(7)
		setHardMode(true)
		setSymbolStyle("twemoji")
	}

	return (
		<Card className="w-full max-w-sm border-border/60 bg-card shadow-lg">
			<CardHeader className="border-b border-border/50 gap-0">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-semibold tracking-tight">
						Control Panel
					</CardTitle>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={handleResetToDefaults}
								>
									<RotateCcw
										key={spinKey}
										className="h-4 w-4 animate-spin-once"
									/>
									<span className="sr-only">Reset to defaults</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Reset to defaults</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* Order Selection */}
				<div className="flex items-center justify-between gap-4">
					<Label className="text-sm font-medium">Symbols per Card</Label>
					<Select
						value={String(order)}
						onValueChange={(v) => setOrder(Number(v) as typeof order)}
					>
						<SelectTrigger className="w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{VALID_ORDERS.map((n) => {
								const info = getOrderInfo(n)
								return (
									<SelectItem key={n} value={String(n)}>
										{info.symbolsPerCard}
									</SelectItem>
								)
							})}
						</SelectContent>
					</Select>
				</div>

				{/* Hard Mode */}
				{(viewMode === "game" || viewMode === "visualizer") && (
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="hard-mode" className="text-sm font-medium">
								Hard Mode
							</Label>
							<p className="text-xs text-muted-foreground">
								More like the real game
							</p>
						</div>
						<Switch
							id="hard-mode"
							checked={hardMode}
							onCheckedChange={setHardMode}
						/>
					</div>
				)}

				{/* Symbol Style */}
				<div className="flex items-center justify-between gap-4">
					<Label className="text-sm font-medium">Style</Label>
					<Select
						value={symbolStyle}
						onValueChange={(v) =>
							setSymbolStyle(v as "openmoji" | "twemoji" | "system" | "numbers")
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="openmoji">
								<Emoji
									emoji="😎"
									style="openmoji"
									size="1em"
									className="mr-1"
								/>
								OpenMoji
							</SelectItem>
							<SelectItem value="twemoji">
								<Emoji emoji="😎" style="twemoji" size="1em" className="mr-1" />
								Twemoji
							</SelectItem>
							<SelectItem value="system">
								<Emoji emoji="😎" style="system" size="1em" className="mr-1" />
								System
							</SelectItem>
							<SelectItem value="numbers">
								<span className="mr-1 inline-flex w-[1.5em] items-center justify-center font-mono text-[0.75em] leading-none">
									123
								</span>
								Numbers
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Actions */}
			</CardContent>
		</Card>
	)
}
