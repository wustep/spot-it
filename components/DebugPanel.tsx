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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function DebugPanel() {
	const {
		symbolMode,
		setSymbolMode,
		emojiStyle,
		setEmojiStyle,
		order,
		setOrder,
		viewMode,
		setViewMode,
		hardMode,
		setHardMode,
		deck,
		shuffleCards,
		gameSubMode,
		isPlaying,
	} = useGame()

	const orderInfo = getOrderInfo(order)

	return (
		<Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm border-border/50">
			<CardHeader>
				<CardTitle className="text-lg font-semibold tracking-tight">
					Control Panel
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* View Mode */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-muted-foreground">
						Mode
					</Label>
					<Tabs
						value={viewMode}
						onValueChange={(v) => setViewMode(v as "game" | "visualizer")}
					>
						<TabsList className="w-full">
							<TabsTrigger value="game" className="flex-1">
								Game
							</TabsTrigger>
							<TabsTrigger value="visualizer" className="flex-1">
								Visualizer
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Symbol Mode */}
				<div className="flex items-center justify-between">
					<Label htmlFor="symbol-mode" className="text-sm font-medium">
						Use Emojis
					</Label>
					<Switch
						id="symbol-mode"
						checked={symbolMode === "emojis"}
						onCheckedChange={(checked) =>
							setSymbolMode(checked ? "emojis" : "numbers")
						}
					/>
				</div>

				{/* Emoji Style */}
				{symbolMode === "emojis" && (
					<div className="flex items-center justify-between gap-4">
						<Label className="text-sm font-medium">Emoji Style</Label>
						<Select
							value={emojiStyle}
							onValueChange={(v) =>
								setEmojiStyle(v as "openmoji" | "twemoji" | "system")
							}
						>
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="openmoji">OpenMoji</SelectItem>
								<SelectItem value="twemoji">Twemoji</SelectItem>
								<SelectItem value="system">System</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Hard Mode */}
				{(viewMode === "game" || viewMode === "visualizer") && (
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="hard-mode" className="text-sm font-medium">
								Harder Cards
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

				{/* Order Selection */}
				<div className="flex items-center justify-between gap-4">
					<Label className="text-sm font-medium">Symbols per Card</Label>
					<Select
						value={String(order)}
						onValueChange={(v) => setOrder(Number(v) as typeof order)}
					>
						<SelectTrigger className="w-24">
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

				{/* Deck Stats */}
				<div className="rounded-lg bg-muted/50 p-3 space-y-1">
					<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Deck Info
					</div>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span className="text-muted-foreground">Cards:</span>{" "}
							<span className="font-mono font-medium">{deck.cards.length}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Symbols:</span>{" "}
							<span className="font-mono font-medium">
								{deck.symbols.length}
							</span>
						</div>
						<div className="col-span-2">
							<span className="text-muted-foreground">Per Card:</span>{" "}
							<span className="font-mono font-medium">
								{orderInfo.symbolsPerCard}
							</span>
						</div>
					</div>
				</div>

				{/* Actions */}
				{viewMode === "game" && gameSubMode === "practice" && !isPlaying && (
					<Button variant="outline" className="w-full" onClick={shuffleCards}>
						Shuffle Deck
					</Button>
				)}
			</CardContent>
		</Card>
	)
}
