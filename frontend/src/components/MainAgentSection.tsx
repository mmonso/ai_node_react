import React from 'react';
import { ConversationListStyled, ConversationItem, ConversationLink } from './Sidebar.styles';
import { BotIcon } from './icons';
import { Conversation } from '../types';
import { useNavigate } from 'react-router-dom';

interface MainAgentSectionProps {
  // conversations: Conversation[]; // REMOVER
  mainAgentConversationId: string; // Manter se ainda for útil para comparação de ativo
  agentConversationDetails: Conversation | null; // NOVA PROP
  conversationId?: string; // ID da conversa ativa na URL
}

const MainAgentSection: React.FC<MainAgentSectionProps> = ({
  // conversations, // REMOVER
  mainAgentConversationId,
  agentConversationDetails, // USAR ESTA
  conversationId
}) => {
  const navigate = useNavigate();

  // const agentConversation = conversations.find(c => c.id === mainAgentConversationId); // REMOVER

  if (!agentConversationDetails) { // USAR A NOVA PROP
    return null;
  }

  return (
    <ConversationListStyled>
      <ConversationItem
        $active={conversationId === agentConversationDetails.id} // Usar ID do objeto
        onClick={() => navigate(`/chat/${agentConversationDetails.id}`)} // Usar ID do objeto
      >
        <ConversationLink to={`/chat/${agentConversationDetails.id}`}> {/* Usar ID do objeto */}
          <span style={{ marginRight: '8px', display: 'inline-flex' }}>
            <BotIcon />
          </span>
          {agentConversationDetails.title || 'Assistente IA'} {/* Usar título do objeto */}
        </ConversationLink>
      </ConversationItem>
    </ConversationListStyled>
  );
};

export default MainAgentSection;
