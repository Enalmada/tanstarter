CREATE TYPE "public"."role" AS ENUM('MEMBER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'MEMBER' NOT NULL;