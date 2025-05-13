import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    /* Tema Escuro Padrão */
    --primary-bg-dark: #121212;
    --secondary-bg-dark: #1e1e1e;
    --tertiary-bg-dark: #252525; /* Para fundos de mensagens de bot, etc. */
    --border-color-dark: #333;
    --primary-text-dark: #ffffff;
    --secondary-text-dark: #aaaaaa;
    --accent-color-dark: #5d6b85; /* Substituindo o roxo por um azul-acinzentado escuro */
    --accent-hover-dark: #4e5d77; /* Versão um pouco mais escura */
    --success-color-dark: #4caf50;
    --error-color-dark: #f44336;
    --input-bg-dark: #1e1e1e;
    --code-bg-dark: #2a2a2a;
    --pre-bg-dark: #1a1a1a;
    --blockquote-bg-dark: rgba(93, 107, 133, 0.05); /* Ajustado para novo accent-color */
    --scrollbar-thumb-dark: #333;
    --scrollbar-thumb-hover-dark: #444;
    --message-user-bg-dark: rgba(93, 107, 133, 0.2); /* Fundo da mensagem do usuário no tema escuro */
    --message-user-text-dark: #ffffff; /* Cor do texto na mensagem do usuário no tema escuro */

    /* Tema Claro */
    --primary-bg-light: #ffffff;
    --secondary-bg-light: #f0f2f5; /* Um cinza claro para fundos secundários */
    --tertiary-bg-light: #e9ecef; /* Para fundos de mensagens de bot, etc. */
    --border-color-light: #d1d5db; /* Um cinza mais claro para bordas */
    --primary-text-light: #111827; /* Texto escuro para contraste */
    --secondary-text-light: #6b7280; /* Texto secundário um pouco mais claro */
    --accent-color-light: #546a8c; /* Tom azul-acinzentado médio para o tema claro */
    --accent-hover-light: #455a7a; /* Versão mais escura */
    --success-color-light: #10b981;
    --error-color-light: #ef4444;
    --input-bg-light: #ffffff;
    --code-bg-light: #f3f4f6;
    --pre-bg-light: #e5e7eb;
    --blockquote-bg-light: rgba(84, 106, 140, 0.05); /* Ajustado para novo accent-color */
    --scrollbar-thumb-light: #cbd5e1;
    --scrollbar-thumb-hover-light: #9ca3af;
    --message-user-bg-light: rgba(71, 85, 105, 0.6); /* Aumentando ainda mais a opacidade para um fundo mais escuro */
    --message-user-text-light: #f8fafc; /* Cor do texto na mensagem do usuário no tema claro */

    /* Variáveis dinâmicas que mudarão com o tema */
    --primary-bg: var(--primary-bg-dark);
    --secondary-bg: var(--secondary-bg-dark);
    --tertiary-bg: var(--tertiary-bg-dark);
    --border-color: var(--border-color-dark);
    --primary-text: var(--primary-text-dark);
    --secondary-text: var(--secondary-text-dark);
    --accent-color: var(--accent-color-dark);
    --accent-hover: var(--accent-hover-dark);
    --success-color: var(--success-color-dark);
    --error-color: var(--error-color-dark);
    --input-bg: var(--input-bg-dark);
    --code-bg: var(--code-bg-dark);
    --pre-bg: var(--pre-bg-dark);
    --blockquote-bg: var(--blockquote-bg-dark);
    --scrollbar-thumb: var(--scrollbar-thumb-dark);
    --scrollbar-thumb-hover: var(--scrollbar-thumb-hover-dark);
    
    /* Variáveis que não mudam com o tema (ou são específicas) */
    --message-user-bg: var(--message-user-bg-dark); /* Usando a nova variável */
    --message-user-text: var(--message-user-text-dark); /* Usando a nova variável */
  }

  body[data-theme='light'] {
    --primary-bg: var(--primary-bg-light);
    --secondary-bg: var(--secondary-bg-light);
    --tertiary-bg: var(--tertiary-bg-light);
    --border-color: var(--border-color-light);
    --primary-text: var(--primary-text-light);
    --secondary-text: var(--secondary-text-light);
    --accent-color: var(--accent-color-light);
    --accent-hover: var(--accent-hover-light);
    --success-color: var(--success-color-light);
    --error-color: var(--error-color-light);
    --input-bg: var(--input-bg-light);
    --code-bg: var(--code-bg-light);
    --pre-bg: var(--pre-bg-light);
    --blockquote-bg: var(--blockquote-bg-light);
    --scrollbar-thumb: var(--scrollbar-thumb-light);
    --scrollbar-thumb-hover: var(--scrollbar-thumb-hover-light);

    --message-user-bg: var(--message-user-bg-light); /* Usando a nova variável */
    --message-user-text: var(--message-user-text-light); /* Usando a nova variável */
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    line-height: 1.5;
    font-size: 16px;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  h1 { font-size: 24px; }
  h2 { font-size: 22px; }
  h3 { font-size: 20px; }

  a {
    color: var(--accent-color);
    text-decoration: none;
    
    &:hover {
      color: var(--accent-hover);
    }
  }

  button, input, textarea {
    font-family: inherit;
    font-size: 16px;
  }

  button {
    cursor: pointer;
    border: none;
    background: var(--accent-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    transition: background-color 0.2s ease, transform 0.1s ease;

    &:hover {
      background: var(--accent-hover);
    }

    &:active {
      transform: translateY(1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &:focus {
      outline: 1px solid var(--accent-color);
      outline-offset: 1px;
    }
  }

  input, textarea {
    background-color: var(--input-bg); /* Usar variável específica */
    border: 1px solid var(--border-color);
    color: var(--primary-text);
    padding: 0.75rem;
    border-radius: 6px;
    
    &:focus {
      outline: 2px solid var(--accent-color);
      border-color: var(--accent-color);
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--primary-bg);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb); /* Usar variável específica */
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover); /* Usar variável específica */
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    background-color: var(--code-bg); /* Usar variável específica */
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 85%;
    color: var(--primary-text); /* Garantir que o texto do código inline seja visível */
  }

  pre {
    background-color: var(--pre-bg); /* Usar variável específica */
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
    
    /* O SyntaxHighlighter tem seus próprios estilos */
    &.syntax-highlighter {
      background-color: transparent;
      border: none;
    }
  }

  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  blockquote {
    border-left: 3px solid var(--accent-color);
    padding-left: 1rem;
    color: var(--secondary-text);
    margin: 1rem 0;
    background-color: var(--blockquote-bg); /* Usar variável específica */
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }
`;

export default GlobalStyles; 