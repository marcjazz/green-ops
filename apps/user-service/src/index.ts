import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { UpdateUserProfileSchema } from "shared";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL,
		},
	},
});
const port = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", service: "user-service" });
});

// GET /profile (using keycloakId from some middleware later)
app.get("/profile", async (req, res) => {
	// Mock keycloakId for now, would normally come from JWT
	const keycloakId = req.headers["x-user-id"] as string;

	if (!keycloakId) {
		return res
			.status(401)
			.json({ success: false, error: "Missing user identity" });
	}

	try {
		let profile = await prisma.userProfile.findUnique({
			where: { keycloakId },
		});

		if (!profile) {
			// Auto-create profile if it doesn't exist
			profile = await prisma.userProfile.create({
				data: {
					keycloakId,
					email:
						(req.headers["x-user-email"] as string) || "unknown@example.com",
				},
			});
		}

		res.json({ success: true, data: profile });
	} catch (_error) {
		res.status(500).json({ success: false, error: "Failed to fetch profile" });
	}
});

// PATCH /profile
app.patch("/profile", async (req, res) => {
	const keycloakId = req.headers["x-user-id"] as string;

	if (!keycloakId) {
		return res
			.status(401)
			.json({ success: false, error: "Missing user identity" });
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
