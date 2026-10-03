import type { Metadata } from "next"
import { Geist_Mono, Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
	subsets: ["latin"],
	variable: "--font-nunito",
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
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
				className={`${nunito.className} ${nunito.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	)
}
