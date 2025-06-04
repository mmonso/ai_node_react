import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from '../entities/model.entity';
import * as fs from 'fs';
import * as path from 'path';
import { AIServiceInterface } from '../models/ai-service.interface';
import { ProviderApiService, ProviderModelInfo } from '../models/provider-api.service.interface';
import { ToolsService, obterDataHoraAtualToolDefinition, criarEventoCalendarioToolDefinition, listarEventosCalendarioToolDefinition } from '../tools/tools.service';
import { CalendarService } from '../calendar/calendar.service';
import { CreateEventDto } from '../calendar/dto/create-event.dto';
import { AgentsService } from '../agents/agents.service'; // Importar AgentsService

@Injectable()
export class OpenAIService implements AIServiceInterface, ProviderApiService {
  private apiKey: string;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private configService: ConfigService,
    private toolsService: ToolsService,
    private calendarService: CalendarService,
    @Inject(forwardRef(() => AgentsService))
    private agentsService: AgentsService, // Injetar AgentsService com forwardRef
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY não encontrada no arquivo .env. O serviço não funcionará corretamente.');
    } else {
      this.logger.log('Serviço OpenAI inicializado com sucesso');
    }
  }

  async generateResponse(
    messages: any[],
    systemPrompt: string,
    useWebSearch: boolean = false,
    model?: Model,
    modelConfig?: any,
    currentConversationId?: string, // ID da conversa atual que originou a chamada
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave API OpenAI não configurada');
      }

      const mainAgent = await this.agentsService.getMainAgent();
      const mainAgentConversationId = mainAgent?.conversationId;

      let modelName = 'gpt-4.1';
      let config = {
        temperature: 0.7,
        maxOutputTokens: 2048
      };
      
      if (model) {
        this.logger.log(`Usando modelo específico: ${model.name} (${model.provider})`);
        modelName = model.name;
        if (modelConfig) {
          config = modelConfig;
          this.logger.log(`Usando configuração personalizada do modelo: ${JSON.stringify(config)}`);
        } else if (model.defaultConfig) {
          config = model.defaultConfig;
          this.logger.log(`Usando configuração padrão do modelo: ${JSON.stringify(config)}`);
        }
      }

      // Preparar o corpo da requisição
      const initialRequestBody: any = {
        model: modelName,
        messages: [], // Será preenchido abaixo
        tools: [obterDataHoraAtualToolDefinition, criarEventoCalendarioToolDefinition, listarEventosCalendarioToolDefinition],
        tool_choice: "auto",
      };

      this.logger.debug(`Gerando resposta para Conversa com ${messages.length} mensagens e prompt do sistema.`);
      initialRequestBody.messages.push({
        role: "system",
        content: systemPrompt,
      });

      // Adicionar as mensagens anteriores no formato correto
      for (const msg of messages) {
        const messageObj: any = {
          role: msg.isUser ? "user" : "assistant",
          content: [] // Inicializa como array para suportar conteúdo multimodal
        };
        
        let textContent = '';
        if (msg.content) {
          if (typeof msg.content === 'string') {
            textContent = msg.content;
          }
        }

        if (textContent) {
           messageObj.content.push({ type: "text", text: textContent });
        }
        
        if (msg.imageUrl && msg.isUser) {
          try {
            const imageName = msg.imageUrl.startsWith('/uploads/')
              ? msg.imageUrl.substring('/uploads/'.length)
              : path.basename(msg.imageUrl);
            this.logger.debug(`Nome do arquivo extraído: ${imageName}`);
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            const imagePath = path.join(uploadDir, imageName);
            this.logger.debug(`Caminho completo da imagem: ${imagePath}`);
            if (fs.existsSync(imagePath)) {
              this.logger.debug(`Imagem encontrada no caminho: ${imagePath}`);
              const imageBuffer = fs.readFileSync(imagePath);
              const base64Image = imageBuffer.toString('base64');
              const ext = path.extname(imagePath).toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              this.logger.debug(`Tipo MIME detectado: ${mimeType}, tamanho base64: ${base64Image.length}`);
              messageObj.content.push({
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              });
              this.logger.debug(`Imagem adicionada com sucesso à requisição`);
            } else {
              this.logger.warn(`Imagem não encontrada no caminho: ${imagePath}`);
            }
          } catch (error) {
            this.logger.error('Erro ao processar imagem:', error);
          }
        }
        // Se content for apenas uma string vazia e não houver imagem,
        // a API pode rejeitar. Garantir que 'content' não seja uma array vazia.
        if (messageObj.content.length === 0 && !textContent) {
            // Se não há texto nem imagem, e o papel é 'user', a API pode não gostar.
            // Se for 'assistant', pode ser uma chamada de ferramenta sem texto.
            // Por segurança, se for user e content estiver vazio, enviamos um placeholder ou logamos.
            // No entanto, o loop `for (const msg of messages)` já filtra mensagens sem `msg.content` (string)
            // ou sem `msg.imageUrl`.
            // Se messageObj.content ainda estiver vazio aqui, significa que msg.content não era uma string
            // e não havia imageUrl. Isso deve ser tratado.
            // A lógica atual já faz com que, se msg.content não for string, ele não é adicionado.
            // Se for string vazia, é adicionado como {type: "text", text: ""}.
            // Se for uma array vazia e não houver imagem, a API pode reclamar.
            // A OpenAI espera que 'content' seja uma string ou uma array de partes.
            // Se for uma array vazia, é problemático.
            // A lógica atual garante que, se houver textContent, ele é adicionado.
            // Se houver imageUrl, ele é adicionado.
            // Se ambos estiverem vazios, messageObj.content será [].
            // Vamos garantir que, se for uma array vazia, enviamos uma string vazia como conteúdo.
            if(messageObj.content.length === 0) {
                messageObj.content = ""; // Fallback para string vazia se array de partes estiver vazia
            }
        }
        initialRequestBody.messages.push(messageObj);
      }

      // Adicionar configurações do modelo
      if (config.temperature) {
        initialRequestBody.temperature = config.temperature;
      }
      if (config.maxOutputTokens) {
        initialRequestBody.max_tokens = config.maxOutputTokens;
      }

      // Manter uma cópia das mensagens para a segunda chamada, se necessário
      const messagesForSecondCall = JSON.parse(JSON.stringify(initialRequestBody.messages));

      try {
        this.logger.debug('Enviando primeira requisição para OpenAI:', JSON.stringify(initialRequestBody));
        let response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(initialRequestBody),
        });

        this.logger.log(`Status da primeira resposta: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`API OpenAI (1ª chamada) retornou status ${response.status}: ${errorText}`);
          return `Erro na API OpenAI (${response.status}): ${errorText}`;
        }

        let responseData = await response.json();
        this.logger.debug('Resposta da primeira chamada OpenAI:', JSON.stringify(responseData));

        const choice = responseData.choices && responseData.choices[0];
        const messageFromAI = choice && choice.message;

        if (messageFromAI && messageFromAI.tool_calls) {
          this.logger.log('IA solicitou chamada de ferramenta(s).');
          // Adicionar a resposta da IA (com tool_calls) ao histórico para a segunda chamada
          messagesForSecondCall.push(messageFromAI);

          for (const toolCall of messageFromAI.tool_calls) {
            let functionResult = '';
            let functionName = toolCall.function ? toolCall.function.name : 'Nome da função não encontrado';

            try {
              if (functionName === "obterDataHoraAtual") {
                this.logger.log(`Executando ferramenta: ${functionName}`);
                functionResult = this.toolsService.obterDataHoraAtual();
                this.logger.log(`Resultado da ferramenta ${functionName}: ${functionResult}`);
              } else if (functionName === "criar_evento_calendario") {
                this.logger.log(`Executando ferramenta: ${functionName} para conversationId: ${currentConversationId}`);
                const args = JSON.parse(toolCall.function.arguments);

                if (!args.title || !args.startTime || !args.endTime) {
                  let missingArgs = [];
                  if (!args.title) missingArgs.push("title");
                  if (!args.startTime) missingArgs.push("startTime");
                  if (!args.endTime) missingArgs.push("endTime");
                  throw new Error(`Argumentos inválidos para criar_evento_calendario: ${missingArgs.join(', ')} são obrigatórios.`);
                }

                if (isNaN(new Date(args.startTime).getTime()) || isNaN(new Date(args.endTime).getTime())) {
                  throw new Error("Argumentos inválidos para criar_evento_calendario: startTime e endTime devem ser datas válidas.");
                }

                const createEventDto: CreateEventDto = {
                  title: args.title,
                  startTime: new Date(args.startTime),
                  endTime: new Date(args.endTime),
                  description: args.description,
                  // conversationId não vem mais da IA para esta ferramenta.
                  // Será definido abaixo se for uma chamada do MainAgent.
                };

                if (currentConversationId && mainAgentConversationId && currentConversationId === mainAgentConversationId) {
                  this.logger.log(`Chamada de criar_evento_calendario originada pelo MainAgent. Usando conversationId: ${mainAgentConversationId}`);
                  createEventDto.conversationId = mainAgentConversationId;
                } else {
                  // Se não for o MainAgent, e a ferramenta agora não aceita conversationId da IA,
                  // o evento será criado sem conversationId, a menos que uma lógica diferente seja necessária.
                  // Para este cenário, o evento do MainAgent *sempre* terá seu conversationId.
                  // Outras chamadas (se houver) não associarão um conversationId através desta lógica.
                  this.logger.log(`Chamada de criar_evento_calendario não originada pelo MainAgent ou MainAgent não configurado. Evento será criado sem conversationId via esta lógica.`);
                }
                
                const event = await this.calendarService.createEvent(createEventDto);
                functionResult = JSON.stringify({ success: true, event });
                this.logger.log(`Resultado da ferramenta ${functionName}: ${functionResult}`);
              } else if (functionName === "listar_eventos_calendario") {
                this.logger.log(`Executando ferramenta: ${functionName} para conversationId: ${currentConversationId}`);
                const args = JSON.parse(toolCall.function.arguments);

                if (args.startDate && isNaN(new Date(args.startDate).getTime())) {
                  throw new Error("Argumento inválido para listar_eventos_calendario: startDate deve ser uma data válida se fornecido.");
                }
                if (args.endDate && isNaN(new Date(args.endDate).getTime())) {
                  throw new Error("Argumento inválido para listar_eventos_calendario: endDate deve ser uma data válida se fornecido.");
                }
                
                let conversationIdToFilter: string | undefined = undefined;
                if (currentConversationId && mainAgentConversationId && currentConversationId === mainAgentConversationId) {
                  this.logger.log(`Chamada de listar_eventos_calendario originada pelo MainAgent. Filtrando por conversationId: ${mainAgentConversationId}`);
                  conversationIdToFilter = mainAgentConversationId;
                } else {
                  // Se não for o MainAgent, a ferramenta agora não aceita conversationId da IA para filtro.
                  // Portanto, listará eventos com base apenas nas datas, para todas as conversas,
                  // ou nenhum se as datas não forem fornecidas (comportamento de findEventsByCriteria).
                  this.logger.log(`Chamada de listar_eventos_calendario não originada pelo MainAgent ou MainAgent não configurado. Não filtrará por conversationId específico via esta lógica.`);
                }

                const events = await this.calendarService.findEventsByCriteria(
                  args.startDate,
                  args.endDate,
                  conversationIdToFilter, // Usar o ID do MainAgent se aplicável
                );
                if (events.length > 0) {
                  functionResult = JSON.stringify({ success: true, events });
                } else {
                  functionResult = JSON.stringify({ success: true, message: "Nenhum evento encontrado para os critérios fornecidos." });
                }
                this.logger.log(`Resultado da ferramenta ${functionName}: ${functionResult}`);
              } else {
                this.logger.warn(`Ferramenta solicitada desconhecida ou não implementada: ${functionName}`);
                functionResult = `Erro: Ferramenta ${functionName} não encontrada ou não suportada.`;
              }
            } catch (error) {
              this.logger.error(`Erro ao executar a ferramenta ${functionName}: ${error.message}`, error.stack);
              functionResult = JSON.stringify({ success: false, error: `Erro ao executar ${functionName}: ${error.message}` });
            }
            
            messagesForSecondCall.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: functionResult,
            });
          }

          // Preparar a segunda requisição
          const secondRequestBody: any = {
            model: initialRequestBody.model,
            messages: messagesForSecondCall,
          };
          if (initialRequestBody.temperature) secondRequestBody.temperature = initialRequestBody.temperature;
          if (initialRequestBody.max_tokens) secondRequestBody.max_tokens = initialRequestBody.max_tokens;
          
          this.logger.debug('Enviando segunda requisição para OpenAI com resultado da ferramenta:', JSON.stringify(secondRequestBody));
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(secondRequestBody),
          });

          this.logger.log(`Status da segunda resposta: ${response.status} ${response.statusText}`);
          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`API OpenAI (2ª chamada) retornou status ${response.status}: ${errorText}`);
            return `Erro na API OpenAI (${response.status}) após chamada de ferramenta: ${errorText}`;
          }
          responseData = await response.json();
          this.logger.debug('Resposta da segunda chamada OpenAI:', JSON.stringify(responseData));
        }
        
        // Extrair o texto da resposta final (seja da primeira ou segunda chamada)
        if (responseData.choices && responseData.choices.length > 0 &&
            responseData.choices[0].message && responseData.choices[0].message.content) {
          
          let finalResponseText = responseData.choices[0].message.content;
          
          const timestampRegexes = [
            /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]\s*/,
            /^\s*\d{1,2}:\d{2}(:\d{2})?\s*/,
            /^\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*/,
            /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s*/
          ];
          for (const regex of timestampRegexes) {
            if (regex.test(finalResponseText)) {
              finalResponseText = finalResponseText.replace(regex, '');
              break;
            }
          }
          const assistantPrefixRegex = /^\s*(Assistente(\s*\[\d{1,2}:\d{2}(:\d{2})?\])?\s*:)\s*/;
          if (assistantPrefixRegex.test(finalResponseText)) {
            finalResponseText = finalResponseText.replace(assistantPrefixRegex, '');
          }
          return finalResponseText;
        }
        
        return `Resposta não processada: ${JSON.stringify(responseData)}`;
      } catch (fetchError) {
        this.logger.error('Erro durante a requisição fetch:', fetchError);
        return `Erro de rede: ${fetchError.message}`;
      }
    } catch (error) {
      this.logger.error('Erro ao gerar resposta:', error);
      throw error;
    }
  }

  async generateConversationTitle(content: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave API OpenAI não configurada');
      }

      // Usar um modelo mais simples para geração de título
      const model = 'gpt-4o-mini';
      
      const requestBody: any = {
        model: model,
        messages: [{
          role: "user",
          content: "Gere um título curto e descritivo para esta conversa com base na primeira mensagem do usuário. O título deve ter no máximo 3 palavras. Retorne apenas o título, sem aspas ou pontuação adicional, sem prefixos como 'Aqui estão algumas opções:' ou 'Título:'. Apenas o título em si: " + content
        }],
        temperature: 0.7,
        max_tokens: 20
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Tenta extrair o título
      let title = 'Nova Conversa';
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        title = data.choices[0].message.content.trim();
        
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
      }
      
      return title;
    } catch (error) {
      this.logger.error('Erro ao gerar título da conversa:', error);
      return 'Nova Conversa';
    }
  }

  getProviderName(): string {
    return "openai";
  }

  async listModels(): Promise<ProviderModelInfo[]> {
    this.logger.log('Listando modelos do OpenAI...');
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY não configurada. Não é possível listar modelos.');
      return [];
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000; // 5 segundos

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.log(`Tentativa ${attempt} de listar modelos do OpenAI.`);
        
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Erro ao listar modelos OpenAI na tentativa ${attempt}: ${response.status} - ${errorText}`);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data || !data.data) {
          this.logger.error('Resposta da API OpenAI não contém a propriedade "data" ou está vazia.');
          throw new Error('Resposta inválida da API OpenAI: propriedade "data" ausente.');
        }

        const modelsFromApi = data.data;

        const providerModels: ProviderModelInfo[] = modelsFromApi.map((model: any) => {
          const id = model.id;
          let label = id; // Default label to id
          const capabilities: Record<string, any> = {};
          const inputModalities: string[] = ['text'];
          let contextLength: number | undefined = undefined;

          // Heurísticas para labels e capabilities baseadas no ID do modelo
          if (id.includes('gpt-4o')) {
            label = 'GPT-4o';
            capabilities.vision = true;
            capabilities.tool_use = true; // GPT-4o suporta tools
            if (!inputModalities.includes('image')) inputModalities.push('image');
            contextLength = 128000; // Comum para GPT-4o
          } else if (id.includes('gpt-4-turbo')) {
            label = id.includes('preview') ? 'GPT-4 Turbo Preview' : 'GPT-4 Turbo';
            capabilities.vision = true;
            capabilities.tool_use = true;
            if (!inputModalities.includes('image')) inputModalities.push('image');
            contextLength = 128000; // Comum para GPT-4 Turbo
          } else if (id.includes('gpt-4')) {
            label = 'GPT-4';
            capabilities.tool_use = true; // GPT-4 base geralmente suporta tools
            // Visão pode depender da versão específica do GPT-4
            if (id.includes('vision')) {
                 capabilities.vision = true;
                 if (!inputModalities.includes('image')) inputModalities.push('image');
            }
            contextLength = id.includes('32k') ? 32768 : 8192; // Comum para GPT-4
          } else if (id.includes('gpt-3.5-turbo')) {
            label = 'GPT-3.5 Turbo';
            capabilities.tool_use = true;
            contextLength = id.includes('16k') ? 16384 : (id.includes('0125') ? 16385 : 4096); // Variações do 3.5
          } else if (id.startsWith('text-embedding')) {
            label = id.replace('text-embedding-', 'Embedding ').replace('-002', ' v2');
            capabilities.embedding = true;
          } else if (id.startsWith('text-davinci')) {
            label = 'Davinci (Legacy)';
          } else if (id.startsWith('ada') || id.startsWith('babbage') || id.startsWith('curie')) {
            label = id.charAt(0).toUpperCase() + id.slice(1) + ' (Legacy)';
          }
          // Adicionar mais heurísticas conforme necessário

          return {
            idOrName: id,
            label: label,
            description: `Owned by: ${model.owned_by}. Object: ${model.object}.`,
            capabilities: capabilities,
            inputModalities: inputModalities,
            outputModalities: ['text'], // Assumindo texto como saída padrão
            contextLength: contextLength,
            raw: model,
          };
        });
        
        this.logger.log(`Modelos do OpenAI listados com sucesso na tentativa ${attempt}. Retornando ${providerModels.length} modelos.`);
        return providerModels;

      } catch (error) {
        this.logger.error(`Falha na tentativa ${attempt} de listar modelos do OpenAI: ${error.message}`);
        if (attempt === MAX_RETRIES) {
          this.logger.error('Todas as tentativas de listar modelos do OpenAI falharam.');
          return Promise.resolve([]);
        }
        await delay(RETRY_DELAY_MS);
      }
    }
    this.logger.error('Loop de retry do OpenAI concluído inesperadamente sem sucesso ou falha final.');
    return Promise.resolve([]);
  }
}