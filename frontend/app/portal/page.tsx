"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Stack, Text, Title } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { PreferencesForm } from "@/components/PreferencesForm";

export default function PortalPage() {
	const router = useRouter();
	const { token, me, loading } = useAuth();

	useEffect(() => {
		if (!loading && (!token || !me)) router.replace("/");
	}, [loading, me, router, token]);

	if (loading || !token || !me) {
		return (
			<Stack gap="md">
				<Text size="sm" c="dimmed">
					Redirecting...
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap="md">
			<Title order={1}>Hi, {me.name ?? me.email}</Title>
			<Text c="dimmed">{me.email}</Text>
			<PreferencesForm token={token} initial={me.preferences} />
		</Stack>
	);
}
