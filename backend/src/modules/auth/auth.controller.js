// ============================================================
// ISIP — Auth Controller
// ============================================================

import authService from './auth.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    ApiResponse.created(res, 'Registration successful', result);
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    ApiResponse.ok(res, 'Login successful', result);
  });

  me = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    ApiResponse.ok(res, 'Profile retrieved', user);
  });

  logout = asyncHandler(async (req, res) => {
    // JWT is stateless — client discards the token
    ApiResponse.ok(res, 'Logout successful');
  });

  refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    ApiResponse.ok(res, 'Token refreshed', result);
  });
}

export default new AuthController();
