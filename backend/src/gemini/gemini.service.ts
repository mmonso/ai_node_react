import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GeminiService {
  private apiKey: string;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY não encontrada no arquivo .env. O serviço não funcionará corretamente.');
    } else {
      this.logger.log('Serviço Gemini inicializado com sucesso');
    }
  }

  async generateResponse(messages: any[], systemPrompt: string): Promise<string> {
    try {
      this.logger.debug(`Gerando resposta com ${messages.length} mensagens e prompt do sistema`);
      
      // Garantir que temos uma chave API
      if (!this.apiKey) {
        throw new Error('Chave API Gemini não configurada');
      }

      // Usar a URL correta da API Gemini conforme documentação atual
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
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
        model: "gemini-2.0-flash",
        messages_count: messages.length
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
      
      // Criar o objeto de requisição
      const requestBody = {
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      };

      // Log da requisição para depuração
      this.logger.debug('URL da API:', apiUrl + queryParams);
      this.logger.debug('Request body (resumido):', JSON.stringify(requestBody).substring(0, 500) + '...');
      
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

        const finalResponseText = candidate.content.parts[0].text;
        this.logger.debug('Texto de resposta extraído com sucesso');
        return finalResponseText;
      } catch (fetchError) {
        this.logger.error('Erro durante a requisição fetch:', fetchError);
        return `Erro de rede: ${fetchError.message}`;
      }
    } catch (error) {
      // Em vez de lançar uma exceção genérica, retornar uma mensagem de erro específica
      this.logger.error('Erro ao gerar resposta:', error);
      return `Erro no serviço Gemini: ${error.message}`;
    }
  }

  // Novo método para gerar títulos
  async generateConversationTitle(firstUserMessage: string): Promise<string> {
    this.logger.log(`Gerando título para a mensagem: "${firstUserMessage.substring(0, 50)}..."`);
    try {
      if (!this.apiKey) {
        throw new Error('Chave API Gemini não configurada');
      }

      // Usar um modelo rápido e endpoint adequado para geração simples
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      const queryParams = `?key=${this.apiKey}`;

      const prompt = `Gere um título curto e descritivo (máximo 5 palavras, sem aspas) para uma conversa de chat que começa com a seguinte mensagem do usuário:\n\n"${firstUserMessage}"\n\nTítulo:`;

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5, // Menos criativo para títulos
          maxOutputTokens: 20, // Suficiente para um título curto
          topP: 1,
          topK: 1,
        },
        // Safety settings podem ser omitidos para tarefas simples como esta, ou usar padrões
      };

      const response = await fetch(`${apiUrl}${queryParams}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API Gemini (gerar título) retornou status ${response.status}: ${errorText}`);
        throw new Error(`Erro na API Gemini (${response.status})`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates.length || !data.candidates[0].content?.parts?.[0]?.text) {
         this.logger.error('Resposta da API Gemini (gerar título) inválida:', JSON.stringify(data));
         throw new Error('Resposta inválida da API Gemini');
      }

      let title = data.candidates[0].content.parts[0].text.trim();

      // Remove aspas se a IA incluir
      if (title.startsWith('"') && title.endsWith('"')) {
        title = title.substring(1, title.length - 1);
      }
      
      // Limita a um tamanho razoável caso a IA ignore o limite de palavras
      title = title.split(' ').slice(0, 7).join(' ');

      this.logger.log(`Título gerado: "${title}"`);
      return title || 'Conversa Iniciada'; // Fallback
    } catch (error) {
      this.logger.error('Erro ao gerar título da conversa:', error);
      return 'Nova Conversa'; // Retorna o padrão em caso de erro
    }
  }
}