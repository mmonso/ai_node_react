import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import ModelSidebar from './ModelSidebar';
import { useParams } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  currentModelId?: number | null;
  currentModelConfig?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, currentModelId, currentModelConfig }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelSidebarOpen, setIsModelSidebarOpen] = useState(false);
  const { id: conversationId } = useParams<{ id: string }>();

  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <ButtonsContainer>
          <ModelButton onClick={() => setIsModelSidebarOpen(true)} title="Escolher modelo de IA">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </ModelButton>
          <SettingsButton onClick={() => setIsSettingsOpen(true)} title="Configurações">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </SettingsButton>
        </ButtonsContainer>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
      <ModelSidebar
        isOpen={isModelSidebarOpen}
        onClose={() => setIsModelSidebarOpen(false)}
        currentModelId={currentModelId}
        currentModelConfig={currentModelConfig}
        conversationId={conversationId ? parseInt(conversationId) : undefined}
      />
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: visible;
  background-color: var(--primary-bg);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: calc(100% - 250px);
  position: relative;
`;

const ButtonsContainer = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  gap: 0.5rem;
`;

const ButtonBase = styled.button`
  background: transparent;
  padding: 0.5rem;
  border-radius: 50%;
  color: var(--secondary-text);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(138, 133, 255, 0.1);
    color: var(--accent-color);
  }

  &:focus {
    outline: 2px solid rgba(138, 133, 255, 0.3);
    outline-offset: 2px;
  }
`;

const SettingsButton = styled(ButtonBase)``;

const ModelButton = styled(ButtonBase)``;

const ContentWrapper = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default Layout; 