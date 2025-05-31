import styled from 'styled-components';
import { StyledButtonBase } from './common/StyledButtonBase';

// Aba independente que fica sempre visível
export const SidebarTab = styled.div<{ $isOpen: boolean }>`
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
  box-shadow: var(--tab-shadow);
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
export const TabArrow = styled.div<{ $isOpen: boolean }>`
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

export const SidebarContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: var(--secondary-bg);
  box-shadow: var(--model-sidebar-shadow);
  padding: 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
`;

export const SidebarHeader = styled.div`
  padding: 0.5rem 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const SidebarTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: 0.3px;
`;

export const CloseButton = styled.button`
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

export const SidebarContent = styled.div`
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

export const ModelSelect = styled.select`
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

export const Section = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0.25rem 0.5rem 0.25rem;
  font-size: 0.75rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

export const ProviderSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
`;

export const ProviderItem = styled(StyledButtonBase).attrs(props => ({
  $variant: 'icon',
  $size: 'medium'
}))<{ $selected: boolean }>`
  width: 48px;
  height: 48px;
  padding: 0;
  
  // Estilos baseados na seleção
  background-color: transparent; // Fundo sempre transparente
  color: var(--primary-text); // Cor base para todos os ícones
  border: none;
  opacity: ${props => props.$selected ? 1 : 0.3}; // Ativo: 1, Inativo base: 0.3

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
    opacity: ${props => props.$selected ? 1 : 0.6}; // Ativo hover: 1, Inativo hover: 0.6
    background-color: transparent; // Fundo sempre transparente no hover

    // Cor do ícone no hover
    color: ${props => props.$selected ? 'var(--primary-text)' : 'var(--primary-text)'}; // Ativo hover: var(--primary-text), Inativo hover: var(--primary-text)
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

export const ModelsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0;
`;

export const ModelItem = styled.div<{ $selected: boolean }>`
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

export const ModelName = styled.div`
  font-weight: 500;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: var(--primary-text);
`;

export const ModelCapabilities = styled.div`
  display: flex;
  gap: 0.35rem;
`;

export const Capability = styled.div`
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

export const EmptyMessage = styled.div`
  padding: 0.75rem;
  text-align: center;
  color: var(--secondary-text);
  font-style: italic;
  font-size: 0.85rem;
`;

export const ConfigForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.4rem 0.2rem;
  margin-bottom: 0.5rem;
`;

export const ConfigRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const ConfigLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--secondary-text);
`;

export const ConfigControl = styled.div`
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

export const ConfigValue = styled.span`
  font-size: 0.65rem;
  min-width: 1.6rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--secondary-text);
  opacity: 0.8;
`;

export const ResetButton = styled.button`
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

export const SidebarFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
`;

export const ButtonBase = styled.button`
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

export const CancelButton = styled(ButtonBase)`
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

export const SaveButton = styled(ButtonBase)`
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

export const CurrentModelInfo = styled.div`
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