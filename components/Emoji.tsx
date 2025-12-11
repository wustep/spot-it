"use client"

import { useState } from "react"
import { useGame } from "@/lib/store"
import { cn } from "@/lib/utils"

interface EmojiProps {
	emoji: string
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

export function Emoji({ emoji, className }: EmojiProps) {
	const { emojiStyle } = useGame()
	const [failed, setFailed] = useState(false)

	// Use system emoji if selected or if OpenMoji failed to load
	if (emojiStyle === "system" || failed) {
		// For text emojis, we need to use the width as font-size since
		// w-[1.4em] doesn't affect text size
		return (
			<span
				className={cn(
					"select-none inline-flex items-center justify-center leading-none",
					// Remove w/h classes and apply as font-size instead
					className?.replace(/[wh]-\[[\d.]+em\]/g, "")
				)}
				style={{
					fontSize: className?.match(/w-\[([\d.]+em)\]/)?.[1] || "1em",
				}}
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
			className={cn("inline-block select-none", className)}
			draggable={false}
			onError={() => setFailed(true)}
		/>
	)
}
