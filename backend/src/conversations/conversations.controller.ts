import { Controller, Get, Post, Put, Delete, Body, Param, UploadedFile, UseInterceptors, Sse, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, timer } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { GeminiService } from '../gemini/gemini.service';
import { ConfigService } from '../config/config.service';
import * as path from 'path';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private conversationsService: ConversationsService,
    private geminiService: GeminiService,
    private configService: ConfigService,
  ) {}

  @Get()
  findAll(): Promise<Conversation[]> {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Conversation> {
    return this.conversationsService.findOne(id);
  }

  @Post()
  create(@Body() body: { title: string }): Promise<Conversation> {
    return this.conversationsService.create(body.title);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() body: { title: string },
  ): Promise<Conversation> {
    return this.conversationsService.update(id, body.title);
  }

  @Delete(':id')
  delete(@Param('id') id: number): Promise<void> {
    return this.conversationsService.delete(id);
  }

  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  async addMessage(
    @Param('id') id: number,
    @Body() body: { content: string },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Message> {
    let imageUrl;
    let fileUrl;
    
    if (file) {
      const filename = file.filename;
      // Verificar se é uma imagem baseado na extensão
      const ext = path.extname(filename).toLowerCase();
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      if (imageExts.includes(ext)) {
        imageUrl = `/uploads/${filename}`;
      } else {
        fileUrl = `/uploads/${filename}`;
      }
    }
    
    // Salva a mensagem do usuário
    const userMessage = await this.conversationsService.addUserMessage(
      id,
      body.content,
      imageUrl,
      fileUrl,
    );

    // Retorna apenas a mensagem do usuário salva.
    // A geração da resposta do bot é tratada pela rota de stream.
    return userMessage;
  }

  @Sse(':id/stream')
  streamResponse(
    @Param('id') id: number,
    @Query('content') content: string,
  ): Observable<MessageEvent> {
    console.log(`Iniciando stream SSE para conversa ${id}`);
    
    // Força encerramento após 60 segundos no máximo para evitar streams pendurados
    const maxTimeout = timer(60000);
    
    return new Observable<MessageEvent>(observer => {
      console.log(`Criando novo Observable para conversa ${id}`);
      
      let isStreamActive = true;
      let completionSent = false;

      // Função para enviar evento de end e encerrar o stream
      const finalizeStream = (message: string) => {
        if (!isStreamActive || completionSent) {
          return; // Evita finalização duplicada
        }
        
        try {
          console.log(`Finalizando stream para conversa ${id}: ${message}`);
          
          // Marca como completado
          completionSent = true;
          
          // Envia evento final
          observer.next({ data: '[STREAM_ENCERRADO]', type: 'end' } as MessageEvent);
          
          // Completa o observable imediatamente
          observer.complete();
          
          // Garante que não fará mais nada
          isStreamActive = false;
          
          console.log(`Stream finalizado para conversa ${id}`);
        } catch (err) {
          console.error(`Erro ao finalizar stream: ${err}`);
        }
      };

      // Função assíncrona para buscar histórico e iniciar stream
      const startStream = async () => {
        try {
          console.log(`Buscando dados para conversa ${id}`);
          
          // Busca a conversa
          const conversation = await this.conversationsService.findOne(id);

          if (!conversation) {
            console.error(`Conversa com ID ${id} não encontrada.`);
            finalizeStream('Conversa não encontrada');
            return;
          }

          // Busca o prompt do sistema
          const systemPrompt = await this.configService.getSystemPrompt();
          
          // Garante que temos um array de mensagens
          const validMessages = conversation.messages || [];
          
          // Inicia o stream do Gemini
          let fullResponse = '';
          
          try {
            console.log(`Iniciando stream Gemini para conversa ${id}`);
            
            const stream = this.geminiService.generateResponseStream(
              validMessages,
              systemPrompt
            );

            stream.subscribe({
              next: (chunk) => {
                if (!isStreamActive || completionSent) return;
                
                if (chunk && chunk.trim().length > 0) {
                  fullResponse += chunk;
                  observer.next({ data: chunk } as MessageEvent);
                }
              },
              error: (err) => {
                console.error(`Erro no Gemini para conversa ${id}:`, err);
                
                // Salva mensagem parcial se tiver conteúdo
                if (fullResponse.trim().length > 0) {
                  this.conversationsService.addBotMessage(id, fullResponse)
                    .catch(e => console.error('Erro ao salvar mensagem parcial:', e));
                }
                
                finalizeStream(`Erro: ${err.message || 'Desconhecido'}`);
              },
              complete: async () => {
                console.log(`Stream Gemini completo para conversa ${id}. Resposta: ${fullResponse.length} caracteres`);
                
                if (fullResponse.trim().length > 0) {
                  try {
                    await this.conversationsService.addBotMessage(id, fullResponse);
                    finalizeStream('Completado com sucesso');
                  } catch (e) {
                    console.error('Erro ao salvar mensagem completa:', e);
                    finalizeStream(`Erro ao salvar: ${e.message}`);
                  }
                } else {
                  finalizeStream('Completado sem conteúdo');
                }
              }
            });
          } catch (e) {
            console.error(`Erro ao criar stream Gemini para conversa ${id}:`, e);
            finalizeStream(`Erro ao iniciar: ${e.message || 'Desconhecido'}`);
          }
        } catch (e) {
          console.error(`Erro ao buscar dados para conversa ${id}:`, e);
          finalizeStream(`Erro interno: ${e.message || 'Desconhecido'}`);
        }
      };

      // Inicia o processo
      startStream();

      // Força encerramento após timeout máximo
      const timeoutSubscription = maxTimeout.subscribe(() => {
        console.log(`Timeout máximo atingido para conversa ${id}, forçando encerramento`);
        finalizeStream('Timeout máximo');
      });

      // Função de limpeza quando o cliente desconecta
      return () => {
        console.log(`Cliente desconectou do stream da conversa ${id}`);
        timeoutSubscription.unsubscribe();
        isStreamActive = false;
      };
    }).pipe(
      // Garante que o stream encerra depois de 60 segundos no máximo
      takeUntil(maxTimeout),
      finalize(() => {
        console.log(`Stream para conversa ${id} finalizado (pipe)`);
      })
    );
  }
}