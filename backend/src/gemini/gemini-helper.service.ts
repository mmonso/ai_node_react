import { Injectable, Logger } from '@nestjs/common';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { Message } from '../entities/message.entity'; // Pode ser necessário se o tipo 'messages' for mais específico

@Injectable()
export class GeminiHelperService {
  private readonly logger = new Logger(GeminiHelperService.name);

  constructor(private imageProcessingService: ImageProcessingService) {}

  async buildRequestParts(
    messages: any[], // Idealmente, tipar melhor se possível
    enhancedSystemPrompt: string,
    metadata: any,
  ): Promise<any[]> {
    const parts = [];
    // Adicionar metadados como comentário no prompt
    parts.push({ text: `<!-- Metadata: ${JSON.stringify(metadata)} -->\n\n` });
    
    // Adicionar o prompt do sistema como parte de texto
    parts.push({ text: `${enhancedSystemPrompt}\n\n` });
    
    // Adicionar as mensagens anteriores como texto
    for (const msg of messages) {
      const role = msg.isUser ? 'Usuário' : 'Assistente';
      const msgTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR') : '';
      const timestampStr = msgTime ? ` [${msgTime}]` : '';
      
      parts.push({ text: `${role}${timestampStr}: ${msg.content}\n` });
      
      if (msg.imageUrl && msg.isUser) {
        try {
          this.logger.debug(`Solicitando dados da imagem para URL: ${msg.imageUrl}`);
          const imageData = await this.imageProcessingService.getImageData(msg.imageUrl);

          if (imageData) {
            parts.push({
              inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.data,
              },
            });
            this.logger.debug(`Imagem ${msg.imageUrl} adicionada com sucesso à requisição.`);
          } else {
            this.logger.warn(`Não foi possível obter dados da imagem para ${msg.imageUrl}. Imagem não incluída.`);
          }
        } catch (error) {
          this.logger.error(`Erro ao tentar obter e adicionar imagem ${msg.imageUrl} à requisição:`, error);
        }
      }
    }
    
    parts.push({ text: "Assistente: " });
    return parts;
  }

  processApiResponse(candidate: any, useWebSearch: boolean): string {
    let finalResponseText = candidate.content.parts[0].text || '';
        
    const timestampRegexes = [
      /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]\s*/,
      /^\s*\d{1,2}:\d{2}(:\d{2})?\s*/,
      /^\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*/,
      /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s*/
    ];
    
    for (const regex of timestampRegexes) {
      if (regex.test(finalResponseText)) {
        finalResponseText = finalResponseText.replace(regex, '');
        break;
      }
    }
    
    const assistantPrefixRegex = /^\s*(Assistente(\s*\[\d{1,2}:\d{2}(:\d{2})?\])?\s*:)\s*/;
    if (assistantPrefixRegex.test(finalResponseText)) {
      finalResponseText = finalResponseText.replace(assistantPrefixRegex, '');
    }

    if (useWebSearch) {
      this.logger.log(`Verificando metadados de grounding na resposta. useWebSearch=${useWebSearch}, tem groundingMetadata=${!!candidate.groundingMetadata}`);
    }
    
    if (useWebSearch && candidate.groundingMetadata) {
      this.logger.log('Resposta contém metadados de grounding com Google Search');
      this.logger.debug('Metadados de grounding:', JSON.stringify(candidate.groundingMetadata));
      
      const responseWithGrounding = JSON.stringify({
        text: finalResponseText,
        groundingMetadata: {
          searchEntryPoint: candidate.groundingMetadata.searchEntryPoint || null,
          searchSuggestions: candidate.groundingMetadata.webSearchQueries || [],
          sources: (candidate.groundingMetadata.groundingChunks || []).map(chunk => ({
            title: chunk.web?.title || 'Fonte',
            uri: chunk.web?.uri || '#'
          })),
          citations: (candidate.groundingMetadata.groundingSupports || []).map(support => ({
            text: support.segment?.text || '',
            startIndex: support.segment?.startIndex || 0,
            endIndex: support.segment?.endIndex || 0,
            sources: support.groundingChunkIndices?.map(index => index) || [],
            confidence: Array.isArray(support.confidenceScores) ?
                        Math.max(...support.confidenceScores) :
                        (support.confidence || 0)
          }))
        }
      });
      
      return responseWithGrounding;
    } else {
      this.logger.debug('Texto de resposta extraído com sucesso');
      return finalResponseText;
    }
  }
}