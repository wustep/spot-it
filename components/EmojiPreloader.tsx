"use client"

import { useEffect, useState } from "react"
import { MASTER_SYMBOLS } from "@/lib/deck"
import { useGame } from "@/lib/store"

function emojiToCodepoint(
	emoji: string,
	options: { stripVariationSelectors: boolean; uppercase: boolean }
): string {
	const codepoints: string[] = []
	for (const char of emoji) {
		const code = char.codePointAt(0)
		if (code !== undefined) {
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

function getAssetUrls(style: "openmoji" | "twemoji"): string[] {
	const uniqueEmojis = [...new Set(MASTER_SYMBOLS)]
	return uniqueEmojis.map((emoji) => {
		if (style === "twemoji") {
			const codepoint = emojiToCodepoint(emoji, {
				stripVariationSelectors: false,
				uppercase: false,
			})
			return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoint}.svg`
		}

		const codepoint = emojiToCodepoint(emoji, {
			stripVariationSelectors: true,
			uppercase: true,
		})
		return `https://openmoji.org/data/color/svg/${codepoint}.svg`
	})
}

/**
 * Preloads selected emoji CDN SVGs in the background (OpenMoji / Twemoji).
 * This component renders nothing visible but helps ensure emojis are cached.
 */
export function EmojiPreloader() {
	const { symbolStyle } = useGame()
	const [preloaded, setPreloaded] = useState({
		openmoji: false,
		twemoji: false,
	})

	useEffect(() => {
		if (symbolStyle !== "openmoji" && symbolStyle !== "twemoji") {
			return
		}

		if (preloaded[symbolStyle]) {
			return
		}

		const urls = getAssetUrls(symbolStyle)

		// Preload images in batches to avoid overwhelming the browser
		const preloadImage = (url: string): Promise<void> => {
			return new Promise((resolve) => {
				const img = new Image()
				img.onload = () => resolve()
				img.onerror = () => resolve() // Don't fail on error, just continue
				img.src = url
			})
		}

		// Load in batches of 20
		const batchSize = 20
		const loadBatch = async (startIndex: number) => {
			const batch = urls.slice(startIndex, startIndex + batchSize)
			await Promise.all(batch.map(preloadImage))

			if (startIndex + batchSize < urls.length) {
				// Small delay between batches
				setTimeout(() => loadBatch(startIndex + batchSize), 50)
			} else {
				setPreloaded((prev) => ({ ...prev, [symbolStyle]: true }))
			}
		}

		loadBatch(0)
	}, [symbolStyle, preloaded])

	// Render nothing - this is purely for preloading
	return null
}
