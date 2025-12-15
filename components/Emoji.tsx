"use client"

import { useState } from "react"
import { useGame } from "@/lib/store"
import { cn } from "@/lib/utils"

interface EmojiProps {
	emoji: string
	size?: string // e.g., "1.4em", "24px", "2rem"
	/**
	 * Optional override for rendering a preview in a specific style,
	 * regardless of the globally selected `symbolStyle`.
	 */
	style?: "openmoji" | "twemoji" | "system"
	className?: string
}

function emojiToCodepoint(
	emoji: string,
	options: {
		stripVariationSelectors: boolean
		uppercase: boolean
	}
): string {
	const codepoints: string[] = []
	for (const char of emoji) {
		const code = char.codePointAt(0)
		if (code !== undefined) {
			// Some CDNs include FE0F/FE0E in filenames; make it configurable.
			if (
				options.stripVariationSelectors &&
				(code === 0xfe0e || code === 0xfe0f)
			) {
				continue
			}

			const hex = code.toString(16)
			codepoints.push(options.uppercase ? hex.toUpperCase() : hex.toLowerCase())
		}
	}
	return codepoints.join("-")
}

export function Emoji({ emoji, size = "1em", style, className }: EmojiProps) {
	const { symbolStyle } = useGame()
	const emojiStyle: "openmoji" | "twemoji" | "system" =
		style ?? (symbolStyle === "numbers" ? "system" : symbolStyle)
	const renderKey = `${emojiStyle}:${emoji}`
	const [failState, setFailState] = useState<{ key: string; failed: boolean }>({
		key: renderKey,
		failed: false,
	})
	const failed = failState.key === renderKey ? failState.failed : false

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

	const url =
		emojiStyle === "twemoji"
			? (() => {
					// Twemoji filenames do not include variation selectors (FE0E/FE0F).
					const codepoint = emojiToCodepoint(emoji, {
						stripVariationSelectors: true,
						uppercase: false,
					})
					return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoint}.svg`
			  })()
			: (() => {
					// OpenMoji filenames do not include FE0E/FE0F.
					const codepoint = emojiToCodepoint(emoji, {
						stripVariationSelectors: true,
						uppercase: true,
					})
					return `https://openmoji.org/data/color/svg/${codepoint}.svg`
			  })()

	return (
		<img
			src={url}
			alt={emoji}
			className={cn("inline-block select-none max-w-none", className)}
			style={{
				width: size,
				height: size,
				// OpenMoji renders a bit small by default; scale it up slightly.
				// Twemoji should be smaller and should not use scaling.
				...(emojiStyle === "openmoji" ? { scale: 1.3 } : {}),
			}}
			draggable={false}
			onError={() => setFailState({ key: renderKey, failed: true })}
		/>
	)
}
