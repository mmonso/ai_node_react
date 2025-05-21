export interface ProviderModelInfo {
  idOrName: string;
  label: string;
  description?: string;
  capabilities?: Record<string, any> | string[]; // Flexible for different provider structures
  isDefaultVersion?: boolean;
  // Add other relevant fields based on typical provider API responses
  // e.g., contextLength, pricing, inputModalities, outputModalities
  contextLength?: number;
  inputModalities?: string[];
  outputModalities?: string[];
  // It's good to have a raw field to store the original provider response for this model
  // This can be useful for debugging or future enhancements without needing to re-fetch
  raw?: any;
}

export interface ProviderApiService {
  listModels(): Promise<ProviderModelInfo[]>;
  getProviderName(): string;
}

export const PROVIDER_API_SERVICE_TOKEN = 'ProviderApiService';