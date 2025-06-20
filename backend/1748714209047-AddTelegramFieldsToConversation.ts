import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelegramFieldsToConversation1748714209047 implements MigrationInterface {
    name = 'AddTelegramFieldsToConversation1748714209047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_407a55172fab879f7c60677705"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0), "folderId" integer, "modelId" varchar, "modelConfig" text, "telegram_habilitado" boolean NOT NULL DEFAULT (0), "telegram_chat_id" text, CONSTRAINT "UQ_0abfab358cbcc0a9e26713209d8" UNIQUE ("telegram_chat_id"), CONSTRAINT "FK_44ed489a721a51e07249be4ff3b" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_407a55172fab879f7c60677705c" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversations"("id", "title", "createdAt", "updatedAt", "systemPrompt", "isPersona", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "systemPrompt", "isPersona", "folderId", "modelId", "modelConfig" FROM "conversations"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversations" RENAME TO "conversations"`);
        await queryRunner.query(`CREATE INDEX "IDX_407a55172fab879f7c60677705" ON "conversations" ("folderId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_407a55172fab879f7c60677705"`);
        await queryRunner.query(`ALTER TABLE "conversations" RENAME TO "temporary_conversations"`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "systemPrompt" text, "isPersona" boolean NOT NULL DEFAULT (0), "folderId" integer, "modelId" varchar, "modelConfig" text, CONSTRAINT "FK_44ed489a721a51e07249be4ff3b" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_407a55172fab879f7c60677705c" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "conversations"("id", "title", "createdAt", "updatedAt", "systemPrompt", "isPersona", "folderId", "modelId", "modelConfig") SELECT "id", "title", "createdAt", "updatedAt", "systemPrompt", "isPersona", "folderId", "modelId", "modelConfig" FROM "temporary_conversations"`);
        await queryRunner.query(`DROP TABLE "temporary_conversations"`);
        await queryRunner.query(`CREATE INDEX "IDX_407a55172fab879f7c60677705" ON "conversations" ("folderId") `);
    }

}
