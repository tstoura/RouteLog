/*
  Warnings:

  - A unique constraint covering the columns `[normalized_name,mountain_or_area,climbing_field]` on the table `routes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "routes_normalized_name_mountain_or_area_climbing_field_idx";

-- CreateIndex
CREATE UNIQUE INDEX "routes_normalized_name_mountain_or_area_climbing_field_key" ON "routes"("normalized_name", "mountain_or_area", "climbing_field");
