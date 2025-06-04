# Plano de Ação: Evolução do Chatbot para Assistente Pessoal Digital

**Visão Geral do Projeto:**

O objetivo é transformar o chatbot em um assistente pessoal digital mais integrado, acessível e proativo, através de:

1.  **Integração Profunda com Telegram:** Usar o Telegram como uma interface principal para interagir com personas específicas, mantendo o histórico sincronizado e permitindo que o bot envie mensagens proativas.
2.  **Capacidades de Ação (Chamada de Função):** Equipar o chatbot com ferramentas para interagir com sistemas externos, começando com um sistema de Calendário/Agenda e um Dashboard de Pacientes (prontuários, pagamentos, etc.) que serão desenvolvidos como parte do projeto.

---

**Fases e Etapas Detalhadas:**

**Fase 1: Fundamentos da Integração com Telegram (Sincronização de Conversa)**

*   **Meta:** Permitir que o usuário converse com uma persona específica via Telegram, com o histórico sendo salvo no banco de dados principal e refletido na interface web.
*   **Experiência do Usuário Alvo:**
    *   Configuração no sistema web de qual persona será acessível via Telegram.
    *   Comando simples no Telegram para vincular um chat específico à persona.
    *   Mensagens no chat do Telegram são processadas pela persona, respostas aparecem no Telegram.
    *   Histórico completo do diálogo do Telegram visível na interface web da persona.
*   **Etapas Principais:**
    1.  **Configuração do Bot no Telegram:**
        *   Criar bot no Telegram (via BotFather) e obter token da API.
        *   Armazenar token de forma segura no backend.
    2.  **Ajustes na Persona (Backend):**
        *   Modificar entidade `Conversation` (persona) para incluir `telegram_habilitado` (BOOLEAN) e `telegram_chat_id` (TEXT, UNIQUE).
        *   Criar migração de banco de dados.
    3.  **Módulo de Telegram no Backend:**
        *   Desenvolver `TelegramModule` para:
            *   Inicializar conexão com API do Telegram.
            *   Implementar handler para comando de vinculação (ex: `/vincular_persona ID_DA_PERSONA`) para associar `chat_id` do Telegram com ID da persona.
    4.  **Processamento de Mensagens (Backend):**
        *   `TelegramModule` recebe nova mensagem:
            *   Identifica persona vinculada ao `chat_id`.
            *   Se vinculada, salva mensagem do usuário no histórico da persona.
            *   Envia mensagem para motor de IA da persona.
            *   Salva resposta da IA no histórico da persona.
            *   Envia resposta da IA de volta ao usuário no Telegram.
    5.  **Interface de Configuração (Frontend):**
        *   Adicionar opção "Habilitar Telegram" na edição de personas.
        *   Exibir instruções para vinculação (incluindo comando do Telegram).

**Fase 2: Fundamentos da Chamada de Função (Ação Simples)**

*   **Meta:** Estabelecer o mecanismo básico para a IA solicitar a execução de uma função no backend e usar o resultado.
*   **Experiência do Usuário Alvo:**
    *   Usuário pede informação externa simples (ex: "Que horas são?").
    *   Persona usa "ferramenta" interna para obter a hora e a inclui na resposta.
*   **Etapas Principais:**
    1.  **Implementação de Função de Teste no Backend:**
        *   Criar função simples, ex: `obter_data_hora_atual()`.
    2.  **Definição da Ferramenta para a IA:**
        *   Descrever `obter_data_hora_atual()` para o modelo de IA (nome, descrição, parâmetros - nenhum neste caso).
    3.  **Adaptação do Serviço de IA (Backend):**
        *   Modificar serviço de IA (`AIResponseService`, `OpenAIService`, `GeminiService`) para:
            *   Enviar lista de ferramentas disponíveis (inicialmente, `obter_data_hora_atual`) com o prompt.
            *   Interpretar resposta da IA para solicitação de chamada da função.
            *   Se solicitado, executar `obter_data_hora_atual()` no backend.
            *   Enviar resultado da função de volta para a IA.
            *   IA usa resultado para formular resposta final.
    4.  **Testes:**
        *   Verificar se, ao perguntar as horas, a IA aciona a chamada de função.

**Fase 3: Desenvolvimento do Sistema de Calendário/Agenda com Chamada de Função**

*   **Meta:** Permitir que a IA crie, consulte e (eventualmente) modifique eventos em um sistema de calendário integrado.
*   **Experiência do Usuário Alvo:**
    *   "Persona, agende uma reunião com João sobre o projeto Alpha para amanhã às 15h."
    *   "Persona, quais são meus compromissos para hoje?"
    *   Persona interage com o calendário para realizar tarefas e confirma a ação.
*   **Etapas Principais:**
    1.  **Modelagem e Criação do Banco de Dados do Calendário:**
        *   Definir e criar tabelas (ex: `Eventos` com título, data/hora início/fim, descrição, participantes, ID da persona).
        *   Criar migrações.
    2.  **Serviços de Backend para o Calendário:**
        *   Desenvolver `CalendarService` com CRUD para eventos.
    3.  **Definição das Ferramentas de Calendário para a IA:**
        *   Descrever funções como `criar_evento_calendario`, `listar_eventos_calendario`, `atualizar_evento_calendario` (nome, descrição, parâmetros).
    4.  **Integração da Chamada de Função:**
        *   Adicionar ferramentas de calendário à lista da IA.
        *   Mapear chamadas de ferramentas da IA para métodos do `CalendarService`.
    5.  **Testes e Iteração.**

**Fase 4: Implementação da Pró-atividade (via Telegram e Calendário)**

*   **Meta:** Permitir que personas configuradas enviem mensagens proativas baseadas em tempo ou eventos do calendário.
*   **Experiência do Usuário Alvo:**
    *   Configuração de regras: "Todo dia às 21h, pergunte como foi meu dia via Telegram." / "Lembre-me dos compromissos 30 minutos antes via Telegram."
    *   Persona envia mensagens automaticamente no Telegram.
*   **Etapas Principais:**
    1.  **Modelagem e Criação da Entidade `RegraProativa`:**
        *   Campos: nome da regra, tipo de gatilho (horário fixo, evento de agenda), config. gatilho (cron, minutos antes), tipo de ação (enviar mensagem), config. ação (texto fixo ou prompt IA), ID da persona.
        *   Criar migração.
    2.  **Serviços de Backend para Regras Proativas:**
        *   Desenvolver `RegraProativaService` para gerenciar regras.
    3.  **Motor de Pró-atividade (`ProactiveEngineService`):**
        *   Processar gatilhos:
            *   "Horário fixo": Usar agendador (`node-cron`) para disparar ações.
            *   "Evento de agenda": Periodicamente verificar próximos eventos e disparar lembretes.
        *   Quando gatilho ativado, motor executa ação (envia mensagem via `TelegramService`, opcionalmente usando IA para texto).
    4.  **Interface de Configuração (Frontend):**
        *   Permitir criação e gerenciamento de regras proativas por persona.

**Fase 5: Desenvolvimento do Dashboard de Pacientes com Chamada de Função**

*   **Meta:** Permitir que a IA acesse e registre informações em um sistema de gerenciamento de pacientes.
*   **Experiência do Usuário Alvo:**
    *   "Persona, qual o telefone do paciente Carlos Silva?"
    *   "Persona, registre que o paciente João Souza realizou o pagamento da consulta de hoje."
    *   Persona interage com sistema de pacientes para fornecer/registrar dados.
*   **Etapas Principais:**
    1.  **Modelagem e Criação do Banco de Dados de Pacientes:**
        *   Definir e criar tabelas (`Pacientes`, `Consultas`, `Prontuarios`, `Pagamentos`).
        *   Criar migrações.
    2.  **Serviços de Backend para Pacientes:**
        *   Desenvolver serviços (`PacienteService`, `ConsultaService`) para interagir com tabelas.
    3.  **Definição das Ferramentas de Pacientes para a IA:**
        *   Descrever funções como `buscar_info_paciente`, `registrar_pagamento_paciente`, `adicionar_nota_prontuario` (parâmetros).
    4.  **Integração da Chamada de Função:**
        *   Adicionar ferramentas à lista da IA e mapeá-las para serviços de backend.
    5.  **Interface de Dashboard (Frontend - Opcional inicial):**
        *   Planejar e desenvolver telas para exibir dados dos pacientes.
    6.  **Testes e Iteração.**

**Fase 6: Refinamentos, Segurança e Expansão**

*   **Meta:** Melhorar robustez, usabilidade, segurança e adicionar funcionalidades avançadas.
*   **Etapas Possíveis:**
    *   Melhorar tratamento de erros e ambiguidades nas chamadas de função.
    *   Implementar confirmação para ações críticas.
    *   Refinar UI para configuração e visualização.
    *   Aprofundar aspectos de segurança e privacidade (dados de pacientes).
    *   Expandir conjunto de ferramentas e gatilhos proativos.

---

**Próximos Passos Imediatos Sugeridos:**

1.  **Focar na Fase 1, Etapa 1 e 2:** Configurar bot do Telegram e ajustes na entidade `Conversation`.
2.  **Focar na Fase 2, Etapa 1 e 2:** Implementar função de teste simples no backend e sua definição para a IA.