-- AlterTable
ALTER TABLE `Order` ADD COLUMN `snapToken` VARCHAR(191) NULL,
    ADD COLUMN `snapTokenExpiredAt` DATETIME(3) NULL,
    ADD COLUMN `snapUrl` VARCHAR(191) NULL;
