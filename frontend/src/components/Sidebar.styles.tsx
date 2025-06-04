import styled from 'styled-components';
import StyledButtonBase from './common/StyledButtonBase'; // Assumindo que StyledButtonBase está aqui
import { Link } from 'react-router-dom'; // Necessário para ConversationLink

export const SidebarContainer = styled.aside`
  width: 300px;
  background-color: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
  box-shadow: var(--sidebar-shadow);
  position: relative;
  z-index: 20;
`;

export const SidebarHeader = styled.div`
  padding: 1.5rem 1rem 0rem; /* padding-bottom ajustado para 0rem */
  /* border-bottom: 1px solid var(--border-color); // Removido */
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

export const LeftActions = styled.div`
  margin-right: auto;
`;

export const RightActions = styled.div`
  margin-left: auto;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const MoreOptionsButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 0; /* Removido padding para diagnóstico */
  border: none; /* Garantir que não haja borda */
  flex-shrink: 0; /* Impedir que o botão encolha */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s ease, color 0.2s ease;

  &:hover {
    background: transparent;
    color: var(--primary-text);
  }
`;

export const NewChatButton = styled(StyledButtonBase).attrs(props => ({
  $variant: 'icon',
  $size: 'medium'
}))`
  width: 48px;
  height: 48px;
  padding: 0;
  color: var(--primary-text);
  background-color: transparent;
  border: none;
  opacity: 0.6;
  transition: background-color 0.2s ease, opacity 0.2s ease;

  svg {
    width: 20px; /* !important removido */
    height: 20px; /* !important removido */
    min-width: 20px;
    min-height: 20px;
  }

  &:hover:not(:disabled) {
    background-color: transparent;
    opacity: 1;
    border: none;
    color: var(--primary-text);
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

export const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 0; /* Removido padding lateral */
  position: relative;
`;

export const FoldersSection = styled.div`
  padding-top: 1rem;
  padding-bottom: 1rem; /* Ajustado para padronizar com SectionDivider */
  padding-left: 0; /* Garantir que não haja padding esquerdo */
  margin-bottom: 1rem; /* Ajustado para padronizar com SectionDivider */
  margin-left: 0; /* Garantir que não haja margem esquerda */
  border-bottom: 1px solid var(--border-color);
`;

export const SectionHeader = styled.h3`
  margin: 0rem 0 0.75rem 0; /* Removidas margens laterais */
  padding-left: 1rem;
  font-size: 0.75rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  /* letter-spacing: 0.5px; */ /* Removido para testar alinhamento */
`;

export const FolderItemContainer = styled.div`
  margin-bottom: 0.25rem;
  margin-left: 0; /* Garantir que não haja margem esquerda */
  padding-left: 0; /* Garantir que não haja padding esquerdo */
  width: 100%; /* Garantir que o container ocupe toda a largura */
  box-sizing: border-box; /* Garantir consistência no box model */
  position: relative;
`;

export const FolderItemHeader = styled.div<{ $active?: boolean, $isEditing?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Adicionado para alinhar itens à esquerda */
  gap: 0.5rem; /* Adicionado para espaçamento entre ícone e texto */
  padding-top: 0;
  padding-right: 1.5rem; /* Adicionado padding direito para simetria */
  padding-bottom: 0;
  padding-left: 1.5rem; /* Aplicando padding esquerdo desejado */
  margin-left: 0 !important; /* Forçar margem esquerda zero */
  border: 0 !important; /* Forçar todas as bordas zero */
  font-size: 0.85rem;
  box-sizing: border-box; /* Adicionado para garantir consistência no box model */
  width: 100%; /* Garantir que o header ocupe toda a largura */
  background-color: ${props => props.$active ? 'var(--hover-bg)' : 'transparent'};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 38px;
  position: relative; // Adicionado para que ActionButtons se posicione corretamente

  .folder-item-icon-svg {
    transform: scaleX(1.1) scaleY(0.8);
    position: relative;
    top: -2px;
    color: var(--secondary-text);
transition: color 0.2s ease; // Adicionando transição para suavidade
  }

  &:hover {
    ${MoreOptionsButton} {
      opacity: 1;
    }
.folder-item-icon-svg {
      color: var(--primary-text);
    }
  }

  ${props => props.$isEditing && `
    ${MoreOptionsButton} {
      opacity: 0 !important;
      pointer-events: none;
    }
  `}

  &::before, &::after {
    content: '';
    display: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
`;

export const FolderName = styled.span`
  display: block; /* Adicionado para garantir comportamento de bloco */
  flex: 1; /* Restaurado */
  min-width: 0; /* Adicionado para flexbox behavior */
  width: 100%; /* Adicionado para garantir largura total */
  white-space: nowrap; /* Revertido para ellipsis */
  overflow: hidden; /* Revertido para ellipsis */
  text-overflow: ellipsis;
  /* margin-left: 0.5rem; // Removido pois FolderIcon está oculto e para alinhar com padding do header */
  margin: 0 !important; /* Forçar todas as margens zero */
  padding: 0 !important; /* Forçar todos os paddings zero */
  text-align: left; /* Adicionado para garantir alinhamento do texto à esquerda */
  text-indent: 0; /* Adicionado para garantir que não haja indentação de texto */
  border: 0 !important; /* Forçar todas as bordas zero */
  box-sizing: border-box; /* Adicionado para garantir consistência no box model */
  position: relative; /* Adicionado para controle de posicionamento */
  left: 0 !important; /* Forçar offset esquerdo zero */
  direction: ltr; /* Garantir direção do texto */
  color: var(--secondary-text);
  transition: color 0.2s ease; // Adicionando transição para suavidade
  line-height: 1; /* Adicionado para normalizar a altura da linha do texto */

  &:hover {
    color: var(--primary-text);
  }

  &::before, &::after {
    content: '';
    display: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
`;

/*
export const FolderIcon = styled.span`
  display: none !important; // Ícone da pasta removido com !important
  // color: var(--accent-color);
  // display: flex;
  // align-items: center;
  // transition: transform 0.2s ease-in-out;
  // opacity: 0.85;
  // &.expanded {
  //   transform: rotate(90deg);
  // }
`;
*/

export const ConversationsInFolderList = styled.div`
  padding-left: 0.75rem; // Adiciona recuo para conversas dentro da pasta
  position: relative;

  /* &::before { // Barra vertical removida
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--border-color);
    opacity: 0.6;
  } */
`;

export const ConversationListStyled = styled.div`
  padding-top: 0.5rem; /* Revertido para valor original da referência da Divisória 1 */
  padding-bottom: 1rem; /* Mantido para espaçamento antes do SectionDivider */
`;

export const EmptyState = styled.div`
  color: var(--secondary-text);
  text-align: center;
  padding: 1rem;
  font-size: 0.85rem;
  line-height: 1.4;
`;

export const ConversationItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding-right: 1.5rem; /* Adicionado padding para o botão de opções */
  font-size: 0.85rem;
  background-color: ${props => props.$active ? 'var(--hover-bg)' : 'transparent'};
  transition: background-color 0.2s;
  position: relative;
  height: 42px;
  border-radius: 4px;

  &:hover {
    ${MoreOptionsButton} {
      opacity: 1;
    }
  }
`;

export const FolderConversationItem = styled(ConversationItem)`
  /* padding-left: 1.5rem; // Removido para herdar do ConversationItem */
  /* margin-left: 0.25rem;  // Removido; o recuo principal vem de ConversationsInFolderList */
  position: relative;
`;

export const ConversationLink = styled(Link)<{ $active?: boolean }>`
  color: ${props => props.$active ? 'var(--primary-text)' : 'var(--secondary-text)'};
  text-decoration: none;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding-left: 1.5rem;
  line-height: 1; /* Adicionado para normalizar a altura da linha do texto */

  svg {
    flex-shrink: 0; /* Garante que o ícone não encolha */
    position: relative;
    top: -2px; /* Alinha verticalmente o ícone */
  }

  .chat-item-icon-svg {
    transform: scaleY(0.9);
    /* position: relative; // Já herdado de 'svg' acima */
    top: 0px; /* Sobrescreve o top: -2px da regra 'svg' para este ícone */
  }

  &:hover {
    color: var(--primary-text);
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: absolute;
  top: calc(100% - 5px);
  right: 0.5rem;
  background-color: var(--secondary-bg);
  padding: 8px 4px;
  border-radius: 8px;
  box-shadow: var(--menu-shadow);
  z-index: 90;
  min-width: 170px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

export const ActionButton = styled(StyledButtonBase).attrs(props => ({
  $variant: 'tertiary',
  $size: 'small'
}))`
  width: 100%;
  justify-content: flex-start;
  padding: 8px 10px;
  font-size: 0.85rem;
  color: var(--primary-text); /* Alterado para primary-text para melhor visibilidade */
  background-color: transparent;
  border: none;

  &:hover:not(:disabled) {
    background-color: var(--hover-bg); /* Adicionado feedback de hover */
    color: var(--primary-text);
  }

  svg {
    color: var(--accent-color);
    opacity: 0.7;
    width: 20px !important;
    height: 20px !important;
    margin-right: 0.75rem;
  }
`;

export const SubMenuContainer = styled.div`
  position: fixed;
  min-width: 150px;
  max-width: 200px;
  background-color: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: var(--menu-shadow);
  z-index: 1000;
  padding: 4px;
  max-height: 250px;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const SubMenuItem = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 8px 10px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  border: none;
  outline: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary-text);
  }

  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
`;

export const EditForm = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  height: 100%;

  input {
    width: 100%;
    height: 24px;
    padding: 0 0.25rem;
    margin: 0;
    background-color: var(--input-bg, var(--primary-bg));
    color: var(--primary-text);
    border: 1px solid var(--accent-color);
    border-radius: 3px;
    font-size: 0.85rem;
    line-height: 1;
    outline: none;
    box-sizing: border-box;
  }
`;

export const CreateFolderForm = styled.div`
  padding: 0rem 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;

  input {
    width: calc(100% - 120px);
    margin-right: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--input-bg);
    color: var(--primary-text);
    font-size: 0.85rem;
  }
`;

export const EnhancedSubMenuItem = styled(SubMenuItem)`
  cursor: pointer;
  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const MenuButton = styled.button`
  background-color: transparent;
  color: var(--primary-text);
  border: none;
  padding: 8px 10px;
  margin: 2px 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  border-radius: 4px;

  &:hover {
    background-color: var(--hover-bg);
  }
`;

export const FolderList = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0; /* Removido padding-left */
  padding-bottom: 1rem; /* Adicionado para espaçamento antes do SectionDivider */
  margin-left: 0; /* Garantir que não haja margem esquerda */
  margin-top: 0.5rem; /* Ajustado para padronizar com Divisória 1 */
  /* border-left: 1px solid var(--border-color); */ // Barra vertical removida
`;

export const SectionDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: 1rem 1rem; /* Adiciona margem vertical e nas laterais para alinhar com o padding dos SectionHeaders */
  opacity: 0.6;
`;

export const AgentItem = styled(ConversationItem)`
  background-color: rgba(var(--accent-color-rgb), 0.05);
  border-left: 3px solid var(--accent-color);
  
  svg {
    color: var(--accent-color);
  }
  
  &:hover {
    background-color: rgba(var(--accent-color-rgb), 0.1);
  }
`;