import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroundingMetadata1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(
        //     `ALTER TABLE message ADD COLUMN groundingMetadata TEXT NULL`
        // );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(
        //     `ALTER TABLE message DROP COLUMN groundingMetadata`
        // );
    }
} 