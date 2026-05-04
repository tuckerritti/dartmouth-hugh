"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { PreferencesForm } from "@/components/PreferencesForm";

function PortalCredit() {
	return (
		<Text size="sm" c="dimmed" ta="center">
			Made with ❤️ at Dartmouth College
		</Text>
	);
}

export default function PortalPage() {
	const router = useRouter();
	const { token, me, loading } = useAuth();

	useEffect(() => {
		if (!loading && (!token || !me)) router.replace("/");
	}, [loading, me, router, token]);

	if (loading || !token || !me) {
		return (
			<Stack gap="lg">
				<Text size="sm" c="dimmed">
					Redirecting...
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={1} size="h2">
					Dining emails
				</Title>
				<Text c="dimmed">
					Manage daily breakfast, lunch, and dinner emails for FoCo, Collis, and the Hop.
				</Text>
			</Stack>
			<Paper withBorder radius="md" p="lg">
				<Stack gap="lg">
					<Group justify="space-between" gap="sm" align="flex-start">
						<Stack gap={2}>
							<Text size="sm" c="dimmed">
								Signed in as
							</Text>
							<Text fw={700}>{me.name ?? me.email}</Text>
							{me.name && (
								<Text size="sm" c="dimmed">
									{me.email}
								</Text>
							)}
						</Stack>
					</Group>
					<PreferencesForm token={token} initial={me.preferences} />
				</Stack>
			</Paper>
			<PortalCredit />
		</Stack>
	);
}
