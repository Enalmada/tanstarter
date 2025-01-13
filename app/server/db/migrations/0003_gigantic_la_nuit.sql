ALTER TABLE "task" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "created_by_id" varchar;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "updated_by_id" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_by_id" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_by_id" varchar;