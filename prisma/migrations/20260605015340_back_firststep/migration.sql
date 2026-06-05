/*
  Warnings:

  - You are about to drop the column `midtransOrderId` on the `order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Order_midtransOrderId_key` ON `order`;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `midtransOrderId`;
