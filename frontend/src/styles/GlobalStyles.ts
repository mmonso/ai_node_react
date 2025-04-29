import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-bg: #121212;
    --secondary-bg: #1e1e1e;
    --border-color: #333;
    --primary-text: #ffffff;
    --secondary-text: #aaaaaa;
    --accent-color: #8a85ff;
    --accent-hover: #7a75ed;
    --success-color: #4caf50;
    --error-color: #f44336;
    --message-user-bg: #1e1e1e;
    --message-bot-bg: #252525;
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
      outline: 2px solid rgba(138, 133, 255, 0.5);
      outline-offset: 2px;
    }
  }

  input, textarea {
    background-color: var(--secondary-bg);
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
    background-color: var(--border-color);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #444;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    background-color: #2a2a2a;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 85%;
  }

  pre {
    background-color: #1a1a1a;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
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
    background-color: rgba(138, 133, 255, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }
`;

export default GlobalStyles; 