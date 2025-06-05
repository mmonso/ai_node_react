import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadGatewayException,
  ServiceUnavailableException,
  HttpException, // Adicionado para capturar status genéricos
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios'; // Adicionado HttpService
import { firstValueFrom } from 'rxjs'; // Adicionado firstValueFrom
import axios from 'axios'; // Adicionado axios
import { Model } from '../entities/model.entity';
import { AIServiceInterface } from '../models/ai-service.interface';
import { ProviderApiService, ProviderModelInfo } from '../models/provider-api.service.interface';
import { WebSearchService } from '../web-search/web-search.service';
import { Message } from '../entities/message.entity';
// ImageProcessingService não é mais injetado diretamente aqui, mas sim no GeminiHelperService
// import { ImageProcessingService } from '../image-processing/image-processing.service';
import { GeminiHelperService } from './gemini-helper.service'; // Adicionar import

@Injectable()
export class GeminiService implements AIServiceInterface, ProviderApiService {
  private apiKey: string;
  private readonly logger = new Logger(GeminiService.name);
  private readonly GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(
    private configService: ConfigService,
    private webSearchService: WebSearchService,
    private httpService: HttpService,
    // private imageProcessingService: ImageProcessingService, // Remover injeção direta
    private geminiHelperService: GeminiHelperService, // Injetar GeminiHelperService
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY não encontrada no arquivo .env. O serviço não funcionará corretamente.');
    } else {
      this.logger.log('Serviço Gemini inicializado com sucesso');
      this.validateGroundingCapability();
    }
  }

  private async _callGeminiApi(endpoint: string, method: 'GET' | 'POST' = 'POST', data: any = null): Promise<any> {
    if (!this.apiKey) {
      this.logger.error('Chave API Gemini não configurada. Não é possível chamar a API.');
      throw new InternalServerErrorException('Chave API Gemini não configurada. Verifique as variáveis de ambiente.');
    }

    const url = `${this.GEMINI_API_BASE_URL}/${endpoint}?key=${this.apiKey}`;
    this.logger.debug(`Chamando API Gemini: ${method} ${url.replace(this.apiKey, 'REDACTED_API_KEY')}`);
    if (data) {
      this.logger.debug('Payload da requisição:', JSON.stringify(data));
    }

    try {
      let response;
      if (method === 'GET') {
        response = await firstValueFrom(this.httpService.get(url));
      } else {
        response = await firstValueFrom(this.httpService.post(url, data, {
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      this.logger.debug(`Resposta da API Gemini (status ${response.status}):`, response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Erro Axios ao chamar API Gemini (${url}): Status ${status}, Mensagem: ${errorMessage}`, error.response?.data);

        switch (status) {
          case 400:
            throw new BadRequestException(`Erro na API Gemini (400): ${errorMessage}`);
          case 401:
            throw new UnauthorizedException(`Erro na API Gemini (401): Não autorizado. Verifique sua chave API. ${errorMessage}`);
          case 403:
            throw new ForbiddenException(`Erro na API Gemini (403): Acesso proibido. ${errorMessage}`);
          case 404:
            throw new NotFoundException(`Erro na API Gemini (404): Endpoint não encontrado. ${errorMessage}`);
          case 429: // Too Many Requests
             throw new HttpException('Muitas requisições para a API Gemini. Tente novamente mais tarde.', 429);
          case 500:
          case 502:
          case 503:
          case 504:
            throw new BadGatewayException(`Erro no servidor da API Gemini (${status}): ${errorMessage}`);
          default:
            throw new ServiceUnavailableException(`Erro ao comunicar com a API Gemini (status ${status || 'desconhecido'}): ${errorMessage}`);
        }
      }
      this.logger.error(`Erro desconhecido ao chamar API Gemini (${url}): ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Erro interno ao processar a chamada para a API Gemini: ${error.message}`);
    }
  }

  private async validateGroundingCapability() {
    try {
      this.logger.log('Validando se a chave API tem permissões para usar grounding...');
      
      const modelToTest = 'models/gemini-2.0-flash:generateContent'; // Usar a nomenclatura correta do endpoint
      
      const requestBody = {
        contents: [{ parts: [{ text: "Quem é o atual presidente do Brasil?" }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
        tools: [{ googleSearch: {} }]
      };
      
      const data = await this._callGeminiApi(modelToTest, 'POST', requestBody);
      
      if (data.candidates && data.candidates[0]?.groundingMetadata) {
        this.logger.log('Teste de grounding bem-sucedido! A chave API tem permissões para usar o recurso de grounding.');
      } else {
        this.logger.warn('Teste de grounding parcialmente bem-sucedido. A API respondeu, mas não retornou metadados de grounding. O recurso pode não estar funcionando corretamente.');
      }
    } catch (error) {
      // O _callGeminiApi já loga o erro, aqui podemos adicionar um log específico para a falha da validação
      this.logger.warn(`Teste de grounding falhou! Motivo: ${error.message}`);
      this.logger.warn('O recurso de grounding pode não funcionar corretamente. Verifique se sua chave API tem permissões adequadas e plano pago ativado.');
    }
  }

  // _buildGeminiRequestParts e _processGeminiResponse serão movidos para GeminiHelperService

  async generateResponse(
    messages: any[],
    systemPrompt: string,
    useWebSearch: boolean = false,
    model?: Model,
    modelConfig?: any,
    webSearchResults?: string, // Novo parâmetro
  ): Promise<string> {
    try {
      this.logger.debug(`Gerando resposta com ${messages.length} mensagens e prompt do sistema. Grounding: ${useWebSearch ? 'ativado' : 'desativado'}. WebSearchResults fornecidos: ${!!webSearchResults}`);
      
      if (!this.apiKey) {
        throw new InternalServerErrorException('Chave API Gemini não configurada para gerar resposta.');
      }

      let modelName = 'gemini-2.0-flash';
      let config = {
        temperature: 0.7,
        maxOutputTokens: 2048
      };
      
      if (model) {
        this.logger.log(`Usando modelo específico: ${model.name} (${model.provider})`);
        if (model.provider === 'gemini') {
          modelName = model.name;
        } else {
          this.logger.warn(`Provedor ${model.provider} ainda não implementado. Usando Gemini como fallback.`);
        }
        if (modelConfig) {
          config = modelConfig;
          this.logger.log(`Usando configuração personalizada do modelo: ${JSON.stringify(config)}`);
        } else if (model.defaultConfig) {
          config = model.defaultConfig;
          this.logger.log(`Usando configuração padrão do modelo: ${JSON.stringify(config)}`);
        }
      }

      const endpoint = `models/${modelName}:generateContent`;
      
      const now = new Date();
      const formattedDate = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let enhancedSystemPrompt = `${systemPrompt}\nAgora é ${formattedDate}.`;
      if (webSearchResults) {
        this.logger.log('Incorporando webSearchResults ao system prompt.');
        enhancedSystemPrompt += `\n\nContexto adicional da busca na web:\n${webSearchResults}`;
      }
      
      const metadata = {
        timestamp: now.toISOString(),
        model: modelName,
        messages_count: messages.length,
        grounding_used: useWebSearch,
      };

      const parts = await this.geminiHelperService.buildRequestParts(messages, enhancedSystemPrompt, metadata);
      
      const requestBody: any = {
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: config
      };

      // Se o grounding estiver ativado, adicionar a ferramenta google_search para Gemini 2.0
      if (useWebSearch) {
        // Para Gemini 2.0, a ferramenta de pesquisa é googleSearch
        requestBody.tools = [{ googleSearch: {} }];
        this.logger.log('Grounding com Google Search ativado para esta solicitação');
        this.logger.debug('Formato do requestBody com grounding:', JSON.stringify(requestBody.tools));
      }

      // Log da requisição já é feito em _callGeminiApi
      
      try {
        const data = await this._callGeminiApi(endpoint, 'POST', requestBody);

        if (!data || !data.candidates || !data.candidates.length) {
          this.logger.error('Resposta da API Gemini não contém candidatos:', JSON.stringify(data));
          throw new BadGatewayException('Resposta inválida da API Gemini: não contém candidatos.');
        }

        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
          this.logger.error('Estrutura de resposta da API Gemini inválida:', JSON.stringify(candidate));
          throw new BadGatewayException('Resposta inválida da API Gemini: estrutura de candidato malformada.');
        }

        if (data.usageMetadata) {
          this.logger.debug('Métricas de uso:', JSON.stringify({
            prompt_tokens: data.usageMetadata.promptTokenCount,
            response_tokens: data.usageMetadata.candidatesTokenCount,
            total_tokens: data.usageMetadata.totalTokenCount
          }));
        }
        
        return this.geminiHelperService.processApiResponse(candidate, useWebSearch);

      } catch (error) {
        // _callGeminiApi já loga o erro detalhado.
        // _callGeminiApi já loga o erro detalhado e lança uma HttpException.
        // Se o erro não for uma HttpException, convertemos para InternalServerErrorException.
        this.logger.error(`Falha ao gerar resposta via Gemini API: ${error.message}`, error.stack);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException(`Erro ao comunicar com a API Gemini: ${error.message}`);
      }
    } catch (error) {
      // Este catch captura erros que podem ocorrer antes da chamada à API, como a falta da chave.
      this.logger.error('Erro crítico ao preparar para gerar resposta:', error.message, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro interno ao preparar para gerar resposta: ${error.message}`);
    }
  }

  // Método para gerar títulos
  async generateConversationTitle(firstUserMessage: string): Promise<string> {
    this.logger.log(`Gerando título para a mensagem: "${firstUserMessage.substring(0, 50)}..."`);
    try {
      if (!this.apiKey) {
        throw new InternalServerErrorException('Chave API Gemini não configurada para gerar título.');
      }

      const endpoint = 'models/gemini-2.0-flash:generateContent';
      const prompt = `Por favor, crie um título curto e descritivo (máximo 3 palavras) para uma conversa que começa com esta mensagem: "${firstUserMessage}". Retorne apenas o título, sem aspas ou pontuação adicional, sem prefixos como 'Aqui estão algumas opções:' ou 'Título:'. Apenas o título em si.`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 30 },
      };

      const data = await this._callGeminiApi(endpoint, 'POST', requestBody);

      if (!data.candidates || !data.candidates.length || !data.candidates[0].content?.parts?.length) {
        this.logger.error('Resposta da API Gemini não contém candidatos ou partes de conteúdo válidas ao gerar título:', JSON.stringify(data));
        throw new BadGatewayException('Resposta inválida da API Gemini ao gerar título: estrutura malformada.');
      }

      let title = data.candidates[0].content.parts[0].text.trim();
      
      // Remover prefixos comuns
      const prefixesToRemove = [
        /^aqui estão algumas opções:?\s*/i,
        /^algumas sugestões:?\s*/i,
        /^sugestões:?\s*/i,
        /^opções:?\s*/i,
        /^título:?\s*/i,
        /^sugestão de título:?\s*/i
      ];
      
      for (const regex of prefixesToRemove) {
        title = title.replace(regex, '');
      }
      
      // Remover aspas se presentes
      title = title.replace(/^["']|["']$/g, '');
      
      // Garantir que o título comece com letra maiúscula
      if (title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      return title;
    } catch (error) {
      // _callGeminiApi já loga o erro e lança HttpException.
      this.logger.error(`Falha ao gerar título via Gemini API: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      // Para outros erros, retorna um título padrão ou lança uma exceção mais genérica.
      // Lançar exceção é mais consistente com o tratamento de erros.
      throw new InternalServerErrorException(`Erro ao gerar título via API Gemini: ${error.message}`);
    }
  }

  getProviderName(): string {
    return "gemini";
  }

  hasNativeGrounding(): boolean {
    this.logger.debug('Verificando capacidade de grounding nativo do GeminiService: true');
    return true; // Gemini tem grounding nativo
  }

  async listModels(): Promise<ProviderModelInfo[]> {
    this.logger.log('Listando modelos do Gemini...');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY não configurada. Não é possível listar modelos.');
      return [];
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000; // 5 segundos

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.log(`Tentativa ${attempt} de listar modelos do Gemini.`);
        // A verificação da apiKey e a construção da URL base são feitas em _callGeminiApi
        // Não é mais necessário buscar a apiKey aqui, pois _callGeminiApi usa this.apiKey
        const endpoint = 'models'; // Apenas o endpoint, sem a base URL ou a chave
        
        // this.logger.debug da chamada e da resposta já é feito dentro de _callGeminiApi
        const responseData = await this._callGeminiApi(endpoint, 'GET');
        
        if (!responseData || !responseData.models) {
          this.logger.error('Resposta da API Gemini não contém a propriedade "models" ou está vazia.');
          throw new BadGatewayException('Resposta inválida da API Gemini ao listar modelos: propriedade "models" ausente.');
        }

        const modelsFromApi = responseData.models;

        const providerModels: ProviderModelInfo[] = modelsFromApi.map((model: any) => {
          // Determinar capacidades
          const modelNameString = model.name || '';
          const cleanIdOrName = modelNameString.startsWith('models/') ? modelNameString.split('/')[1] : modelNameString;

          let currentInputModalities = model.inputModalities || ['text'];
          // Gemini 1.5 Flash e Pro são multimodais (texto, imagem)
          if (cleanIdOrName.includes('gemini-1.5-flash') || cleanIdOrName.includes('gemini-1.5-pro')) {
            if (!currentInputModalities.includes('image')) {
              currentInputModalities.push('image');
            }
          } else if (modelNameString.includes('vision')) { // Para modelos mais antigos como gemini-pro-vision
             if (!currentInputModalities.includes('image')) {
              currentInputModalities.push('image');
            }
          }


          const capabilities: ProviderModelInfo['capabilities'] = {
            vision: currentInputModalities.includes('image'), // Deriva 'vision' de inputModalities
            // Gemini 1.5 Flash e Pro suportam 'tools'. A API pode ter um campo explícito como `tool_config`.
            // Se não, inferimos pelo nome para os modelos conhecidos por suportarem.
            tool_use: !!model.tool_config || cleanIdOrName.includes('gemini-1.5-flash') || cleanIdOrName.includes('gemini-1.5-pro'),
            long_context: model.inputTokenLimit ? model.inputTokenLimit > 32000 : false,
            grounding: modelNameString === 'models/aqa' || modelNameString.includes('grounding'),
          };

          return {
            idOrName: cleanIdOrName,
            label: model.displayName || cleanIdOrName, // Usar cleanIdOrName como fallback para label
            description: model.description || 'N/A',
            provider: 'gemini',
            capabilities: capabilities,
            contextLength: model.inputTokenLimit || undefined,
            inputModalities: currentInputModalities,
            outputModalities: model.outputModalities || ['text'],
            raw: model, // Armazenar o objeto original do provedor
          };
        });
        
        this.logger.log(`Modelos do Gemini listados com sucesso na tentativa ${attempt}. Retornando ${providerModels.length} modelos.`);
        return providerModels;

      } catch (error) {
        // _callGeminiApi já loga o erro Axios ou outros erros de chamada.
        // A mensagem de erro de _callGeminiApi já inclui detalhes.
        this.logger.error(`Falha na tentativa ${attempt} de listar modelos do Gemini: ${error.message}`);
        
        if (attempt === MAX_RETRIES) {
          this.logger.error('Todas as tentativas de listar modelos do Gemini falharam.');
          // Lançar uma exceção aqui em vez de retornar array vazio
          throw new ServiceUnavailableException('Não foi possível listar os modelos do Gemini após múltiplas tentativas.');
        }
        await delay(RETRY_DELAY_MS);
      }
    }
    // Este ponto não deve ser alcançado se MAX_RETRIES > 0, mas para segurança:
    this.logger.error('Loop de retry concluído inesperadamente sem sucesso ou falha final.');
    return []; // Retorna array vazio
  }
}