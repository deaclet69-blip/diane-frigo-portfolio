-- AlterTable
ALTER TABLE "PricingSettings" ADD COLUMN     "estimatedMonthlyCartonsSold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedMonthlyFixedCharges" DECIMAL(14,2) NOT NULL DEFAULT 0;
