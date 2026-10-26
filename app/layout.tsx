import type { Metadata } from "next"
import { Baloo_2, IBM_Plex_Mono, Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
	subsets: ["latin"],
	variable: "--font-nunito",
})

// Chunky rounded display face for the wordmark and headings, echoing the
// printed game's lettering. Nunito stays the reading face.
const baloo = Baloo_2({
	variable: "--font-baloo",
	subsets: ["latin"],
	weight: ["600", "700", "800"],
})

const plexMono = IBM_Plex_Mono({
	variable: "--font-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
	metadataBase: new URL("https://spot-its.vercel.app"),
	title: "Spot it!",
	description:
		"An exploration of Spot it!, the symbols matching game and its mathematical properties.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									var saved = localStorage.getItem('theme');
									if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
										document.documentElement.classList.add('dark');
									}
								} catch (e) {}
							})();
						`,
					}}
				/>
			</head>
			<body
				className={`${nunito.className} ${nunito.variable} ${baloo.variable} ${plexMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	)
}
