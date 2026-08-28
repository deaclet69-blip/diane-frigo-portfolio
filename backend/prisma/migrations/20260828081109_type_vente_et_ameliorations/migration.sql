-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "saleType" "CustomerType" NOT NULL DEFAULT 'DETAIL';
