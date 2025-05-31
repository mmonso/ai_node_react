import { useState, useCallback } from 'react';

interface ModalState<T = null> {
  isOpen: boolean;
  data: T | null;
  openModal: (data?: T) => void;
  closeModal: () => void;
}

function useModalState<T = null>(): ModalState<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const openModal = useCallback((modalData?: T) => {
    setData(modalData || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null); // Limpa os dados ao fechar, opcional mas geralmente bom
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
  };
}

export default useModalState;