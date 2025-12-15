"use client"

import { useGame } from "@/lib/store"
import { VALID_ORDERS, getOrderInfo } from "@/lib/deck"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Emoji } from "./Emoji"

export function DebugPanel() {
	const {
		symbolStyle,
		setSymbolStyle,
		order,
		setOrder,
		viewMode,
		hardMode,
		setHardMode,
	} = useGame()

	return (
		<Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm border-border/50">
			<CardHeader>
				<CardTitle className="text-lg font-semibold tracking-tight">
					Control Panel
				</CardTitle>
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
								Scattered symbols, varied sizes
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
									className="mr-2"
								/>
								OpenMoji
							</SelectItem>
							<SelectItem value="twemoji">
								<Emoji emoji="😎" style="twemoji" size="1em" className="mr-2" />
								Twemoji
							</SelectItem>
							<SelectItem value="system">
								<Emoji emoji="😎" style="system" size="1em" className="mr-2" />
								System
							</SelectItem>
							<SelectItem value="numbers">
								<span className="mr-2 inline-flex w-[1em] items-center justify-center font-mono text-[0.95em] leading-none">
									12
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
