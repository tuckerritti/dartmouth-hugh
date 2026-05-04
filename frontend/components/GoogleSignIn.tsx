"use client";
import { useCallback } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

export function GoogleSignIn({ onToken }: { onToken: (token: string) => void }) {
	const handleSuccess = useCallback(
		(response: CredentialResponse) => {
			if (response.credential) onToken(response.credential);
		},
		[onToken],
	);

	return (
		<GoogleLogin
			onSuccess={handleSuccess}
			onError={() => undefined}
			theme="outline"
			size="large"
			auto_select
			useOneTap
		/>
	);
}
