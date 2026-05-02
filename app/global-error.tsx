"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="bg">
			<body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0c0a09", color: "#fafaf9" }}>
				<div style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
					<h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Критична грешка</h1>
					<p style={{ opacity: 0.85, marginBottom: "1.25rem", fontSize: "0.9rem" }}>
						{error.message || "Приложението спря. Презареди страницата или рестартирай npm run dev."}
					</p>
					<button
						type="button"
						onClick={() => reset()}
						style={{
							padding: "0.6rem 1rem",
							borderRadius: "0.5rem",
							border: "none",
							background: "#0f766e",
							color: "#fff",
							cursor: "pointer",
							fontWeight: 600,
						}}>
						Презареди
					</button>
				</div>
			</body>
		</html>
	);
}
