import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFoldersAndLinkToConversations1748312111813 implements MigrationInterface {
    name = 'CreateFoldersAndLinkToConversations1748312111813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the 'folders' table
        await queryRunner.query(`
            CREATE TABLE "folders" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "systemPrompt" text,
                "userId" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
        // 2. Create index on folders.userId
        await queryRunner.query(`CREATE INDEX "IDX_folders_userId" ON "folders" ("userId")`);

        // 3. Recreate 'conversations' table to add 'folderId' column and its foreign key
        await queryRunner.query(`
            CREATE TABLE "temporary_conversations" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "systemPrompt" text,
                "isPersona" boolean NOT NULL DEFAULT (0),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "modelId" varchar,
                "modelConfig" text,
                "folderId" integer,
                CONSTRAINT "FK_conversations_folders_folderId" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                CONSTRAINT "FK_conversations_models_modelId" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Copy data from old 'conversations' to 'temporary_conversations'
        await queryRunner.query(`
            INSERT INTO "temporary_conversations" (
                "id", "title", "systemPrompt", "isPersona", "createdAt", "updatedAt", "modelId", "modelConfig"
            )
            SELECT
                "id", "title", "systemPrompt", "isPersona", "createdAt", "updatedAt", "modelId", "modelConfig"
            FROM "conversations"
        `);

        // Drop the old 'conversations' table
        await queryRunner.query(`DROP TABLE "conversations"`);

        // Rename 'temporary_conversations' to 'conversations'
        await queryRunner.query(`ALTER TABLE "temporary_conversations" RENAME TO "conversations"`);

        // 4. Create index on conversations.folderId
        await queryRunner.query(`CREATE INDEX "IDX_conversations_folderId" ON "conversations" ("folderId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop index on conversations.folderId
        await queryRunner.query(`DROP INDEX "IDX_conversations_folderId"`);

        // 2. Recreate 'conversations' table to remove 'folderId' column and its foreign key
        await queryRunner.query(`
            CREATE TABLE "temporary_conversations" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "systemPrompt" text,
                "isPersona" boolean NOT NULL DEFAULT (0),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "modelId" varchar,
                "modelConfig" text,
                CONSTRAINT "FK_conversations_models_modelId_rollback" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Copy data from old 'conversations' (which has folderId) to 'temporary_conversations' (which doesn't)
        await queryRunner.query(`
            INSERT INTO "temporary_conversations" (
                "id", "title", "systemPrompt", "isPersona", "createdAt", "updatedAt", "modelId", "modelConfig"
            )
            SELECT
                "id", "title", "systemPrompt", "isPersona", "createdAt", "updatedAt", "modelId", "modelConfig"
            FROM "conversations"
        `);

        // Drop the 'conversations' table (which has folderId)
        await queryRunner.query(`DROP TABLE "conversations"`);

        // Rename 'temporary_conversations' to 'conversations'
        await queryRunner.query(`ALTER TABLE "temporary_conversations" RENAME TO "conversations"`);

        // 3. Drop index on folders.userId
        await queryRunner.query(`DROP INDEX "IDX_folders_userId"`);

        // 4. Drop the 'folders' table
        await queryRunner.query(`DROP TABLE "folders"`);
    }

}
