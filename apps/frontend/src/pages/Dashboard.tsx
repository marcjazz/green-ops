import {
	Activity,
	AlertTriangle,
	Bell,
	Cpu,
	Droplets,
	Gauge,
	Settings,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Alert, UserProfile } from "shared";
import { apiClient } from "@/api/apiClient.js";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function formatDateTime(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleString("fr-FR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StatCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	trendUp,
}: {
	title: string;
	value: string | number;
	icon: typeof Activity;
	description?: string;
	trend?: string;
	trendUp?: boolean;
}) {
	return (
		<Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
			<div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-primary/5 transition-all duration-300 group-hover:bg-primary/10" />
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<div className="rounded-lg bg-primary/10 p-2 text-primary">
					<Icon className="h-4 w-4" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold tracking-tight">{value}</div>
				<div className="mt-1 flex items-center gap-2">
					{trend && (
						<span
							className={`inline-flex items-center gap-0.5 text-xs font-medium ${
								trendUp ? "text-emerald-600" : "text-destructive"
							}`}
						>
							<TrendingUp
								className={`h-3 w-3 ${trendUp ? "" : "rotate-180"}`}
							/>
							{trend}
						</span>
					)}
					{description && (
						<span className="text-xs text-muted-foreground">{description}</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function ScrapeDurationBar({
	label,
	value,
	max,
}: {
	label: string;
	value: number;
	max: number;
}) {
	const pct = Math.min((value / max) * 100, 100);
	return (
		<div className="flex items-center gap-3">
			<span className="w-36 truncate text-sm font-medium text-muted-foreground">
				{label}
			</span>
			<div className="flex-1">
				<div className="h-2 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>
			<span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
				{value.toFixed(3)}s
			</span>
		</div>
	);
}

export function Dashboard({
	alerts,
	profile,
}: {
	alerts: Alert[];
	profile: UserProfile | null;
}) {
	const [scrapeDurations, setScrapeDurations] = useState<
		Array<{ metric: { job: string }; value: [number, string] }>
	>([]);

	useEffect(() => {
		apiClient
			.get("/prometheus/api/v1/query?query=scrape_duration_seconds")
			.then((res) => {
				if (res.data.status === "success")
					setScrapeDurations(res.data.data.result);
			})
			.catch(() => {});
	}, []);

	const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
	const unreadAlerts = alerts.filter((a) => !a.isRead).length;
	const serviceCount = 8;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
				<p className="text-sm text-muted-foreground">
					Energy monitoring overview and recent activity
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total Alerts"
					value={alerts.length}
					icon={Bell}
					trend={alerts.length > 0 ? `${alerts.length} active` : "No alerts"}
					trendUp={false}
				/>
				<StatCard
					title="Critical"
					value={criticalAlerts}
					icon={AlertTriangle}
					description="Requires immediate attention"
					trend={
						criticalAlerts > 0 ? `${criticalAlerts} critical` : "All clear"
					}
					trendUp={false}
				/>
				<StatCard
					title="Unread"
					value={unreadAlerts}
					icon={Zap}
					description="Awaiting review"
					trend={unreadAlerts > 0 ? "New notifications" : "All read"}
					trendUp={unreadAlerts > 0}
				/>
				<StatCard
					title="Theme"
					value={
						profile?.theme
							? profile.theme.charAt(0).toUpperCase() + profile.theme.slice(1)
							: "Default"
					}
					icon={Settings}
					description="Current preference"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-7">
				{scrapeDurations.length > 0 && (
					<Card className="lg:col-span-4">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Gauge className="h-4 w-4 text-primary" />
								<CardTitle>Prometheus Metrics</CardTitle>
							</div>
							<CardDescription>
								Current scrape duration in seconds per job
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-3">
								{scrapeDurations.map((r) => {
									const job = r.metric.job || "unknown";
									const val = Number.parseFloat(r.value[1]);
									const max = Math.max(
										...scrapeDurations.map((s) =>
											Number.parseFloat(s.value[1]),
										),
										0.1,
									);
									return (
										<ScrapeDurationBar
											key={job}
											label={job}
											value={val}
											max={max}
										/>
									);
								})}
							</div>
						</CardContent>
					</Card>
				)}

				<Card className="lg:col-span-3">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Cpu className="h-4 w-4 text-primary" />
							<CardTitle>System Overview</CardTitle>
						</div>
						<CardDescription>
							Quick stats about your monitored infrastructure
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
								<div className="flex items-center gap-2">
									<Activity className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">Services</span>
								</div>
								<span className="text-lg font-bold">{serviceCount}</span>
							</div>
							<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
								<div className="flex items-center gap-2">
									<Droplets className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">Alert Severity</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="destructive" className="text-xs">
										{criticalAlerts} critical
									</Badge>
									<Badge variant="secondary" className="text-xs">
										{alerts.filter((a) => a.severity === "warning").length}{" "}
										warning
									</Badge>
									<Badge variant="outline" className="text-xs">
										{alerts.filter((a) => a.severity === "info").length} info
									</Badge>
								</div>
							</div>
							<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
								<div className="flex items-center gap-2">
									<Bell className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">Unread</span>
								</div>
								<span className="text-lg font-bold">{unreadAlerts}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Bell className="h-4 w-4 text-primary" />
						<CardTitle>Recent Alerts</CardTitle>
					</div>
					<CardDescription>
						Latest energy consumption alerts triggered by the monitoring system
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Metric</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Severity</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{alerts.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="py-8 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-1">
											<Bell className="h-8 w-8 opacity-30" />
											<span>No alerts found</span>
										</div>
									</TableCell>
								</TableRow>
							) : (
								alerts.slice(0, 10).map((alert: Alert) => (
									<TableRow
										key={alert.id}
										className="cursor-pointer transition-colors hover:bg-muted/50"
									>
										<TableCell className="font-medium">{alert.title}</TableCell>
										<TableCell>{alert.metricName}</TableCell>
										<TableCell className="tabular-nums">
											{alert.metricValue}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													alert.severity === "critical"
														? "destructive"
														: alert.severity === "warning"
															? "secondary"
															: "outline"
												}
											>
												{alert.severity}
											</Badge>
										</TableCell>
										<TableCell>
											{alert.isRead ? (
												<Badge variant="ghost">Read</Badge>
											) : (
												<Badge>New</Badge>
											)}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground tabular-nums">
											{formatDateTime(alert.createdAt)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
