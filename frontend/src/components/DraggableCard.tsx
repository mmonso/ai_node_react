import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggableCardProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  initialPosition?: Position;
  initialSize?: Size;
  onClose?: () => void;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  onClose,
  minWidth = 800,
  minHeight = 400,
  maxWidth,
  maxHeight,
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prevSize, setPrevSize] = useState<Size>(initialSize);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const dragStartOffset = useRef<Position>({ x: 0, y: 0 });
  const resizeStartSize = useRef<Size>({ width: 0, height: 0 });
  const resizeStartPos = useRef<Position>({ x: 0, y: 0 });

  // Limites máximos baseados no tamanho da janela
  const getMaxWidth = () => maxWidth || window.innerWidth - 40;
  const getMaxHeight = () => maxHeight || window.innerHeight - 40;

  // Carregar posição e tamanho salvos do localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(`card-${id}-position`);
    const savedSize = localStorage.getItem(`card-${id}-size`);
    const savedMinimized = localStorage.getItem(`card-${id}-minimized`);
    
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
    
    if (savedSize) {
      const parsedSize = JSON.parse(savedSize);
      setSize(parsedSize);
      setPrevSize(parsedSize);
    }
    
    if (savedMinimized) {
      setIsMinimized(JSON.parse(savedMinimized) === true);
    }
  }, [id]);

  // Salvar posição e tamanho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(`card-${id}-position`, JSON.stringify(position));
  }, [id, position]);

  useEffect(() => {
    localStorage.setItem(`card-${id}-size`, JSON.stringify(size));
  }, [id, size]);

  useEffect(() => {
    localStorage.setItem(`card-${id}-minimized`, JSON.stringify(isMinimized));
  }, [id, isMinimized]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Só arrasta se clicar no fundo do card, não nos botões ou handles
    if (
      e.target instanceof Element &&
      (e.target.classList.contains('resize-handle') ||
        e.target.closest('.resize-handle') ||
        e.target.classList.contains('card-header-button') ||
        e.target.closest('.card-header-button'))
    ) {
      return;
    }
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { ...position };
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      let newX = dragStartOffset.current.x + dx;
      let newY = dragStartOffset.current.y + dy;
      // Limitar para não sair da tela
      newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - size.height));
      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      e.preventDefault();
      const dx = e.clientX - resizeStartPos.current.x;
      const dy = e.clientY - resizeStartPos.current.y;
      let newWidth = resizeStartSize.current.width;
      let newHeight = resizeStartSize.current.height;
      let newX = position.x;
      let newY = position.y;
      if (resizeDirection?.includes('right')) {
        newWidth = Math.max(
          minWidth,
          Math.min(resizeStartSize.current.width + dx, getMaxWidth())
        );
      }
      if (resizeDirection?.includes('bottom')) {
        newHeight = Math.max(
          minHeight,
          Math.min(resizeStartSize.current.height + dy, getMaxHeight())
        );
      }
      if (resizeDirection?.includes('left')) {
        const possibleWidth = Math.max(
          minWidth,
          Math.min(resizeStartSize.current.width - dx, getMaxWidth())
        );
        if (possibleWidth !== minWidth || dx < 0) {
          newX = resizeStartPos.current.x - (possibleWidth - resizeStartSize.current.width);
          newX = Math.max(0, Math.min(newX, window.innerWidth - possibleWidth));
          newWidth = possibleWidth;
        }
      }
      if (resizeDirection?.includes('top')) {
        const possibleHeight = Math.max(
          minHeight,
          Math.min(resizeStartSize.current.height - dy, getMaxHeight())
        );
        if (possibleHeight !== minHeight || dy < 0) {
          newY = resizeStartPos.current.y - (possibleHeight - resizeStartSize.current.height);
          newY = Math.max(0, Math.min(newY, window.innerHeight - possibleHeight));
          newHeight = possibleHeight;
        }
      }
      setSize({ width: newWidth, height: newHeight });
      if (resizeDirection?.includes('left') || resizeDirection?.includes('top')) {
        setPosition({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartSize.current = { ...size };
    resizeStartPos.current = { x: position.x, y: position.y };
    e.preventDefault();
    e.stopPropagation();
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setSize(prevSize);
    } else {
      setPrevSize(size);
      setIsMinimized(true);
      setSize({ width: size.width, height: 40 });
    }
  };

  return (
    <CardContainer
      ref={cardRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      $isDragging={isDragging}
      $isResizing={isResizing}
      onMouseDown={handleMouseDown}
    >
      <CardActions>
        <CardButton className="card-header-button" onClick={toggleMinimize} title={isMinimized ? "Expandir" : "Minimizar"}>
          {isMinimized ? <span style={{fontWeight: 'bold'}}>▢</span> : <span style={{fontWeight: 'bold'}}>-</span>}
        </CardButton>
        {onClose && (
          <CardButton className="card-header-button" onClick={onClose} title="Fechar">
            ×
          </CardButton>
        )}
      </CardActions>
      {!isMinimized && <CardContent>{children}</CardContent>}
      {!isMinimized && (
        <>
          <ResizeHandle className="resize-handle top-left" onMouseDown={handleResizeStart('top-left')} style={{ top: 0, left: 0, cursor: 'nwse-resize' }} />
          <ResizeHandle className="resize-handle top" onMouseDown={handleResizeStart('top')} style={{ top: 0, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }} />
          <ResizeHandle className="resize-handle top-right" onMouseDown={handleResizeStart('top-right')} style={{ top: 0, right: 0, cursor: 'nesw-resize' }} />
          <ResizeHandle className="resize-handle right" onMouseDown={handleResizeStart('right')} style={{ top: '50%', right: 0, transform: 'translateY(-50%)', cursor: 'ew-resize' }} />
          <ResizeHandle className="resize-handle bottom-right" onMouseDown={handleResizeStart('bottom-right')} style={{ bottom: 0, right: 0, cursor: 'nwse-resize' }} />
          <ResizeHandle className="resize-handle bottom" onMouseDown={handleResizeStart('bottom')} style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }} />
          <ResizeHandle className="resize-handle bottom-left" onMouseDown={handleResizeStart('bottom-left')} style={{ bottom: 0, left: 0, cursor: 'nesw-resize' }} />
          <ResizeHandle className="resize-handle left" onMouseDown={handleResizeStart('left')} style={{ top: '50%', left: 0, transform: 'translateY(-50%)', cursor: 'ew-resize' }} />
        </>
      )}
    </CardContainer>
  );
};

const CardContainer = styled.div<{ $isDragging: boolean; $isResizing: boolean }>`
  position: absolute;
  background-color: var(--secondary-bg);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 1px solid var(--border-color);
  transition: box-shadow 0.2s ease;
  z-index: ${props => (props.$isDragging || props.$isResizing) ? 1000 : 10};
  min-width: 800px;
  min-height: 400px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  user-select: none;
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.32);
  }
`;

const CardActions = styled.div`
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const CardButton = styled.button`
  background: rgba(30,32,40,0.7);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
  transition: background 0.2s, opacity 0.2s;
  &:hover {
    background: rgba(60,60,80,0.9);
    opacity: 1;
  }
`;

const CardContent = styled.div`
  flex: 1;
  padding: 0;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
`;

const ResizeHandle = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: transparent;
  z-index: 20;
  &.top-left, &.top-right, &.bottom-left, &.bottom-right {
    width: 18px;
    height: 18px;
  }
`;

export default DraggableCard; 