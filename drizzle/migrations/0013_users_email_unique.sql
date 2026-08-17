--> statement-breakpoint
-- Deduplicate users by email: reassign posted_by references to the earliest row
UPDATE "journal_headers" jh
SET "posted_by" = u."keep_id"
FROM (
  SELECT MIN("id") AS "keep_id", "email"
  FROM "users"
  GROUP BY "email"
  HAVING COUNT(*) > 1
) u
WHERE jh."posted_by" IN (
  SELECT "id" FROM "users" WHERE "email" = u."email" AND "id" <> u."keep_id"
);
--> statement-breakpoint
-- Keep only the earliest row per email, delete duplicates
DELETE FROM "users"
WHERE "id" NOT IN (
  SELECT MIN("id") FROM "users" GROUP BY "email"
);
--> statement-breakpoint
-- Unique index on users.email (prevents provisioning races creating duplicate accounts)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
