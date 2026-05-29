/*
  Warnings:

  - A unique constraint covering the columns `[source_scale,source_grade,target_scale]` on the table `grade_mappings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "grade_mappings_source_scale_source_grade_target_scale_key" ON "grade_mappings"("source_scale", "source_grade", "target_scale");
