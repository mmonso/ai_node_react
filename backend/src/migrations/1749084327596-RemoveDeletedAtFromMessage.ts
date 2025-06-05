import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDeletedAtFromMessage1749084327596 implements MigrationInterface {
    name = 'RemoveDeletedAtFromMessage1749084327596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" varchar, "groundingMetadata" text, "isUser" boolean NOT NULL, "imageUrl" varchar, "fileUrl" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp") SELECT "id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "content" text NOT NULL, "conversationId" varchar, "groundingMetadata" text, "isUser" boolean NOT NULL, "imageUrl" varchar, "fileUrl" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "deletedAt" datetime, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp") SELECT "id", "content", "conversationId", "groundingMetadata", "isUser", "imageUrl", "fileUrl", "timestamp" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
    }

}
