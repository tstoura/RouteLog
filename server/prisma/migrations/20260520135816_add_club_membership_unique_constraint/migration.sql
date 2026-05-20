/*
  Warnings:

  - A unique constraint covering the columns `[user_id,club_id]` on the table `club_memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_user_id_club_id_key" ON "club_memberships"("user_id", "club_id");
