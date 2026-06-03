-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "keycloakId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'light',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "dashboardLayout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_keycloakId_key" ON "UserProfile"("keycloakId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");
