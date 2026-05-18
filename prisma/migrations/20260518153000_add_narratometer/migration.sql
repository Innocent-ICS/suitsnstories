-- CreateEnum
CREATE TYPE "NarratometerStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NarratometerAgentKind" AS ENUM ('EXTRACTOR', 'NARRATIVE', 'INVESTOR_READINESS', 'DESIGN_SYSTEM', 'GUARDRAIL', 'ORCHESTRATOR');

-- CreateEnum
CREATE TYPE "NarratometerProvider" AS ENUM ('GROQ', 'OPENROUTER');

-- CreateTable
CREATE TABLE "NarratometerAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "founderContext" TEXT,
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileFingerprint" TEXT NOT NULL,
    "provider" "NarratometerProvider",
    "model" TEXT,
    "status" "NarratometerStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "riskLevel" TEXT,
    "summary" TEXT,
    "report" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NarratometerAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarratometerAgentRun" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "kind" "NarratometerAgentKind" NOT NULL,
    "provider" "NarratometerProvider",
    "model" TEXT,
    "status" "NarratometerStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT,
    "findings" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NarratometerAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NarratometerAnalysis_userId_createdAt_idx" ON "NarratometerAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NarratometerAnalysis_projectId_idx" ON "NarratometerAnalysis"("projectId");

-- CreateIndex
CREATE INDEX "NarratometerAnalysis_status_idx" ON "NarratometerAnalysis"("status");

-- CreateIndex
CREATE INDEX "NarratometerAnalysis_fileFingerprint_idx" ON "NarratometerAnalysis"("fileFingerprint");

-- CreateIndex
CREATE INDEX "NarratometerAgentRun_analysisId_kind_idx" ON "NarratometerAgentRun"("analysisId", "kind");

-- CreateIndex
CREATE INDEX "NarratometerAgentRun_status_idx" ON "NarratometerAgentRun"("status");

-- AddForeignKey
ALTER TABLE "NarratometerAnalysis" ADD CONSTRAINT "NarratometerAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarratometerAnalysis" ADD CONSTRAINT "NarratometerAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarratometerAgentRun" ADD CONSTRAINT "NarratometerAgentRun_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "NarratometerAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
