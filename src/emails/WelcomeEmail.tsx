import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { FC } from "react";

interface WelcomeEmailProps {
	username?: string;
}

export const WelcomeEmail: FC<WelcomeEmailProps> = ({ username = "there" }) => (
	<Html>
		<Head />
		<Preview>Welcome to our platform! Get started with your new account.</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={logoSection}>
					<Text style={brandText}>TanStarter</Text>
				</Section>
				<Section style={contentSection}>
					<Heading style={h1}>Welcome {username}!</Heading>
					<Text style={text}>
						We're thrilled to have you on board. Your account has been successfully created and you're ready to get
						started.
					</Text>

					<Section style={buttonContainer}>
						<Button style={button} href="https://app.example.com/getting-started">
							Get Started
						</Button>
					</Section>

					<Text style={text}>Here are a few things you can do:</Text>
					<ul style={list}>
						<li style={listItem}>Complete your profile</li>
						<li style={listItem}>Explore the dashboard</li>
						<li style={listItem}>Create your first project</li>
					</ul>

					<Hr style={hr} />

					<Text style={footer}>
						Need help? Email us at{" "}
						<Link href="mailto:support@example.com" style={link}>
							support@example.com
						</Link>
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

export default WelcomeEmail;

const main = {
	backgroundColor: "#f8f9fa",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "580px",
};

const contentSection = {
	backgroundColor: "#ffffff",
	padding: "40px",
	borderRadius: "8px",
	boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const logoSection = {
	padding: "20px 0",
	textAlign: "center" as const,
};

const brandText = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#228be6",
	margin: "0",
};

const h1 = {
	color: "#1a1a1a",
	fontSize: "24px",
	fontWeight: "600",
	textAlign: "center" as const,
	margin: "30px 0",
};

const text = {
	color: "#444",
	fontSize: "16px",
	lineHeight: "24px",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "30px 0",
};

const button = {
	backgroundColor: "#228be6",
	borderRadius: "6px",
	color: "#fff",
	padding: "12px 32px",
	fontSize: "16px",
	fontWeight: "500",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	boxShadow: "0 2px 4px rgba(34, 139, 230, 0.2)",
};

const hr = {
	borderColor: "#e9ecef",
	margin: "20px 0",
};

const footer = {
	color: "#868e96",
	fontSize: "14px",
};

const link = {
	color: "#228be6",
	textDecoration: "none",
};

const list = {
	marginBottom: "0",
	marginTop: "10px",
	paddingLeft: "20px",
};

const listItem = {
	color: "#444",
	fontSize: "16px",
	lineHeight: "24px",
	marginBottom: "8px",
};
