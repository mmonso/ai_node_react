import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getSystemPrompt, updateSystemPrompt, resetSystemPrompt } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
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
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <ButtonContainer>
              <SaveButton type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </SaveButton>
              <ResetButton type="button" onClick={handleReset} disabled={isSaving}>
                Restaurar Padrão
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
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid var(--border-color);
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
  background-color: rgba(0, 0, 0, 0.2);
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
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SaveButton = styled.button`
  flex: 2;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--accent-hover);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background-color: transparent;
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--primary-text);
    border-color: var(--secondary-text);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #f44336;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--success-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
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