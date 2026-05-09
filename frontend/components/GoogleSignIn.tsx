"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const MAX_GOOGLE_BUTTON_WIDTH = 400;

export function GoogleSignIn({ onToken }: { onToken: (token: string) => void }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [buttonWidth, setButtonWidth] = useState(0);

	// GoogleLogin only takes a pixel width, so measure the wrapper to keep it responsive up to 400px.
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const updateWidth = () => {
			setButtonWidth(Math.floor(container.getBoundingClientRect().width));
		};

		updateWidth();

		const observer = new ResizeObserver(updateWidth);
		observer.observe(container);

		return () => observer.disconnect();
	}, []);

	const handleSuccess = useCallback(
		(response: CredentialResponse) => {
			if (response.credential) onToken(response.credential);
		},
		[onToken],
	);

	return (
		<div ref={containerRef} style={{ marginInline: "auto", maxWidth: MAX_GOOGLE_BUTTON_WIDTH, width: "100%" }}>
			{buttonWidth > 0 && (
				<GoogleLogin
					key={buttonWidth}
					onSuccess={handleSuccess}
					onError={() => undefined}
					theme="outline"
					size="large"
					width={Math.min(buttonWidth, MAX_GOOGLE_BUTTON_WIDTH)}
					auto_select
					useOneTap
				/>
			)}
		</div>
	);
}
