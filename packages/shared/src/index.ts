import { z } from "zod";

// --- User Profile ---
export const UserProfileSchema = z.object({
	id: z.uuid(),
	keycloakId: z.string(),
	email: z.email(),
	theme: z.enum(["light", "dark"]).default("light"),
	notifications: z.boolean().default(true),
	dashboardLayout: z.any().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateUserProfileSchema = UserProfileSchema.partial().omit({
	id: true,
	keycloakId: true,
	email: true,
	createdAt: true,
	updatedAt: true,
});

// --- Alerts ---
export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertSchema = z.object({
	id: z.uuid(),
	title: z.string(),
	description: z.string(),
	severity: AlertSeveritySchema,
	metricName: z.string(),
	metricValue: z.number(),
	threshold: z.number(),
	isRead: z.boolean().default(false),
	createdAt: z.date(),
});

export type Alert = z.infer<typeof AlertSchema>;

export const CreateAlertSchema = AlertSchema.omit({
	id: true,
	isRead: true,
	createdAt: true,
});

// --- API Responses ---
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
}

export * from "./auth.js";
