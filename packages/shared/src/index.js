import { z } from "zod";
// --- User Profile ---
export const UserProfileSchema = z.object({
    id: z.string().uuid(),
    keycloakId: z.string(),
    email: z.string().email(),
    preferences: z.object({
        theme: z.enum(["light", "dark"]).default("light"),
        notifications: z.boolean().default(true),
        dashboardLayout: z.any().optional(),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const UpdateUserProfileSchema = UserProfileSchema.partial().omit({
    id: true,
    keycloakId: true,
    createdAt: true,
    updatedAt: true,
});
// --- Alerts ---
export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export const AlertSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    severity: AlertSeveritySchema,
    metricName: z.string(),
    metricValue: z.number(),
    threshold: z.number(),
    isRead: z.boolean().default(false),
    createdAt: z.date(),
});
export const CreateAlertSchema = AlertSchema.omit({
    id: true,
    isRead: true,
    createdAt: true,
});
//# sourceMappingURL=index.js.map