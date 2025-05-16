import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Model } from '../entities/model.entity';

@Injectable()
export class GeminiService {
  private apiKey: string;
  private readonly logger = new Logger(GeminiService.name);

  constructor(
    private configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY não encontrada no arquivo .env. O serviço não funcionará corretamente.');
    } else {
      this.logger.log('Serviço Gemini inicializado com sucesso');
      this.validateGroundingCapability();
    }
  }

  private async validateGroundingCapability() {
    try {
      this.logger.log('Validando se a chave API tem permissões para usar grounding...');
      
      // Usar a versão mais recente do modelo Gemini
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      const queryParams = `?key=${this.apiKey}`;
      
      // Conteúdo para teste simples
      const requestBody = {
        contents: [
          {
            parts: [
              { text: "Quem é o atual presidente do Brasil?" }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100
        },
        // Ativar grounding para teste (formato correto para Gemini 2.0)
        tools: [{ googleSearch: {} }]
      };
      
      // Fazer uma requisição de teste
      const response = await fetch(`${apiUrl}${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Verificar o status da resposta
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Teste de grounding falhou! Status: ${response.status}. Motivo: ${errorText}`);
        this.logger.warn('O recurso de grounding pode não funcionar corretamente. Verifique se sua chave API tem permissões adequadas e plano pago ativado.');
      } else {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.groundingMetadata) {
          this.logger.log('Teste de grounding bem-sucedido! A chave API tem permissões para usar o recurso de grounding.');
        } else {
          this.logger.warn('Teste de grounding parcialmente bem-sucedido. A API respondeu, mas não retornou metadados de grounding. O recurso pode não estar funcionando corretamente.');
        }
      }
    } catch (error) {
      this.logger.error('Erro ao validar recurso de grounding:', error);
    }
  }

  async generateResponse(
    messages: any[], 
    systemPrompt: string, 
    useWebSearch: boolean = false,
    model?: Model,
    modelConfig?: any
  ): Promise<string> {
    try {
      this.logger.debug(`Gerando resposta com ${messages.length} mensagens e prompt do sistema. Grounding: ${useWebSearch ? 'ativado' : 'desativado'}`);
      
      // Garantir que temos uma chave API
      if (!this.apiKey) {
        throw new Error('Chave API Gemini não configurada');
      }

      // Determinar qual modelo usar
      let modelName = 'gemini-2.0-flash'; // Modelo padrão
      let config = {
        temperature: 0.7,
        maxOutputTokens: 2048
      };
      
      if (model) {
        // Se um modelo específico foi fornecido, usar ele
        this.logger.log(`Usando modelo específico: ${model.name} (${model.provider})`);
        
        if (model.provider === 'gemini') {
          modelName = model.name;
        } else {
          // Aqui você implementaria a lógica para outros provedores
          this.logger.warn(`Provedor ${model.provider} ainda não implementado. Usando Gemini como fallback.`);
          // No futuro: switch case para diferentes provedores
        }
        
        // Usar a configuração do modelo, se fornecida
        if (modelConfig) {
          config = modelConfig;
          this.logger.log(`Usando configuração personalizada do modelo: ${JSON.stringify(config)}`);
        } else if (model.defaultConfig) {
          config = model.defaultConfig;
          this.logger.log(`Usando configuração padrão do modelo: ${JSON.stringify(config)}`);
        }
      }

      // Usar o modelo selecionado
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      const queryParams = `?key=${this.apiKey}`;
      
      // Verificar se alguma mensagem tem imagem
      const hasImage = messages.some(msg => msg.imageUrl);
      
      // Obter data e hora atual formatadas
      const now = new Date();
      const formattedDate = now.toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      // Adicionar timestamp ao prompt do sistema
      const enhancedSystemPrompt = `${systemPrompt}\nAgora é ${formattedDate}.`;
      
      // Preparar o conteúdo para a API
      const parts = [];
      
      // Preparar metadados para log e contexto
      const metadata = {
        timestamp: now.toISOString(),
        model: modelName,
        messages_count: messages.length,
        grounding_used: useWebSearch,
      };
      
      // Adicionar metadados como comentário no prompt
      parts.push({ text: `<!-- Metadata: ${JSON.stringify(metadata)} -->\n\n` });
      
      // Adicionar o prompt do sistema como parte de texto
      parts.push({ text: `${enhancedSystemPrompt}\n\n` });
      
      // Adicionar as mensagens anteriores como texto
      for (const msg of messages) {
        // Adicionar a mensagem de texto
        const role = msg.isUser ? 'Usuário' : 'Assistente';
        // Adicionar timestamp à mensagem
        const msgTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR') : '';
        const timestampStr = msgTime ? ` [${msgTime}]` : '';
        
        parts.push({ text: `${role}${timestampStr}: ${msg.content}\n` });
        
        // Se tiver imagem e for uma mensagem do usuário, adicionar a imagem
        if (msg.imageUrl && msg.isUser) {
          try {
            // Log da URL da imagem
            this.logger.debug(`Tentando processar imagem com URL: ${msg.imageUrl}`);
            
            // Verificar se a imagem existe
            // A URL é /uploads/nome-do-arquivo, precisamos pegar apenas o nome do arquivo
            const imageName = msg.imageUrl.startsWith('/uploads/') 
              ? msg.imageUrl.substring('/uploads/'.length) 
              : path.basename(msg.imageUrl);
              
            this.logger.debug(`Nome do arquivo extraído: ${imageName}`);
            
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            const imagePath = path.join(uploadDir, imageName);
            
            this.logger.debug(`Caminho completo da imagem: ${imagePath}`);
            
            if (fs.existsSync(imagePath)) {
              this.logger.debug(`Imagem encontrada no caminho: ${imagePath}`);
              
              // Ler a imagem como base64
              const imageBuffer = fs.readFileSync(imagePath);
              const base64Image = imageBuffer.toString('base64');
              
              // Determinar o mimeType com base na extensão
              const ext = path.extname(imagePath).toLowerCase();
              let mimeType = 'image/jpeg'; // padrão
              
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              
              this.logger.debug(`Tipo MIME detectado: ${mimeType}, tamanho base64: ${base64Image.length}`);
              
              // Adicionar imagem como parte da mensagem
              parts.push({
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              });
              
              this.logger.debug(`Imagem adicionada com sucesso à requisição`);
            } else {
              this.logger.warn(`Imagem não encontrada no caminho: ${imagePath}`);
            }
          } catch (error) {
            this.logger.error('Erro ao processar imagem:', error);
          }
        }
      }
      
      // Adicionar a última solicitação (último turno)
      parts.push({ text: "Assistente: " });
      
      // Configuração base do request
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

      // Log da requisição para depuração
      this.logger.debug('URL da API:', apiUrl + queryParams);
      this.logger.debug('Request body (completo):', JSON.stringify(requestBody));
      
      try {
        const response = await fetch(`${apiUrl}${queryParams}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // Log do status da resposta
        this.logger.log(`Status da resposta: ${response.status} ${response.statusText}`);

        // Verificar status da resposta
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`API Gemini retornou status ${response.status}: ${errorText}`);
          return `Erro na API Gemini (${response.status}): ${errorText}`;
        }

        // Ler o corpo da resposta
        const responseText = await response.text();
        this.logger.debug('Resposta bruta:', responseText);
        
        // Tentar parsear a resposta como JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          this.logger.error('Falha ao parsear resposta JSON:', e);
          return `Erro ao processar resposta: ${responseText.substring(0, 200)}...`;
        }

        // Verificar a estrutura da resposta
        if (!data || !data.candidates || !data.candidates.length) {
          this.logger.error('Resposta da API Gemini não contém candidatos:', JSON.stringify(data));
          return `Resposta sem candidatos: ${JSON.stringify(data)}`;
        }

        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
          this.logger.error('Estrutura de resposta da API Gemini inválida:', JSON.stringify(candidate));
          return `Estrutura de resposta inválida: ${JSON.stringify(candidate)}`;
        }

        // Registrar informações de tokens e outras métricas
        if (data.usageMetadata) {
          this.logger.debug('Métricas de uso:', JSON.stringify({
            prompt_tokens: data.usageMetadata.promptTokenCount,
            response_tokens: data.usageMetadata.candidatesTokenCount,
            total_tokens: data.usageMetadata.totalTokenCount
          }));
        }

        // Verificar se temos metadados de embasamento (grounding)
        if (useWebSearch) {
          this.logger.log(`Verificando metadados de grounding na resposta. useWebSearch=${useWebSearch}, tem groundingMetadata=${!!candidate.groundingMetadata}`);
        }
        
        if (useWebSearch && candidate.groundingMetadata) {
          this.logger.log('Resposta contém metadados de grounding com Google Search');
          this.logger.debug('Metadados de grounding:', JSON.stringify(candidate.groundingMetadata));
          
          // Extrair o texto da resposta
          const finalResponseText = candidate.content.parts[0].text;
          
          try {
            // Criar uma resposta estruturada que inclui o texto e os metadados de grounding
            // Estrutura de acordo com a documentação do Gemini 2.0
            const responseWithGrounding = JSON.stringify({
              text: finalResponseText,
              groundingMetadata: {
                // Preservar o searchEntryPoint.renderedContent diretamente se disponível (contém o HTML das sugestões)
                searchEntryPoint: candidate.groundingMetadata.searchEntryPoint || null,
                
                // Usar webSearchQueries diretamente conforme documentação
                searchSuggestions: candidate.groundingMetadata.webSearchQueries || [],
                
                // Extrair as fontes do groundingChunks conforme documentação
                sources: (candidate.groundingMetadata.groundingChunks || []).map(chunk => ({
                  title: chunk.web?.title || 'Fonte',
                  uri: chunk.web?.uri || '#'
                })),
                
                // Citações e seus índices de groundingSupports
                citations: (candidate.groundingMetadata.groundingSupports || []).map(support => ({
                  text: support.segment?.text || '',
                  startIndex: support.segment?.startIndex || 0,
                  endIndex: support.segment?.endIndex || 0,
                  sources: support.groundingChunkIndices?.map(index => index) || [],
                  confidence: Array.isArray(support.confidenceScores) ? 
                              Math.max(...support.confidenceScores) : 
                              (support.confidence || 0)
                }))
              }
            });
            
            return responseWithGrounding;
          } catch (error) {
            this.logger.error('Erro ao processar metadados de grounding:', error);
            return finalResponseText;
          }
        } else {
          // Resposta normal sem embasamento
          const finalResponseText = candidate.content.parts[0].text;
          this.logger.debug('Texto de resposta extraído com sucesso');
          return finalResponseText;
        }
      } catch (fetchError) {
        this.logger.error('Erro durante a requisição fetch:', fetchError);
        return `Erro de rede: ${fetchError.message}`;
      }
    } catch (error) {
      this.logger.error('Erro ao gerar resposta:', error);
      throw error;
    }
  }

  // Método para gerar títulos
  async generateConversationTitle(firstUserMessage: string): Promise<string> {
    this.logger.log(`Gerando título para a mensagem: "${firstUserMessage.substring(0, 50)}..."`);
    try {
      if (!this.apiKey) {
        throw new Error('Chave API Gemini não configurada');
      }

      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      const queryParams = `?key=${this.apiKey}`;

      const prompt = `Por favor, crie um título curto e descritivo (máximo 5 palavras) para uma conversa que começa com esta mensagem: "${firstUserMessage}"`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 30
        }
      };

      const response = await fetch(`${apiUrl}${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API Gemini retornou status ${response.status} ao gerar título: ${errorText}`);
        return 'Nova Conversa';
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates.length || !data.candidates[0].content.parts.length) {
        this.logger.error('Resposta da API Gemini não contém candidatos ao gerar título');
        return 'Nova Conversa';
      }

      const title = data.candidates[0].content.parts[0].text.trim();
      // Remover aspas se presentes (às vezes o modelo inclui aspas)
      return title.replace(/^["']|["']$/g, '');
    } catch (error) {
      this.logger.error('Erro ao gerar título:', error);
      return 'Nova Conversa';
    }
  }
}