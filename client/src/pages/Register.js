import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        location: ''
    });
    const { register, loading } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await register(formData);
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
                    <h2>Optima Account erstellen</h2>
                    <p>Registrieren Sie sich kostenlos!</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Ihr Name"
                        />
                    </div>

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
                            minLength={6}
                            placeholder="Mindestens 6 Zeichen"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Standort (optional)</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="z.B. Berlin, München..."
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Registrieren...' : 'Kostenlos registrieren'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Bereits registriert? <Link to="/login">Hier anmelden</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;