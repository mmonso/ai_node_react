import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from '../entities/model.entity';
import * as fs from 'fs';
import * as path from 'path';
import { AIServiceInterface } from '../models/ai-service.interface';

@Injectable()
export class OpenAIService implements AIServiceInterface {
  private apiKey: string;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private configService: ConfigService
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
    modelConfig?: any
  ): Promise<string> {
    try {
      this.logger.debug(`Gerando resposta com ${messages.length} mensagens e prompt do sistema usando OpenAI.`);
      
      // Garantir que temos uma chave API
      if (!this.apiKey) {
        throw new Error('Chave API OpenAI não configurada');
      }

      // Determinar qual modelo usar
      let modelName = 'gpt-4.1'; // Modelo padrão
      let config = {
        temperature: 0.7,
        maxOutputTokens: 2048
      };
      
      if (model) {
        // Se um modelo específico foi fornecido, usar ele
        this.logger.log(`Usando modelo específico: ${model.name} (${model.provider})`);
        modelName = model.name;
        
        // Usar a configuração do modelo, se fornecida
        if (modelConfig) {
          config = modelConfig;
          this.logger.log(`Usando configuração personalizada do modelo: ${JSON.stringify(config)}`);
        } else if (model.defaultConfig) {
          config = model.defaultConfig;
          this.logger.log(`Usando configuração padrão do modelo: ${JSON.stringify(config)}`);
        }
      }

      // Obter data e hora atual formatadas
      const now = new Date();
      const formattedDate = now.toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });

      // Preparar o corpo da requisição
      const requestBody: any = {
        model: modelName,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\nAgora é ${formattedDate}.`
          }
        ]
      };

      // Adicionar as mensagens anteriores no formato correto
      for (const msg of messages) {
        const messageObj: any = {
          role: msg.isUser ? "user" : "assistant",
          content: []
        };
        
        // Adicionar conteúdo de texto
        if (msg.content) {
          if (typeof msg.content === 'string') {
            if (msg.imageUrl && msg.isUser) {
              // Se tiver imagem, será adicionada como array
              messageObj.content = [{ type: "text", text: msg.content }];
            } else {
              // Se for só texto, pode ser string direta
              messageObj.content = msg.content;
            }
          }
        }
        
        // Se tiver imagem e for uma mensagem do usuário, adicionar a imagem
        if (msg.imageUrl && msg.isUser) {
          try {
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
              messageObj.content.push({
                type: "image_url",
                image_url: `data:${mimeType};base64,${base64Image}`
              });
              
              this.logger.debug(`Imagem adicionada com sucesso à requisição`);
            } else {
              this.logger.warn(`Imagem não encontrada no caminho: ${imagePath}`);
            }
          } catch (error) {
            this.logger.error('Erro ao processar imagem:', error);
          }
        }
        
        // Adicionar à lista de mensagens
        requestBody.messages.push(messageObj);
      }

      // Adicionar configurações do modelo
      if (config.temperature) {
        requestBody.temperature = config.temperature;
      }
      
      if (config.maxOutputTokens) {
        requestBody.max_tokens = config.maxOutputTokens;
      }

      try {
        // Fazer a requisição para a API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        // Log do status da resposta
        this.logger.log(`Status da resposta: ${response.status} ${response.statusText}`);

        // Verificar status da resposta
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`API OpenAI retornou status ${response.status}: ${errorText}`);
          return `Erro na API OpenAI (${response.status}): ${errorText}`;
        }

        // Ler o corpo da resposta
        const responseData = await response.json();
        
        // Extrair o texto da resposta
        if (responseData.choices && responseData.choices.length > 0 && 
            responseData.choices[0].message && responseData.choices[0].message.content) {
          
          let finalResponseText = responseData.choices[0].message.content;
          
          // Processar a resposta para remover possíveis timestamps no início
          const timestampRegexes = [
            /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]\s*/,                      // [HH:MM] ou [HH:MM:SS]
            /^\s*\d{1,2}:\d{2}(:\d{2})?\s*/,                          // HH:MM ou HH:MM:SS
            /^\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*/,                      // (HH:MM) ou (HH:MM:SS)
            /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s*/     // DD/MM/YYYY HH:MM ou DD/MM/YYYY HH:MM:SS
          ];
          
          for (const regex of timestampRegexes) {
            if (regex.test(finalResponseText)) {
              finalResponseText = finalResponseText.replace(regex, '');
              break; // Parar após encontrar o primeiro formato
            }
          }
          
          // Verificar se a resposta começa com "Assistente:" ou "Assistente [HH:MM]:"
          const assistantPrefixRegex = /^\s*(Assistente(\s*\[\d{1,2}:\d{2}(:\d{2})?\])?\s*:)\s*/;
          if (assistantPrefixRegex.test(finalResponseText)) {
            finalResponseText = finalResponseText.replace(assistantPrefixRegex, '');
          }
          
          return finalResponseText;
        }
        
        // Se não conseguir extrair a resposta, retornar o JSON completo
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
} 