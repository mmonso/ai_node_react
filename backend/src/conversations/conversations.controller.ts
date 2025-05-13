import { Controller, Get, Post, Put, Delete, Body, Param, UploadedFile, UseInterceptors, Query, Logger, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common'; // Added ParseIntPipe, HttpCode, HttpStatus
import { FileInterceptor } from '@nestjs/platform-express';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { GeminiService } from '../gemini/gemini.service';
import { ConfigService } from '../config/config.service';
import * as path from 'path';

@Controller('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

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

  // --- Rotas para Pastas ---

  @Post(':conversationId/folder/:folderId')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK em vez de 201 Created
  addConversationToFolder(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('folderId', ParseIntPipe) folderId: number,
  ): Promise<Conversation> {
    this.logger.log(`Adicionando conversa ${conversationId} à pasta ${folderId}`);
    return this.conversationsService.addConversationToFolder(conversationId, folderId);
  }

  @Delete(':conversationId/folder')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  removeConversationFromFolder(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<Conversation> {
    this.logger.log(`Removendo conversa ${conversationId} da pasta`);
    return this.conversationsService.removeConversationFromFolder(conversationId);
  }

  // --- Rota de Mensagens ---
 
  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  async addMessage(
    @Param('id') id: number,
    @Body() body: { content: string },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Message[]> {
    let imageUrl;
    let fileUrl;
    
    if (file) {
      this.logger.log(`Arquivo recebido: ${JSON.stringify({
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      })}`);
      
      // Verificar se temos um nome de arquivo válido
      const filename = file.filename || file.originalname;
      
      if (filename) {
        // Verificar se é uma imagem baseado na extensão ou mimetype
        const ext = path.extname(filename).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const isImage = imageExts.includes(ext) || file.mimetype.startsWith('image/');
        
        if (isImage) {
          // Garantir que a URL completa do servidor seja usada
          imageUrl = `/uploads/${filename}`;
          this.logger.log(`Imagem detectada, URL: ${imageUrl}`);
        } else {
          fileUrl = `/uploads/${filename}`;
          this.logger.log(`Arquivo detectado, URL: ${fileUrl}`);
        }
      } else {
        this.logger.error('Arquivo enviado sem nome de arquivo válido');
      }
    }
    
    // Salva a mensagem do usuário
    const userMessage = await this.conversationsService.addUserMessage(
      id,
      body.content,
      imageUrl,
      fileUrl,
    );

    // Log detalhado da mensagem do usuário salva
    this.logger.log(`Mensagem do usuário salva: ${JSON.stringify({
      id: userMessage.id,
      content: userMessage.content,
      imageUrl: userMessage.imageUrl,
      fileUrl: userMessage.fileUrl
    })}`);

    // Busca a conversa atualizada
    const conversation = await this.conversationsService.findOne(id);
    
    if (!conversation) {
      throw new Error(`Conversa com ID ${id} não encontrada.`);
    }

    // Busca o prompt do sistema
    const systemPrompt = await this.configService.getSystemPrompt();
    
    // Verifica se é a primeira mensagem da conversa para gerar título
    if (conversation.title === 'Nova Conversa' && conversation.messages.length === 1) {
      this.logger.log(`Conversa "${conversation.title}" (${id}) detectada. Tentando gerar novo título...`);
      
      // Gerar e atualizar título em background (não bloquear a resposta)
      this.geminiService.generateConversationTitle(body.content)
        .then(newTitle => {
          if (newTitle && newTitle !== 'Nova Conversa') {
            this.logger.log(`Novo título gerado para conversa ${id}: "${newTitle}". Atualizando...`);
            return this.conversationsService.update(id, newTitle);
          }
        })
        .then(() => {
          this.logger.log(`Título da conversa ${id} atualizado com sucesso.`);
        })
        .catch(err => {
          this.logger.error(`Falha ao gerar/atualizar título para conversa ${id}:`, err);
        });
    }
    
    // Gera a resposta do Gemini
    this.logger.log(`Gerando resposta para conversa ${id}...`);
    const botResponse = await this.geminiService.generateResponse(conversation.messages, systemPrompt);
    
    // Salva a resposta do bot
    await this.conversationsService.addBotMessage(id, botResponse);
    
    // Retorna todas as mensagens atualizadas
    const updatedConversation = await this.conversationsService.findOne(id);
    return updatedConversation.messages;
  }
}