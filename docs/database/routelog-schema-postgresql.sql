CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"system_role" varchar(30) NOT NULL,
	"preferred_activity" varchar(30),
	"onboarding_completed" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "clubs" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"short_name" varchar(100),
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "club_memberships" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"role" varchar(30) NOT NULL,
	"registry_number" varchar(100),
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "activities" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"club_id" uuid,
	"date" date NOT NULL,
	"category" varchar(30) NOT NULL,
	"is_official" boolean NOT NULL,
	"points" numeric(10,2),
	"private_notes" text,
	"public_notes" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "routes" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"created_by_user_id" uuid,
	"category" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"mountain_or_area" varchar(255) NOT NULL,
	"climbing_field" varchar(255) NOT NULL,
	"default_scale" varchar(30) NOT NULL,
	"default_grade" varchar(50) NOT NULL,
	"altitude" integer,
	"route_length" numeric(8,2),
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "hiking_activity_details" (
	"activity_id" uuid NOT NULL,
	"mountain" varchar(255) NOT NULL,
	"start_point" varchar(255) NOT NULL,
	"end_point" varchar(255) NOT NULL,
	"max_altitude" integer NOT NULL,
	"total_elevation_gain" integer NOT NULL,
	"distance_length" numeric(8,2) NOT NULL,
	"field_type" varchar(100) NOT NULL,
	"difficulty_grade" varchar(50) NOT NULL,
	"participants_num" integer NOT NULL,
	PRIMARY KEY ("activity_id")
);
CREATE TABLE IF NOT EXISTS "climbing_activity_details" (
	"activity_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"route_name" varchar(255) NOT NULL,
	"mountain_or_area" varchar(255) NOT NULL,
	"climbing_field" varchar(255) NOT NULL,
	"season" varchar(30) NOT NULL,
	"repetition_type" varchar(30) NOT NULL,
	"altitude" integer NOT NULL,
	"completion_type" varchar(50),
	"difficulty_scale" varchar(30),
	"difficulty_grade" varchar(50),
	"mapped_scale" varchar(30),
	"mapped_grade" varchar(50),
	"mixed_climbing" varchar(50),
	"route_length" numeric(8,2) NOT NULL,
	"participants_num" integer NOT NULL,
	"participants_text" text NOT NULL,
	PRIMARY KEY ("activity_id")
);
CREATE TABLE IF NOT EXISTS "expedition_activity_details" (
	"activity_id" uuid NOT NULL,
	"country" varchar(255) NOT NULL,
	"mountain_range" varchar(255) NOT NULL,
	"mountain" varchar(255) NOT NULL,
	"summit" varchar(255) NOT NULL,
	"route_name" varchar(255) NOT NULL,
	"season" varchar(30) NOT NULL,
	"altitude" integer NOT NULL,
	"total_elevation_gain" integer NOT NULL,
	"difficulty_grade" varchar(50) NOT NULL,
	"participants_num" integer NOT NULL,
	"organization_type" varchar(100) NOT NULL,
	PRIMARY KEY ("activity_id")
);
CREATE TABLE IF NOT EXISTS "grade_mappings" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"source_scale" varchar(30) NOT NULL,
	"source_grade" varchar(50) NOT NULL,
	"target_scale" varchar(30) NOT NULL,
	"target_grade" varchar(50) NOT NULL,
	PRIMARY KEY ("id")
);
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_fk1" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_fk2" FOREIGN KEY ("club_id") REFERENCES "clubs"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_fk1" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_fk2" FOREIGN KEY ("club_id") REFERENCES "clubs"("id");
ALTER TABLE "routes" ADD CONSTRAINT "routes_fk1" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "hiking_activity_details" ADD CONSTRAINT "hiking_activity_details_fk0" FOREIGN KEY ("activity_id") REFERENCES "activities"("id");
ALTER TABLE "climbing_activity_details" ADD CONSTRAINT "climbing_activity_details_fk0" FOREIGN KEY ("activity_id") REFERENCES "activities"("id");
ALTER TABLE "climbing_activity_details" ADD CONSTRAINT "climbing_activity_details_fk1" FOREIGN KEY ("route_id") REFERENCES "routes"("id");
ALTER TABLE "expedition_activity_details" ADD CONSTRAINT "expedition_activity_details_fk0" FOREIGN KEY ("activity_id") REFERENCES "activities"("id");