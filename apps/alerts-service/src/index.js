import { PrismaClient } from "./generated/prisma/index.js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { CreateAlertSchema } from "shared";
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
app.use(helmet());
app.use(cors());
app.use(express.json());
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
    }
    catch (_error) {
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
    }
    catch (_error) {
        res.status(400).json({ success: false, error: "Invalid alert data" });
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
    }
    catch (_error) {
        res.status(404).json({ success: false, error: "Alert not found" });
    }
});
app.listen(port, () => {
    console.log(`Alerts service listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map