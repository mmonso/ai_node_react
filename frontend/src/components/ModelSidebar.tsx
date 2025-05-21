import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Model, ModelConfig } from '../types';
import { getModels } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { StyledButtonBase } from './common/StyledButtonBase';
import { OpenAIIcon, AnthropicIcon, GoogleIcon } from './icons';

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
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
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
        console.log(`ModelSidebar: Modelos carregados: ${allModels.length}`, allModels); // Log detalhado
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
  
  const handleSelectModel = (modelId: string) => {
    console.log(`ModelSidebar: Modelo selecionado com ID: ${modelId}`);
    const modelDetails = models.find(model => model.id === modelId);
    
    if (!modelDetails) {
      console.warn(`ModelSidebar: Modelo com ID ${modelId} não encontrado na lista de modelos carregados.`);
      return;
    }
    
    console.log('ModelSidebar: Detalhes do modelo encontrado para seleção:', modelDetails);
    setSelectedModelId(modelId);
    
    if (activeModel && activeModel.id === modelId && activeModelConfig) {
      console.log('ModelSidebar: Usando activeModelConfig existente para o modelo selecionado:', activeModelConfig);
      setModelConfig({ ...activeModelConfig });
    } else {
      console.log('ModelSidebar: Usando defaultConfig do modelo selecionado:', modelDetails.defaultConfig);
      setModelConfig({ ...modelDetails.defaultConfig });
    }
  };
  
  const handleSaveModelSelection = async () => {
    if (!selectedModelId || !modelConfig) {
      console.warn('ModelSidebar: Não é possível salvar - dados incompletos', {
        selectedModelId,
        hasModelConfig: !!modelConfig
      });
      return;
    }
    
    const selectedModel = models.find(model => model.id === selectedModelId);
    if (!selectedModel) {
      console.error('ModelSidebar: Modelo selecionado não encontrado na lista de modelos');
      return;
    }
    
    console.log(`ModelSidebar: Tentando salvar seleção de modelo global:`, {
      modelId: selectedModelId,
      modelName: selectedModel.name,
      modelProvider: selectedModel.provider,
      config: modelConfig
    });
    
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
            <ModelSelect value={selectedModelId || ''} onChange={(e) => handleSelectModel(e.target.value)}>
              <option value="" disabled>Selecione um modelo</option>
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))
              ) : (
                <option value="" disabled>Nenhum modelo disponível</option>
              )}
            </ModelSelect>
          </Section>
          
          {selectedModelId && modelConfig && (
            <Section>
              <SectionTitle>Configurações do Modelo</SectionTitle>
              <ConfigForm>
                <ConfigRow>
                  <ConfigLabel>Temperatura:</ConfigLabel>
                  <ConfigControl>
                    <input 
                      type="number" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={modelConfig.temperature} 
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                      style={{
                        width: '60px',
                        padding: '0.25rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-bg)',
                        color: 'var(--secondary-text)',
                        fontSize: '0.7rem',
                        textAlign: 'right',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}
                    />
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
                      type="number" 
                      min="100" 
                      max="8000" 
                      step="100" 
                      value={modelConfig.maxOutputTokens} 
                      onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '0.25rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-bg)',
                        color: 'var(--secondary-text)',
                        fontSize: '0.7rem',
                        textAlign: 'right',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}
                    />
                  </ConfigControl>
                </ConfigRow>
                
                <ResetButton onClick={handleResetConfig} title="Restaurar Padrões" />
              </ConfigForm>
            </Section>
          )}
        </SidebarContent>
        
        <SidebarFooter>
          <CancelButton onClick={onClose} disabled={isSaving || isLoadingModel} title="Cancelar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CancelButton>
          <SaveButton
            onClick={handleSaveModelSelection}
            disabled={isSaving || isLoadingModel || !selectedModelId}
            title={isSaving || isLoadingModel ? 'Salvando...' : 'Aplicar Modelo'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </SaveButton>
        </SidebarFooter>
      </SidebarContainer>
    </>
  );
};

function getProviderLabel(provider: string): string | React.ReactNode {
  switch (provider) {
    case 'openai':
      return <OpenAIIcon size={20} />;
    case 'anthropic':
      return <AnthropicIcon size={20} />;
    case 'google':
    case 'gemini': // Adicionar case para 'gemini'
      return <GoogleIcon size={20} />;
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

const ModelSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--primary-bg);
  color: var(--secondary-text);
  font-size: 0.7rem;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 0.75rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }

  option {
    color: var(--secondary-text);
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
`;

const Section = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0.25rem 0.5rem 0.25rem;
  font-size: 0.75rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

const ProviderSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
`;

const ProviderItem = styled(StyledButtonBase).attrs(props => ({
  variant: 'icon',
  size: 'medium'
}))<{ $selected: boolean }>`
  width: 48px;
  height: 48px;
  padding: 0;
  
  // Estilos baseados na seleção
  background-color: ${props => props.$selected ? 'transparent' : 'transparent'}; // Fundo transparente para ambos os estados base
  color: ${props => props.$selected ? 'var(--secondary-text)' : 'var(--primary-text)'}; // Cor do ícone é secondary-text se selecionado, senão primary-text
  border: none; // Sem borda para ambos os estados base
  opacity: ${props => props.$selected ? 1 : 0.1}; // Opacidade 0.1 se não selecionado, 1 se selecionado

  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  svg {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px;
    min-height: 24px;
  }

  &:hover:not(:disabled) {
    opacity: ${props => props.$selected ? 1 : 0.4}; // Opacidade 0.6 no hover se não selecionado, senão 1
    background-color: ${props => props.$selected ? 'transparent' : 'var(--hover-bg)'}; // Fundo transparente no hover se selecionado, senão --hover-bg

    // Estilos específicos de hover baseados na seleção
    color: ${props => props.$selected ? 'var(--secondary-text)' : 'var(--primary-text)'}; // Cor do ícone no hover é secondary-text se selecionado, senão primary-text
    // border: none; // Sem borda no hover para ambos os estados (já definido no estado base)
  }

  &:focus {
    outline: none;
    border: none;
    box-shadow: none;
  }
  
  &:focus-visible {
    outline: none;
    border: none;
    box-shadow: none;
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
  // Apply styles based on selection state
  background-color: ${({ $selected }) => ($selected ? 'transparent' : 'transparent')}; // Fundo transparente para ambos os estados base
  color: var(--primary-text); // Cor do texto é sempre primary-text
  border: none; // Sem borda para ambos os estados base
  opacity: ${({ $selected }) => ($selected ? 1 : 0.4)}; // Opacidade 1 se selecionado, 0.1 se não
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    // Apply hover styles based on selection state
    background-color: ${({ $selected }) => ($selected ? 'transparent' : 'var(--hover-bg)')}; // Fundo transparente no hover se selecionado, senão --hover-bg
    color: var(--primary-text); // Cor do texto no hover é sempre primary-text
    opacity: ${({ $selected }) => ($selected ? 1 : 0.6)}; // Opacidade 1 no hover se selecionado, 0.6 se não
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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const ConfigLabel = styled.label`
  font-size: 0.85rem;
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
  opacity: 0.6; /* Adicionada opacidade para o estado normal */
  border: none;
  padding: 0.2rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
  margin-top: 0.4rem;
  align-self: flex-end;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  &::before {
    content: "↺";
    font-size: 0.75rem;
  }
  
  &:hover {
    background-color: transparent !important; /* Força o fundo transparente, mesmo no tema escuro */
    color: var(--secondary-text); /* Alterado para cor do texto secundário no hover */
    opacity: 1; /* Ícone totalmente opaco no hover */
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
  padding: 0; /* Ajustado para botões de ícone */
  border-radius: 4px;
  /* font-weight: 500; */ /* Removido pois não há texto */
  cursor: pointer;
  transition: opacity 0.2s ease, color 0.2s ease, transform 0.1s ease; /* Ajustada transição */
  /* font-size: 0.85rem; */ /* Removido pois não há texto */
  width: 32px; /* Largura padrão para botões de ícone */
  height: 32px; /* Altura padrão para botões de ícone */
  display: flex; /* Para centralizar o ícone */
  align-items: center; /* Para centralizar o ícone */
  justify-content: center; /* Para centralizar o ícone */

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ButtonBase)`
  background-color: transparent !important;
  color: var(--secondary-text);
  border: none;
  opacity: 0.6;
  
  &:hover:not(:disabled) {
    color: var(--secondary-text);
    opacity: 1;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const SaveButton = styled(ButtonBase)`
  background-color: transparent !important;
  color: var(--secondary-text);
  border: none;
  opacity: 0.6;
  /* min-width: 100px; */ /* Removido */
  
  &:hover:not(:disabled) {
    color: var(--secondary-text);
    opacity: 1;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const CurrentModelInfo = styled.div`
  padding: 0.6rem 0.25rem;
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  color: var(--secondary-text);
  
  span {
    color: var(--secondary-text);
    margin-right: 0.35rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
  
  strong {
    color: var(--secondary-text);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
`;

export default ModelSidebar; 