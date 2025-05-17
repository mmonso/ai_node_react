import React, { useState } from 'react';
import styled from 'styled-components';
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
          <ButtonsContainer>
            <SettingsButton onClick={() => setIsSettingsOpen(true)} title="Configurações">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </SettingsButton>
          </ButtonsContainer>
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

const IconButton = styled.button`
  background-color: var(--secondary-bg);
  color: var(--text-color);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  transition: background-color 0.2s;
  opacity: 0.7;
  
  &:hover {
    background-color: var(--hover-color);
  }
`;

const SettingsButton = styled(IconButton)``;

export default Layout;