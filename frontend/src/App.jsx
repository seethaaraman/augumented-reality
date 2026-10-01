import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import Header from './components/Header';
import RestaurantMenu from './components/RestaurantMenu';
import DishInfoModal from './components/DishInfoModal';
import DishScanModal from './components/DishScanModal';
import ARView from './components/ar/ARView';
import { fetchMenu } from './services/api';

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'ar'
  const [selectedDish, setSelectedDish] = useState(null);
  const [autoLaunchCamera, setAutoLaunchCamera] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isARLayerMode, setIsARLayerMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const arViewRef = useRef(null);

  // 1. Initial Menu Fetch
  useEffect(() => {
    async function loadDishes() {
      setLoading(true);
      const data = await fetchMenu();
      setDishes(data);
      if (data && data.length > 0) {
        setSelectedDish(data[0]); // Default to Chicken Biryani
      }
      setLoading(false);
    }
    loadDishes();
  }, []);

  const handleSelectAR = (dish, triggerCamera = false) => {
    setSelectedDish(dish);
    setAutoLaunchCamera(triggerCamera);
    setCurrentView('ar');
    try {
      window.history.pushState({ screen: 'ar', dishId: dish?.id }, '');
    } catch (_) {}
  };

  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setIsDetailsOpen(true);
    try {
      window.history.pushState({ modal: 'details', dishId: dish?.id }, '');
    } catch (_) {}
  };

  const handleOpenScanModal = () => {
    setIsScanModalOpen(true);
    try {
      window.history.pushState({ modal: 'scan' }, '');
    } catch (_) {}
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setAutoLaunchCamera(false);
    setIsDetailsOpen(false);
    setIsARLayerMode(false);
  };

  const handleDishAdded = (newDish) => {
    setDishes((prev) => [newDish, ...prev]);
    setSelectedDish(newDish);
  };

  // UNIFIED PHONE BACK GESTURE / HARDWARE BACK HANDLER
  const handleBackGesture = useCallback(() => {
    // 1. Scan modal open
    if (isScanModalOpen) {
      setIsScanModalOpen(false);
      return true;
    }
    // 2. Details info modal open
    if (isDetailsOpen) {
      setIsDetailsOpen(false);
      return true;
    }
    // 3. Inside AR screen
    if (currentView === 'ar') {
      // If exploded culinary layers are active, collapse them first
      if (isARLayerMode) {
        if (arViewRef.current && arViewRef.current.collapseLayerMode) {
          arViewRef.current.collapseLayerMode();
        } else {
          setIsARLayerMode(false);
        }
        return true;
      }
      // Else exit AR back to main menu
      handleBackToMenu();
      return true;
    }
    // Already on root menu: return false (allows default OS exit)
    return false;
  }, [isScanModalOpen, isDetailsOpen, currentView, isARLayerMode]);

  // A. Native Android Back Gesture via Capacitor App plugin
  useEffect(() => {
    let listener = null;
    async function initCapacitorBack() {
      try {
        listener = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const wasHandled = handleBackGesture();
          if (!wasHandled) {
            CapApp.exitApp();
          }
        });
      } catch (e) {
        console.log('[App] Native back listener not available in desktop browser');
      }
    }
    initCapacitorBack();
    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [handleBackGesture]);

  // B. Browser History Popstate (Mobile Chrome gesture back / Browser Back button)
  useEffect(() => {
    const handlePopState = () => {
      handleBackGesture();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackGesture]);

  // C. Mobile Left-to-Right Edge-Swipe Gesture Listener
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isValidEdgeStart = false;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      // Triggered within 40px of left screen edge
      isValidEdgeStart = startX <= 40;
    };
    let touchStartY = 0;

    const onTouchEnd = (e) => {
      if (!isValidEdgeStart) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = Math.abs(endY - touchStartY);

      // Swipe at least 65px rightwards and predominantly horizontal
      if (deltaX > 65 && deltaY < 55) {
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(25);
          }
        } catch (_) {}
        handleBackGesture();
      }
      isValidEdgeStart = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleBackGesture]);

  return (
    <div className="app-container">
      {/* Ambient background glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {currentView === 'menu' && (
        <>
          <Header onOpenScanModal={handleOpenScanModal} />
          <RestaurantMenu
            dishes={dishes}
            onSelectAR={handleSelectAR}
            onSelectDish={handleSelectDish}
          />
        </>
      )}

      {currentView === 'ar' && selectedDish && (
        <ARView
          ref={arViewRef}
          dish={selectedDish}
          autoLaunch={autoLaunchCamera}
          onBack={handleBackToMenu}
          onOpenDetails={() => setIsDetailsOpen(true)}
          onLayerModeChange={(active) => setIsARLayerMode(active)}
        />
      )}

      {/* Floating Dish Information Modal (accessible in both Menu and AR modes) */}
      {isDetailsOpen && selectedDish && (
        <DishInfoModal
          dish={selectedDish}
          onClose={() => setIsDetailsOpen(false)}
          onSelectAR={handleSelectAR}
        />
      )}

      {/* 3D Scan & Cloudinary Add Dish Modal */}
      <DishScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onDishAdded={handleDishAdded}
      />
    </div>
  );
}
