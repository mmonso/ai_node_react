import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from '../entities/message.entity';
import { AIServiceInterface } from '../models/ai-service.interface';
import { Model } from '../entities/model.entity';

@Injectable()
export class AnthropicService implements AIServiceInterface {
  private apiKey: string;
  private readonly logger = new Logger(AnthropicService.name);

  constructor(
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY não encontrada no arquivo .env. O serviço não funcionará corretamente.');
    } else {
      this.logger.log('Serviço Anthropic inicializado com sucesso');
    }
  }

  async generateResponse(
    messages: Message[],
    systemPrompt: string,
    useWebSearch: boolean,
    model: Model | null,
    modelConfig: any
  ): Promise<string> {
    this.logger.log('Gerando resposta com Anthropic Claude...');
    
    // Verificar se a chave API está configurada
    if (!this.apiKey) {
      throw new Error('Chave API Anthropic não configurada');
    }
    
    // Implementação da chamada para Anthropic API
    // Aqui seria o código específico para chamar a API da Anthropic
    
    // Exemplo simplificado (precisaria ser implementado com a SDK da Anthropic)
    try {
      // Formatação das mensagens no formato esperado pela API da Anthropic
      // Implementação real para integração com a API da Anthropic

      return 'Exemplo de resposta do Claude - esta é uma implementação de exemplo.';
    } catch (error) {
      this.logger.error(`Erro ao chamar API da Anthropic: ${error.message}`);
      throw new Error(`Falha ao gerar resposta com Anthropic: ${error.message}`);
    }
  }

  async generateConversationTitle(content: string): Promise<string> {
    this.logger.log('Gerando título de conversa com Anthropic Claude...');
    
    // Verificar se a chave API está configurada
    if (!this.apiKey) {
      throw new Error('Chave API Anthropic não configurada');
    }
    
    try {
      // Implementação da chamada para API da Anthropic para gerar um título
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 30,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: `Por favor, crie um título curto e descritivo (máximo 3 palavras) para uma conversa que começa com esta mensagem: "${content}". Retorne apenas o título, sem aspas ou pontuação adicional, sem prefixos como 'Aqui estão algumas opções:' ou 'Título:'. Apenas o título em si.`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API Claude retornou status ${response.status} ao gerar título: ${errorText}`);
        return 'Nova Conversa';
      }

      const data = await response.json();
      if (!data.content || !data.content.length || !data.content[0].text) {
        this.logger.error('Resposta da API Claude não contém conteúdo ao gerar título');
        return 'Nova Conversa';
      }

      let title = data.content[0].text.trim();
      
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
      
      return title;
    } catch (error) {
      this.logger.error('Erro ao gerar título da conversa:', error);
      return 'Nova Conversa';
    }
  }
} 