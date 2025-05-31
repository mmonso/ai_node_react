import { Controller, Get, Post, Put, Delete, Body, Param, UploadedFile, UseInterceptors, Query, Logger, ParseIntPipe, HttpCode, HttpStatus, ParseBoolPipe, DefaultValuePipe, Patch } from '@nestjs/common'; // Added Patch
import { FileInterceptor } from '@nestjs/platform-express';
import { ConversationsService } from './conversations.service';
import { MessageService } from './message.service'; // Adicionado MessageService
import { AIResponseService } from './ai-response.service'; // Adicionado AIResponseService
import { ConversationFolderService } from './conversation-folder.service'; // Adicionado ConversationFolderService
import { ConversationModelService } from './conversation-model.service'; // Adicionado ConversationModelService
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConfigService } from '../config/config.service';
import { AIServiceFactory } from '../models/ai-service.factory';
import { AIProviderService } from '../models/ai-provider.service';
import * as path from 'path';
import { ActiveModelService } from '../models/active-model.service';
import { UpdateMessageDto } from './dto/update-message.dto'; // Adicionado UpdateMessageDto

@Controller('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(
    private conversationsService: ConversationsService,
    private configService: ConfigService,
    private aiServiceFactory: AIServiceFactory,
    private aiProviderService: AIProviderService,
    private activeModelService: ActiveModelService,
    private messageService: MessageService, // Adicionado MessageService
    private aiResponseService: AIResponseService, // Adicionado AIResponseService
    private conversationFolderService: ConversationFolderService, // Adicionado ConversationFolderService
    private conversationModelService: ConversationModelService, // Adicionado ConversationModelService
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
  create(@Body() body: { title: string; modelId?: string; systemPrompt?: string; isPersona?: boolean }): Promise<Conversation> {
    return this.conversationsService.create(body.title, body.modelId, body.systemPrompt, body.isPersona);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() body: { title: string; isPersona?: boolean; systemPrompt?: string | null },
  ): Promise<Conversation> {
    return this.conversationsService.update(id, body.title, body.isPersona, body.systemPrompt);
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
    return this.conversationFolderService.addConversationToFolder(conversationId, folderId);
  }

  @Delete(':conversationId/folder')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  removeConversationFromFolder(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<Conversation> {
    this.logger.log(`Removendo conversa ${conversationId} da pasta`);
    return this.conversationFolderService.removeConversationFromFolder(conversationId);
  }

  // --- Rotas para Modelo ---
  
  @Patch(':conversationId/model')
  @HttpCode(HttpStatus.OK)
  updateConversationModel(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() body: { modelId: string; modelConfig?: any },
  ): Promise<Conversation> {
    this.logger.log(`Atualizando modelo da conversa ${conversationId} para ${body.modelId}`);
    return this.conversationModelService.updateConversationModel(
      conversationId,
      body.modelId,
      body.modelConfig,
    );
  }

  // --- Rota de Mensagens ---

  private _processUploadedFile(file?: Express.Multer.File): { imageUrl?: string; fileUrl?: string } {
    let imageUrl: string | undefined;
    let fileUrl: string | undefined;

    if (file) {
      this.logger.log(`Arquivo recebido: ${JSON.stringify({
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      })}`);

      const filename = file.filename || file.originalname;

      if (filename) {
        const ext = path.extname(filename).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const isImage = imageExts.includes(ext) || file.mimetype.startsWith('image/');

        if (isImage) {
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
    return { imageUrl, fileUrl };
  }
 
  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  async addMessage(
    @Param('id') id: number,
    @Body() body: { content: string; modelConfig?: string },
    @Query('web_search', new DefaultValuePipe(false), ParseBoolPipe) useWebSearch: boolean,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Message[]> {
    let modelConfig = null;
    
    // Log da solicitação com o parâmetro de busca na web
    this.logger.log(`Recebida nova mensagem para conversa ${id}. Busca na web: ${useWebSearch ? 'ativada' : 'desativada'}`);
    
    // Processar a configuração do modelo, se fornecida
    if (body.modelConfig) {
      try {
        modelConfig = JSON.parse(body.modelConfig);
        this.logger.log(`Configuração do modelo recebida: ${JSON.stringify(modelConfig)}`);
      } catch (e) {
        this.logger.error(`Erro ao processar configuração do modelo: ${e.message}`);
      }
    }
    
    const { imageUrl, fileUrl } = this._processUploadedFile(file);
    
    // Busca a conversa atualizada para obter as relações (folder, isPersona, systemPrompt)
    // A busca da conversa é feita aqui para garantir que as relações estejam carregadas
    // antes de determinar o prompt de sistema.
    const conversation = await this.conversationsService.findOneWithFolder(id);
    
    if (!conversation) {
      throw new Error(`Conversa com ID ${id} não encontrada.`);
    }

    // Adicionar a mensagem do usuário
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

    // Recarregar a conversa para garantir que a lista de mensagens esteja atualizada
    // e que a relação 'folder' esteja carregada.
    const conversationAfterUserMessage = await this.conversationsService.findOneWithFolder(id);
    
    // Gera o título da conversa, se necessário (movido para o ConversationsService)
    // A chamada explícita foi removida daqui, pois o ConversationsService agora lida com isso internamente
    // ao adicionar a mensagem do usuário.
    
    // Obter o modelo ativo global e sua configuração
    const { model: activeModel, config: activeModelConfig } = await this.activeModelService.getActiveModel();
    
    // Se existe uma configuração personalizada do modelo para esta requisição, usá-la
    const finalModelConfig = modelConfig || activeModelConfig;
    
    // Gera e salva a resposta do bot usando o AIResponseService
    this.logger.log(`Solicitando AIResponseService para gerar resposta para conversa ${id} usando modelo ${activeModel?.name}${useWebSearch ? ' com busca na web' : ''}...`);
    await this.aiResponseService.generateAndSaveBotResponse(
      conversationAfterUserMessage, // Passa a entidade Conversation completa
      conversationAfterUserMessage.messages,
      useWebSearch,
      finalModelConfig, // Passa a configuração final do modelo
    );
    
    // Retorna todas as mensagens atualizadas
    const updatedConversation = await this.conversationsService.findOne(id);
    return updatedConversation.messages;
  }

  @Patch('messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    return this.messageService.updateMessageContent(messageId, updateMessageDto);
  }
}