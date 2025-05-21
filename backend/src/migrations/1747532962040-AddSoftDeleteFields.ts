import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteFields1747532962040 implements MigrationInterface {
    name = 'AddSoftDeleteFields1747532962040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "role" varchar NOT NULL, "conversationId" integer, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "groundingMetadata" text)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "role", "conversationId", "createdAt", "updatedAt", "groundingMetadata") SELECT "id", "content", "role", "conversationId", "createdAt", "updatedAt", "groundingMetadata" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
        await queryRunner.query(`CREATE TABLE "folder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text)`);
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" integer, "groundingMetadata" text)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "conversationId", "groundingMetadata") SELECT "id", "content", "conversationId", "groundingMetadata" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
        await queryRunner.query(`CREATE TABLE "temporary_models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean DEFAULT (1), "capabilities" text, "defaultConfig" text, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "lastSeenAt" datetime, "markedAsMissingSince" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt" FROM "models"`);
        await queryRunner.query(`DROP TABLE "models"`);
        await queryRunner.query(`ALTER TABLE "temporary_models" RENAME TO "models"`);
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" integer, "groundingMetadata" text, "isUser" boolean NOT NULL, "imageUrl" varchar, "fileUrl" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "conversationId", "groundingMetadata") SELECT "id", "content", "conversationId", "groundingMetadata" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
        await queryRunner.query(`CREATE TABLE "temporary_models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean NOT NULL DEFAULT (1), "capabilities" text, "defaultConfig" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeenAt" datetime, "markedAsMissingSince" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince" FROM "models"`);
        await queryRunner.query(`DROP TABLE "models"`);
        await queryRunner.query(`ALTER TABLE "temporary_models" RENAME TO "models"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, CONSTRAINT "FK_9fcac556b18c08c8b003294cd5f" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_9ff4c201f529015ec2d0e36462d" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" integer, "groundingMetadata" text, "isUser" boolean NOT NULL, "imageUrl" varchar, "fileUrl" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp") SELECT "id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" integer, "groundingMetadata" text, "isUser" boolean NOT NULL, "imageUrl" varchar, "fileUrl" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp") SELECT "id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text)`);
        await queryRunner.query(`INSERT INTO "conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`ALTER TABLE "models" RENAME TO "temporary_models"`);
        await queryRunner.query(`CREATE TABLE "models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean DEFAULT (1), "capabilities" text, "defaultConfig" text, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "lastSeenAt" datetime, "markedAsMissingSince" datetime)`);
        await queryRunner.query(`INSERT INTO "models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince" FROM "temporary_models"`);
        await queryRunner.query(`DROP TABLE "temporary_models"`);
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" integer, "groundingMetadata" text)`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "conversationId", "groundingMetadata") SELECT "id", "content", "conversationId", "groundingMetadata" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
        await queryRunner.query(`ALTER TABLE "models" RENAME TO "temporary_models"`);
        await queryRunner.query(`CREATE TABLE "models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean DEFAULT (1), "capabilities" text, "defaultConfig" text, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt" FROM "temporary_models"`);
        await queryRunner.query(`DROP TABLE "temporary_models"`);
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "role" varchar NOT NULL, "conversationId" integer, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "groundingMetadata" text)`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "conversationId", "groundingMetadata") SELECT "id", "content", "conversationId", "groundingMetadata" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`DROP TABLE "folder"`);
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "role" varchar NOT NULL, "conversationId" integer, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "groundingMetadata" text, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "role", "conversationId", "createdAt", "updatedAt", "groundingMetadata") SELECT "id", "content", "role", "conversationId", "createdAt", "updatedAt", "groundingMetadata" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
    }

}
