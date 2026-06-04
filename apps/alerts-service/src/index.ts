import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Pool } from "pg";
import client from "prom-client";
import { authenticateJWT, CreateAlertSchema } from "shared";
import { startMonitor } from "./monitor.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
app.use((req, _res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Prometheus metrics endpoint (unauthenticated)
const register = new client.Registry();
client.collectDefaultMetrics({ register });
app.get("/metrics", async (_req, res) => {
	res.set("Content-Type", register.contentType);
	res.end(await register.metrics());
});

// Protect all routes
app.use(authenticateJWT);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", service: "alerts-service" });
});

// GET /alerts
app.get("/alerts", async (_req, res) => {
	try {
		const alerts = await prisma.alert.findMany({
			orderBy: { createdAt: "desc" },
		});
		res.json({ success: true, data: alerts });
	} catch (error: any) {
		console.error("Error in GET /alerts:", error.message);
		res.status(500).json({ success: false, error: "Failed to fetch alerts" });
	}
});

// POST /alerts
app.post("/alerts", async (req, res) => {
	try {
		const validated = CreateAlertSchema.parse(req.body);
		const alert = await prisma.alert.create({
			data: validated,
		});
		res.status(201).json({ success: true, data: alert });
	} catch (error: any) {
		res.status(400).json({
			success: false,
			error: "Invalid alert data",
			details: error.message,
		});
	}
});

// PATCH /alerts/:id/read
app.patch("/alerts/:id/read", async (req, res) => {
	const { id } = req.params;
	try {
		const alert = await prisma.alert.update({
			where: { id },
			data: { isRead: true },
		});
		res.json({ success: true, data: alert });
	} catch (_error) {
		res.status(404).json({ success: false, error: "Alert not found" });
	}
});

app.listen(port, () => {
	console.log(`Alerts service listening at http://localhost:${port}`);
	startMonitor(prisma);
});
