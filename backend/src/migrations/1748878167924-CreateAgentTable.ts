import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAgentTable1748878167924 implements MigrationInterface {
    name = 'CreateAgentTable1748878167924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "systemPrompt" text, "telegramBotToken" varchar, "telegramChatId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_8f520d683530e0e0e9778dd787b" UNIQUE ("telegramChatId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "agents"`);
    }

}
