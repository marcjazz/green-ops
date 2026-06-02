import { z } from "zod";
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    keycloakId: z.ZodString;
    email: z.ZodString;
    preferences: z.ZodObject<{
        theme: z.ZodDefault<z.ZodEnum<{
            light: "light";
            dark: "dark";
        }>>;
        notifications: z.ZodDefault<z.ZodBoolean>;
        dashboardLayout: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export declare const UpdateUserProfileSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        theme: z.ZodDefault<z.ZodEnum<{
            light: "light";
            dark: "dark";
        }>>;
        notifications: z.ZodDefault<z.ZodBoolean>;
        dashboardLayout: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AlertSeveritySchema: z.ZodEnum<{
    info: "info";
    warning: "warning";
    critical: "critical";
}>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export declare const AlertSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    severity: z.ZodEnum<{
        info: "info";
        warning: "warning";
        critical: "critical";
    }>;
    metricName: z.ZodString;
    metricValue: z.ZodNumber;
    threshold: z.ZodNumber;
    isRead: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type Alert = z.infer<typeof AlertSchema>;
export declare const CreateAlertSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    severity: z.ZodEnum<{
        info: "info";
        warning: "warning";
        critical: "critical";
    }>;
    metricName: z.ZodString;
    metricValue: z.ZodNumber;
    threshold: z.ZodNumber;
}, z.core.$strip>;
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map