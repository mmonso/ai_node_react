import { Controller, Get, Post, Put, Delete, Body, Param, UploadedFile, UseInterceptors, Query, Logger, ParseIntPipe, HttpCode, HttpStatus, ParseBoolPipe, DefaultValuePipe, Patch } from '@nestjs/common'; // Added Patch
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
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

import { CreateConversationDto } from './dto/create-conversation.dto'; // Será criado
import { UpdateConversationDto } from './dto/update-conversation.dto'; // Será criado
import { AddMessageDto } from './dto/add-message.dto'; // Será criado

@ApiTags('Conversations')
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
  @ApiOperation({ summary: 'Listar todas as conversas' })
  @ApiResponse({ status: 200, description: 'Lista de conversas retornada com sucesso.', type: [Conversation] })
  findAll(): Promise<Conversation[]> {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma conversa pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da conversa', type: String })
  @ApiResponse({ status: 200, description: 'Conversa retornada com sucesso.', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  findOne(@Param('id') id: string): Promise<Conversation> {
    return this.conversationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova conversa' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 201, description: 'Conversa criada com sucesso.', type: Conversation })
  create(@Body() createConversationDto: CreateConversationDto): Promise<Conversation> {
    return this.conversationsService.create(createConversationDto.title, createConversationDto.modelId, createConversationDto.systemPrompt, createConversationDto.isPersona);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar uma conversa existente' })
  @ApiParam({ name: 'id', description: 'ID da conversa a ser atualizada', type: String })
  @ApiBody({ type: UpdateConversationDto })
  @ApiResponse({ status: 200, description: 'Conversa atualizada com sucesso.', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.update(id, updateConversationDto.title, updateConversationDto.isPersona, updateConversationDto.systemPrompt);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa a ser deletada', type: String })
  @ApiResponse({ status: 200, description: 'Conversa deletada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  delete(@Param('id') id: string): Promise<void> {
    return this.conversationsService.delete(id);
  }

  // --- Rotas para Pastas ---

  @Post(':conversationId/folder/:folderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar conversa a uma pasta' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa', type: String })
  @ApiParam({ name: 'folderId', description: 'ID da pasta', type: Number })
  @ApiResponse({ status: 200, description: 'Conversa adicionada à pasta com sucesso.', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversa ou pasta não encontrada.' })
  addConversationToFolder(
    @Param('conversationId') conversationId: string,
    @Param('folderId', ParseIntPipe) folderId: number,
  ): Promise<Conversation> {
    this.logger.log(`Adicionando conversa ${conversationId} à pasta ${folderId}`);
    return this.conversationFolderService.addConversationToFolder(conversationId, folderId);
  }

  @Delete(':conversationId/folder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover conversa de uma pasta' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa', type: String })
  @ApiResponse({ status: 200, description: 'Conversa removida da pasta com sucesso.', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  removeConversationFromFolder(
    @Param('conversationId') conversationId: string,
  ): Promise<Conversation> {
    this.logger.log(`Removendo conversa ${conversationId} da pasta`);
    return this.conversationFolderService.removeConversationFromFolder(conversationId);
  }

  // --- Rotas para Modelo ---
  
  @Patch(':conversationId/model')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar modelo da conversa' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa', type: String })
  @ApiBody({ schema: { properties: { modelId: { type: 'string' }, modelConfig: { type: 'object', additionalProperties: true } } } })
  @ApiResponse({ status: 200, description: 'Modelo da conversa atualizado com sucesso.', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  updateConversationModel(
    @Param('conversationId') conversationId: string,
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
  @ApiOperation({ summary: 'Adicionar uma nova mensagem a uma conversa e obter resposta do AI' })
  @ApiParam({ name: 'id', description: 'ID da conversa', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AddMessageDto })
  @ApiQuery({ name: 'web_search', description: 'Usar busca na web para a resposta', type: Boolean, required: false })
  @ApiResponse({ status: 201, description: 'Mensagem adicionada e resposta do AI retornada.', type: [Message] })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
    @Query('web_search', new DefaultValuePipe(false), ParseBoolPipe) useWebSearch: boolean,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Message[]> {
    let modelConfig = null;
    
    // Log da solicitação com o parâmetro de busca na web
    this.logger.log(`Recebida nova mensagem para conversa ${id}. Busca na web: ${useWebSearch ? 'ativada' : 'desativada'}`);
    
    // Processar a configuração do modelo, se fornecida
    if (addMessageDto.modelConfig) {
      try {
        // modelConfig já é um objeto se class-transformer estiver funcionando corretamente com o DTO
        // Se modelConfig for uma string JSON, precisará ser parseado.
        // Para simplificar, assumimos que o DTO já lida com a transformação.
        modelConfig = typeof addMessageDto.modelConfig === 'string' ? JSON.parse(addMessageDto.modelConfig) : addMessageDto.modelConfig;
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
      addMessageDto.content,
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
  @ApiOperation({ summary: 'Atualizar o conteúdo de uma mensagem existente' })
  @ApiParam({ name: 'messageId', description: 'ID da mensagem a ser atualizada', type: String })
  @ApiBody({ type: UpdateMessageDto })
  @ApiResponse({ status: 200, description: 'Mensagem atualizada com sucesso.', type: Message })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada.' })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    return this.messageService.updateMessageContent(messageId, updateMessageDto);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar uma mensagem permanentemente (hard delete)' })
  @ApiParam({ name: 'messageId', description: 'ID da mensagem a ser deletada permanentemente', type: String })
  @ApiResponse({ status: 204, description: 'Mensagem deletada permanentemente com sucesso.' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada.' })
  async deleteMessage(
    @Param('messageId') messageId: string,
  ): Promise<void> {
    this.logger.log(`Requisição para hard delete da mensagem com ID: ${messageId}`);
    await this.messageService.deleteMessage(messageId);
    // Nenhuma resposta de corpo para 204 No Content
  }
}