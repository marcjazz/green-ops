import {
	Activity,
	Bell,
	LayoutDashboard,
	LogOut,
	Moon,
	Server,
	Settings,
	Sun,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import type { Alert, UserProfile } from "shared";
import { apiClient } from "@/api/apiClient.js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/useTheme";
import { Alerts } from "@/pages/Alerts.js";
import { Dashboard } from "@/pages/Dashboard.js";
import { Profile } from "@/pages/Profile.js";
import { Services } from "@/pages/Services.js";
import { Settings as SettingsPage } from "@/pages/Settings.js";

export type Page = "dashboard" | "services" | "alerts" | "profile" | "settings";

const pageTitles: Record<Page, string> = {
	dashboard: "Dashboard Overview",
	services: "Service Status",
	alerts: "Alert Management",
	profile: "Profile",
	settings: "Settings",
};

export function DashboardLayout() {
	const auth = useAuth();
	const { theme, toggleTheme } = useTheme();
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [page, setPage] = useState<Page>("dashboard");

	const fetchAlerts = useCallback(async () => {
		try {
			const res = await apiClient.get("/alerts");
			setAlerts(res.data.data);
		} catch {
			// Silently fail
		}
	}, []);

	const fetchProfile = useCallback(async () => {
		try {
			const res = await apiClient.get("/user");
			setProfile(res.data.data);
		} catch {
			// Silently fail
		}
	}, []);

	useEffect(() => {
		if (auth.isAuthenticated) {
			fetchAlerts();
			fetchProfile();
		}
	}, [auth.isAuthenticated, fetchAlerts, fetchProfile]);

	const sidebarItems: Array<{
		page: Page;
		icon: typeof LayoutDashboard;
		label: string;
	}> = [
		{ page: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
		{ page: "services", icon: Server, label: "Services" },
		{ page: "alerts", icon: Bell, label: "Alerts" },
	];

	return (
		<SidebarProvider>
			<div className="flex h-screen w-full overflow-hidden bg-background">
				<Sidebar>
					<SidebarHeader className="flex items-center gap-2 p-4">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
								<Activity className="h-4 w-4 text-primary-foreground" />
							</div>
							<span className="text-lg font-bold">GreenOps</span>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Menu</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{sidebarItems.map((item) => (
										<SidebarMenuItem key={item.page}>
											<SidebarMenuButton
												className="cursor-pointer"
												isActive={page === item.page}
												onClick={() => setPage(item.page)}
											>
												<item.icon />
												<span>{item.label}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter className="border-t p-4">
						<button
							type="button"
							className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							onClick={() => setPage("profile")}
						>
							<Avatar className="h-8 w-8">
								<AvatarFallback>
									{auth.user?.profile.preferred_username
										?.substring(0, 2)
										.toUpperCase() || "US"}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col truncate text-left">
								<span className="text-sm font-medium">
									{auth.user?.profile.preferred_username}
								</span>
								<span className="text-xs text-muted-foreground">
									{auth.user?.profile.email}
								</span>
							</div>
						</button>
					</SidebarFooter>
				</Sidebar>

				<main className="flex flex-1 flex-col overflow-auto">
					<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-sm">
						<div className="flex items-center gap-4">
							<SidebarTrigger />
							<Separator orientation="vertical" className="h-6" />
							<h1 className="text-lg font-semibold">{pageTitles[page]}</h1>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								className="cursor-pointer"
								onClick={toggleTheme}
							>
								{theme === "dark" ? (
									<Sun className="h-5 w-5" />
								) : (
									<Moon className="h-5 w-5" />
								)}
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger className="cursor-pointer">
									<Button
										variant="ghost"
										className="relative h-9 w-9 cursor-pointer rounded-full p-0"
									>
										<Avatar className="h-9 w-9">
											<AvatarFallback>
												{auth.user?.profile.preferred_username
													?.substring(0, 2)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end">
									<DropdownMenuGroup>
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col gap-1">
												<p className="text-sm font-medium leading-none">
													{auth.user?.profile.preferred_username}
												</p>
												<p className="text-xs leading-none text-muted-foreground">
													{auth.user?.profile.email}
												</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="cursor-pointer"
											onClick={() => setPage("profile")}
										>
											<User />
											<span>Profile</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer"
											onClick={() => setPage("settings")}
										>
											<Settings />
											<span>Settings</span>
										</DropdownMenuItem>
									</DropdownMenuGroup>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => auth.signoutRedirect()}
									>
										<LogOut />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>

					<div className="flex-1">
						{page === "dashboard" && (
							<Dashboard alerts={alerts} profile={profile} />
						)}
						{page === "services" && <Services />}
						{page === "alerts" && (
							<Alerts alerts={alerts} onAlertsUpdate={fetchAlerts} />
						)}
						{page === "profile" && (
							<Profile profile={profile} onProfileUpdate={fetchProfile} />
						)}
						{page === "settings" && <SettingsPage />}
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
