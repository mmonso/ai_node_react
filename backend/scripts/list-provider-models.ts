import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module'; // Importa o AppModule principal
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

// Importar os serviços dos provedores diretamente
// NOTA: Isso pode ser um pouco complicado se eles tiverem muitas dependências
// que são normalmente resolvidas pelo sistema de injeção de dependência do NestJS.
// Uma abordagem alternativa seria obter os serviços do contexto da aplicação NestJS standalone.
import { GeminiService } from '../src/gemini/gemini.service';
import { OpenAIService } from '../src/openai/openai.service';
import { AnthropicService } from '../src/anthropic/anthropic.service';
import { WebSearchService } from '../src/web-search/web-search.service'; // Se for dependência

async function listModels() {
  console.log('Iniciando script para listar modelos dos provedores...');

  // Inicializar um contexto de aplicação NestJS standalone para acessar serviços configurados
  // Isso garante que ConfigService e outras dependências sejam injetadas corretamente.
  const app = await NestFactory.createApplicationContext(AppModule, {
    // Desabilitar o logger padrão do NestJS para este script, se desejado, para não poluir a saída
    logger: false, // ou ['error', 'warn'] para ver apenas erros/avisos do NestJS
  });

  const configService = app.get(ConfigService);
  const httpService = app.get(HttpService);
  // WebSearchService pode não ser necessário para listar modelos, mas se for uma dependência dos serviços de IA:
  const webSearchService = app.get(WebSearchService);


  console.log('\n--- Modelos Gemini ---');
  try {
    const geminiApiKey = configService.get<string>('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.log('Chave API Gemini (GEMINI_API_KEY) não configurada. Pulando.');
    } else {
      const geminiService = new GeminiService(configService, webSearchService, httpService); // Instanciação manual
      const geminiModels = await geminiService.listModels();
      console.log(`Encontrados ${geminiModels.length} modelos Gemini:`);
      geminiModels.forEach(model => {
        const context = model.contextLength ? `${model.contextLength} tokens` : 'N/A';
        let supportsImage = false;
        let supportsTools = false;

        if (model.capabilities && typeof model.capabilities === 'object' && !Array.isArray(model.capabilities)) {
          supportsImage = !!model.capabilities.vision; // Acessar como propriedade de objeto
          supportsTools = !!model.capabilities.tool_use; // Acessar como propriedade de objeto
        }
        // Fallback para inputModalities se capabilities.vision não estiver definido ou capabilities não for um objeto
        if (!supportsImage && model.inputModalities && model.inputModalities.includes('image')) {
          supportsImage = true;
        }
        
        console.log(`  - ID/Nome: ${model.idOrName}`);
        console.log(`    Label: ${model.label}`);
        console.log(`    Contexto: ${context}`);
        console.log(`    Suporta Imagem: ${supportsImage ? 'Sim' : 'Não'}`);
        console.log(`    Suporta Tools: ${supportsTools ? 'Sim' : 'Não'}`);
        console.log(`    ---`); // Separador para melhor legibilidade entre modelos
      });
    }
  } catch (error) {
    console.error('Erro ao listar modelos Gemini:', error.message);
  }

  console.log('\n--- Modelos OpenAI ---');
  try {
    const openaiApiKey = configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.log('Chave API OpenAI (OPENAI_API_KEY) não configurada. Pulando.');
    } else {
      // OpenAIService espera apenas ConfigService no construtor
      const openaiService = new OpenAIService(configService);
      const openaiModels = await openaiService.listModels();
      console.log(`Encontrados ${openaiModels.length} modelos OpenAI:`);
      openaiModels.forEach(model => {
        console.log(`  ID/Nome: ${model.idOrName}, Label: ${model.label}`);
        console.log(`    Capabilities: ${JSON.stringify(model.capabilities)}`);
      });
    }
  } catch (error) {
    console.error('Erro ao listar modelos OpenAI:', error.message);
  }

  console.log('\n--- Modelos Anthropic ---');
  try {
    const anthropicApiKey = configService.get<string>('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.log('Chave API Anthropic (ANTHROPIC_API_KEY) não configurada. Pulando.');
    } else {
      // AnthropicService espera apenas ConfigService no construtor
      const anthropicService = new AnthropicService(configService);
      const anthropicModels = await anthropicService.listModels();
      console.log(`Encontrados ${anthropicModels.length} modelos Anthropic:`);
      anthropicModels.forEach(model => {
        console.log(`  ID/Nome: ${model.idOrName}, Label: ${model.label}`);
        console.log(`    Capabilities: ${JSON.stringify(model.capabilities)}`);
      });
    }
  } catch (error) {
    console.error('Erro ao listar modelos Anthropic:', error.message);
  }

  await app.close();
  console.log('\nScript concluído.');
}

listModels().catch(error => {
  console.error('Erro fatal no script:', error);
  process.exit(1);
});