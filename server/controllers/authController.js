const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { email, password, name, location } = req.body;

      // Basic validation
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password and name are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await db.run(
        'INSERT INTO users (email, password_hash, name, location) VALUES (?, ?, ?, ?)',
        [email.toLowerCase(), passwordHash, name, location || null]
      );

      // Generate JWT token
      const token = this.generateToken(result.id);

      // Get created user (without password)
      const user = await db.get(
        'SELECT id, email, name, location, is_premium, created_at FROM users WHERE id = ?',
        [result.id]
      );

      console.log(`✅ New user registered: ${email} (ID: ${result.id})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: user,
        token: token
      });

    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Get user with password hash
      const user = await db.get(
        'SELECT id, email, password_hash, name, location, is_premium, preferences FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Remove password hash from response
      delete user.password_hash;

      console.log(`✅ User logged in: ${email} (ID: ${user.id})`);

      res.json({
        success: true,
        message: 'Login successful',
        user: user,
        token: token
      });

    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await db.get(
        'SELECT id, email, name, location, is_premium, preferences, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse preferences if they exist
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      res.json({
        success: true,
        user: user
      });

    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, location, preferences } = req.body;

      const updates = {};
      const params = [];

      // Build dynamic update query
      if (name) {
        updates.name = '?';
        params.push(name);
      }

      if (location !== undefined) {
        updates.location = '?';
        params.push(location);
      }

      if (preferences) {
        updates.preferences = '?';
        params.push(JSON.stringify(preferences));
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Add updated_at and user_id
      updates.updated_at = 'CURRENT_TIMESTAMP';
      params.push(userId);

      const setClause = Object.entries(updates)
        .map(([field, placeholder]) => `${field} = ${placeholder}`)
        .join(', ');

      await db.run(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        params
      );

      // Get updated user
      const updatedUser = await db.get(
        'SELECT id, email, name, location, is_premium, preferences, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      if (updatedUser.preferences) {
        try {
          updatedUser.preferences = JSON.parse(updatedUser.preferences);
        } catch (e) {
          updatedUser.preferences = {};
        }
      }

      console.log(`✅ User profile updated: ${updatedUser.email} (ID: ${userId})`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET || 'optima-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthController();