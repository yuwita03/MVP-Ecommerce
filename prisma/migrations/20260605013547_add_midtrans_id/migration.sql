/*
  Warnings:

  - A unique constraint covering the columns `[midtransId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `midtransId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_midtransId_key` ON `Order`(`midtransId`);
