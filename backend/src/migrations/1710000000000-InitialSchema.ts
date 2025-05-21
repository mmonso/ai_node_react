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
            CREATE TABLE "folders" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "message";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "folders";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "models";`);
    }
} 