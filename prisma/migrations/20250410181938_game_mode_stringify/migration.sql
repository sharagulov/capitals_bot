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
    "gameMode" TEXT NOT NULL DEFAULT 'Столицы'
);
INSERT INTO "new_User" ("createdAt", "gameMode", "id", "isAdmin", "poolSize", "shortName", "telegramId", "username") SELECT "createdAt", "gameMode", "id", "isAdmin", "poolSize", "shortName", "telegramId", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
