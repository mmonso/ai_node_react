import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async getImageData(imageUrl: string): Promise<{ mimeType: string; data: string } | null> {
    this.logger.debug(`Tentando processar imagem com URL: ${imageUrl}`);

    try {
      // A URL pode ser relativa como '/uploads/nome-do-arquivo.png'
      // ou um caminho de arquivo já processado internamente.
      // Precisamos garantir que estamos pegando apenas o nome do arquivo para juntar com o diretório 'uploads'.
      const imageName = imageUrl.startsWith('/uploads/')
        ? imageUrl.substring('/uploads/'.length)
        : path.basename(imageUrl);
      
      this.logger.debug(`Nome do arquivo extraído: ${imageName}`);

      // O diretório 'uploads' está na raiz do projeto, um nível acima de 'src'
      // __dirname aqui será algo como backend/dist/image-processing
      // Portanto, precisamos subir alguns níveis para chegar à raiz do projeto e depois a 'uploads'
      // Assumindo que 'uploads' está em 'backend/uploads'
      const uploadDir = path.join(__dirname, '..', '..', 'uploads'); 
      const imagePath = path.join(uploadDir, imageName);

      this.logger.debug(`Caminho completo da imagem construído: ${imagePath}`);

      if (!fs.existsSync(imagePath)) {
        this.logger.warn(`Imagem não encontrada no caminho: ${imagePath}`);
        // Tentar um caminho alternativo se 'uploads' estiver na raiz do projeto (fora de backend)
        // Isso pode depender de como o projeto está estruturado e de onde o serviço é executado.
        // Para este exemplo, vamos manter o caminho relativo a 'backend/uploads'.
        // Se o diretório 'uploads' estiver na raiz do projeto (ao lado de 'backend' e 'frontend'),
        // o path.join precisaria ser ajustado, por exemplo: path.join(__dirname, '..', '..', '..', 'uploads');
        return null;
      }

      this.logger.debug(`Imagem encontrada no caminho: ${imagePath}`);
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg'; // padrão
      
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      
      this.logger.debug(`Tipo MIME detectado: ${mimeType}, tamanho base64: ${base64Image.length}`);
      
      return { mimeType, data: base64Image };

    } catch (error) {
      this.logger.error(`Erro ao processar imagem (${imageUrl}):`, error);
      return null;
    }
  }
}