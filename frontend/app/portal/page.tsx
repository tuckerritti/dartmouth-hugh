"use client";
import Link from "next/link";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
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
	const { token, me } = useAuth();

	if (!token || !me) {
		return (
			<Stack gap="lg">
				<Paper withBorder radius="md" p="lg">
					<Stack gap="md">
						<Title order={1} size="h2">
							Dartmouth Hugh
						</Title>
						<Text c="dimmed">
							Use the Google sign-in button on the home page to manage your dining emails.
						</Text>
						<Button component={Link} href="/" size="md" w="fit-content">
							Go home
						</Button>
					</Stack>
				</Paper>
				<PortalCredit />
			</Stack>
		);
	}

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={1}>Dartmouth Hugh</Title>
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
