import React from 'react';
import { FileCard, FileIcon, FileInfo, FileName, FileType } from './ChatMessage.styles';
import { FileAttachmentIcon } from './icons';

interface MessageFileProps {
  fileUrl: string | null | undefined;
  // Poderíamos adicionar mais props se necessário, como fileName, fileType, etc.,
  // se a URL sozinha não for suficiente ou se quisermos mais controle.
}

const MessageFile: React.FC<MessageFileProps> = ({ fileUrl }) => {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return null;
  }

  // Extrai o nome do arquivo da URL
  const getFileName = (url: string): string => { // Adicionado tipo de retorno
    try {
      const parts = url.split('/');
      const fileNameFromUrl = parts[parts.length - 1];
      // Decodifica o nome do arquivo caso esteja URL encoded (ex: com %20 para espaços)
      return fileNameFromUrl ? decodeURIComponent(fileNameFromUrl) : "Arquivo Anexado";
    } catch (e) {
      console.error("Erro ao extrair nome do arquivo:", e);
      return "Arquivo Anexado";
    }
  };

  const fileName = getFileName(fileUrl);

  return (
    <FileCard href={fileUrl} target="_blank" rel="noopener noreferrer">
      <FileIcon>
        <FileAttachmentIcon />
      </FileIcon>
      <FileInfo>
        <FileName>{fileName}</FileName>
        <FileType>Arquivo Anexado</FileType> {/* Poderia ser mais dinâmico se tivéssemos o tipo */}
      </FileInfo>
    </FileCard>
  );
};

export default MessageFile;