import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from '../entities/model.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAIService {
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

      // Preparar mensagens para a API
      const inputContent = [];
      
      // Adicionar o prompt do sistema como mensagem de desenvolvedor
      inputContent.push({
        role: "developer",
        content: `${systemPrompt}\nAgora é ${formattedDate}.`
      });
      
      // Adicionar as mensagens anteriores
      for (const msg of messages) {
        const contentItems = [];
        contentItems.push({
          type: "input_text", 
          text: msg.content
        });
        
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
              contentItems.push({
                type: "input_image",
                image_url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
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
        inputContent.push({
          role: msg.isUser ? "user" : "assistant",
          content: contentItems
        });
      }

      // Preparar o corpo da requisição
      const requestBody: any = {
        model: modelName,
        input: inputContent
      };

      // Adicionar configurações do modelo
      if (config.temperature) {
        requestBody.temperature = config.temperature;
      }

      try {
        // Fazer a requisição para a API
        const response = await fetch('https://api.openai.com/v1/responses', {
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
        if (responseData.output_text) {
          return responseData.output_text;
        }
        
        // Tentar extrair a resposta da estrutura completa
        if (responseData.output && responseData.output.length > 0) {
          for (const item of responseData.output) {
            if (item.type === 'message' && 
                item.content && 
                item.content.length > 0) {
              for (const content of item.content) {
                if (content.type === 'output_text') {
                  return content.text;
                }
              }
            }
          }
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
      const model = 'gpt-4.1-mini';
      
      const requestBody: any = {
        model: model,
        input: "Gere um título curto e descritivo para esta conversa com base na primeira mensagem do usuário. O título deve ter no máximo 6 palavras. Retorne apenas o título, sem aspas ou pontuação adicional: " + content,
        temperature: 0.7
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
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
      
      if (data.output_text) {
        title = data.output_text.trim();
      }
      
      return title;
    } catch (error) {
      this.logger.error('Erro ao gerar título da conversa:', error);
      return 'Nova Conversa';
    }
  }
} 