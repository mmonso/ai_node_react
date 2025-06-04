import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationIdToAgent1748882615111 implements MigrationInterface {
    name = 'AddConversationIdToAgent1748882615111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "systemPrompt" text, "telegramBotToken" varchar, "telegramChatId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "conversationId" varchar, CONSTRAINT "UQ_8f520d683530e0e0e9778dd787b" UNIQUE ("telegramChatId"), CONSTRAINT "UQ_01e3d6589e4cc6028598ceb281c" UNIQUE ("conversationId"))`);
        await queryRunner.query(`INSERT INTO "temporary_agents"("id", "name", "systemPrompt", "telegramBotToken", "telegramChatId", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "systemPrompt", "telegramBotToken", "telegramChatId", "createdAt", "updatedAt", "deletedAt" FROM "agents"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`ALTER TABLE "temporary_agents" RENAME TO "agents"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agents" RENAME TO "temporary_agents"`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "systemPrompt" text, "telegramBotToken" varchar, "telegramChatId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_8f520d683530e0e0e9778dd787b" UNIQUE ("telegramChatId"))`);
        await queryRunner.query(`INSERT INTO "agents"("id", "name", "systemPrompt", "telegramBotToken", "telegramChatId", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "systemPrompt", "telegramBotToken", "telegramChatId", "createdAt", "updatedAt", "deletedAt" FROM "temporary_agents"`);
        await queryRunner.query(`DROP TABLE "temporary_agents"`);
    }

}
