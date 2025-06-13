import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ShoppingCart, Dumbbell, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Willkommen bei Optima</h1>
          <p>Ihre KI-gestützte Beratungs-App für Alltag, Einkaufen und Fitness</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Kostenlos starten
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Anmelden
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Was Optima für Sie tun kann</h2>
          <div className="features-grid">
            <div className="feature-card">
              <ShoppingCart size={48} />
              <h3>Smart Einkaufen</h3>
              <p>Preisvergleiche, Angebote finden und Kassenbons analysieren für maximale Ersparnis</p>
            </div>
            <div className="feature-card">
              <Dumbbell size={48} />
              <h3>Fitness & Ernährung</h3>
              <p>Individuelle Trainings- und Ernährungspläne, perfekt auf Ihre Ziele abgestimmt</p>
            </div>
            <div className="feature-card">
              <Brain size={48} />
              <h3>KI-Beratung</h3>
              <p>Intelligente Empfehlungen und Tipps, die sich an Ihre Bedürfnisse anpassen</p>
            </div>
            <div className="feature-card">
              <Zap size={48} />
              <h3>Schnell & Einfach</h3>
              <p>Alles in einer App - Zeit sparen durch intelligente Automatisierung</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Bereit, Ihren Alltag zu optimieren?</h2>
          <p>Starten Sie noch heute mit Optima und entdecken Sie die Kraft der KI-Beratung</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Jetzt kostenlos registrieren
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;