// Spot It / Dobble deck generation using projective plane construction
// For a prime power order q, generates q² + q + 1 cards with q + 1 symbols each

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
	order: number // The order q (prime or prime power)
	symbolsPerCard: number // q + 1
}

// Full 130-Symbol Set (Distinct, Simple, Spot-It-Friendly)
const MASTER_SYMBOLS = [
	// Original 57 Spot-It symbols
	"⚓",
	"🍎",
	"🍼",
	"💣",
	"🌵",
	"🕯️",
	"🚕",
	"🥕",
	"🐴",
	"🕒",
	"🤡",
	"🌼",
	"🦖",
	"🐬",
	"🐉",
	"❗",
	"👁️",
	"🔥",
	"🍀",
	"👻",
	"💥",
	"🔨",
	"❤️",
	"🧊",
	"🏠",
	"🔑",
	"🐞",
	"💡",
	"⚡",
	"🔒",
	"🍁",
	"🌙",
	"⛔",
	"🧑‍🌾",
	"✏️",
	"🐦",
	"🐱",
	"🧍",
	"💋",
	"✂️",
	"☠️",
	"❄️",
	"⛄",
	"🕷️",
	"🕸️",
	"☀️",
	"😎",
	"🎯",
	"🐢",
	"🎼",
	"🌳",
	"💧",
	"🐶",
	"☯️",
	"🦓",
	"❓",
	"🧀",
	// Animals (25)
	"🦊",
	"🐻",
	"🐼",
	"🐨",
	"🐯",
	"🐸",
	"🐧",
	"🦁",
	"🐔",
	"🐤",
	"🐙",
	"🦋",
	"🐠",
	"🐳",
	"🐊",
	"🦅",
	"🐝",
	"🐛",
	"🦆",
	"🐴",
	"🐑",
	"🐘",
	"🐍",
	"🐿️",
	"🦄",
	// Food & Drink (21)
	"🍌",
	"🍇",
	"🍉",
	"🍒",
	"🍓",
	"🍑",
	"🍍",
	"🥥",
	"🍔",
	"🍟",
	"🍕",
	"🌭",
	"🍪",
	"🍩",
	"🎂",
	"🍬",
	"🍭",
	"🧃",
	"☕",
	"🍺",
	"🍖",
	// Plants / Nature (11)
	"🌻",
	"🌹",
	"🍄",
	"🌴",
	"🌲",
	"🍃",
	"⭐",
	"🌈",
	"🌪️",
	"🌊",
	"🌋",
	// Objects (29)
	"🔧",
	"🧲",
	"🗝️",
	"🎈",
	"🎁",
	"🎀",
	"🎲",
	"🧩",
	"🧸",
	"🕹️",
	"🎧",
	"🥁",
	"🎹",
	"📌",
	"📎",
	"📏",
	"🔍",
	"🔭",
	"💎",
	"🔔",
	"🛎️",
	"🪄",
	"🚨",
	"🪁",
	"🛸",
	"🚀",
	"✈️",
	"🚗",
	"🚲",
]

// Generate number labels
function generateNumberLabels(count: number): string[] {
	return Array.from({ length: count }, (_, i) => String(i + 1))
}

// Get emojis for a deck from the master symbol set
function getEmojisForDeck(symbolCount: number): string[] {
	if (symbolCount <= MASTER_SYMBOLS.length) {
		return MASTER_SYMBOLS.slice(0, symbolCount)
	}
	// Fallback: repeat symbols if we need more than 130
	const result: string[] = []
	for (let i = 0; i < symbolCount; i++) {
		result.push(MASTER_SYMBOLS[i % MASTER_SYMBOLS.length])
	}
	return result
}

/**
 * Check if a number is prime
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
 * Check if a number is a prime power and return [prime, exponent] or null
 */
export function getPrimePower(n: number): [number, number] | null {
	if (n < 2) return null

	for (let p = 2; p * p <= n; p++) {
		if (!isPrime(p)) continue
		let k = 0
		let temp = n
		while (temp % p === 0) {
			temp /= p
			k++
		}
		if (temp === 1 && k > 0) {
			return [p, k]
		}
	}

	// n itself is prime
	if (isPrime(n)) {
		return [n, 1]
	}

	return null
}

/**
 * Galois Field arithmetic for GF(p^k)
 * For p=2, we use polynomial arithmetic with XOR
 * For p>2, we use polynomial arithmetic mod p
 */
class GaloisField {
	readonly q: number
	readonly p: number
	readonly k: number
	private expTable: number[]
	private logTable: number[]

	constructor(q: number) {
		const pp = getPrimePower(q)
		if (!pp) throw new Error(`${q} is not a prime power`)

		this.q = q
		this.p = pp[0]
		this.k = pp[1]

		// For prime fields, arithmetic is simple mod p
		if (this.k === 1) {
			this.expTable = []
			this.logTable = []
			return
		}

		// Build exp and log tables for GF(p^k)
		this.expTable = new Array(q)
		this.logTable = new Array(q)

		// Irreducible polynomials for common fields
		const irreducibles: Record<number, number> = {
			4: 0b111, // x² + x + 1 for GF(4)
			8: 0b1011, // x³ + x + 1 for GF(8)
			9: 10, // x² + 1 for GF(9) (coefficients: 1, 0, 1 base 3)
		}

		if (this.p === 2) {
			// GF(2^k) - use polynomial arithmetic with XOR
			const poly = irreducibles[q] || this.findIrreducible2()
			let x = 1
			for (let i = 0; i < q - 1; i++) {
				this.expTable[i] = x
				this.logTable[x] = i
				x <<= 1
				if (x >= q) {
					x ^= poly
				}
			}
		} else if (this.p === 3 && this.k === 2) {
			// GF(9) - special case
			// Elements: 0, 1, 2, α, α+1, α+2, 2α, 2α+1, 2α+2
			// where α² = 2 (using x² + 1 = 0, so α² = -1 = 2 in GF(3))
			this.buildGF9Tables()
		}
	}

	private findIrreducible2(): number {
		// Find an irreducible polynomial for GF(2^k)
		// This is a simplified version for small k
		const degree = this.k
		for (let poly = (1 << degree) + 1; poly < 1 << (degree + 1); poly += 2) {
			if (this.isIrreducible2(poly, degree)) {
				return poly
			}
		}
		throw new Error(`Could not find irreducible polynomial for GF(2^${degree})`)
	}

	private isIrreducible2(poly: number, degree: number): boolean {
		// Check if polynomial is irreducible over GF(2)
		for (let d = 1; d <= degree / 2; d++) {
			// Check if any polynomial of degree d divides poly
			for (let divisor = 1 << d; divisor < 1 << (d + 1); divisor++) {
				if (this.polyMod2(poly, divisor) === 0) {
					return false
				}
			}
		}
		return true
	}

	private polyMod2(a: number, b: number): number {
		// Polynomial division over GF(2)
		const degA = Math.floor(Math.log2(a))
		const degB = Math.floor(Math.log2(b))

		while (a >= b && a > 0) {
			const shift = Math.floor(Math.log2(a)) - degB
			if (shift < 0) break
			a ^= b << shift
		}
		return a
	}

	private buildGF9Tables(): void {
		// GF(9) = GF(3)[x]/(x² + 1)
		// Elements represented as a + bα where α² = 2
		// Encoding: a + 3b (so 0-8 maps to all elements)

		// Multiplication table approach
		const mult = (x: number, y: number): number => {
			const a1 = x % 3,
				b1 = Math.floor(x / 3)
			const a2 = y % 3,
				b2 = Math.floor(y / 3)
			// (a1 + b1*α)(a2 + b2*α) = a1*a2 + (a1*b2 + a2*b1)*α + b1*b2*α²
			// = a1*a2 + 2*b1*b2 + (a1*b2 + a2*b1)*α
			const a = (a1 * a2 + 2 * b1 * b2) % 3
			const b = (a1 * b2 + a2 * b1) % 3
			return (a + 3 * b + 9) % 9 || 0
		}

		// Find a generator (primitive element)
		for (let g = 2; g < 9; g++) {
			const seen = new Set<number>()
			let x = 1
			for (let i = 0; i < 8; i++) {
				if (seen.has(x)) break
				seen.add(x)
				this.expTable[i] = x
				this.logTable[x] = i
				x = mult(x, g)
			}
			if (seen.size === 8) break
		}
	}

	add(a: number, b: number): number {
		if (this.k === 1) {
			return (a + b) % this.p
		}
		if (this.p === 2) {
			return a ^ b
		}
		// GF(p^k) for p > 2
		if (this.p === 3 && this.k === 2) {
			const a1 = a % 3,
				b1 = Math.floor(a / 3)
			const a2 = b % 3,
				b2 = Math.floor(b / 3)
			return ((a1 + a2) % 3) + 3 * ((b1 + b2) % 3)
		}
		return (a + b) % this.q
	}

	multiply(a: number, b: number): number {
		if (a === 0 || b === 0) return 0
		if (this.k === 1) {
			return (a * b) % this.p
		}
		// Use log/exp tables
		const logA = this.logTable[a]
		const logB = this.logTable[b]
		return this.expTable[(logA + logB) % (this.q - 1)]
	}
}

/**
 * Generate a Spot It / Dobble style deck using the projective plane construction.
 * Works for prime power orders (q = p^k where p is prime)
 *
 * For order q:
 * - Total symbols = q² + q + 1
 * - Total cards = q² + q + 1
 * - Symbols per card = q + 1
 * - Any two cards share exactly 1 symbol
 */
export function generateDeck(q: number, useEmojis: boolean = true): Deck {
	const pp = getPrimePower(q)
	if (!pp) {
		throw new Error(`Order must be a prime power. Got: ${q}`)
	}

	const numSymbols = q * q + q + 1
	const symbolsPerCard = q + 1

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

	// For primes, use the simple modular arithmetic
	// For prime powers, use Galois field arithmetic
	const gf = new GaloisField(q)

	// Card 0: symbols 0..q (the "infinity" line)
	cards.push({
		id: 0,
		symbols: Array.from({ length: symbolsPerCard }, (_, i) => i),
	})

	// Next q cards: each includes symbol 0 + a block of q other symbols
	for (let i = 0; i < q; i++) {
		const cardSymbols = [0]
		for (let j = 0; j < q; j++) {
			cardSymbols.push(symbolsPerCard + i * q + j)
		}
		cards.push({
			id: cards.length,
			symbols: cardSymbols,
		})
	}

	// Remaining q² cards: one for each (a, b) pair
	for (let a = 0; a < q; a++) {
		for (let b = 0; b < q; b++) {
			const cardSymbols: number[] = [a + 1]
			for (let x = 0; x < q; x++) {
				const y = gf.add(gf.multiply(a, x), b)
				const sym = symbolsPerCard + x * q + y
				cardSymbols.push(sym)
			}
			cards.push({
				id: cards.length,
				symbols: cardSymbols,
			})
		}
	}

	return { cards, symbols, order: q, symbolsPerCard }
}

/**
 * Find the shared symbol between two cards.
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
 * Valid orders for Spot It decks (prime powers only)
 * Note: 6 and 10 are not prime powers, so no projective plane exists
 */
export const VALID_ORDERS = [2, 3, 4, 5, 7, 8, 9, 11] as const
export type ValidOrder = (typeof VALID_ORDERS)[number]

/**
 * Get human-readable info about a deck order
 */
export function getOrderInfo(n: ValidOrder) {
	const totalSymbols = n * n + n + 1
	const symbolsPerCard = n + 1
	const pp = getPrimePower(n)
	const isPrimeOrder = pp && pp[1] === 1
	return {
		order: n,
		totalCards: totalSymbols,
		totalSymbols,
		symbolsPerCard,
		description: `${totalSymbols} cards, ${symbolsPerCard} symbols each`,
		note: isPrimeOrder ? undefined : `(${pp![0]}^${pp![1]})`,
	}
}
