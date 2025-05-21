import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components'; // Adicionado css
import { getSystemPrompt, updateSystemPrompt, resetSystemPrompt } from '../services/api';
import { useTheme } from '../context/ThemeContext'; // Importar useTheme

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme(); // Usar o contexto do tema
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const prompt = await getSystemPrompt();
        setSystemPrompt(prompt);
      } catch (error) {
        console.error('Erro ao carregar system prompt:', error);
        setError('Não foi possível carregar o prompt do sistema.');
      }
    };
    
    fetchSystemPrompt();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateSystemPrompt(systemPrompt);
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setError('Não foi possível salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await resetSystemPrompt();
      const prompt = await getSystemPrompt();
      setSystemPrompt(prompt);
      setSuccess('Prompt do sistema redefinido para o padrão!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao redefinir prompt:', error);
      setError('Não foi possível redefinir o prompt do sistema.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer ref={modalRef}>
        <ModalHeader>
          <ModalTitle>Configurações</ModalTitle>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          <SettingsForm onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <SettingsSection>
              <SectionTitle>Prompt do Sistema</SectionTitle>
              <SectionDescription>
                Defina as instruções que controlam o comportamento do chatbot. 
                Este prompt é enviado no início de cada conversa.
              </SectionDescription>
              
              <PromptTextarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Insira um prompt para definir a personalidade e comportamento do chatbot..."
                rows={8}
                disabled={isSaving}
              />

              <ButtonContainer>
                <SaveButton type="submit" disabled={isSaving} title="Salvar Prompt">
                  {isSaving ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  )}
                </SaveButton>
                <ResetButton type="button" onClick={handleReset} disabled={isSaving} title="Restaurar Prompt Padrão">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                </ResetButton>
              </ButtonContainer>
            </SettingsSection>

            <SettingsSection>
              <SectionTitle>Tema da Interface</SectionTitle>
              <SectionDescription>
                Escolha entre o tema claro ou escuro para a aplicação.
              </SectionDescription>
              <ThemeSelectorContainer>
                <ThemeButton
                  type="button"
                  $active={theme === 'dark'}
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  aria-label="Mudar para tema escuro"
                  title="Mudar para tema escuro"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </ThemeButton>
                <ThemeButton
                  type="button"
                  $active={theme === 'light'}
                  onClick={() => theme !== 'light' && toggleTheme()}
                  aria-label="Mudar para tema claro"
                  title="Mudar para tema claro"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </ThemeButton>
              </ThemeSelectorContainer>
            </SettingsSection>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </SettingsForm>
        </ModalContent>
        
        {success && (
          <SuccessMessage>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </SuccessMessage>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background-color: var(--secondary-bg);
  border-radius: 8px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--secondary-bg);
`;

const ModalTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  margin: 0;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  opacity: 0.7;
  
  &:hover {
    color: var(--primary-text);
    opacity: 1;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  
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

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--secondary-bg);
  border-radius: 4px;
`;

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin: 0;
`;

const SectionDescription = styled.p`
  font-size: 0.75rem;
  color: var(--secondary-text);
  margin: 0;
  line-height: 1.5;
`;

const PromptTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--secondary-bg);
  color: var(--primary-text);
  font-size: 0.85rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: var(--secondary-text);
    opacity: 0.7;
  }
`;

const ThemeSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ButtonBase = styled.button`
  background-color: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  
  &:hover:not(:disabled) {
    background-color: transparent !important;
  }
  
  &:active:not(:disabled) {
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  &:focus {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }

  &:focus-visible {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }

  &:focus-within {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }
`;

const ThemeButton = styled(ButtonBase)<{ $active?: boolean }>`
  color: ${props => props.$active ? 'var(--primary-text)' : 'var(--secondary-text)'};
  padding: 0.6rem;
  border-radius: 4px;
  cursor: ${props => props.$active ? 'default' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: ${props => props.$active ? 1 : 0.7};
  
  &:hover:not(:disabled) {
    color: ${props => props.$active ? 'var(--primary-text)' : 'var(--primary-text)'};
    opacity: ${props => props.$active ? 1 : 1};
    background-color: ${props => props.$active ? 'transparent !important' : 'transparent !important'};
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorMessage = styled.div`
  background-color: var(--error-bg);
  border: 1px solid var(--error-color);
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: "⚠️";
  }
`;

const SuccessMessage = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--success-bg);
  border: 1px solid var(--success-color);
  color: var(--success-color);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
  justify-content: flex-end;
`;

const SaveButton = styled(ButtonBase)`
  color: var(--secondary-text);
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;
  
  &:hover:not(:disabled) {
    color: var(--primary-text);
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ResetButton = styled(ButtonBase)`
  color: var(--secondary-text);
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;
  
  &:hover:not(:disabled) {
    color: var(--primary-text);
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export default SettingsModal; 