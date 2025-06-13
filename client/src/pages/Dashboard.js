import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, TrendingUp, Crown, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { chatAPI } from '../services/api';
import CategorySelector from '../components/CategorySelector';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isPremium } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      const response = await chatAPI.getSessions({ limit: 5 });
      setRecentSessions(response.data.sessions);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      toast.error('Kürzliche Chats konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    navigate(`/chat/${session.category.slug}?session=${session.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Heute';
    if (diffDays === 2) return 'Gestern';
    if (diffDays <= 7) return `vor ${diffDays - 1} Tagen`;
    
    return date.toLocaleDateString('de-DE');
  };

  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'shopping':
        return '🛒';
      case 'fitness':
        return '💪';
      default:
        return '💬';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Willkommen zurück, {user?.name}! 👋</h1>
          <p>Bereit für eine neue KI-gestützte Beratung? Wählen Sie eine Kategorie oder setzen Sie einen Chat fort.</p>
        </div>

        <div className="user-stats">
          <div className="stat-card">
            <MessageCircle size={24} />
            <div>
              <span className="stat-number">{recentSessions.length}</span>
              <span className="stat-label">Aktive Chats</span>
            </div>
          </div>
          
          <div className="stat-card">
            <TrendingUp size={24} />
            <div>
              <span className="stat-number">
                {recentSessions.reduce((total, session) => total + session.message_count, 0)}
              </span>
              <span className="stat-label">Nachrichten</span>
            </div>
          </div>

          {isPremium() && (
            <div className="stat-card premium">
              <Crown size={24} />
              <div>
                <span className="stat-label">Premium</span>
                <span className="stat-sublabel">Aktiv</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="main-section">
          <CategorySelector />
        </div>

        <div className="sidebar-section">
          <div className="recent-chats">
            <div className="section-header">
              <h3>
                <Clock size={20} />
                Kürzliche Chats
              </h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/chat')}
              >
                Alle anzeigen
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <LoadingSpinner size="small" />
                <p>Lade Chats...</p>
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="sessions-list">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="session-item"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="session-icon">
                      {getCategoryIcon(session.category.slug)}
                    </div>
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <div className="session-meta">
                        <span className="category">{session.category.name}</span>
                        <span className="date">{formatDate(session.updated_at)}</span>
                      </div>
                      <div className="message-count">
                        {session.message_count} Nachrichten
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <MessageCircle size={48} />
                <h4>Noch keine Chats</h4>
                <p>Starten Sie Ihren ersten Chat, indem Sie eine Kategorie auswählen.</p>
              </div>
            )}
          </div>

          {!isPremium() && (
            <div className="premium-upgrade">
              <div className="premium-card">
                <Crown size={32} />
                <h3>Optima Premium</h3>
                <p>Erhalten Sie Zugang zu allen Features:</p>
                <ul>
                  <li>✨ Alle Kategorien</li>
                  <li>📄 Unbegrenzte PDF-Exports</li>
                  <li>🎯 Prioritäts-Support</li>
                  <li>📊 Erweiterte Analysen</li>
                </ul>
                <div className="premium-price">
                  <span className="price">0,99€</span>
                  <span className="period">/Monat</span>
                </div>
                <button className="upgrade-button">
                  Jetzt upgraden
                </button>
              </div>
            </div>
          )}

          <div className="quick-tips">
            <h3>💡 Schnell-Tipps</h3>
            <div className="tips-list">
              <div className="tip-item">
                <strong>🛒 Einkaufen:</strong> Fotografieren Sie Kassenbons für automatische Spartipps
              </div>
              <div className="tip-item">
                <strong>💪 Fitness:</strong> Lassen Sie sich individuelle Trainings- und Ernährungspläne erstellen
              </div>
              <div className="tip-item">
                <strong>📱 Tipp:</strong> Nutzen Sie spezifische Fragen für bessere Ergebnisse
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;