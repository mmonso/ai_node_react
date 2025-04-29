# Gemini Chatbot - Uma aplicação modular com NestJS e React

Um chatbot moderno com uma arquitetura modular, usando a API Gemini (Google) como LLM para geração de respostas contextuais.

## Tecnologias Utilizadas

### Backend
- NestJS (Framework Node.js)
- TypeORM
- SQLite (Banco de dados)
- Gemini API (Google)

### Frontend
- React
- TypeScript
- Styled Components
- React Router
- React Markdown

## Estrutura do Projeto

O projeto está dividido em duas partes principais:

```
/
├── backend/           # Aplicação NestJS
│   ├── src/           # Código fonte do backend
│   ├── data/          # Dados do banco SQLite
│   └── ...
│
└── frontend/          # Aplicação React
    ├── src/           # Código fonte do frontend
    │   ├── components/  # Componentes React
    │   ├── pages/       # Páginas
    │   ├── services/    # Serviços e APIs
    │   ├── styles/      # Estilos globais
    │   └── ...
    └── ...
```

## Funcionalidades

- Interface principal com barra lateral para gestão de conversas
- Chat com suporte para renderização em Markdown
- Suporte para respostas via streaming (em tempo real)
- Envio de imagens e arquivos como parte das mensagens
- Prompt do sistema personalizável
- Persistência de conversas e configurações em SQLite

## Configuração e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- NPM ou Yarn

### Configuração da API Gemini

1. Obtenha uma chave API em [https://ai.google.dev/](https://ai.google.dev/)
2. Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Executando o Backend

```bash
cd backend
npm install
npm run dev
```

O servidor estará disponível em `http://localhost:3001`.

### Executando o Frontend

```bash
cd frontend
npm install
npm start
```

O aplicativo estará disponível em `http://localhost:3000`.

## Estrutura do Backend

- **src/conversations**: Módulo para gerenciar conversas e mensagens
- **src/gemini**: Módulo para integração com a API Gemini
- **src/config**: Módulo para configurações do sistema
- **src/entities**: Definições de entidades do banco de dados

## Estrutura do Frontend

- **src/components**: Componentes React reutilizáveis
- **src/pages**: Páginas principais da aplicação
- **src/services**: Serviços para comunicação com o backend
- **src/styles**: Estilos globais e tema

## Licença

Este projeto está licenciado sob a licença MIT. 