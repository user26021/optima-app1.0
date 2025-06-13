import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { chatAPI } from '../services/api';
import CategorySelector from '../components/CategorySelector';
import ChatInterface from '../components/ChatInterface';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Chat = () => {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('session');
  
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categorySlug && !sessionIdFromUrl) {
      createNewSession();
    } else if (sessionIdFromUrl) {
      loadExistingSession();
    }
  }, [categorySlug, sessionIdFromUrl]);

  const createNewSession = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.createSession({
        categorySlug,
        title: `Neue ${categorySlug} Beratung`
      });
      setCurrentSession(response.data.session);
    } catch (error) {
      toast.error('Chat-Session konnte nicht erstellt werden');
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSession = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.getSession(sessionIdFromUrl);
      setCurrentSession(response.data.session);
    } catch (error) {
      toast.error('Chat-Session konnte nicht geladen werden');
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdate = () => {
    // Refresh session data if needed
    if (currentSession) {
      loadExistingSession();
    }
  };

  if (!categorySlug && !sessionIdFromUrl) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <h2>Chat auswählen</h2>
          <p>Wählen Sie eine Kategorie, um einen neuen Chat zu starten</p>
        </div>
        <CategorySelector />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chat-loading-page">
        <LoadingSpinner size="large" />
        <p>Chat wird vorbereitet...</p>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="chat-error-page">
        <h2>Chat konnte nicht geladen werden</h2>
        <p>Bitte versuchen Sie es erneut oder wählen Sie eine neue Kategorie.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="btn">
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-title">
          <h2>{currentSession.category.name}</h2>
          <span className="session-title">{currentSession.title}</span>
        </div>
        <div className="chat-actions">
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="btn btn-secondary btn-small"
          >
            Dashboard
          </button>
        </div>
      </div>
      
      <ChatInterface
        sessionId={currentSession.id}
        categorySlug={currentSession.category.slug}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  );
};

export default Chat;