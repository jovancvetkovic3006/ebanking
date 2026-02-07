-- Update existing UUID-based account IDs to Serbian bank account format
-- Temporarily drop FK constraints, update IDs, then re-add constraints

ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_fromAccountId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_toAccountId_fkey";

UPDATE "Account" SET "id" = '265-1000000000001-88' WHERE "id" = '00000000-0000-0000-0000-000000000001';
UPDATE "Account" SET "id" = '265-1000000000002-85' WHERE "id" = '00000000-0000-0000-0000-000000000002';

UPDATE "Transaction" SET "fromAccountId" = '265-1000000000001-88' WHERE "fromAccountId" = '00000000-0000-0000-0000-000000000001';
UPDATE "Transaction" SET "toAccountId" = '265-1000000000001-88' WHERE "toAccountId" = '00000000-0000-0000-0000-000000000001';
UPDATE "Transaction" SET "fromAccountId" = '265-1000000000002-85' WHERE "fromAccountId" = '00000000-0000-0000-0000-000000000002';
UPDATE "Transaction" SET "toAccountId" = '265-1000000000002-85' WHERE "toAccountId" = '00000000-0000-0000-0000-000000000002';

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Also update any AuditLog meta that references old account IDs
UPDATE "AuditLog" SET "meta" = jsonb_set("meta"::jsonb, '{accountId}', '"265-1000000000001-88"') WHERE "meta"::text LIKE '%00000000-0000-0000-0000-000000000001%';
UPDATE "AuditLog" SET "meta" = jsonb_set("meta"::jsonb, '{accountId}', '"265-1000000000002-85"') WHERE "meta"::text LIKE '%00000000-0000-0000-0000-000000000002%';