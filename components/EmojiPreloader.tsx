"use client"

import { useEffect, useState } from "react"
import { MASTER_SYMBOLS } from "@/lib/deck"
import { useGame } from "@/lib/store"

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

// Get unique emojis and their OpenMoji URLs
function getOpenMojiUrls(): string[] {
	const uniqueEmojis = [...new Set(MASTER_SYMBOLS)]
	return uniqueEmojis.map((emoji) => {
		const codepoint = emojiToCodepoint(emoji)
		return `https://openmoji.org/data/color/svg/${codepoint}.svg`
	})
}

/**
 * Preloads all OpenMoji SVGs in the background.
 * This component renders nothing visible but ensures emojis are cached.
 */
export function EmojiPreloader() {
	const { emojiStyle } = useGame()
	const [preloaded, setPreloaded] = useState(false)

	useEffect(() => {
		// Only preload if using OpenMoji style and not already preloaded
		if (emojiStyle !== "openmoji" || preloaded) {
			return
		}

		const urls = getOpenMojiUrls()

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
				setPreloaded(true)
			}
		}

		loadBatch(0)
	}, [emojiStyle, preloaded])

	// Render nothing - this is purely for preloading
	return null
}

