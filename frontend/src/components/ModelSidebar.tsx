import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Model, ModelConfig } from '../types';
import { getModels } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface ModelSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeModel, 
    activeModelConfig, 
    setActiveModelWithId, 
    isLoadingModel 
  } = useAppContext();

  // Efeito para atualizar o modelo selecionado quando o modelo ativo global mudar
  useEffect(() => {
    if (activeModel) {
      console.log('ModelSidebar: Atualizando com modelo ativo global:', activeModel.name);
      setSelectedModelId(activeModel.id);
      setSelectedProvider(activeModel.provider);
      setModelConfig(activeModelConfig);
    }
  }, [activeModel, activeModelConfig]);

  // Efeito para carregar os modelos disponíveis
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('ModelSidebar: Carregando modelos...');
        const allModels = await getModels();
        console.log('ModelSidebar: Modelos carregados:', allModels.length);
        setModels(allModels);
        
        // Extrair provedores únicos dos modelos
        const uniqueProviders = [...new Set(allModels.map(model => model.provider))];
        setProviders(uniqueProviders);
        console.log('ModelSidebar: Provedores disponíveis:', uniqueProviders);
        
        // Selecionar o primeiro provedor por padrão se não tiver um selecionado
        if (!selectedProvider && uniqueProviders.length > 0) {
          console.log('ModelSidebar: Selecionando provedor padrão:', uniqueProviders[0]);
          setSelectedProvider(uniqueProviders[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
      }
    };
    
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen, selectedProvider]);
  
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
    console.log(`ModelSidebar: Modelo selecionado manualmente: ${modelId}`);
    setSelectedModelId(modelId);
    const selectedModel = models.find(model => model.id === modelId);
    if (selectedModel) {
      // Se não tiver configuração personalizada ainda, usar a padrão do modelo
      if (!modelConfig) {
        console.log('ModelSidebar: Configurando com as configurações padrão do modelo');
        setModelConfig({...selectedModel.defaultConfig});
      }
    }
  };
  
  const handleSaveModelSelection = async () => {
    if (!selectedModelId || !modelConfig) {
      console.warn('ModelSidebar: Não é possível salvar - dados incompletos', { 
        selectedModelId, hasModelConfig: !!modelConfig 
      });
      return;
    }
    
    console.log(`ModelSidebar: Salvando seleção de modelo global: modelId=${selectedModelId}`);
    setIsSaving(true);
    try {
      const success = await setActiveModelWithId(selectedModelId, modelConfig);
      if (success) {
        console.log('ModelSidebar: Modelo ativo global atualizado com sucesso');
        onClose();
      } else {
        console.error('ModelSidebar: Falha ao atualizar modelo ativo global');
      }
    } catch (error) {
      console.error('Erro ao atualizar modelo ativo global:', error);
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
    <>
      {/* Aba que fica sempre visível */}
      <SidebarTab onClick={onToggle} $isOpen={isOpen}>
        <TabArrow $isOpen={isOpen} />
      </SidebarTab>
      
      {/* Conteúdo da barra lateral */}
      <SidebarContainer ref={sidebarRef}>
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
          {activeModel && (
            <CurrentModelInfo>
              <span>Modelo ativo:</span> <strong>{activeModel.label}</strong>
            </CurrentModelInfo>
          )}
          
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
          <CancelButton onClick={onClose} disabled={isSaving || isLoadingModel}>
            Cancelar
          </CancelButton>
          <SaveButton 
            onClick={handleSaveModelSelection} 
            disabled={isSaving || isLoadingModel || !selectedModelId}
          >
            {isSaving || isLoadingModel ? 'Salvando...' : 'Aplicar Modelo'}
          </SaveButton>
        </SidebarFooter>
      </SidebarContainer>
    </>
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

// Aba independente que fica sempre visível
const SidebarTab = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 50%;
  left: -20px;
  transform: translateY(-50%);
  width: 20px;
  height: 80px;
  background-color: var(--secondary-bg); /* Usando a variável de cor de fundo secundária */
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
  z-index: 1002; /* Acima da barra lateral */
  border-left: 1px solid var(--border-color); /* Adicionando borda para melhor definição */
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  
  &:hover {
    width: 24px;
    background-color: var(--hover-bg); /* Cor de hover para feedback visual */
  }
`;

// Seta dentro da aba que muda de direção
const TabArrow = styled.div<{ $isOpen: boolean }>`
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: ${({ $isOpen }) => ($isOpen ? 'none' : '8px solid var(--primary-text)')};
  border-left: ${({ $isOpen }) => ($isOpen ? '8px solid var(--primary-text)' : 'none')};
  margin-left: ${({ $isOpen }) => ($isOpen ? '2px' : '-2px')};
  opacity: 0.7;
  transition: all 0.3s ease;
`;

const SidebarContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: var(--secondary-bg);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  padding: 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
`;

const SidebarHeader = styled.div`
  padding: 0.5rem 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SidebarTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: 0.3px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--secondary-text);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0.7;
  
  &:hover {
    color: var(--primary-text);
    background-color: var(--hover-bg);
    opacity: 1;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0.25rem;
  
  /* Estilizando a barra de rolagem */
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 3px;
    opacity: 0.6;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    opacity: 0.9;
  }
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0.25rem 0.5rem;
  font-size: 0.7rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

const ProviderSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
`;

const ProviderItem = styled.button<{ $selected: boolean }>`
  background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'white' : 'var(--primary-text)')};
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--border-color)')};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${({ $selected }) => ($selected ? '500' : '400')};
  transition: all 0.2s ease;
  opacity: ${({ $selected }) => ($selected ? '1' : '0.85')};
  
  &:hover {
    background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--hover-bg)')};
    opacity: 1;
    border-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--accent-color)')};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const ModelsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0;
`;

const ModelItem = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 0.6rem;
  background-color: ${({ $selected }) => ($selected ? 'var(--hover-bg)' : 'transparent')};
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--border-color)')};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
  }
  
  &:active {
    transform: scale(0.99);
  }
`;

const ModelName = styled.div`
  font-weight: 500;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: var(--primary-text);
`;

const ModelCapabilities = styled.div`
  display: flex;
  gap: 0.35rem;
`;

const Capability = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background-color: rgba(138, 133, 255, 0.08);
  color: var(--accent-color);
  opacity: 0.85;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const EmptyMessage = styled.div`
  padding: 0.75rem;
  text-align: center;
  color: var(--secondary-text);
  font-style: italic;
  font-size: 0.85rem;
`;

const ConfigForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.4rem 0.2rem;
  margin-bottom: 0.5rem;
`;

const ConfigRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const ConfigLabel = styled.label`
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--secondary-text);
`;

const ConfigControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="range"] {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 1px;
    background: var(--border-color);
    outline: none;
    opacity: 0.7;
    
    /* Para navegadores WebKit/Blink */
    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 1px;
      background: var(--border-color);
      border-radius: 0;
      border: none;
    }
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--secondary-text);
      cursor: pointer;
      margin-top: -2.5px; /* Ajuste para centralizar o thumb */
      opacity: 0.7;
    }
    
    /* Para Firefox */
    &::-moz-range-track {
      width: 100%;
      height: 1px;
      background: var(--border-color);
      border-radius: 0;
      border: none;
    }
    
    &::-moz-range-thumb {
      width: 6px;
      height: 6px;
      border: none;
      border-radius: 50%;
      background: var(--secondary-text);
      cursor: pointer;
      opacity: 0.7;
    }
    
    /* Para IE */
    &::-ms-track {
      width: 100%;
      height: 1px;
      background: transparent;
      border-color: transparent;
      color: transparent;
    }
    
    &::-ms-thumb {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--secondary-text);
      cursor: pointer;
      opacity: 0.7;
    }
    
    &::-ms-fill-lower {
      background: var(--border-color);
    }
    
    &::-ms-fill-upper {
      background: var(--border-color);
    }
    
    &:hover {
      opacity: 0.9;
    }
    
    &:hover::-webkit-slider-thumb {
      background: var(--accent-color);
      opacity: 1;
    }
    
    &:hover::-moz-range-thumb {
      background: var(--accent-color);
      opacity: 1;
    }
    
    &:hover::-ms-thumb {
      background: var(--accent-color);
      opacity: 1;
    }
  }
`;

const ConfigValue = styled.span`
  font-size: 0.65rem;
  min-width: 1.6rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--secondary-text);
  opacity: 0.8;
`;

const ResetButton = styled.button`
  background-color: transparent;
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
  margin-top: 0.4rem;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 3px;
  
  &::before {
    content: "↺";
    font-size: 0.75rem;
  }
  
  &:hover {
    background-color: var(--hover-bg);
    color: var(--accent-color);
    border-color: var(--accent-color);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const SidebarFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
`;

const ButtonBase = styled.button`
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ButtonBase)`
  background-color: transparent;
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  
  &:hover:not(:disabled) {
    background-color: var(--hover-bg);
  }
`;

const SaveButton = styled(ButtonBase)`
  background-color: var(--accent-color);
  color: white;
  border: none;
  min-width: 100px;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const CurrentModelInfo = styled.div`
  padding: 0.6rem 0.75rem;
  margin: 0 0 0.75rem;
  background-color: var(--hover-bg);
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  
  span {
    color: var(--secondary-text);
    margin-right: 0.35rem;
  }
  
  strong {
    color: var(--accent-color);
    font-weight: 500;
  }
`;

export default ModelSidebar; 