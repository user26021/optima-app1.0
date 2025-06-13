import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isPremium } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          Optima
        </Link>
        
        <div className="navbar-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/chat" className="nav-link">
            Chat
          </Link>
          
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User size={20} />
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <p>{user?.name}</p>
                  <small>{user?.email}</small>
                  {isPremium() && (
                    <div className="premium-badge">
                      <Crown size={12} />
                      Premium
                    </div>
                  )}
                </div>
                <hr />
                <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <Settings size={16} />
                  Profil
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  <LogOut size={16} />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;