import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemPromptAndIsPersonaToEntities1748133914999 implements MigrationInterface {
    name = 'AddSystemPromptAndIsPersonaToEntities1748133914999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_folder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "systemPrompt" text)`);
        await queryRunner.query(`INSERT INTO "temporary_folder"("id", "name", "createdAt", "updatedAt") SELECT "id", "name", "createdAt", "updatedAt" FROM "folder"`);
        await queryRunner.query(`DROP TABLE "folder"`);
        await queryRunner.query(`ALTER TABLE "temporary_folder" RENAME TO "folder"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_9ff4c201f529015ec2d0e36462d" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_9fcac556b18c08c8b003294cd5f" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
        await queryRunner.query(`CREATE TABLE "temporary_models" ("id" varchar PRIMARY KEY NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean NOT NULL, "capabilities" text NOT NULL, "defaultConfig" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeenAt" datetime, "markedAsMissingSince" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince" FROM "models"`);
        await queryRunner.query(`DROP TABLE "models"`);
        await queryRunner.query(`ALTER TABLE "temporary_models" RENAME TO "models"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" varchar, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" varchar, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_9fcac556b18c08c8b003294cd5f" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_9ff4c201f529015ec2d0e36462d" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" varchar, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`ALTER TABLE "models" RENAME TO "temporary_models"`);
        await queryRunner.query(`CREATE TABLE "models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "provider" varchar NOT NULL, "name" varchar NOT NULL, "label" varchar NOT NULL, "isAvailable" boolean NOT NULL DEFAULT (1), "capabilities" text, "defaultConfig" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeenAt" datetime, "markedAsMissingSince" datetime)`);
        await queryRunner.query(`INSERT INTO "models"("id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince") SELECT "id", "provider", "name", "label", "isAvailable", "capabilities", "defaultConfig", "createdAt", "updatedAt", "lastSeenAt", "markedAsMissingSince" FROM "temporary_models"`);
        await queryRunner.query(`DROP TABLE "temporary_models"`);
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_9ff4c201f529015ec2d0e36462d" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig", "systemPrompt", "isPersona" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "folderId" integer, "modelId" integer, "modelConfig" text, CONSTRAINT "FK_9ff4c201f529015ec2d0e36462d" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_9fcac556b18c08c8b003294cd5f" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "conversation"("id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "folderId", "modelId", "modelConfig" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`ALTER TABLE "folder" RENAME TO "temporary_folder"`);
        await queryRunner.query(`CREATE TABLE "folder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "folder"("id", "name", "createdAt", "updatedAt") SELECT "id", "name", "createdAt", "updatedAt" FROM "temporary_folder"`);
        await queryRunner.query(`DROP TABLE "temporary_folder"`);
    }

}
