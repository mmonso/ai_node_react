import React from 'react'; // Adicionado import do React
import styled, { css } from 'styled-components';

export interface StyledButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'icon';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean; // Nova propriedade para botões que ocupam 100% da largura
}

// --- Variáveis de Cor (Exemplos - Ajustar conforme o tema do projeto) ---
// É crucial que estas variáveis CSS existam no seu tema global ou sejam definidas aqui com fallbacks.
// Usando sugestões de UX para cores e comportamentos.

// Cores base (exemplos, idealmente viriam de --accent-color, --secondary-bg etc. do tema)
const ACCENT_COLOR = 'var(--accent-color, #007bff)'; // Azul padrão como fallback
const ACCENT_COLOR_DARK = 'var(--accent-color-dark, #0056b3)';
const ACCENT_COLOR_DARKER = 'var(--accent-color-darker, #004085)';
const ACCENT_COLOR_RGB = 'var(--accent-color-rgb, 0, 123, 255)'; // Para rgba
const TEXT_ON_ACCENT = 'var(--text-color-on-accent, #ffffff)';

const SECONDARY_BG = 'var(--button-secondary-base-bg, var(--secondary-bg, #f0f2f5))'; // Um cinza claro para tema claro
const SECONDARY_TEXT = 'var(--button-secondary-base-text, var(--primary-text, #212529))';
const SECONDARY_BORDER = 'var(--button-secondary-base-border, var(--border-color, #ced4da))';

const SECONDARY_HOVER_BG = 'var(--button-secondary-hover-base-bg, #e2e6ea)';
const SECONDARY_HOVER_BORDER = 'var(--button-secondary-hover-base-border, #adb5bd)';

const SECONDARY_ACTIVE_BG = 'var(--button-secondary-active-base-bg, #d6dbdf)';

const TERTIARY_TEXT = 'var(--button-tertiary-base-text, var(--accent-color, #007bff))';
const TERTIARY_HOVER_BG = 'var(--button-tertiary-hover-base-bg, rgba('+ACCENT_COLOR_RGB+ ', 0.08))';
const TERTIARY_HOVER_TEXT = 'var(--button-tertiary-hover-base-text, var(--accent-color-dark, #0056b3))';

const ICON_BUTTON_COLOR = 'var(--icon-button-base-color, var(--secondary-text, #6c757d))';
const ICON_BUTTON_HOVER_BG = 'var(--icon-button-hover-base-bg, rgba(0,0,0,0.04))'; // Um hover bem sutil
const ICON_BUTTON_HOVER_COLOR = 'var(--icon-button-hover-base-color, var(--accent-color, #007bff))';

const FOCUS_RING_COLOR = 'var(--focus-ring-color, rgba('+ACCENT_COLOR_RGB+', 0.35))';

const DISABLED_OPACITY = 'var(--disabled-opacity, 0.65)';
const DISABLED_BG = 'var(--disabled-bg, #e9ecef)';
const DISABLED_TEXT = 'var(--disabled-text, #6c757d)';


const primaryStyles = css`
  background-color: ${ACCENT_COLOR};
  color: ${TEXT_ON_ACCENT};
  border: 1px solid ${ACCENT_COLOR};

  &:hover:not(:disabled) {
    background-color: ${ACCENT_COLOR_DARK};
    border-color: ${ACCENT_COLOR_DARK};
  }

  &:active:not(:disabled) {
    background-color: ${ACCENT_COLOR_DARKER};
    border-color: ${ACCENT_COLOR_DARKER};
  }
`;

const secondaryStyles = css`
  background-color: ${SECONDARY_BG};
  color: ${SECONDARY_TEXT};
  border: 1px solid ${SECONDARY_BORDER};

  &:hover:not(:disabled) {
    background-color: ${SECONDARY_HOVER_BG};
    border-color: ${SECONDARY_HOVER_BORDER};
  }

  &:active:not(:disabled) {
    background-color: ${SECONDARY_ACTIVE_BG};
    border-color: ${SECONDARY_ACTIVE_BG}; // Ou manter o hover border
  }
`;

const tertiaryStyles = css`
  background-color: transparent;
  color: ${TERTIARY_TEXT};
  border: 1px solid transparent;

  &:hover:not(:disabled) {
    background-color: ${TERTIARY_HOVER_BG};
    color: ${TERTIARY_HOVER_TEXT};
  }
`;

const iconButtonStyles = css`
  background-color: transparent;
  color: ${ICON_BUTTON_COLOR};
  border: none;
  padding: 0.5rem;
  border-radius: 50%;

  &:hover:not(:disabled) {
    background-color: ${ICON_BUTTON_HOVER_BG};
    color: ${ICON_BUTTON_HOVER_COLOR};
  }
`;

const sizeStyles = (props: StyledButtonBaseProps) => {
  switch (props.size) {
    case 'small':
      return css`
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
        // Para botões de ícone pequenos, o padding do iconButtonStyles pode ser suficiente
        // ou podemos ajustar aqui se props.variant === 'icon'
        ${props.variant === 'icon' && css`padding: 0.4rem;`}
      `;
    case 'large':
      return css`
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        ${props.variant === 'icon' && css`padding: 0.6rem;`}
      `;
    case 'medium':
    default:
      return css`
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        ${props.variant === 'icon' && css`padding: 0.5rem;`}
      `;
  }
};

export const StyledButtonBase = styled.button<StyledButtonBaseProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  white-space: nowrap;
  user-select: none; // Impede seleção de texto dentro do botão

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${FOCUS_RING_COLOR};
  }

  &:disabled {
    opacity: ${DISABLED_OPACITY};
    cursor: not-allowed;
    background-color: var(--button-disabled-bg, ${DISABLED_BG}); // Permitir override via tema
    color: var(--button-disabled-text, ${DISABLED_TEXT});
    border-color: var(--button-disabled-border, ${DISABLED_BG}); // Borda da mesma cor do fundo desabilitado
  }

  // Aplica variante de estilo
  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return primaryStyles;
      case 'secondary':
        return secondaryStyles;
      case 'tertiary':
        return tertiaryStyles;
      case 'icon':
        return iconButtonStyles;
      default:
        return secondaryStyles; // Padrão para 'secondary' se nenhuma variante for especificada
    }
  }}

  // Aplica estilos de tamanho
  ${sizeStyles}

  // Aplica largura total se especificado
  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}
  
  // Para ícones dentro de botões com texto
  svg {
    margin-right: ${(props) => (props.children && typeof props.children !== 'string' && React.Children.count(props.children) > 1 && props.variant !== 'icon' ? '0.5em' : '0')};
    // Adiciona margem apenas se houver texto E não for um botão de ícone puro
    width: 1em; // Tamanho padrão do ícone relativo ao font-size do botão
    height: 1em;
    vertical-align: middle;
  }
`;

export default StyledButtonBase;