import {
	AlertTriangle,
	Bell,
	CheckCircle,
	Filter,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import type { Alert, AlertSeverity } from "shared";
import { apiClient } from "@/api/apiClient.js";
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

const SEVERITY_ORDER: AlertSeverity[] = ["critical", "warning", "info"];

export function Alerts({
	alerts,
	onAlertsUpdate,
}: {
	alerts: Alert[];
	onAlertsUpdate: () => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">(
		"all",
	);
	const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">(
		"all",
	);

	const filteredAlerts = alerts.filter((alert) => {
		if (severityFilter !== "all" && alert.severity !== severityFilter)
			return false;
		if (statusFilter === "read" && !alert.isRead) return false;
		if (statusFilter === "unread" && alert.isRead) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (
				!alert.title.toLowerCase().includes(q) &&
				!alert.metricName.toLowerCase().includes(q) &&
				!alert.description?.toLowerCase().includes(q)
			)
				return false;
		}
		return true;
	});

	const sortedAlerts = [...filteredAlerts].sort((a, b) => {
		const aIdx = SEVERITY_ORDER.indexOf(a.severity);
		const bIdx = SEVERITY_ORDER.indexOf(b.severity);
		if (aIdx !== bIdx) return aIdx - bIdx;
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	async function markAsRead(id: string) {
		try {
			await apiClient.patch(`/alerts/${id}/read`);
			onAlertsUpdate();
		} catch {
			// Silently fail
		}
	}

	const criticalCount = alerts.filter((a) => a.severity === "critical").length;
	const unreadCount = alerts.filter((a) => !a.isRead).length;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
				<p className="text-sm text-muted-foreground">
					Monitor and manage energy consumption alerts
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Alerts
						</CardTitle>
						<Bell className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{alerts.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Critical
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-destructive" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-destructive">
							{criticalCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Unread
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{unreadCount}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Alert Management</CardTitle>
					<CardDescription>
						Search, filter, and manage system alerts
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search alerts..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<div className="flex flex-wrap gap-1">
								{(["all", "critical", "warning", "info"] as const).map(
									(sev) => (
										<Button
											key={sev}
											variant={severityFilter === sev ? "default" : "outline"}
											size="sm"
											onClick={() => setSeverityFilter(sev)}
										>
											{sev === "all" ? "All" : sev}
										</Button>
									),
								)}
							</div>
							<div className="ml-2 flex gap-1">
								<Button
									variant={statusFilter === "all" ? "default" : "outline"}
									size="sm"
									onClick={() => setStatusFilter("all")}
								>
									All
								</Button>
								<Button
									variant={statusFilter === "unread" ? "default" : "outline"}
									size="sm"
									onClick={() => setStatusFilter("unread")}
								>
									Unread
								</Button>
								<Button
									variant={statusFilter === "read" ? "default" : "outline"}
									size="sm"
									onClick={() => setStatusFilter("read")}
								>
									Read
								</Button>
							</div>
						</div>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Metric</TableHead>
								<TableHead>Value / Threshold</TableHead>
								<TableHead>Severity</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead className="w-20">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedAlerts.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="py-12 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-2">
											<Bell className="h-10 w-10 opacity-20" />
											<span className="text-sm font-medium">
												No alerts match your filters
											</span>
											<span className="text-xs">
												Try adjusting your search or filter criteria
											</span>
										</div>
									</TableCell>
								</TableRow>
							) : (
								sortedAlerts.map((alert) => (
									<TableRow
										key={alert.id}
										className="transition-colors hover:bg-muted/50"
									>
										<TableCell className="font-medium">{alert.title}</TableCell>
										<TableCell className="max-w-xs truncate text-muted-foreground">
											{alert.description}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{alert.metricName}
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{alert.metricValue} / {alert.threshold}
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
										<TableCell>
											{alert.isRead ? (
												<span className="text-xs text-muted-foreground">—</span>
											) : (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => markAsRead(alert.id)}
												>
													<X className="mr-1 h-3 w-3" />
													Dismiss
												</Button>
											)}
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
