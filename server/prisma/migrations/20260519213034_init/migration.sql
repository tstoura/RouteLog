-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "system_role" VARCHAR(30) NOT NULL,
    "preferred_activity" VARCHAR(30),
    "onboarding_completed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "registry_number" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "club_id" UUID,
    "date" DATE NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "is_official" BOOLEAN NOT NULL,
    "points" DECIMAL(10,2),
    "private_notes" TEXT,
    "public_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by_user_id" UUID,
    "category" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "normalized_name" VARCHAR(255) NOT NULL,
    "mountain_or_area" VARCHAR(255) NOT NULL,
    "climbing_field" VARCHAR(255) NOT NULL,
    "default_scale" VARCHAR(30) NOT NULL,
    "default_grade" VARCHAR(50) NOT NULL,
    "altitude" INTEGER,
    "route_length" DECIMAL(8,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiking_activity_details" (
    "activity_id" UUID NOT NULL,
    "mountain" VARCHAR(255) NOT NULL,
    "start_point" VARCHAR(255) NOT NULL,
    "end_point" VARCHAR(255) NOT NULL,
    "max_altitude" INTEGER NOT NULL,
    "total_elevation_gain" INTEGER NOT NULL,
    "distance_length" DECIMAL(8,2) NOT NULL,
    "field_type" VARCHAR(100) NOT NULL,
    "difficulty_grade" VARCHAR(50) NOT NULL,
    "participants_num" INTEGER NOT NULL,

    CONSTRAINT "hiking_activity_details_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "climbing_activity_details" (
    "activity_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "route_name" VARCHAR(255) NOT NULL,
    "mountain_or_area" VARCHAR(255) NOT NULL,
    "climbing_field" VARCHAR(255) NOT NULL,
    "season" VARCHAR(30) NOT NULL,
    "repetition_type" VARCHAR(30) NOT NULL,
    "altitude" INTEGER NOT NULL,
    "completion_type" VARCHAR(50),
    "difficulty_scale" VARCHAR(30),
    "difficulty_grade" VARCHAR(50),
    "mapped_scale" VARCHAR(30),
    "mapped_grade" VARCHAR(50),
    "mixed_climbing" VARCHAR(50),
    "route_length" DECIMAL(8,2) NOT NULL,
    "participants_num" INTEGER NOT NULL,
    "participants_text" TEXT NOT NULL,

    CONSTRAINT "climbing_activity_details_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "expedition_activity_details" (
    "activity_id" UUID NOT NULL,
    "country" VARCHAR(255) NOT NULL,
    "mountain_range" VARCHAR(255) NOT NULL,
    "mountain" VARCHAR(255) NOT NULL,
    "summit" VARCHAR(255) NOT NULL,
    "route_name" VARCHAR(255) NOT NULL,
    "season" VARCHAR(30) NOT NULL,
    "altitude" INTEGER NOT NULL,
    "total_elevation_gain" INTEGER NOT NULL,
    "difficulty_grade" VARCHAR(50) NOT NULL,
    "participants_num" INTEGER NOT NULL,
    "organization_type" VARCHAR(100) NOT NULL,

    CONSTRAINT "expedition_activity_details_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "grade_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_scale" VARCHAR(30) NOT NULL,
    "source_grade" VARCHAR(50) NOT NULL,
    "target_scale" VARCHAR(30) NOT NULL,
    "target_grade" VARCHAR(50) NOT NULL,

    CONSTRAINT "grade_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_club_id_is_official_idx" ON "activities"("club_id", "is_official");

-- CreateIndex
CREATE INDEX "routes_normalized_name_mountain_or_area_climbing_field_idx" ON "routes"("normalized_name", "mountain_or_area", "climbing_field");

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiking_activity_details" ADD CONSTRAINT "hiking_activity_details_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "climbing_activity_details" ADD CONSTRAINT "climbing_activity_details_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "climbing_activity_details" ADD CONSTRAINT "climbing_activity_details_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedition_activity_details" ADD CONSTRAINT "expedition_activity_details_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
