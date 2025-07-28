ALTER TABLE "doctors"
ADD COLUMN "user_id" integer REFERENCES "users"("user_id"); 