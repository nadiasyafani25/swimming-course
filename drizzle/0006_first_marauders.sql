CREATE TABLE "coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"certification" varchar(150),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "coaches_name_unique" ON "coaches" USING btree ("name");--> statement-breakpoint
CREATE INDEX "coaches_is_active_idx" ON "coaches" USING btree ("is_active");