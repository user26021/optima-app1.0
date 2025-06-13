import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Dumbbell, Crown, ArrowRight } from 'lucide-react';
import { categoriesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const CategorySelector = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isPremium } = useAuthStore();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Kategorien konnten nicht geladen werden');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    if (category.is_premium && !isPremium()) {
      toast.error('Premium-Zugang erforderlich für diese Kategorie');
      return;
    }
    
    navigate(`/chat/${category.slug}`);
  };

  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'shopping':
        return <ShoppingCart size={32} />;
      case 'fitness':
        return <Dumbbell size={32} />;
      default:
        return <ArrowRight size={32} />;
    }
  };

  const getCategoryColor = (slug) => {
    switch (slug) {
      case 'shopping':
        return 'from-green-500 to-emerald-600';
      case 'fitness':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-purple-500 to-pink-600';
    }
  };

  if (loading) {
    return (
      <div className="category-selector-loading">
        <LoadingSpinner />
        <p>Kategorien werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="category-selector">
      <div className="category-header">
        <h2>Wählen Sie eine Kategorie</h2>
        <p>Starten Sie eine KI-gestützte Beratung in Ihrem gewünschten Bereich</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`category-card ${category.is_premium && !isPremium() ? 'category-locked' : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            <div className={`category-icon bg-gradient-to-br ${getCategoryColor(category.slug)}`}>
              {getCategoryIcon(category.slug)}
              {category.is_premium && (
                <div className="premium-badge">
                  <Crown size={16} />
                </div>
              )}
            </div>
            
            <div className="category-content">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              
              {category.is_premium && !isPremium() && (
                <div className="premium-notice">
                  <Crown size={16} />
                  <span>Premium erforderlich</span>
                </div>
              )}
            </div>
            
            <div className="category-arrow">
              <ArrowRight size={20} />
            </div>
          </div>
        ))}
      </div>

      {!isPremium() && (
        <div className="premium-info">
          <div className="premium-card">
            <Crown size={24} />
            <h3>Optima Premium</h3>
            <p>Erhalten Sie Zugang zu allen Kategorien und erweiterten Features für nur 0,99€ pro Monat</p>
            <button className="premium-button">
              Premium upgraden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;