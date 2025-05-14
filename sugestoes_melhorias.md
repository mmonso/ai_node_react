# Sugestões de Melhorias - Projeto Gemini Chatbot

## Implementações Recentes

1. **Grounding Nativo com Google Search**
   - Implementado o grounding nativo do Gemini API com Google Search para respostas mais precisas e atualizadas
   - Adicionado suporte para exibição de fontes, citações e sugestões de pesquisa no frontend
   - Removido o módulo manual de web-search, utilizando agora a funcionalidade oficial da API

## Novas Funcionalidades para Implementar

1. **Edição de Conversas**
   - Funcionalidade para editar mensagens do usuário após terem sido enviadas
   - Possibilidade de editar ou regenerar respostas do assistente
   - Sistema de versionamento para acompanhar alterações feitas em conversas
   - Opção para marcar versões específicas como favoritas

2. **Histórico de Prompts do Sistema**
   - Sistema para salvar e recuperar prompts do sistema favoritos
   - Possibilidade de criar templates de prompts para tarefas específicas

3. **Personalização Estética**
   - Temas Hitech, Sand e Eco
   - Fonte, tamanho e espaçamento


## Melhorias em Funcionalidades Existentes


1. **Gerenciamento de Pastas Melhorado**
   - Adicionar suporte para subpastas
   - Funcionalidade de arrastar e soltar para reorganizar conversas


2. **Configurações Avançadas de Modelo**
   - Interface mais amigável para ajustar os parâmetros do modelo (temperatura, top-p, etc.), possivelmente numa barra lateral direita retrátil
   - Presets de configurações para diferentes tipos de tarefas (criativo, preciso, técnico)
   - Feedback visual sobre como cada parâmetro afeta as respostas

3. **Suporte a Múltiplos Modelos**
   - Adicionar suporte para outros modelos além do Gemini (como GPT, Claude, Llama)