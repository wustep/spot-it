import { cn } from "@/lib/utils"

interface LogoProps {
	className?: string
	size?: number
}

export function Logo({ className, size = 24 }: LogoProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			fill="none"
			width={size}
			height={size}
			className={cn("inline-block", className)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#c084fc" />
					<stop offset="100%" stopColor="#9333ea" />
				</linearGradient>
				<linearGradient id="cardGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#e879f9" />
					<stop offset="100%" stopColor="#a855f7" />
				</linearGradient>
			</defs>

			{/* Back card (offset) */}
			<circle cx="12" cy="12" r="10" fill="url(#cardGrad1)" opacity="0.7" />

			{/* Front card */}
			<circle
				cx="20"
				cy="20"
				r="10"
				fill="url(#cardGrad2)"
				stroke="white"
				strokeWidth="1.5"
			/>

			{/* Symbols on front card */}
			<circle cx="16" cy="17" r="2" fill="#fef08a" />
			<circle cx="22" cy="15" r="1.5" fill="white" opacity="0.8" />
			<circle cx="24" cy="22" r="1.5" fill="#86efac" />
			<circle cx="18" cy="24" r="1.3" fill="#93c5fd" />

			{/* Match indicator - star where cards overlap */}
			<path
				d="M16 12 L17 15 L20 15 L17.5 17 L18.5 20 L16 18 L13.5 20 L14.5 17 L12 15 L15 15 Z"
				fill="white"
			/>
		</svg>
	)
}
