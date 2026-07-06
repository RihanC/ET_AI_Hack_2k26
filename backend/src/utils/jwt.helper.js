// ============================================================
// ISIP — JWT Helper
// ============================================================

import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Sign a JWT access token with user payload.
 */
export function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/**
 * Sign a JWT refresh token with user payload.
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

/**
 * Verify a JWT access token.
 */
export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

/**
 * Verify a JWT refresh token.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/**
 * Generate access + refresh token pair for a user.
 */
export function generateAuthTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  return { accessToken, refreshToken };
}
