import React from 'react';
import styled from 'styled-components';
import DraggableCard from './DraggableCard';

interface ChatWorkspaceCardProps {
  sidebar: React.ReactNode;
  chat: React.ReactNode;
  rightSidebar: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose?: () => void;
}

const ChatWorkspaceCard: React.FC<ChatWorkspaceCardProps> = ({
  sidebar,
  chat,
  rightSidebar,
  initialPosition = { x: 80, y: 40 },
  initialSize = { width: 1100, height: 650 },
  onClose,
}) => {
  return (
    <DraggableCard
      id="chat-workspace-card"
      title="Chat AI"
      initialPosition={initialPosition}
      initialSize={initialSize}
      minWidth={800}
      minHeight={400}
      onClose={onClose}
    >
      <WorkspaceBody>
        <SidebarArea>
          {sidebar}
        </SidebarArea>
        <ChatArea>
          {chat}
        </ChatArea>
        <RightSidebarArea>
          {rightSidebar}
        </RightSidebarArea>
      </WorkspaceBody>
    </DraggableCard>
  );
};

const WorkspaceBody = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  background: rgba(30, 32, 40, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 0 0 16px 16px;
  overflow: hidden;
`;

const SidebarArea = styled.div`
  width: 220px;
  min-width: 180px;
  max-width: 260px;
  background: rgba(24, 26, 32, 0.85);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 0 0;
  background: transparent;
  overflow: hidden;
`;

const RightSidebarArea = styled.div`
  width: 300px;
  min-width: 220px;
  max-width: 350px;
  background: rgba(24, 26, 32, 0.85);
  border-left: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

export default ChatWorkspaceCard; 