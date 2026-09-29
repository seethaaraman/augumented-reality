import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RestaurantMenu from './components/RestaurantMenu';
import DishInfoModal from './components/DishInfoModal';
import ARView from './components/ar/ARView';
import { fetchMenu } from './services/api';

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'ar'
  const [selectedDish, setSelectedDish] = useState(null);
  const [autoLaunchCamera, setAutoLaunchCamera] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
  };

  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setIsDetailsOpen(true);
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setAutoLaunchCamera(false);
    setIsDetailsOpen(false);
  };

  return (
    <div className="app-container">
      {/* Ambient background glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {currentView === 'menu' && (
        <>
          <Header />
          <RestaurantMenu
            dishes={dishes}
            onSelectAR={handleSelectAR}
            onSelectDish={handleSelectDish}
          />
        </>
      )}

      {currentView === 'ar' && selectedDish && (
        <ARView
          dish={selectedDish}
          autoLaunch={autoLaunchCamera}
          onBack={handleBackToMenu}
          onOpenDetails={() => setIsDetailsOpen(true)}
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
    </div>
  );
}
