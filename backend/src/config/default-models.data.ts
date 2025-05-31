import { Model } from '../entities/model.entity';

export const defaultModelsList: Array<Partial<Model>> = [
  // Gemini Models
  {
    provider: 'gemini',
    name: 'gemini-2.5-pro-preview-05-06',
    label: 'Gemini 2.5 Pro (05-06)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-pro-exp-03-25',
    label: 'Gemini 2.5 Pro Exp (03-25)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-pro-preview-03-25',
    label: 'Gemini 2.5 Pro Preview (03-25)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-flash-preview-04-17',
    label: 'Gemini 2.5 Flash Preview (04-17)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.0-flash', // Pode ser um alias para uma versão específica
    label: 'Gemini 2.0 Flash',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-sonnet-20240229',
    label: 'Claude 3 Sonnet (2024-02-29)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-haiku-20240307',
    label: 'Claude 3 Haiku (2024-03-07)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: false }, // Haiku geralmente não tem tool_use por padrão
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20240620',
    label: 'Claude 3.5 Sonnet (2024-06-20)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-5-haiku-20241022',
    label: 'Claude 3.5 Haiku (2024-10-22)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: false }, // Assumindo capacidades similares a outros Haiku
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet (2024-10-22)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-7-sonnet-20250219', // Assumindo que este é um futuro modelo Sonnet
    label: 'Claude 3.7 Sonnet (2025-02-19)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'openai',
    name: 'gpt-4o',
    label: 'GPT-4o',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'openai',
    name: 'gpt-4o-mini', // Verificar se este ID é oficial da OpenAI
    label: 'GPT-4o Mini',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'anthropic',
    name: 'claude-3-opus-20240229',
    label: 'Claude 3 Opus (2024-02-29)',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.0-flash-lite', // Pode ser um alias
    label: 'Gemini 2.0 Flash Lite',
    isAvailable: true,
    capabilities: { textInput: true, imageInput: false, fileInput: false, webSearch: true },
    defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  },
];