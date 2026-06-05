import { Moon, Save, Sun, User } from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "shared";
import { apiClient } from "@/api/apiClient.js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";

export function Profile({
	profile,
	onProfileUpdate,
}: {
	profile: UserProfile | null;
	onProfileUpdate: () => void;
}) {
	const { theme, setTheme } = useTheme();
	const [notifications, setNotifications] = useState(
		profile?.notifications ?? true,
	);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		try {
			await apiClient.patch("/user", {
				theme,
				notifications,
			});
			onProfileUpdate();
		} catch {
			// Silently fail
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Profile</h2>
				<p className="text-sm text-muted-foreground">
					Manage your account settings and preferences
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Account Info</CardTitle>
						<CardDescription>Your account details</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-4">
						<Avatar className="h-20 w-20">
							<AvatarFallback className="text-2xl">
								{profile?.email?.substring(0, 2).toUpperCase() || "US"}
							</AvatarFallback>
						</Avatar>
						<div className="text-center">
							<div className="text-lg font-medium">{profile?.email}</div>
							<div className="text-sm text-muted-foreground">
								{profile?.email || "No email"}
							</div>
						</div>
						<Badge variant="outline" className="mt-1">
							<User className="mr-1 h-3 w-3" />
							{profile?.theme || "light"} mode
						</Badge>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
						<CardDescription>
							Customize your dashboard experience
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						<div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
							<div className="flex items-center gap-3">
								{theme === "light" ? (
									<Sun className="h-5 w-5 text-amber-500" />
								) : (
									<Moon className="h-5 w-5 text-primary" />
								)}
								<div>
									<div className="text-sm font-medium">Theme</div>
									<div className="text-xs text-muted-foreground">
										Switch between light and dark mode
									</div>
								</div>
							</div>
							<div className="flex gap-1">
								<Button
									variant={theme === "light" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("light")}
								>
									<Sun className="mr-1 h-4 w-4" />
									Light
								</Button>
								<Button
									variant={theme === "dark" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("dark")}
								>
									<Moon className="mr-1 h-4 w-4" />
									Dark
								</Button>
							</div>
						</div>

						<div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
							<div>
								<div className="text-sm font-medium">Email</div>
								<div className="text-xs text-muted-foreground">
									Your registered email address
								</div>
							</div>
							<Input
								className="max-w-xs"
								value={profile?.email || ""}
								readOnly
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
							<div>
								<div className="text-sm font-medium">Notifications</div>
								<div className="text-xs text-muted-foreground">
									Receive email notifications for critical alerts
								</div>
							</div>
							<div className="flex gap-1">
								<Button
									variant={notifications ? "default" : "outline"}
									size="sm"
									onClick={() => setNotifications(true)}
								>
									On
								</Button>
								<Button
									variant={!notifications ? "default" : "outline"}
									size="sm"
									onClick={() => setNotifications(false)}
								>
									Off
								</Button>
							</div>
						</div>

						<div className="flex justify-end">
							<Button onClick={handleSave} disabled={saving}>
								<Save className="mr-2 h-4 w-4" />
								{saving ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
