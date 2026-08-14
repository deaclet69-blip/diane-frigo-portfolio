/*
  Warnings:

  - You are about to drop the column `expenseType` on the `Expense` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('FIXE', 'VARIABLE', 'EXCEPTIONNEL');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('RUPTURE_CHAINE_FROID', 'EXPIRATION', 'CASSE', 'VOL', 'ERREUR_MANUTENTION', 'AUTRE');

-- DropIndex
DROP INDEX "Expense_expenseType_idx";

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "expenseType",
ADD COLUMN     "chargeType" "ChargeType" NOT NULL DEFAULT 'VARIABLE';

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "unitCost" DECIMAL(12,2);

-- DropEnum
DROP TYPE "ExpenseType";

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "targetMarginFloor" DECIMAL(5,4) NOT NULL DEFAULT 0.08,
    "targetMarginWholesaleBulk" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "targetMarginWholesale" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "targetMarginRetail" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "marginAlertCritical" DECIMAL(5,4) NOT NULL DEFAULT 0.08,
    "marginAlertGood" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "marginAlertExcellent" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "stockRotationFastDays" INTEGER NOT NULL DEFAULT 15,
    "stockRotationDormantDays" INTEGER NOT NULL DEFAULT 30,
    "acceptableLossRate" DECIMAL(5,4) NOT NULL DEFAULT 0.02,
    "priceRoundingFcfa" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loss" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "reason" "LossReason" NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "totalValue" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "constructionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "equipmentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "customProfitGoal" DECIMAL(14,2),
    "velocityWindowDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loss_productId_date_idx" ON "Loss"("productId", "date");

-- CreateIndex
CREATE INDEX "Expense_chargeType_idx" ON "Expense"("chargeType");

-- AddForeignKey
ALTER TABLE "Loss" ADD CONSTRAINT "Loss_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loss" ADD CONSTRAINT "Loss_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
