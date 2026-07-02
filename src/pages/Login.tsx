import React, { useState } from 'react';
import { Activity, User, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import bgImg from '../assets/bg-img.jpg';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      if (username === 'test' && password === 'test@123') {
        onLoginSuccess();
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container">
      {/* Left Column: Visual Panel */}
      <div className="login-visual">
        <img src={bgImg} alt="Platform background" className="login-visual-bg" />
        <div className="login-visual-overlay" />
        
        <div className="login-visual-content">
          <div className="login-brand">
            <Activity size={24} color="#3b82f6" strokeWidth={2.5} />
            <span className="login-brand-text">ISIP</span>
          </div>

          <div className="login-hero-text">
            <h1 className="login-hero-title">Easy to use Dashboard</h1>
            <p className="login-hero-desc">
              Real-time monitoring, AI risk indicators, and automated compliance verification in a premium control room.
            </p>
          </div>

          <div className="login-visual-footer">
            © 2026 Industrial Safety Intelligence Platform. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="login-form-container">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign In to Platform</h2>
            <p className="login-form-subtitle">Welcome back! Please enter your details.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="login-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="login-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error-message">
                <ShieldAlert size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" id="remember-me" defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link" onClick={e => e.preventDefault()}>Forgot password?</a>
            </div>

            {/* Sign In Button */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Credentials Helper Tip */}
          <div className="credentials-hint">
            <strong>System Credentials</strong>
            <div style={{ marginTop: 4 }}>
              Username: <strong>test</strong>
            </div>
            <div>
              Password: <strong>test@123</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
