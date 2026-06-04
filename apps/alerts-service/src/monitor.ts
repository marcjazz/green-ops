import type { PrismaClient } from "@prisma/client";

interface AlertRule {
	name: string;
	description: string;
	severity: "info" | "warning" | "critical";
	query: string;
	threshold: number;
	comparison: "gt" | "lt";
	metricName: string;
}

const rules: AlertRule[] = [
	{
		name: "Alerts Service Down",
		description: "The alerts-service target is not reachable by Prometheus",
		severity: "critical",
		query: 'up{job="alerts-service"}',
		threshold: 0.5,
		comparison: "lt",
		metricName: "up",
	},
	{
		name: "User Service Down",
		description: "The user-service target is not reachable by Prometheus",
		severity: "critical",
		query: 'up{job="user-service"}',
		threshold: 0.5,
		comparison: "lt",
		metricName: "up",
	},
	{
		name: "High Scrape Duration on Prometheus",
		description: "Prometheus self-scrape is taking longer than expected",
		severity: "warning",
		query: 'scrape_duration_seconds{job="prometheus"}',
		threshold: 1,
		comparison: "gt",
		metricName: "scrape_duration_seconds",
	},
];

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "http://prometheus:9090";

async function queryPrometheus(query: string): Promise<number | null> {
	try {
		const url = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
		const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!response.ok) {
			console.error(`Prometheus query failed: ${response.status}`);
			return null;
		}
		const data: {
			status: string;
			data?: { result?: Array<{ value: [number, string] }> };
		} = await response.json();
		if (data.status !== "success" || !data.data?.result?.length) return null;
		const first = data.data.result[0];
		if (!first) return null;
		const val = first.value[1];
		return val ? Number.parseFloat(val) : null;
	} catch (error) {
		console.error("Prometheus query error:", error);
		return null;
	}
}

function startMonitor(prisma: PrismaClient): void {
	console.log("Starting Prometheus alert monitor...");

	const check = async () => {
		for (const rule of rules) {
			try {
				const value = await queryPrometheus(rule.query);
				if (value === null) continue;

				const breached =
					rule.comparison === "gt"
						? value > rule.threshold
						: value < rule.threshold;

				if (breached) {
					const existing = await prisma.alert.findFirst({
						where: { title: rule.name, isRead: false },
					});

					if (!existing) {
						await prisma.alert.create({
							data: {
								title: rule.name,
								description: rule.description,
								severity: rule.severity,
								metricName: rule.metricName,
								metricValue: value,
								threshold: rule.threshold,
							},
						});
						console.log(`Alert created: ${rule.name} (value: ${value})`);
					}
				} else {
					await prisma.alert.updateMany({
						where: { title: rule.name, isRead: false },
						data: { isRead: true },
					});
				}
			} catch (error) {
				console.error(`Error checking rule "${rule.name}":`, error);
			}
		}
	};

	check();
	setInterval(check, 30_000);
}

export { startMonitor };
