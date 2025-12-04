// Spot It / Dobble deck generation using projective plane construction
// For a prime order n, generates n² + n + 1 cards with n + 1 symbols each

export type SymbolId = number

export type Card = {
	id: number
	symbols: SymbolId[]
}

export type SymbolMeta = {
	id: SymbolId
	label: string
	emoji?: string
}

export type Deck = {
	cards: Card[]
	symbols: SymbolMeta[]
	order: number // The prime order n
	symbolsPerCard: number // n + 1
}

// Emoji sets for different deck sizes
const EMOJI_SETS: Record<number, string[]> = {
	2: ["🔴", "🟢", "🔵", "🟡", "🟣", "🟠", "⚫"],
	3: [
		"🍎",
		"🍊",
		"🍋",
		"🍇",
		"🍓",
		"🍒",
		"🥝",
		"🍑",
		"🍌",
		"🍉",
		"🍐",
		"🫐",
		"🥭",
	],
	5: [
		"🐶",
		"🐱",
		"🐭",
		"🐹",
		"🐰",
		"🦊",
		"🐻",
		"🐼",
		"🐨",
		"🐯",
		"🦁",
		"🐮",
		"🐷",
		"🐸",
		"🐵",
		"🐔",
		"🐧",
		"🐦",
		"🐤",
		"🦆",
		"🦅",
		"🦉",
		"🦇",
		"🐺",
		"🐗",
		"🐴",
		"🦄",
		"🐝",
		"🐛",
		"🦋",
		"🐌",
	],
	7: [
		"🚗",
		"🚕",
		"🚙",
		"🚌",
		"🚎",
		"🏎️",
		"🚓",
		"🚑",
		"🚒",
		"🚐",
		"🛻",
		"🚚",
		"🚛",
		"🚜",
		"🏍️",
		"🛵",
		"🚲",
		"🛴",
		"🚁",
		"✈️",
		"🚀",
		"🛸",
		"⛵",
		"🚤",
		"🛥️",
		"🚢",
		"⚓",
		"🎡",
		"🎢",
		"🎠",
		"🏰",
		"🗼",
		"🗽",
		"⛩️",
		"🕌",
		"🛕",
		"⛪",
		"🏛️",
		"🏯",
		"🎪",
		"🎭",
		"🎨",
		"🎬",
		"🎤",
		"🎧",
		"🎹",
		"🥁",
		"🎷",
		"🎺",
		"🎸",
		"🪕",
		"🎻",
		"🎲",
		"♟️",
		"🎯",
		"🎳",
		"🎮",
	],
	11: [
		// 133 symbols needed for n=11
		"🍎",
		"🍊",
		"🍋",
		"🍇",
		"🍓",
		"🍒",
		"🥝",
		"🍑",
		"🍌",
		"🍉",
		"🍐",
		"🫐",
		"🥭",
		"🍍",
		"🥥",
		"🥑",
		"🍆",
		"🥔",
		"🥕",
		"🌽",
		"🌶️",
		"🥒",
		"🥬",
		"🥦",
		"🧄",
		"🧅",
		"🍄",
		"🥜",
		"🫘",
		"🌰",
		"🐶",
		"🐱",
		"🐭",
		"🐹",
		"🐰",
		"🦊",
		"🐻",
		"🐼",
		"🐨",
		"🐯",
		"🦁",
		"🐮",
		"🐷",
		"🐸",
		"🐵",
		"🐔",
		"🐧",
		"🐦",
		"🐤",
		"🦆",
		"🦅",
		"🦉",
		"🦇",
		"🐺",
		"🐗",
		"🐴",
		"🦄",
		"🐝",
		"🐛",
		"🦋",
		"🚗",
		"🚕",
		"🚙",
		"🚌",
		"🚎",
		"🏎️",
		"🚓",
		"🚑",
		"🚒",
		"🚐",
		"🛻",
		"🚚",
		"🚛",
		"🚜",
		"🏍️",
		"🛵",
		"🚲",
		"🛴",
		"🚁",
		"✈️",
		"🚀",
		"🛸",
		"⛵",
		"🚤",
		"🛥️",
		"🚢",
		"⚓",
		"🎡",
		"🎢",
		"🎠",
		"⚽",
		"🏀",
		"🏈",
		"⚾",
		"🥎",
		"🎾",
		"🏐",
		"🏉",
		"🥏",
		"🎱",
		"🏓",
		"🏸",
		"🏒",
		"🏑",
		"🥍",
		"🏏",
		"🪃",
		"🥅",
		"⛳",
		"🪁",
		"🎣",
		"🤿",
		"🎽",
		"🎿",
		"🛷",
		"🥌",
		"🎯",
		"🪀",
		"🪂",
		"🎮",
		"🎲",
		"🧩",
		"♟️",
		"🎰",
		"🎳",
		"🎭",
		"🎨",
		"🎬",
		"🎤",
		"🎧",
		"🎹",
		"🥁",
		"🎷",
	],
}

// Generate number labels
function generateNumberLabels(count: number): string[] {
	return Array.from({ length: count }, (_, i) => String(i + 1))
}

// Get emojis for a deck, falling back to the largest available set
function getEmojisForDeck(symbolCount: number): string[] {
	// Find the best matching emoji set
	const orders = Object.keys(EMOJI_SETS)
		.map(Number)
		.sort((a, b) => b - a)
	for (const order of orders) {
		if (EMOJI_SETS[order].length >= symbolCount) {
			return EMOJI_SETS[order].slice(0, symbolCount)
		}
	}
	// Fallback: use the largest set and repeat if needed
	const largest = EMOJI_SETS[7]
	const result: string[] = []
	for (let i = 0; i < symbolCount; i++) {
		result.push(largest[i % largest.length])
	}
	return result
}

/**
 * Check if a number is prime (for small numbers)
 */
export function isPrime(n: number): boolean {
	if (n < 2) return false
	if (n === 2) return true
	if (n % 2 === 0) return false
	for (let i = 3; i * i <= n; i += 2) {
		if (n % i === 0) return false
	}
	return true
}

/**
 * Generate a Spot It / Dobble style deck using the projective plane construction.
 * Only works for prime orders (n = 2, 3, 5, 7, 11, ...)
 *
 * For order n:
 * - Total symbols = n² + n + 1
 * - Total cards = n² + n + 1
 * - Symbols per card = n + 1
 * - Any two cards share exactly 1 symbol
 */
export function generateDeck(n: number, useEmojis: boolean = true): Deck {
	if (!isPrime(n)) {
		throw new Error(`Order must be prime. Got: ${n}`)
	}

	const numSymbols = n * n + n + 1
	const symbolsPerCard = n + 1

	// Generate symbol labels
	const labels = useEmojis
		? getEmojisForDeck(numSymbols)
		: generateNumberLabels(numSymbols)

	const symbols: SymbolMeta[] = Array.from({ length: numSymbols }, (_, id) => ({
		id,
		label: useEmojis ? labels[id] : String(id + 1),
		emoji: useEmojis ? labels[id] : undefined,
	}))

	const cards: Card[] = []

	// Card 0: symbols 0..n (the "infinity" line)
	cards.push({
		id: 0,
		symbols: Array.from({ length: symbolsPerCard }, (_, i) => i),
	})

	// Next n cards: each includes symbol 0 + a block of n other symbols
	// These represent lines through the "point at infinity"
	for (let i = 0; i < n; i++) {
		const cardSymbols = [0]
		for (let j = 0; j < n; j++) {
			cardSymbols.push(symbolsPerCard + i * n + j)
		}
		cards.push({
			id: cards.length,
			symbols: cardSymbols,
		})
	}

	// Remaining n² cards: one for each (a, b) pair
	// These represent the "affine lines" y = ax + b
	for (let a = 0; a < n; a++) {
		for (let b = 0; b < n; b++) {
			const cardSymbols: number[] = [a + 1] // Point at infinity for slope a
			for (let x = 0; x < n; x++) {
				const y = (a * x + b) % n
				const sym = symbolsPerCard + x * n + y
				cardSymbols.push(sym)
			}
			cards.push({
				id: cards.length,
				symbols: cardSymbols,
			})
		}
	}

	return { cards, symbols, order: n, symbolsPerCard }
}

/**
 * Find the shared symbol between two cards.
 * In a valid Spot It deck, there should be exactly one.
 */
export function findSharedSymbol(card1: Card, card2: Card): SymbolId | null {
	const set1 = new Set(card1.symbols)
	for (const sym of card2.symbols) {
		if (set1.has(sym)) {
			return sym
		}
	}
	return null
}

/**
 * Find all cards that contain a specific symbol.
 */
export function findCardsWithSymbol(deck: Deck, symbolId: SymbolId): Card[] {
	return deck.cards.filter((card) => card.symbols.includes(symbolId))
}

/**
 * Get deck statistics
 */
export function getDeckStats(deck: Deck) {
	return {
		order: deck.order,
		totalCards: deck.cards.length,
		totalSymbols: deck.symbols.length,
		symbolsPerCard: deck.symbolsPerCard,
		expectedCards: deck.order * deck.order + deck.order + 1,
		expectedSymbols: deck.order * deck.order + deck.order + 1,
	}
}

/**
 * Valid prime orders for reasonable deck sizes
 * Note: 8 and 9 are NOT prime (8=2³, 9=3²), so they won't work with this algorithm
 * The next prime after 7 is 11
 */
export const VALID_ORDERS = [2, 3, 5, 7, 11] as const
export type ValidOrder = (typeof VALID_ORDERS)[number]

/**
 * Get human-readable info about a deck order
 */
export function getOrderInfo(n: ValidOrder) {
	const totalSymbols = n * n + n + 1
	const symbolsPerCard = n + 1
	return {
		order: n,
		totalCards: totalSymbols,
		totalSymbols,
		symbolsPerCard,
		description: `${totalSymbols} cards, ${symbolsPerCard} symbols each`,
	}
}
