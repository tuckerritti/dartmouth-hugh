"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Alert, Stack, Text, Title } from "@mantine/core";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
	const router = useRouter();
	const { me, loading, error, signIn } = useAuth();

	useEffect(() => {
		if (me) router.replace("/portal");
	}, [me, router]);

	const handleToken = useCallback(
		async (token: string) => {
			const ok = await signIn(token);
			if (ok) router.replace("/portal");
		},
		[router, signIn],
	);

	if (me || loading) {
		return (
			<Stack gap="md">
				<Text size="sm" c="dimmed">
					{me ? "Redirecting..." : "Loading..."}
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap="md">
			<Title order={1}>Dartmouth Hugh</Title>
			<Text>
				Get one morning email with breakfast, lunch, and dinner from{" "}
				<Text span fw={700}>
					FoCo
				</Text>{" "}
				and{" "}
				<Text span fw={700}>
					Collis
				</Text>
				.
			</Text>
			<Text size="sm" c="dimmed">
				Sign in with your @dartmouth.edu Google account.
			</Text>
			<GoogleSignIn onToken={handleToken} />
			{error && (
				<Alert color="red" variant="light">
					{error}
				</Alert>
			)}
		</Stack>
	);
}
