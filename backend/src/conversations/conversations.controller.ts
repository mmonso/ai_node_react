import { Controller, Get, Post, Put, Delete, Body, Param, UploadedFile, UseInterceptors, Query, Logger, ParseIntPipe, HttpCode, HttpStatus, ParseBoolPipe, DefaultValuePipe, Patch } from '@nestjs/common'; // Added Patch
import { FileInterceptor } from '@nestjs/platform-express';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConfigService } from '../config/config.service';
import { AIServiceFactory } from '../models/ai-service.factory';
import { AIProviderService } from '../models/ai-provider.service';
import * as path from 'path';
import { ActiveModelService } from '../models/active-model.service';

@Controller('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(
    private conversationsService: ConversationsService,
    private configService: ConfigService,
    private aiServiceFactory: AIServiceFactory,
    private aiProviderService: AIProviderService,
    private activeModelService: ActiveModelService,
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
  create(@Body() body: { title: string; modelId?: number }): Promise<Conversation> {
    return this.conversationsService.create(body.title, body.modelId);
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

  // --- Rotas para Modelo ---
  
  @Patch(':conversationId/model')
  @HttpCode(HttpStatus.OK)
  updateConversationModel(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() body: { modelId: number; modelConfig?: any },
  ): Promise<Conversation> {
    this.logger.log(`Atualizando modelo da conversa ${conversationId} para ${body.modelId}`);
    return this.conversationsService.updateConversationModel(
      conversationId,
      body.modelId,
      body.modelConfig,
    );
  }

  // --- Rota de Mensagens ---
 
  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  async addMessage(
    @Param('id') id: number,
    @Body() body: { content: string; modelConfig?: string },
    @Query('web_search', new DefaultValuePipe(false), ParseBoolPipe) useWebSearch: boolean,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Message[]> {
    let imageUrl;
    let fileUrl;
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
      
      // Obter o serviço apropriado para o modelo ativo global
      const aiService = await this.aiProviderService.getService();
      
      // Gerar e atualizar título em background
      aiService.generateConversationTitle(body.content)
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
    
    // Obter o modelo ativo global e sua configuração
    const { model: activeModel, config: activeModelConfig } = await this.activeModelService.getActiveModel();
    
    // Se existe uma configuração personalizada do modelo para esta requisição, usá-la
    const finalModelConfig = modelConfig || activeModelConfig;
    
    // Gera a resposta do modelo apropriado
    this.logger.log(`Gerando resposta para conversa ${id} usando modelo global ${activeModel?.name}${useWebSearch ? ' com busca na web' : ''}...`);
    
    // Obter o serviço apropriado para o modelo ativo global
    const aiService = await this.aiProviderService.getService(activeModel);
    
    // Gerar resposta
    const botResponse = await aiService.generateResponse(
      conversation.messages, 
      systemPrompt,
      useWebSearch,
      activeModel,
      finalModelConfig
    );
    
    // Salva a resposta do bot
    await this.conversationsService.addBotMessage(id, botResponse);
    
    // Retorna todas as mensagens atualizadas
    const updatedConversation = await this.conversationsService.findOne(id);
    return updatedConversation.messages;
  }
}