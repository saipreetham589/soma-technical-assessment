-- prisma/migrations/20241209_add_dependencies/migration.sql

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dependentId" INTEGER NOT NULL,
    "dependencyId" INTEGER NOT NULL,
    CONSTRAINT "TaskDependency_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_dependentId_dependencyId_key" ON "TaskDependency"("dependentId", "dependencyId");

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Todo" ADD COLUMN "earliestStart" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "latestStart" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "earliestFinish" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "latestFinish" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "isCritical" BOOLEAN NOT NULL DEFAULT false;