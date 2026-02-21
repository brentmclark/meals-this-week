ALTER TABLE "users"
  ADD COLUMN "email_verified_at" TIMESTAMPTZ,
  ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMPTZ;

CREATE TABLE "email_verification_tokens" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_email_verification_user_expires"
  ON "email_verification_tokens" ("user_id", "expires_at");

CREATE TABLE "password_reset_tokens" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_password_reset_user_expires"
  ON "password_reset_tokens" ("user_id", "expires_at");

CREATE TABLE "household_invites" (
  "id" BIGSERIAL PRIMARY KEY,
  "household_id" BIGINT NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "token_hash" TEXT NOT NULL UNIQUE,
  "invited_by_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
  "accepted_by_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "accepted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_household_invites_household_email"
  ON "household_invites" ("household_id", "email");

CREATE INDEX "idx_household_invites_household_expires"
  ON "household_invites" ("household_id", "expires_at");
