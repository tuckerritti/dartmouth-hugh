"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Alert, Button, Stack, Text, Title } from "@mantine/core";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
	const router = useRouter();
	const { me, loading, error, signIn } = useAuth();

	const handleToken = useCallback(
		async (token: string) => {
			const ok = await signIn(token);
			if (ok) router.push("/portal");
		},
		[router, signIn],
	);

	return (
		<Stack gap="md">
			<Title order={1}>Dartmouth Dining Subscriptions</Title>
			<Text>
				Get a daily email with the menu at{" "}
				<Text span fw={700}>
					FoCo
				</Text>
				,{" "}
				<Text span fw={700}>
					Collis
				</Text>
				, and the{" "}
				<Text span fw={700}>
					Hop
				</Text>
				. Pick which meals you want — breakfast, lunch, or dinner — and we'll send the day's options
				to your inbox.
			</Text>
			{me ? (
				<Button component={Link} href="/portal" size="md" w="fit-content">
					Open the portal →
				</Button>
			) : (
				<>
					<Text size="sm" c="dimmed">
						Sign in with your @dartmouth.edu Google account.
					</Text>
					<GoogleSignIn onToken={handleToken} />
					{loading && (
						<Text size="sm" c="dimmed">
							Signing in…
						</Text>
					)}
					{error && (
						<Alert color="red" variant="light">
							{error}
						</Alert>
					)}
				</>
			)}
		</Stack>
	);
}
