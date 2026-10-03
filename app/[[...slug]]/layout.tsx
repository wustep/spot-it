import type { Metadata } from "next"

const SITE_URL = "https://spot-its.vercel.app"

type RouteMeta = {
	title: string
	description: string
	image: { url: string; alt: string }
}

const HOME_IMAGE = {
	url: "/og.png",
	alt: "Two Spot it! cards with their one shared symbol, a heart, highlighted.",
}

const HOME: RouteMeta = {
	title: "Spot it!",
	description:
		"An exploration of Spot it!, the symbols matching game and its mathematical properties.",
	image: HOME_IMAGE,
}

// Share metadata for each top-level route the app handles client-side
// (see parsePathname in GameProvider). Keys are the path without a slash.
const ROUTES: Record<string, RouteMeta> = {
	"": HOME,
	practice: {
		title: "Practice — Spot it!",
		description: "Match cards freely and explore the deck.",
		image: HOME_IMAGE,
	},
	timed: {
		title: "Timed — Spot it!",
		description:
			"Click the matching symbol as fast as you can. Track your accuracy and speed.",
		image: HOME_IMAGE,
	},
	visualizer: {
		title: "Deck Visualizer — Spot it!",
		description:
			"Explore the mathematical structure of the Spot it! deck: 57 cards, 57 symbols, and every pair of cards shares exactly one.",
		image: HOME_IMAGE,
	},
	matrix: {
		title: "Incidence Matrix — Spot it!",
		description:
			"57 cards × 57 symbols: the incidence matrix behind the Spot it! deck.",
		image: HOME_IMAGE,
	},
	article: {
		title: "The Mathematics Behind Spot it!",
		description:
			"Every pair of Spot it! cards shares exactly one symbol. The guarantee comes from a finite projective plane.",
		image: HOME_IMAGE,
	},
}

function resolveRoute(slug: string[] = []): { path: string; meta: RouteMeta } {
	// Old /game/<mode> links still resolve to their mode.
	const segments = slug[0] === "game" ? slug.slice(1) : slug
	const key = segments[0] ?? ""
	const meta = ROUTES[key]
	if (!meta) return { path: "/", meta: HOME }
	return { path: key ? `/${key}` : "/", meta }
}

export function generateStaticParams() {
	return Object.keys(ROUTES).map((key) => ({ slug: key ? [key] : [] }))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
	const { slug } = await params
	const { path, meta } = resolveRoute(slug)
	const url = `${SITE_URL}${path}`
	const image = {
		url: `${SITE_URL}${meta.image.url}`,
		width: 1200,
		height: 630,
		alt: meta.image.alt,
	}

	return {
		title: meta.title,
		description: meta.description,
		alternates: { canonical: url },
		openGraph: {
			type: "website",
			siteName: "Spot it!",
			title: meta.title,
			description: meta.description,
			url,
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			title: meta.title,
			description: meta.description,
			images: [image],
		},
	}
}

export default function SlugLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return children
}
