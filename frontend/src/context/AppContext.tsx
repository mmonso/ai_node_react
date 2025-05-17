import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Model, ModelConfig } from '../types';
import { getActiveModel, setActiveModel as apiSetActiveModel, updateActiveModelConfig as apiUpdateActiveModelConfig } from '../services/api';

interface AppContextType {
  reloadTrigger: number; // Um contador para disparar reloads
  triggerReload: () => void; // Função para incrementar o contador
  activeModel: Model | null;
  activeModelConfig: ModelConfig | null;
  setActiveModelWithId: (modelId: number, config?: ModelConfig) => Promise<boolean>;
  updateActiveConfig: (config: ModelConfig) => Promise<boolean>;
  isLoadingModel: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [activeModelConfig, setActiveModelConfig] = useState<ModelConfig | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);

  // Função estável para disparar o reload incrementando o contador
  const triggerReload = useCallback(() => {
    console.log("AppContext: Disparando reload (incrementando trigger)...");
    setReloadTrigger(prev => prev + 1);
  }, []);

  // Carregar o modelo ativo ao iniciar
  useEffect(() => {
    const loadActiveModel = async () => {
      setIsLoadingModel(true);
      try {
        const { model, config } = await getActiveModel();
        console.log('AppContext: Modelo ativo carregado:', model?.name);
        setActiveModel(model);
        setActiveModelConfig(config);
      } catch (error) {
        console.error('AppContext: Erro ao carregar modelo ativo:', error);
      } finally {
        setIsLoadingModel(false);
      }
    };

    loadActiveModel();
  }, []);

  // Função para definir o modelo ativo
  const setActiveModelWithId = useCallback(async (modelId: number, config?: ModelConfig): Promise<boolean> => {
    setIsLoadingModel(true);
    try {
      const result = await apiSetActiveModel(modelId, config);
      if (result.model) {
        console.log(`AppContext: Modelo ativo definido para ${result.model.name}`);
        setActiveModel(result.model);
        setActiveModelConfig(result.config);
        triggerReload(); // Recarregar para refletir a mudança
        return true;
      }
      return false;
    } catch (error) {
      console.error('AppContext: Erro ao definir modelo ativo:', error);
      return false;
    } finally {
      setIsLoadingModel(false);
    }
  }, [triggerReload]);

  // Função para atualizar apenas a configuração do modelo ativo
  const updateActiveConfig = useCallback(async (config: ModelConfig): Promise<boolean> => {
    try {
      const success = await apiUpdateActiveModelConfig(config);
      if (success) {
        console.log('AppContext: Configuração do modelo ativo atualizada');
        setActiveModelConfig(config);
        return true;
      }
      return false;
    } catch (error) {
      console.error('AppContext: Erro ao atualizar configuração do modelo ativo:', error);
      return false;
    }
  }, []);

  return (
    // Fornece o contador e a função para dispará-lo
    <AppContext.Provider value={{ 
      reloadTrigger, 
      triggerReload,
      activeModel,
      activeModelConfig,
      setActiveModelWithId,
      updateActiveConfig,
      isLoadingModel
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};