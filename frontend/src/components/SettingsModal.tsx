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
      setTimeout(() => setSuccess(''), 3000);
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
            </SettingsSection>

            <SettingsSection>
              <SectionTitle>Tema da Interface</SectionTitle>
              <SectionDescription>
                Escolha entre o tema claro ou escuro para a aplicação.
              </SectionDescription>
              <ThemeSelectorContainer>
                <ThemeButton
                  onClick={toggleTheme}
                  aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                  title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                >
                  {theme === 'light' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  )}
                  <ThemeButtonText>
                    Mudar para Tema {theme === 'light' ? 'Escuro' : 'Claro'}
                  </ThemeButtonText>
                </ThemeButton>
              </ThemeSelectorContainer>
            </SettingsSection>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <ButtonContainer>
              <SaveButton type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar Prompt
                  </>
                )}
              </SaveButton>
              <ResetButton type="button" onClick={handleReset} disabled={isSaving}>
                Restaurar Prompt Padrão
              </ResetButton>
            </ButtonContainer>
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
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background-color: var(--secondary-bg);
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  color: var(--primary-text);
  margin: 0;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--primary-text);
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-color);
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-text);
  margin: 0;
`;

const SectionDescription = styled.p`
  color: var(--secondary-text);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const PromptTextarea = styled.textarea`
  background-color: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--primary-text);
  padding: 1rem;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
  
  &:disabled {
    opacity: 0.7;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.25rem;
  background-color: transparent;
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: transparent;
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResetButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.25rem;
  background-color: transparent;
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--primary-text);
    border-color: var(--accent-color);
    background-color: transparent;
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ThemeSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Alinha o botão à esquerda */
  margin-top: 0.5rem;
`;

const ThemeButton = styled.button`
  background-color: transparent;
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: transparent;
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  svg {
    transition: transform 0.3s ease;
  }
`;

const ThemeButtonText = styled.span`
  /* Estilos adicionais para o texto do botão, se necessário */
`;

const ErrorMessage = styled.div`
  background-color: transparent;
  border: 1px solid var(--error-color);
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
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
  background-color: transparent;
  border: 1px solid var(--success-color);
  color: var(--success-color);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
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

export default SettingsModal; 