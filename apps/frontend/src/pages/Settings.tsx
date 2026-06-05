import { Bell, Shield, Sliders } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function Settings() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Settings</h2>
				<p className="text-sm text-muted-foreground">
					System configuration and preferences
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card className="transition-all hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Bell className="h-4 w-4 text-primary" />
							<CardTitle>Notifications</CardTitle>
						</div>
						<CardDescription>
							Configure alert notification channels
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Set up email, webhook, or Slack integrations for alert
							notifications.
						</p>
					</CardContent>
				</Card>

				<Card className="transition-all hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Sliders className="h-4 w-4 text-primary" />
							<CardTitle>Alert Thresholds</CardTitle>
						</div>
						<CardDescription>
							Define thresholds for alert triggers
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Customize the sensitivity of energy consumption alerts.
						</p>
					</CardContent>
				</Card>

				<Card className="transition-all hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Shield className="h-4 w-4 text-primary" />
							<CardTitle>Security</CardTitle>
						</div>
						<CardDescription>Authentication and access control</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Manage SSO, API keys, and user permissions.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
