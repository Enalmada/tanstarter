import { Box, Container, Text, useMantineColorScheme } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export function Footer() {
	const { colorScheme } = useMantineColorScheme();

	return (
		<Box
			component="footer"
			bg={colorScheme === "dark" ? "dark.7" : "gray.0"}
			py="xl"
		>
			<Container>
				<Box
					style={{
						display: "flex",
						justifyContent: "center",
						gap: "2xl",
						marginBottom: "xl",
					}}
				>
					<Link to="/terms" style={{ marginRight: "1rem" }}>
						Terms
					</Link>
					<Link to="/privacy" style={{ marginLeft: "1rem" }}>
						Privacy
					</Link>
				</Box>

				<Text
					mt="xl"
					pt="md"
					style={{
						borderTop: `1px solid ${colorScheme === "dark" ? "dark.4" : "gray.2"}`,
						textAlign: "center",
						color: colorScheme === "dark" ? "gray.5" : "gray.7",
					}}
				>
					© {new Date().getFullYear()} TodoApp. All rights reserved.
				</Text>
			</Container>
		</Box>
	);
}
