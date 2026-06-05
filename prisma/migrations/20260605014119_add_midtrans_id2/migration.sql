/*
  Warnings:

  - You are about to drop the column `midtransId` on the `order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[midtransOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Order_midtransId_key` ON `order`;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `midtransId`,
    ADD COLUMN `midtransOrderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_midtransOrderId_key` ON `Order`(`midtransOrderId`);
