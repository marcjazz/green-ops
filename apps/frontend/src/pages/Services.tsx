import { Activity, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const SERVICES = [
	{ name: "nginx", job: "nginx", description: "Reverse proxy" },
	{ name: "postgres", job: null, description: "Database" },
	{ name: "keycloak", job: "keycloak", description: "Identity provider" },
	{ name: "alerts-service", job: "alerts-service", description: "Alerts API" },
	{ name: "user-service", job: "user-service", description: "User API" },
	{ name: "prometheus", job: "prometheus", description: "Metrics collection" },
	{ name: "grafana", job: null, description: "Monitoring dashboards" },
	{
		name: "postgres-exporter",
		job: "postgres-exporter",
		description: "DB metrics exporter",
	},
];

export function Services() {
	const [upStatus, setUpStatus] = useState<Record<string, string>>({});

	useEffect(() => {
		apiClient
			.get("/prometheus/api/v1/query?query=up")
			.then((res) => {
				if (res.data.status === "success") {
					const map: Record<string, string> = {};
					for (const r of res.data.data.result) {
						map[r.metric.job] = r.value[1];
					}
					setUpStatus(map);
				}
			})
			.catch(() => {});
	}, []);

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Services</h2>
				<p className="text-sm text-muted-foreground">
					Live status of all services managed by this platform
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Server className="h-4 w-4 text-primary" />
						<CardTitle>Service Status</CardTitle>
					</div>
					<CardDescription>
						Real-time health monitoring of all infrastructure components
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{SERVICES.map((svc) => {
							const jobVal = svc.job ? upStatus[svc.job] : undefined;
							let status: "up" | "down" | "unknown" = "unknown";
							if (jobVal !== undefined) {
								status = jobVal === "1" ? "up" : "down";
							}
							return (
								<div
									key={svc.name}
									className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm"
								>
									<div className="relative shrink-0">
										<div
											className={`h-3 w-3 rounded-full ${
												status === "up"
													? "bg-primary shadow-sm shadow-primary/30"
													: status === "down"
														? "bg-destructive shadow-sm shadow-destructive/30"
														: "bg-muted-foreground/30"
											}`}
										/>
										{status === "up" && (
											<span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium">{svc.name}</div>
										<div className="truncate text-xs text-muted-foreground">
											{svc.description}
										</div>
									</div>
									<Badge
										variant={
											status === "up"
												? "default"
												: status === "down"
													? "destructive"
													: "outline"
										}
										className="shrink-0"
									>
										{status === "up" && <Activity className="mr-1 h-3 w-3" />}
										{status}
									</Badge>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
