import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Model, ModelConfig } from '../types';
import { getModels, updateConversationModel } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface ModelSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModelId?: number | null;
  currentModelConfig?: ModelConfig | null;
  conversationId?: number;
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  isOpen,
  onClose,
  currentModelId,
  currentModelConfig,
  conversationId,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(currentModelId || null);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(currentModelConfig || null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { triggerReload } = useAppContext();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const allModels = await getModels();
        setModels(allModels);
        
        // Extrair provedores únicos dos modelos
        const uniqueProviders = [...new Set(allModels.map(model => model.provider))];
        setProviders(uniqueProviders);
        
        // Selecionar o primeiro provedor por padrão se não tiver um selecionado
        if (!selectedProvider && uniqueProviders.length > 0) {
          setSelectedProvider(uniqueProviders[0]);
        }
        
        // Se tiver um modelo atual, selecionar o provedor correspondente
        if (currentModelId) {
          const currentModel = allModels.find(model => model.id === currentModelId);
          if (currentModel) {
            setSelectedProvider(currentModel.provider);
            
            // Se já tem configuração específica, usar essa, caso contrário usar a padrão do modelo
            if (currentModelConfig) {
              setModelConfig(currentModelConfig);
            } else {
              setModelConfig(currentModel.defaultConfig);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
      }
    };
    
    fetchModels();
  }, [currentModelId, currentModelConfig, selectedProvider]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  const handleSelectModel = (modelId: number) => {
    setSelectedModelId(modelId);
    const selectedModel = models.find(model => model.id === modelId);
    if (selectedModel) {
      // Se não tiver configuração personalizada ainda, usar a padrão do modelo
      if (!modelConfig) {
        setModelConfig({...selectedModel.defaultConfig});
      }
    }
  };
  
  const handleSaveModelSelection = async () => {
    if (!conversationId || !selectedModelId || !modelConfig) return;
    
    setIsSaving(true);
    try {
      await updateConversationModel(conversationId, selectedModelId, modelConfig);
      triggerReload(); // Recarregar as conversas para refletir a mudança
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar modelo da conversa:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleConfigChange = (field: keyof ModelConfig, value: number) => {
    if (!modelConfig) return;
    
    setModelConfig({
      ...modelConfig,
      [field]: value,
    });
  };
  
  const handleResetConfig = () => {
    if (!selectedModelId) return;
    
    const selectedModel = models.find(model => model.id === selectedModelId);
    if (selectedModel) {
      setModelConfig({...selectedModel.defaultConfig});
    }
  };
  
  // Filtrar modelos pelo provedor selecionado
  const filteredModels = selectedProvider
    ? models.filter(model => model.provider === selectedProvider && model.isAvailable)
    : [];

  return (
    <SidebarOverlay $isOpen={isOpen}>
      <SidebarContainer ref={sidebarRef} $isOpen={isOpen}>
        <SidebarHeader>
          <SidebarTitle>Escolha de Modelo</SidebarTitle>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SidebarHeader>
        
        <SidebarContent>
          <Section>
            <SectionTitle>Provedor</SectionTitle>
            <ProviderSelector>
              {providers.map(provider => (
                <ProviderItem 
                  key={provider}
                  $selected={provider === selectedProvider}
                  onClick={() => setSelectedProvider(provider)}
                >
                  {getProviderLabel(provider)}
                </ProviderItem>
              ))}
            </ProviderSelector>
          </Section>
          
          <Section>
            <SectionTitle>Modelos Disponíveis</SectionTitle>
            <ModelsList>
              {filteredModels.length > 0 ? (
                filteredModels.map(model => (
                  <ModelItem
                    key={model.id}
                    $selected={model.id === selectedModelId}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <ModelName>{model.label}</ModelName>
                    <ModelCapabilities>
                      {model.capabilities.textInput && (
                        <Capability title="Suporta entrada de texto">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7V4h16v3"></path>
                            <path d="M9 20h6"></path>
                            <path d="M12 4v16"></path>
                          </svg>
                        </Capability>
                      )}
                      {model.capabilities.imageInput && (
                        <Capability title="Suporta entrada de imagem">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </Capability>
                      )}
                      {model.capabilities.fileInput && (
                        <Capability title="Suporta upload de arquivos">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </Capability>
                      )}
                      {model.capabilities.webSearch && (
                        <Capability title="Suporta pesquisa na web">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </Capability>
                      )}
                    </ModelCapabilities>
                  </ModelItem>
                ))
              ) : (
                <EmptyMessage>Nenhum modelo disponível para este provedor.</EmptyMessage>
              )}
            </ModelsList>
          </Section>
          
          {selectedModelId && modelConfig && (
            <Section>
              <SectionTitle>Configurações do Modelo</SectionTitle>
              <ConfigForm>
                <ConfigRow>
                  <ConfigLabel>Temperatura:</ConfigLabel>
                  <ConfigControl>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={modelConfig.temperature} 
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    />
                    <ConfigValue>{modelConfig.temperature.toFixed(1)}</ConfigValue>
                  </ConfigControl>
                </ConfigRow>
                
                {modelConfig.topP !== undefined && (
                  <ConfigRow>
                    <ConfigLabel>Top P:</ConfigLabel>
                    <ConfigControl>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={modelConfig.topP} 
                        onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                      />
                      <ConfigValue>{modelConfig.topP.toFixed(2)}</ConfigValue>
                    </ConfigControl>
                  </ConfigRow>
                )}
                
                {modelConfig.topK !== undefined && (
                  <ConfigRow>
                    <ConfigLabel>Top K:</ConfigLabel>
                    <ConfigControl>
                      <input 
                        type="range" 
                        min="0" 
                        max="40" 
                        step="1" 
                        value={modelConfig.topK} 
                        onChange={(e) => handleConfigChange('topK', parseInt(e.target.value))}
                      />
                      <ConfigValue>{modelConfig.topK}</ConfigValue>
                    </ConfigControl>
                  </ConfigRow>
                )}
                
                <ConfigRow>
                  <ConfigLabel>Máx. Tokens:</ConfigLabel>
                  <ConfigControl>
                    <input 
                      type="range" 
                      min="100" 
                      max="8000" 
                      step="100" 
                      value={modelConfig.maxOutputTokens} 
                      onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value))}
                    />
                    <ConfigValue>{modelConfig.maxOutputTokens}</ConfigValue>
                  </ConfigControl>
                </ConfigRow>
                
                <ResetButton onClick={handleResetConfig}>
                  Restaurar Padrões
                </ResetButton>
              </ConfigForm>
            </Section>
          )}
        </SidebarContent>
        
        <SidebarFooter>
          <CancelButton onClick={onClose} disabled={isSaving}>
            Cancelar
          </CancelButton>
          <SaveButton onClick={handleSaveModelSelection} disabled={isSaving || !selectedModelId}>
            {isSaving ? 'Salvando...' : 'Aplicar Modelo'}
          </SaveButton>
        </SidebarFooter>
      </SidebarContainer>
    </SidebarOverlay>
  );
};

// Função auxiliar para obter o rótulo do provedor
function getProviderLabel(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'openai':
      return 'OpenAI';
    case 'gemini':
      return 'Google Gemini';
    case 'anthropic':
      return 'Anthropic';
    case 'deepseek':
      return 'DeepSeek';
    case 'grok':
      return 'Grok';
    default:
      return provider;
  }
}

// Estilos
const SidebarOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  transition: opacity 0.3s ease;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
`;

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background-color: var(--bg-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform 0.3s ease;
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--secondary-text);
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: var(--text-color);
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--secondary-text);
  text-transform: uppercase;
`;

const ProviderSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ProviderItem = styled.button<{ $selected: boolean }>`
  background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--secondary-bg)')};
  color: ${({ $selected }) => ($selected ? 'white' : 'var(--text-color)')};
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${({ $selected }) => ($selected ? '600' : '400')};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--hover-color)')};
  }
`;

const ModelsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ModelItem = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background-color: ${({ $selected }) => ($selected ? 'rgba(138, 133, 255, 0.1)' : 'var(--bg-color)')};
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--border-color)')};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--accent-color);
    background-color: ${({ $selected }) => ($selected ? 'rgba(138, 133, 255, 0.1)' : 'rgba(138, 133, 255, 0.05)')};
  }
`;

const ModelName = styled.div`
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const ModelCapabilities = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Capability = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(138, 133, 255, 0.1);
  color: var(--accent-color);
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: var(--secondary-text);
  font-style: italic;
`;

const ConfigForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConfigRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ConfigLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
`;

const ConfigControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  input[type="range"] {
    flex: 1;
    accent-color: var(--accent-color);
  }
`;

const ConfigValue = styled.span`
  font-size: 0.9rem;
  min-width: 2.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

const ResetButton = styled.button`
  background-color: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: rgba(138, 133, 255, 0.1);
  }
`;

const SidebarFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
`;

const ButtonBase = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ButtonBase)`
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  
  &:hover:not(:disabled) {
    background-color: var(--hover-color);
  }
`;

const SaveButton = styled(ButtonBase)`
  background-color: var(--accent-color);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: var(--accent-hover);
  }
`;

export default ModelSidebar; 