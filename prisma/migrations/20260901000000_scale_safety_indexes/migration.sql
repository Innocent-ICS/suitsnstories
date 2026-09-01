-- Protect money and calendar side effects under webhook/verify retries and load spikes.
CREATE UNIQUE INDEX "Payment_provider_providerRef_key"
  ON "Payment"("provider", "providerRef");

CREATE UNIQUE INDEX "Booking_paymentId_key"
  ON "Booking"("paymentId");

CREATE INDEX "Payment_status_createdAt_idx"
  ON "Payment"("status", "createdAt");

CREATE INDEX "Booking_clientId_startTime_idx"
  ON "Booking"("clientId", "startTime");

CREATE INDEX "Booking_coachId_status_startTime_endTime_idx"
  ON "Booking"("coachId", "status", "startTime", "endTime");

CREATE INDEX "Recommendation_status_featured_reviewedAt_createdAt_idx"
  ON "Recommendation"("status", "featured", "reviewedAt", "createdAt");

CREATE INDEX "NarratometerAnalysis_userId_status_idx"
  ON "NarratometerAnalysis"("userId", "status");

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_active_overlap_per_coach"
  EXCLUDE USING gist (
    "coachId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
