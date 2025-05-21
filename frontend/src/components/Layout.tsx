import React, { useState } from 'react';
import styled from 'styled-components';
import StyledButtonBase from './common/StyledButtonBase'; // Importar o botão base
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import ModelSidebar from './ModelSidebar';
import { useParams } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelSidebarOpen, setIsModelSidebarOpen] = useState(false);

  const toggleModelSidebar = () => {
    setIsModelSidebarOpen(!isModelSidebarOpen);
  };

  return (
    <LayoutContainer>
      <Sidebar />
      <ContentContainer $isModelSidebarOpen={isModelSidebarOpen}>
        <MainContent>
          <ContentWrapper>
            {children}
          </ContentWrapper>
        </MainContent>
        
        <ModelSidebarWrapper $isOpen={isModelSidebarOpen}>
          <ModelSidebar
            isOpen={isModelSidebarOpen}
            onClose={() => setIsModelSidebarOpen(false)}
            onToggle={toggleModelSidebar}
          />
        </ModelSidebarWrapper>
      </ContentContainer>
      
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100%;
`;

const ContentContainer = styled.div<{ $isModelSidebarOpen: boolean }>`
  display: flex;
  flex: 1;
  position: relative;
  transition: margin-right 0.3s ease;
  margin-right: ${({ $isModelSidebarOpen }) => ($isModelSidebarOpen ? '350px' : '0')};
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ModelSidebarWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform 0.3s ease;
  z-index: 1001;
`;

const ContentWrapper = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const ButtonsContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  display: flex;
  gap: 8px;
`;

const IconButton = styled(StyledButtonBase).attrs(props => ({
  variant: 'icon',
  size: 'medium'
}))`
  width: 48px;
  height: 48px;
  padding: 0; // Para garantir que width/height controlem o tamanho total
  /* background-color: var(--secondary-bg); // O variant='icon' é transparente. Descomente se quiser fundo. */
  color: var(--primary-text); // Cor padrão igual ao ícone de nova pasta
  opacity: 0.8; // Ajustado para um pouco mais de visibilidade
  font-size: 20px; // Definindo font-size para que 1em do SVG seja 20px

  /* O hover padrão do StyledButtonBase variant='icon' é:
    background-color: var(--icon-button-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
    color: var(--icon-button-hover-color, var(--accent-color, #007bff));
  */
  // Para manter o comportamento de hover original do IconButton (só muda o fundo):
  &:hover:not(:disabled) {
    background-color: var(--hover-color); // Mantém o hover de fundo original
    color: var(--accent-color); // Cor no hover igual ao ícone de nova pasta
  }

  svg {
    width: 1em !important; // SVG terá 1em de largura (50px devido ao font-size do IconButton)
    height: 1em !important; // SVG terá 1em de altura (50px devido ao font-size do IconButton)
  }
`;

const SettingsButton = styled(IconButton)`
  color: var(--primary-text);

  &:hover:not(:disabled) {
    background-color: var(--hover-bg);
    color: var(--primary-text);
  }

  &:active:not(:disabled) {
    background-color: var(--hover-bg);
    color: var(--primary-text);
  }
`;

export default Layout;