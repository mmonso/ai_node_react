import React, { useState, useEffect, useRef } from 'react';
import { Model, ModelConfig } from '../types';
import {
  SidebarTab,
  TabArrow,
  SidebarContainer,
  SidebarHeader,
  CloseButton,
  SidebarContent,
  ModelSelect,
  Section,
  SectionTitle,
  ProviderSelector,
  ProviderItem,
  ConfigForm,
  ConfigRow,
  ConfigLabel,
  ConfigControl,
  ConfigValue,
  ResetButton,
  SidebarFooter,
  CancelButton,
  SaveButton,
  CurrentModelInfo
} from './ModelSidebar.styles';
import { getModels } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { StyledButtonBase } from './common/StyledButtonBase';
import { OpenAIIcon, AnthropicIcon, GoogleIcon, CloseIcon as CloseButtonIcon, ResetIcon, CancelIcon, CheckIcon } from './icons';

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
            <CloseButtonIcon />
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
                
                <ResetButton onClick={handleResetConfig} title="Restaurar Padrões">
                  <ResetIcon />
                </ResetButton>
              </ConfigForm>
            </Section>
          )}
        </SidebarContent>
        
        <SidebarFooter>
          <CancelButton onClick={onClose} disabled={isSaving || isLoadingModel} title="Cancelar">
            <CancelIcon />
          </CancelButton>
          <SaveButton
            onClick={handleSaveModelSelection}
            disabled={isSaving || isLoadingModel || !selectedModelId}
            title={isSaving || isLoadingModel ? 'Salvando...' : 'Aplicar Modelo'}
          >
            <CheckIcon />
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

export default ModelSidebar;