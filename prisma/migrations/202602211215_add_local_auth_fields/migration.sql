ALTER TABLE "users"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "password_hash" TEXT;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
