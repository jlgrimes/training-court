'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  darkModeAtom,
  sidebarOpenAtom,
  mobileMenuOpenAtom,
  toastsAtom,
  modalsAtom,
  loadingOverlayAtom,
  activeTabAtom,
  scrollPositionAtom,
  Toast,
  Modal,
} from '../atoms/ui';
import {
  activeToastsSelector,
  openModalsSelector,
  themeSelector,
  isAnyModalOpenSelector,
} from '../selectors/ui';

export function useUI() {
  const [darkMode, setDarkMode] = useRecoilState(darkModeAtom);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenAtom);
  const [mobileMenuOpen, setMobileMenuOpen] = useRecoilState(mobileMenuOpenAtom);
  const [toasts, setToasts] = useRecoilState(toastsAtom);
  const [modals, setModals] = useRecoilState(modalsAtom);
  const [loadingOverlay, setLoadingOverlay] = useRecoilState(loadingOverlayAtom);
  const [activeTab, setActiveTab] = useRecoilState(activeTabAtom);
  const [scrollPositions, setScrollPositions] = useRecoilState(scrollPositionAtom);
  
  const activeToasts = useRecoilValue(activeToastsSelector);
  const openModals = useRecoilValue(openModalsSelector);
  const isAnyModalOpen = useRecoilValue(isAnyModalOpenSelector);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = uuidv4();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }
    
    return id;
  }, [setToasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, [setToasts]);

  const showSuccessToast = useCallback((message: string) => {
    return showToast({
      type: 'success',
      description: message,
    });
  }, [showToast]);

  const showErrorToast = useCallback((message: string) => {
    return showToast({
      type: 'error',
      description: message,
    });
  }, [showToast]);

  const openModal = useCallback((modal: Omit<Modal, 'id' | 'isOpen'>) => {
    const id = uuidv4();
    const newModal: Modal = {
      id,
      isOpen: true,
      ...modal,
    };
    
    setModals(prev => [...prev, newModal]);
    return id;
  }, [setModals]);

  const closeModal = useCallback((id: string) => {
    setModals(prev => 
      prev.map(modal => modal.id === id ? { ...modal, isOpen: false } : modal)
    );
    
    setTimeout(() => {
      setModals(prev => prev.filter(modal => modal.id !== id));
    }, 300);
  }, [setModals]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, [setDarkMode]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, [setSidebarOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, [setMobileMenuOpen]);

  const saveScrollPosition = useCallback((key: string, position: number) => {
    setScrollPositions(prev => ({ ...prev, [key]: position }));
  }, [setScrollPositions]);

  const getScrollPosition = useCallback((key: string) => {
    return scrollPositions[key] || 0;
  }, [scrollPositions]);

  return {
    darkMode,
    sidebarOpen,
    mobileMenuOpen,
    toasts: activeToasts,
    modals: openModals,
    loadingOverlay,
    activeTab,
    isAnyModalOpen,
    setDarkMode,
    setSidebarOpen,
    setMobileMenuOpen,
    setLoadingOverlay,
    setActiveTab,
    showToast,
    dismissToast,
    showSuccessToast,
    showErrorToast,
    openModal,
    closeModal,
    toggleDarkMode,
    toggleSidebar,
    toggleMobileMenu,
    saveScrollPosition,
    getScrollPosition,
  };
}