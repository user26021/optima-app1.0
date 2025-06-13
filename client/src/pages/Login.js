import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-page">
      <div className="form-container">
        <div className="auth-header">
          <h2>Bei Optima anmelden</h2>
          <p>Willkommen zurück! Melden Sie sich an, um fortzufahren.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ihre.email@beispiel.de"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Ihr Passwort"
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Anmelden...
              </>
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Noch kein Account? <Link to="/register">Hier registrieren</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;