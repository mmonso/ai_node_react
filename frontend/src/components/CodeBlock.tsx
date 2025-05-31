import React, { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../context/ThemeContext';
import { CodeBlockWrapper, SyntaxHighlighterContainer, CopyButton } from './ChatMessage.styles'; // Reutilizando estilos
import { CopiedIcon, CopyIcon } from './icons'; // Reutilizando ícones

interface CodeBlockProps {
  language: string | null;
  codeContent: string;
  node?: any; // Para manter a compatibilidade com a estrutura original do ReactMarkdown se necessário
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, codeContent, node }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Falha ao copiar código: ', err);
    }
  };

  // Se não houver linguagem detectada, renderiza como um <code> inline simples
  // ou podemos decidir não renderizar nada ou um fallback.
  // Para manter o comportamento original do ChatMessage, se não houver 'match',
  // ele renderizava um <code> simples. Aqui, como é um componente dedicado
  // para blocos de código com highlight, faz sentido que 'language' seja esperado.
  // Se 'language' for null, podemos optar por um fallback ou estilo padrão.
  // Por ora, vamos assumir que 'language' será fornecido se for um bloco de código válido.

  return (
    <CodeBlockWrapper>
      <SyntaxHighlighterContainer>
        <SyntaxHighlighter
          PreTag="div"
          language={language || 'text'} // Fallback para 'text' se a linguagem não for detectada
          style={theme === 'light' ? docco : atomOneDark}
        >
          {codeContent}
        </SyntaxHighlighter>
      </SyntaxHighlighterContainer>
      <CopyButton onClick={handleCopy} title="Copiar código">
        {copied ? <CopiedIcon /> : <CopyIcon />}
      </CopyButton>
    </CodeBlockWrapper>
  );
};

export default CodeBlock;