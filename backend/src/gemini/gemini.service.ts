import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
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
      const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
      const queryParams = `?key=${this.apiKey}`;
      
      // Verificar se alguma mensagem tem imagem
      const hasImage = messages.some(msg => msg.imageUrl);
      
      // Preparar o conteúdo para a API
      const parts = [];
      
      // Adicionar o prompt do sistema como parte de texto
      parts.push({ text: `${systemPrompt}\n\n` });
      
      // Adicionar as mensagens anteriores como texto
      for (const msg of messages) {
        // Adicionar a mensagem de texto
        const role = msg.isUser ? 'Usuário' : 'Assistente';
        parts.push({ text: `${role}: ${msg.content}\n` });
        
        // Se tiver imagem e for uma mensagem do usuário, adicionar a imagem
        if (msg.imageUrl && msg.isUser) {
          try {
            // Verificar se a imagem existe
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            const imagePath = path.join(uploadDir, path.basename(msg.imageUrl));
            
            if (fs.existsSync(imagePath)) {
              // Ler a imagem como base64
              const imageBuffer = fs.readFileSync(imagePath);
              const base64Image = imageBuffer.toString('base64');
              
              // Determinar o mimeType com base na extensão
              const ext = path.extname(imagePath).toLowerCase();
              let mimeType = 'image/jpeg'; // padrão
              
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              
              // Adicionar imagem como parte da mensagem
              parts.push({
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              });
              
              this.logger.debug(`Imagem adicionada: ${imagePath}`);
            } else {
              this.logger.warn(`Imagem não encontrada: ${imagePath}`);
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

  generateResponseStream(messages: any[], systemPrompt: string): Observable<string> {
    return new Observable<string>(observer => {
      // Função assíncrona para lidar com o streaming
      const processStream = async () => {
        try {
          this.logger.debug(`Iniciando stream com ${messages.length} mensagens e prompt do sistema`);

          if (!this.apiKey) {
            throw new Error('Chave API Gemini não configurada');
          }

          // Endpoint para streaming
          const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent';
          const queryParams = `?key=${this.apiKey}&alt=sse`; // Usar Server-Sent Events

          // Preparar o conteúdo para a API no formato 'contents' esperado
          const contents = [];

          // Adicionar prompt do sistema (se houver) como primeiro turno do usuário ou instrução inicial
          // A API Gemini geralmente lida melhor com o system prompt como parte do primeiro turno 'user'
          // ou através de um campo 'systemInstruction' (se disponível e suportado pelo modelo/endpoint).
          // Vamos integrá-lo ao primeiro turno do usuário por enquanto.
          let firstUserMessageContent = systemPrompt ? `${systemPrompt}\n\n` : '';

          for (const msg of messages) {
            const role = msg.isUser ? 'user' : 'model';
            let messageParts = [];

            // Se for a primeira mensagem do usuário, adiciona o system prompt
            if (role === 'user' && contents.length === 0) {
               messageParts.push({ text: firstUserMessageContent + msg.content });
               firstUserMessageContent = ''; // Limpa para não adicionar novamente
            } else {
               messageParts.push({ text: msg.content });
            }

            // TODO: Adicionar lógica de imagem se necessário para streaming
            if (msg.imageUrl && msg.isUser) {
               this.logger.warn('Processamento de imagem no streaming ainda não implementado.');
               // A lógica de imagem precisaria ser adaptada aqui, adicionando a parte da imagem
               // ao array messageParts. Ex: messageParts.push({ inline_data: { ... } });
            }

            contents.push({ role: role, parts: messageParts });
          }

          // Se o system prompt não foi adicionado a nenhuma mensagem de usuário (conversa vazia?)
          // Isso não deveria acontecer no fluxo normal, mas por segurança:
          if (firstUserMessageContent && contents.length === 0) {
             contents.push({ role: 'user', parts: [{ text: firstUserMessageContent }] });
          }

          const requestBody = {
            contents: contents, // Usar o array 'contents' formatado corretamente
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 800,
              topK: 40,
            }
          };
          
          this.logger.debug('URL da API Stream:', apiUrl + queryParams);
          this.logger.debug('Request body Stream (resumido):', JSON.stringify(requestBody).substring(0, 500) + '...');

          this.logger.debug('Iniciando fetch para API Stream...');
          const response = await fetch(`${apiUrl}${queryParams}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          this.logger.debug(`Fetch para API Stream concluído. Status OK: ${response.ok}, Status: ${response.status}`);
          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`API Gemini Stream retornou status ${response.status}: ${errorText}`);
            throw new Error(`Erro na API Gemini Stream (${response.status}): ${errorText}`);
          }

          if (!response.body) {
            throw new Error('Resposta da API Stream não contém corpo (body)');
          }

          this.logger.debug('Iniciando processamento do stream SSE...');
          // Processar o stream SSE
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

          while (true) {
            this.logger.debug('Lendo próximo chunk do stream...');
            const { value, done } = await reader.read();
            this.logger.debug(`Chunk lido. Done: ${done}, Value (início): ${value?.substring(0, 100)}`);
            if (done) {
              this.logger.debug('Stream Gemini finalizado.');
              break; // Sai do loop quando o stream termina
            }

            // Processar eventos SSE (simplificado, pode precisar de mais robustez)
            const lines = value.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.substring(6));
                  if (jsonData.candidates && jsonData.candidates.length > 0) {
                    const content = jsonData.candidates[0]?.content?.parts?.[0]?.text;
                    if (content) {
                      this.logger.debug(`Enviando chunk para observer: ${content}`);
                      observer.next(content); // Envia o chunk de texto para o controller
                    }
                  }
                } catch (e) {
                  // Ignora linhas que não são JSON válido (ex: linhas vazias entre eventos)
                  // this.logger.warn('Linha SSE não JSON ignorada:', line);
                }
              }
            }
          }
          this.logger.debug('Completando observer do RxJS.');
          observer.complete(); // Completa o observer do RxJS
        } catch (error) {
          this.logger.error('Erro durante o processamento do stream Gemini:', error);
          observer.error(error); // Propaga o erro
        }
      };

      processStream(); // Inicia o processamento do stream

      // Nota: Não há um mecanismo direto para cancelar o fetch aqui se o observer for desinscrito.
      // Em um cenário de produção, pode ser necessário implementar lógica de cancelamento (AbortController).
    });
  }
} 