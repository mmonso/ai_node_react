import React, { useState, useEffect, useRef } from 'react';
import { ImagePreview, ImageErrorContainer } from './ChatMessage.styles';
import { ImageErrorIcon } from './icons';

const BASE_URL = 'http://localhost:3001'; // Pode ser movido para um arquivo de constantes

interface MessageImageProps {
  imageUrl: string | null | undefined;
  messageId?: number; // Para logs, opcional
}

const MessageImage: React.FC<MessageImageProps> = ({ imageUrl: initialImageUrl, messageId }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl || '');
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (initialImageUrl) {
      console.log('MessageImage: Imagem detectada:', initialImageUrl, 'para mensagem ID:', messageId);
      setImageError(false);
      setCurrentImageUrl(initialImageUrl);

      const img = new Image();
      img.onload = () => {
        console.log('MessageImage: Imagem pré-carregada com sucesso:', initialImageUrl);
      };
      img.onerror = () => {
        console.error('MessageImage: Erro ao pré-carregar imagem:', initialImageUrl);
        if (initialImageUrl && initialImageUrl.startsWith('/uploads/')) {
          const absoluteUrl = `${BASE_URL}${initialImageUrl}`;
          console.log('MessageImage: Tentando pré-carregar com URL absoluta:', absoluteUrl);
          
          const retryImg = new Image();
          retryImg.onload = () => {
            console.log('MessageImage: Imagem pré-carregada com sucesso com URL absoluta:', absoluteUrl);
            setCurrentImageUrl(absoluteUrl); // Atualiza para a URL absoluta se funcionar
          };
          retryImg.onerror = () => {
            console.error('MessageImage: Falha definitiva ao carregar imagem, mesmo com URL absoluta');
            setImageError(true);
          };
          retryImg.src = absoluteUrl;
        } else {
          setImageError(true);
        }
      };
      img.src = initialImageUrl;
    } else {
      // Se initialImageUrl for null/undefined, reseta os estados
      setCurrentImageUrl('');
      setImageError(false);
    }
  }, [initialImageUrl, messageId]);

  const handleImageError = () => {
    console.error('MessageImage: Erro ao carregar imagem no elemento <img>:', currentImageUrl);
    // Se a URL atual já não for a absoluta e for relativa, tenta a absoluta
    if (currentImageUrl && currentImageUrl.startsWith('/uploads/') && !currentImageUrl.startsWith(BASE_URL)) {
      const absoluteUrl = `${BASE_URL}${currentImageUrl.substring(currentImageUrl.indexOf('/uploads/'))}`;
      console.log('MessageImage: Tentando carregar diretamente com URL absoluta no onError do <img>:', absoluteUrl);
      setCurrentImageUrl(absoluteUrl); 
      // Não seta imageError aqui, pois o novo src vai disparar onError novamente se falhar
      return;
    }
    setImageError(true);
  };

  if (!currentImageUrl || imageError) {
    if (imageError && initialImageUrl) { // Só mostra erro se havia uma tentativa de carregar imagem
        return (
            <ImageErrorContainer>
                <ImageErrorIcon />
                <span>Não foi possível carregar a imagem</span>
            </ImageErrorContainer>
        );
    }
    return null; // Não renderiza nada se não há imagem ou se o erro é por falta de URL inicial
  }

  return (
    <ImagePreview
      ref={imageRef}
      src={currentImageUrl}
      alt="Imagem enviada"
      onError={handleImageError}
    />
  );
};

export default MessageImage;