"use client"

import { useState } from "react"
import { useGame } from "@/lib/store"
import { cn } from "@/lib/utils"

interface EmojiProps {
	emoji: string
	size?: string // e.g., "1.4em", "24px", "2rem"
	className?: string
}

// Convert emoji to OpenMoji codepoint format (e.g., "😀" → "1F600")
function emojiToCodepoint(emoji: string): string {
	const codepoints: string[] = []
	for (const char of emoji) {
		const code = char.codePointAt(0)
		if (code !== undefined) {
			// Skip variation selectors (FE0E, FE0F) for cleaner URLs
			if (code !== 0xfe0e && code !== 0xfe0f) {
				codepoints.push(code.toString(16).toUpperCase())
			}
		}
	}
	return codepoints.join("-")
}

export function Emoji({ emoji, size = "1em", className }: EmojiProps) {
	const { emojiStyle } = useGame()
	const [failed, setFailed] = useState(false)

	// Use system emoji if selected or if OpenMoji failed to load
	// System emoji glyphs render smaller than their font-size box (~75-80%)
	// Use calc() to increase font-size to compensate and match OpenMoji image sizing
	if (emojiStyle === "system" || failed) {
		return (
			<span
				className={cn(
					"select-none inline-flex items-center justify-center leading-none max-w-none",
					className
				)}
				style={{ fontSize: size }}
			>
				{emoji}
			</span>
		)
	}

	// OpenMoji CDN URL
	const codepoint = emojiToCodepoint(emoji)
	const openmojiUrl = `https://openmoji.org/data/color/svg/${codepoint}.svg`

	return (
		<img
			src={openmojiUrl}
			alt={emoji}
			className={cn("inline-block select-none max-w-none", className)}
			style={{ width: size, height: size, scale: 1.2 }}
			draggable={false}
			onError={() => setFailed(true)}
		/>
	)
}
