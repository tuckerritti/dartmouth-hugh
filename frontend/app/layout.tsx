import "@mantine/core/styles.css";
import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
	ColorSchemeScript,
	Container,
	MantineProvider,
	createTheme,
	mantineHtmlProps,
} from "@mantine/core";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/components/AuthProvider";
import { GOOGLE_CLIENT_ID } from "@/lib/env";

export const metadata: Metadata = {
	title: "Dartmouth Hugh",
	description: "Daily emails of the FoCo (1953 Commons) menu.",
};

const theme = createTheme({
	primaryColor: "dartmouth",
	cursorType: "pointer",
	colors: {
		dartmouth: [
			"#e6f4ec",
			"#cce9d9",
			"#99d2b3",
			"#66bc8d",
			"#33a567",
			"#008f41",
			"#00693e",
			"#005634",
			"#00422a",
			"#002f1f",
		],
	},
});

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" {...mantineHtmlProps}>
			<head>
				<ColorSchemeScript />
			</head>
			<body>
				<MantineProvider theme={theme}>
					<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
						<AuthProvider>
							<Container size="sm" py="xl">
								{children}
							</Container>
						</AuthProvider>
					</GoogleOAuthProvider>
				</MantineProvider>
			</body>
		</html>
	);
}
