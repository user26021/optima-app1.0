import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      
      // Initialize authentication on app start
      initializeAuth: async () => {
        const { token } = get();
        if (token) {
          set({ loading: true });
          try {
            const response = await authAPI.getProfile();
            set({ 
              user: response.data.user,
              loading: false 
            });
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid token
            set({ 
              user: null, 
              token: null, 
              loading: false 
            });
          }
        }
      },

      // Login user
      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await authAPI.login(credentials);
          const { user, token } = response.data;
          
          set({ 
            user, 
            token, 
            loading: false 
          });
          
          toast.success(`Willkommen zurück, ${user.name}!`);
          return { success: true };
          
        } catch (error) {
          set({ loading: false });
          const message = error.response?.data?.error || 'Login fehlgeschlagen';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Register user
      register: async (userData) => {
        set({ loading: true });
        try {
          const response = await authAPI.register(userData);
          const { user, token } = response.data;
          
          set({ 
            user, 
            token, 
            loading: false 
          });
          
          toast.success(`Willkommen bei Optima, ${user.name}!`);
          return { success: true };
          
        } catch (error) {
          set({ loading: false });
          const message = error.response?.data?.error || 'Registrierung fehlgeschlagen';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Logout user
      logout: () => {
        set({ 
          user: null, 
          token: null 
        });
        toast.success('Erfolgreich abgemeldet');
      },

      // Update user profile
      updateProfile: async (updates) => {
        set({ loading: true });
        try {
          const response = await authAPI.updateProfile(updates);
          const updatedUser = response.data.user;
          
          set({ 
            user: updatedUser, 
            loading: false 
          });
          
          toast.success('Profil erfolgreich aktualisiert');
          return { success: true, user: updatedUser };
          
        } catch (error) {
          set({ loading: false });
          const message = error.response?.data?.error || 'Profil-Update fehlgeschlagen';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Get current token
      getToken: () => get().token,

      // Check if user is premium
      isPremium: () => get().user?.is_premium || false,
    }),
    {
      name: 'optima-auth',
      partialize: (state) => ({ 
        token: state.token,
        // Don't persist user data, fetch fresh on app load
      }),
    }
  )
);