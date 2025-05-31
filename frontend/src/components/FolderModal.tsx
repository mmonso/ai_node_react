import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Folder } from '../types';
import StyledButtonBase from './common/StyledButtonBase'; // Para os botões

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, systemPrompt?: string) => void;
  folderToEdit?: Folder | null | undefined; // Modificado para aceitar undefined do useModalState
}

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
`;

const ModalContent = styled.div`
  background-color: var(--primary-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--modal-shadow);
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalHeader = styled.h2`
  margin: 0;
  color: var(--primary-text);
  font-size: 1.5rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: var(--secondary-text);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--secondary-bg);
  color: var(--primary-text);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--accent-color);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--secondary-bg);
  color: var(--primary-text);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  min-height: 100px;
  resize: vertical;

  &:focus {
    border-color: var(--accent-color);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const SaveButton = styled(StyledButtonBase).attrs({ $variant: 'primary' })``;
const CancelButton = styled(StyledButtonBase).attrs({ $variant: 'secondary' })``;


const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  folderToEdit,
}) => {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setSystemPrompt(folderToEdit.systemPrompt || '');
    } else {
      // Reset para criação
      setName('');
      setSystemPrompt('');
    }
  }, [folderToEdit, isOpen]); // Resetar quando o modal abre ou folderToEdit muda

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), systemPrompt.trim() || undefined); // Envia undefined se vazio
    } else {
      // Adicionar feedback de erro se o nome estiver vazio
      alert("O nome da pasta não pode estar vazio.");
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>{folderToEdit ? 'Editar Pasta' : 'Criar Nova Pasta'}</ModalHeader>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="folderName">Nome da Pasta</Label>
            <Input
              id="folderName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ideias de Projetos"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="systemPrompt">Prompt do Sistema (Opcional)</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Ex: Você é um especialista em brainstorming de projetos de IA..."
            />
          </FormGroup>
          <ModalActions>
            <CancelButton type="button" onClick={onClose}>
              Cancelar
            </CancelButton>
            <SaveButton type="submit">
              {folderToEdit ? 'Salvar Alterações' : 'Criar Pasta'}
            </SaveButton>
          </ModalActions>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default FolderModal;