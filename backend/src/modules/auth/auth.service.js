// ============================================================
// ISIP — Auth Service
// ============================================================

import userRepository from '../users/user.repository.js';
import { hashPassword, comparePassword } from '../../utils/password.helper.js';
import { generateAuthTokens, verifyRefreshToken } from '../../utils/jwt.helper.js';
import ApiError from '../../utils/ApiError.js';

class AuthService {
  async register(data) {
    // Check if email already exists
    const existingEmail = await userRepository.findByEmail(data.email.toLowerCase());
    if (existingEmail) {
      throw ApiError.conflict('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw ApiError.conflict('Username already taken');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await userRepository.create({
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = generateAuthTokens(user);

    return { user, ...tokens };
  }

  async login(email, password) {
    // Find user with password (full record)
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Strip password
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = generateAuthTokens(userWithoutPassword);

    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Find user
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    // Generate new token pair
    const tokens = generateAuthTokens(user);
    return { user, ...tokens };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

export default new AuthService();
