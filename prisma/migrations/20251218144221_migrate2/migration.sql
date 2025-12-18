/*
  Warnings:

  - Made the column `imagePath` on table `arsipedia` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "arsipedia" ALTER COLUMN "imagePath" SET NOT NULL;
