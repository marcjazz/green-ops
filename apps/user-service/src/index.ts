import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Pool } from "pg";
import client from "prom-client";
import { authenticateJWT, UpdateUserProfileSchema, getRedis } from "shared";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const port = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const redis = getRedis();
const limiter = rateLimit({
	store: new RedisStore({
		sendCommand: (...args: string[]) => (redis as any).call(...args),
	}),
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, error: "Too many requests, please try again later" },
});
app.use(limiter);

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

const CACHE_TTL = 300; // 5 minutes

function profileCacheKey(keycloakId: string): string {
	return `user:profile:${keycloakId}`;
}

// GET /profile
app.get("/profile", async (req, res) => {
	const keycloakId = (req as any).user?.sub;

	if (!keycloakId) {
		return res
			.status(401)
			.json({ success: false, error: "Missing user identity from token" });
	}

	try {
		const cacheKey = profileCacheKey(keycloakId);
		const cached = await redis.get(cacheKey);

		if (cached) {
			console.log("Profile cache hit for keycloakId:", keycloakId);
			return res.json({ success: true, data: JSON.parse(cached) });
		}

		console.log("Fetching profile for keycloakId:", keycloakId);
		let profile = await prisma.userProfile.findUnique({
			where: { keycloakId },
		});

		if (!profile) {
			const email = (req as any).user?.email;
			console.log("Profile not found for keycloakId, trying email:", email);
			if (email) {
				profile = await prisma.userProfile.findUnique({
					where: { email },
				});
			}
			if (profile) {
				console.log("Found profile by email, updating keycloakId");
				profile = await prisma.userProfile.update({
					where: { email },
					data: { keycloakId },
				});
			} else {
				console.log("Creating new profile for:", keycloakId);
				profile = await prisma.userProfile.create({
					data: {
						keycloakId,
						email: email || "unknown@example.com",
					},
				});
			}
		}

		await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(profile));
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
		// Invalidate cache on update
		const cacheKey = profileCacheKey(keycloakId);
		await redis.del(cacheKey);
		// Re-cache updated profile
		await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(profile));
		res.json({ success: true, data: profile });
	} catch (_error) {
		res.status(400).json({ success: false, error: "Invalid profile data" });
	}
});

app.listen(port, () => {
	console.log(`User service listening at http://localhost:${port}`);
});

redis.connect().catch((err: Error) => {
	console.error("Redis connection failed — rate limiting and cache degraded:", err.message);
});
