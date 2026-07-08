import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: 120,
					background: "linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(79, 70, 229) 100%)",
				}}
			>
				<svg width="240" height="240" viewBox="0 0 256 256" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
					<line x1="128" y1="30" x2="128" y2="200"/>
					<circle cx="128" cy="30" r="14"/>
					<line x1="40" y1="70" x2="216" y2="70"/>
					<circle cx="128" cy="70" r="8"/>
					<line x1="52" y1="80" x2="52" y2="140"/>
					<line x1="204" y1="80" x2="204" y2="140"/>
					<path d="M24 140 Q52 162 80 140"/>
					<path d="M176 140 Q204 162 232 140"/>
					<path d="M72 200 L128 232 L184 200"/>
				</svg>
			</div>
		),
		{ width: 512, height: 512 },
	);
}
