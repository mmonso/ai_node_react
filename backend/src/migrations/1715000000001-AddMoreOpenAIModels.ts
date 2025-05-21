import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoreOpenAIModels1715000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar novos modelos OpenAI
        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-4-turbo-preview',
                'GPT-4 Turbo (Preview)',
                true,
                '{"textInput": true, "imageInput": true, "fileInput": true, "webSearch": true}',
                '{"temperature": 0.7, "maxOutputTokens": 8192}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-4-vision-preview',
                'GPT-4 Vision (Preview)',
                true,
                '{"textInput": true, "imageInput": true, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 4096}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-3.5-turbo-0125',
                'GPT-3.5 Turbo (0125)',
                true,
                '{"textInput": true, "imageInput": false, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 4096}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-3.5-turbo-instruct',
                'GPT-3.5 Turbo Instruct',
                true,
                '{"textInput": true, "imageInput": false, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 4096}'
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover os modelos adicionados
        await queryRunner.query(`
            DELETE FROM models 
            WHERE provider = 'openai' AND name IN (
                'gpt-4-turbo-preview',
                'gpt-4-vision-preview',
                'gpt-3.5-turbo-0125',
                'gpt-3.5-turbo-instruct'
            );
        `);
    }
} 