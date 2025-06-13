import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Crown, User } from 'lucide-react';

const Profile = () => {
    const { user, updateProfile, loading, isPremium } = useAuthStore();
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        location: user?.location || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateProfile(profileForm);
    };

    const handleChange = (e) => {
        setProfileForm({
            ...profileForm,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="user-avatar">
                        <User size={40} />
                    </div>
                    <div className="user-info">
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                        {isPremium() && (
                            <div className="premium-badge">
                                <Crown size={16} />
                                Premium Mitglied
                            </div>
                        )}
                    </div>
                </div>

                <div className="tab-content">
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-section">
                            <h3>Persönliche Informationen</h3>

                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={profileForm.name}
                                    onChange={handleChange}
                                    placeholder="Ihr vollständiger Name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">Standort</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={profileForm.location}
                                    onChange={handleChange}
                                    placeholder="z.B. Berlin, München..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Speichern...' : 'Profil aktualisieren'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;