import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAIModels1715000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Atualizar modelos Gemini
        await queryRunner.query(`
            UPDATE models 
            SET name = 'gemini-2.5-flash-preview-04-17',
                label = 'Gemini 2.5 Flash (Preview)',
                capabilities = '{"textInput": true, "imageInput": true, "fileInput": false, "webSearch": true}',
                defaultConfig = '{"temperature": 0.7, "maxOutputTokens": 2048}'
            WHERE provider = 'gemini' AND name = 'gemini-2.0-flash';
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'gemini',
                'gemini-2.5-pro-preview-05-06',
                'Gemini 2.5 Pro (Preview)',
                true,
                '{"textInput": true, "imageInput": true, "fileInput": false, "webSearch": true}',
                '{"temperature": 0.7, "maxOutputTokens": 4096}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'gemini',
                'gemini-2.0-flash-lite',
                'Gemini 2.0 Flash Lite',
                true,
                '{"textInput": true, "imageInput": false, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 1024}'
            );
        `);

        // Atualizar modelos OpenAI
        await queryRunner.query(`
            UPDATE models 
            SET name = 'gpt-4.1',
                label = 'GPT-4.1',
                capabilities = '{"textInput": true, "imageInput": true, "fileInput": true, "webSearch": true}',
                defaultConfig = '{"temperature": 0.7, "maxOutputTokens": 4096}'
            WHERE provider = 'openai' AND name = 'gpt-4';
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-4.1-mini',
                'GPT-4.1 Mini',
                true,
                '{"textInput": true, "imageInput": true, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 2048}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'gpt-4.1-nano',
                'GPT-4.1 Nano',
                true,
                '{"textInput": true, "imageInput": false, "fileInput": false, "webSearch": false}',
                '{"temperature": 0.7, "maxOutputTokens": 1024}'
            );
        `);

        await queryRunner.query(`
            INSERT INTO models (provider, name, label, isAvailable, capabilities, defaultConfig)
            VALUES (
                'openai',
                'o3',
                'O3',
                true,
                '{"textInput": true, "imageInput": true, "fileInput": true, "webSearch": true}',
                '{"temperature": 0.7, "maxOutputTokens": 8192}'
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter atualizações Gemini
        await queryRunner.query(`
            UPDATE models 
            SET name = 'gemini-2.0-flash',
                label = 'Gemini 2.0 Flash',
                capabilities = '{"textInput": true, "imageInput": true, "fileInput": false, "webSearch": true}',
                defaultConfig = '{"temperature": 0.7, "maxOutputTokens": 2048}'
            WHERE provider = 'gemini' AND name = 'gemini-2.5-flash-preview-04-17';
        `);

        await queryRunner.query(`
            DELETE FROM models 
            WHERE provider = 'gemini' AND name IN (
                'gemini-2.5-pro-preview-05-06',
                'gemini-2.0-flash-lite'
            );
        `);

        // Reverter atualizações OpenAI
        await queryRunner.query(`
            UPDATE models 
            SET name = 'gpt-4',
                label = 'GPT-4',
                capabilities = '{"textInput": true, "imageInput": true, "fileInput": true, "webSearch": true}',
                defaultConfig = '{"temperature": 0.7, "maxOutputTokens": 4096}'
            WHERE provider = 'openai' AND name = 'gpt-4.1';
        `);

        await queryRunner.query(`
            DELETE FROM models 
            WHERE provider = 'openai' AND name IN (
                'gpt-4.1-mini',
                'gpt-4.1-nano',
                'o3'
            );
        `);
    }
} 