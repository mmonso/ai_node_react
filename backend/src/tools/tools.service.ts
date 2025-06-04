import { Injectable } from '@nestjs/common';
export const obterDataHoraAtualToolDefinition = {
  type: "function" as const, // Adicionando 'as const' para manter o tipo literal
  function: {
    name: "obterDataHoraAtual",
    description: "Obtém a data e hora atuais formatadas.",
    parameters: {
      type: "object" as const, // Adicionando 'as const'
      properties: {},
      required: []
    }
  }
};

export const criarEventoCalendarioToolDefinition = {
  type: "function" as const,
  function: {
    name: "criar_evento_calendario",
    description: "Cria um novo evento no calendário. Requer título, data e hora de início, e data e hora de término. A descrição é opcional.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "O título ou nome do evento."
        },
        startTime: {
          type: "string",
          description: "A data e hora de início do evento no formato ISO 8601 (ex: '2025-06-01T15:00:00.000Z')."
        },
        endTime: {
          type: "string",
          description: "A data e hora de término do evento no formato ISO 8601 (ex: '2025-06-01T16:00:00.000Z')."
        },
        description: {
          type: "string",
          description: "Uma descrição mais detalhada para o evento."
        },
      },
      required: ["title", "startTime", "endTime"]
    }
  }
};

export const listarEventosCalendarioToolDefinition = {
  type: "function" as const,
  function: {
    name: "listar_eventos_calendario",
    description: "Lista os eventos do calendário para um período específico. Requer data de início e data de fim do período.",
    parameters: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "A data de início do período para listar eventos, no formato ISO 8601 (apenas data, ex: '2025-06-01')."
        },
        endDate: {
          type: "string",
          description: "A data de fim do período para listar eventos, no formato ISO 8601 (apenas data, ex: '2025-06-02')."
        }
      },
      required: ["startDate", "endDate"]
    }
  }
};

@Injectable()
export class ToolsService {
  /**
   * Retorna a data e hora atuais formatadas.
   * @returns Uma string com a data e hora atuais (ex: "31 de maio de 2025, 15:10:30").
   */
  obterDataHoraAtual(): string {
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    // getMonth() retorna 0 para Janeiro, 1 para Fevereiro, etc.
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' });
    const ano = agora.getFullYear();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');

    return `${dia} de ${nomeMes} de ${ano}, ${horas}:${minutos}:${segundos}`;
  }
}