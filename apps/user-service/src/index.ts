import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { UpdateUserProfileSchema, authenticateJWT } from "shared";
import client from "prom-client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const port = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

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
	res.json({ status: "ok", service: "user-service" });
});

// GET /profile
app.get("/profile", async (req, res) => {
	const keycloakId = (req as any).user?.sub;

	if (!keycloakId) {
		return res
			.status(401)
			.json({ success: false, error: "Missing user identity from token" });
	}

	try {
		console.log("Fetching profile for keycloakId:", keycloakId);
		let profile = await prisma.userProfile.findUnique({
			where: { keycloakId },
		});

		if (!profile) {
			const email = (req as any).user?.email;
			console.log("Profile not found for keycloakId, trying email:", email);
			// Try to find profile by email (in case keycloakId changed)
			if (email) {
				profile = await prisma.userProfile.findUnique({
					where: { email },
				});
			}
			if (profile) {
				// Existing profile found by email — update keycloakId
				console.log("Found profile by email, updating keycloakId");
				profile = await prisma.userProfile.update({
					where: { email },
					data: { keycloakId },
				});
			} else {
				// No profile exists for this user at all — create one
				console.log("Creating new profile for:", keycloakId);
				profile = await prisma.userProfile.create({
					data: {
						keycloakId,
						email: email || "unknown@example.com",
					},
				});
			}
		}

		res.json({ success: true, data: profile });
	} catch (error: any) {
		console.error("Error in GET /profile:", error.message, error.stack);
		res.status(500).json({ success: false, error: "Failed to fetch profile" });
	}
});

// PATCH /profile
app.patch("/profile", async (req, res) => {
	const keycloakId = (req as any).user?.sub;

	if (!keycloakId) {
		return res
			.status(401)
			.json({ success: false, error: "Missing user identity from token" });
	}

	try {
		const validated = UpdateUserProfileSchema.parse(req.body);
		const profile = await prisma.userProfile.update({
			where: { keycloakId },
			data: validated,
		});
		res.json({ success: true, data: profile });
	} catch (_error) {
		res.status(400).json({ success: false, error: "Invalid profile data" });
	}
});

app.listen(port, () => {
	console.log(`User service listening at http://localhost:${port}`);
});
