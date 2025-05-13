import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AppContextType {
  reloadTrigger: number; // Um contador para disparar reloads
  triggerReload: () => void; // Função para incrementar o contador
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Função estável para disparar o reload incrementando o contador
  const triggerReload = useCallback(() => {
    console.log("AppContext: Disparando reload (incrementando trigger)...");
    setReloadTrigger(prev => prev + 1);
  }, []);

  return (
    // Fornece o contador e a função para dispará-lo
    <AppContext.Provider value={{ reloadTrigger, triggerReload }}>
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