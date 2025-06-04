import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Conversation } from '../types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    systemPrompt: string | null
  ) => void;
  personaToEdit?: Conversation | null;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #282c34;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: var(--modal-shadow);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ModalTitle = styled.h2`
  color: #61dafb;
  margin-bottom: 15px;
  text-align: center;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #f0f0f0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px; // Espaço entre o checkbox e o texto
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #61dafb; // Cor do checkbox quando marcado
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #3a3f4b;
  color: #f0f0f0;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;

const ReadOnlyInput = styled(Input)`
  background-color: #333; // Um pouco diferente para indicar que é readonly
  cursor: not-allowed;
`;

const InstructionsSection = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #3a3f4b;
  border-radius: 4px;
  border: 1px solid #444;
  color: #f0f0f0;
  font-size: 0.9rem;

  p {
    margin-bottom: 10px;
    line-height: 1.4;
  }

  code {
    background-color: #282c34;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', Courier, monospace;
  }

  strong {
    color: #61dafb;
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #3a3f4b;
  color: #f0f0f0;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &.primary {
    background-color: #61dafb;
    color: #282c34;
    &:hover {
      background-color: #4fa3d1;
    }
  }

  &.secondary {
    background-color: #555;
    color: #f0f0f0;
    &:hover {
      background-color: #666;
    }
  }
`;

const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, onSave, personaToEdit }) => {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (personaToEdit) {
      setName(personaToEdit.title); // Personas usam 'title' como nome
      setSystemPrompt(personaToEdit.systemPrompt || '');
    } else {
      setName('');
      setSystemPrompt('');
    }
  }, [personaToEdit, isOpen]);

  const handleSave = () => {
    onSave(name, systemPrompt || null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{personaToEdit ? 'Editar Persona' : 'Criar Nova Persona'}</ModalTitle>
        <FormGroup>
          <Label htmlFor="personaName">Nome da Persona:</Label>
          <Input
            id="personaName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da persona"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="systemPrompt">System Prompt (Opcional):</Label>
          <TextArea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Defina um prompt de sistema para esta persona"
          />
        </FormGroup>

        {/* Seção de Integração com Telegram REMOVIDA */}

        <ButtonContainer>
          <Button className="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="primary" onClick={handleSave}>
            Salvar
          </Button>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PersonaModal;