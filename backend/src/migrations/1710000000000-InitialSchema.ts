import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "models" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "provider" varchar NOT NULL,
                "name" varchar NOT NULL,
                "label" varchar NOT NULL,
                "isAvailable" boolean DEFAULT 1,
                "capabilities" text,
                "defaultConfig" text,
                "createdAt" datetime DEFAULT (datetime('now')),
                "updatedAt" datetime DEFAULT (datetime('now'))
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "createdAt" datetime DEFAULT (datetime('now')),
                "updatedAt" datetime DEFAULT (datetime('now'))
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "message" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "content" text NOT NULL,
                "role" varchar NOT NULL,
                "conversationId" integer,
                "createdAt" datetime DEFAULT (datetime('now')),
                "updatedAt" datetime DEFAULT (datetime('now')),
                FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "config" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "systemPrompt" text NOT NULL,
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `);
        // Opcional: Inserir uma linha de configuração padrão, se necessário
        // await queryRunner.query(`
        //     INSERT INTO "config" ("systemPrompt") VALUES ('Você é um assistente prestativo.');
        // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "config";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "message";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "models";`);
    }
}