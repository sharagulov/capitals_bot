/*
  Warnings:

  - You are about to alter the column `gameMode` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Boolean` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "shortName" TEXT,
    "telegramId" BIGINT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poolSize" INTEGER NOT NULL DEFAULT 20,
    "gameMode" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_User" ("createdAt", "gameMode", "id", "isAdmin", "poolSize", "shortName", "telegramId", "username") SELECT "createdAt", "gameMode", "id", "isAdmin", "poolSize", "shortName", "telegramId", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
