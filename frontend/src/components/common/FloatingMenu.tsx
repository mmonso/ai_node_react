import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'; // Adicionado useCallback
import ReactDOM from 'react-dom';
import { SubMenuContainer } from '../Sidebar.styles'; // Ajustar o caminho se necessário

interface FloatingMenuProps {
  children: React.ReactNode;
  buttonElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}

const FloatingMenu = ({ children, buttonElement, isOpen, onClose }: FloatingMenuProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (isOpen && buttonElement && menuRef.current) {
      const rect = buttonElement.getBoundingClientRect();
      const menuElement = menuRef.current;
      
      let top = rect.bottom + 2;
      let left = rect.left;

      const menuWidth = menuElement.offsetWidth;
      const menuHeight = menuElement.offsetHeight;
      // O console.log pode ser removido ou mantido para depuração fina
      // console.log('FloatingMenu dimensions for calc:', { menuWidth, menuHeight });
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left + menuWidth > viewportWidth - 5) {
        left = viewportWidth - menuWidth - 5;
      }
      if (left < 5) {
        left = 5;
      }
      if (top + menuHeight > viewportHeight - 5) {
        const topAbove = rect.top - menuHeight - 2;
        if (topAbove > 5) {
          top = topAbove;
        } else {
          top = viewportHeight - menuHeight - 5;
          if (top < 5) top = 5; // Garante que não saia do topo se for muito alto
        }
      } else if (top < 5) { // Se posicionado abaixo, mas ainda sai do topo
         top = 5;
      }
      setPosition({ top, left });
    }
  }, [isOpen, buttonElement]); // menuRef.current não é uma dependência estável para useCallback, mas calculatePosition será chamado quando necessário

  useLayoutEffect(() => {
    // Cálculo inicial da posição assim que o menu é aberto e o botão existe
    if (isOpen && buttonElement) {
      calculatePosition();
    }
  }, [isOpen, buttonElement, calculatePosition]);

  useEffect(() => {
    // Observar mudanças de tamanho do menu para recalcular a posição
    // Isso é útil se o conteúdo do menu mudar dinamicamente (ex: carregar mais itens)
    if (isOpen && menuRef.current) {
      const observer = new ResizeObserver(() => {
        // console.log('ResizeObserver triggered recalculation'); // Para depuração
        calculatePosition();
      });
      observer.observe(menuRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [isOpen, calculatePosition]); // calculatePosition é uma dependência estável devido ao useCallback

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonElement &&
        !buttonElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Adiciona o listener um pouco depois para evitar que o clique que abriu o menu o feche imediatamente
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonElement, menuRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <SubMenuContainer
      ref={menuRef}
      style={{
        position: 'fixed', // Usar fixed para posicionar relativo ao viewport
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1100, // z-index alto para garantir visibilidade
        // Os estilos base do SubMenuContainer (padding, background, etc.) vêm de Sidebar.styles.tsx
      }}
      // O onClick com stopPropagation não é mais necessário aqui, pois não há overlay pai imediato para parar.
      // Os cliques nos botões filhos devem funcionar normalmente.
    >
      {children}
    </SubMenuContainer>,
    document.body
  );
};

export default FloatingMenu;