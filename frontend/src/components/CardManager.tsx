import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DraggableCard from './DraggableCard';

interface CardData {
  id: string;
  title: string;
  content: React.ReactNode;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isVisible?: boolean;
}

interface CardManagerProps {
  initialCards?: CardData[];
}

const CardManager: React.FC<CardManagerProps> = ({ initialCards = [] }) => {
  const [cards, setCards] = useState<CardData[]>(initialCards);
  const [minimizedCards, setMinimizedCards] = useState<string[]>([]);
  
  useEffect(() => {
    // Carregar cards salvos do localStorage
    const savedCards = localStorage.getItem('cards');
    if (savedCards) {
      try {
        setCards(JSON.parse(savedCards));
      } catch (error) {
        console.error('Erro ao carregar cards salvos:', error);
      }
    } else if (initialCards.length > 0) {
      // Se não houver cards salvos, use os initialCards
      setCards(initialCards);
    }
    
    // Carregar estado de minimização dos cards
    const savedMinimized = localStorage.getItem('minimizedCards');
    if (savedMinimized) {
      try {
        setMinimizedCards(JSON.parse(savedMinimized));
      } catch (error) {
        console.error('Erro ao carregar estado de minimização dos cards:', error);
      }
    }
  }, [initialCards]);
  
  // Salvar cards no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('cards', JSON.stringify(cards));
  }, [cards]);
  
  // Salvar estado de minimização dos cards
  useEffect(() => {
    localStorage.setItem('minimizedCards', JSON.stringify(minimizedCards));
  }, [minimizedCards]);
  
  const addCard = (card: CardData) => {
    setCards(prevCards => [...prevCards, { ...card, isVisible: true }]);
  };
  
  const removeCard = (id: string) => {
    setCards(prevCards => prevCards.filter(card => card.id !== id));
  };
  
  const toggleCardVisibility = (id: string) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === id 
          ? { ...card, isVisible: !card.isVisible } 
          : card
      )
    );
  };
  
  const toggleMinimizeCard = (id: string) => {
    if (minimizedCards.includes(id)) {
      setMinimizedCards(prev => prev.filter(cardId => cardId !== id));
    } else {
      setMinimizedCards(prev => [...prev, id]);
    }
  };

  return (
    <CardManagerContainer>
      {cards
        .filter(card => card.isVisible !== false)
        .map(card => (
          <DraggableCard
            key={card.id}
            id={card.id}
            title={card.title}
            initialPosition={card.position}
            initialSize={card.size}
            onClose={() => removeCard(card.id)}
          >
            {card.content}
          </DraggableCard>
        ))}
        
      <MinimizedCardsContainer>
        {cards
          .filter(card => card.isVisible === false)
          .map(card => (
            <MinimizedCardButton
              key={card.id}
              onClick={() => toggleCardVisibility(card.id)}
              title={`Mostrar ${card.title}`}
            >
              {card.title.substring(0, 1).toUpperCase()}
            </MinimizedCardButton>
          ))}
      </MinimizedCardsContainer>
      
      <AddCardButton 
        onClick={() => addCard({
          id: `card-${Date.now()}`,
          title: 'Novo Card',
          content: 'Conteúdo do novo card',
          position: { x: Math.random() * 200 + 100, y: Math.random() * 100 + 100 },
        })}
        title="Adicionar novo card"
      >
        +
      </AddCardButton>
    </CardManagerContainer>
  );
};

const CardManagerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
  
  & > * {
    pointer-events: auto;
  }
`;

const MinimizedCardsContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
`;

const MinimizedCardButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: transform 0.2s, background-color 0.2s;
 
  &:hover {
    transform: scale(1.1);
    background-color: var(--accent-hover);
  }
`;

const AddCardButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--accent-color);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: transform 0.2s, background-color 0.2s;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
    background-color: var(--accent-hover);
  }
`;

export default CardManager; 