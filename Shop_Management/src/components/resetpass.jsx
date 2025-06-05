import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './res.css'

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setMessage('Invalid reset link');
      setMessageType('error');
    }
  }, [token]);

  const validatePassword = (pwd) => {
    return pwd.length >= 6; // Add your password validation rules here
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || 'Password reset successful');
        setMessageType('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setMessage(data.message || 'Failed to reset password');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setMessage("Network error. Please try again.");
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <h2>Invalid Reset Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <button onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h2>Reset Your Password</h2>
      <p>Enter your new password below.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength="6"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength="6"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${messageType}`}>
          <p>{message}</p>
          {messageType === 'success' && (
            <p><small>Redirecting to login in 3 seconds...</small></p>
          )}
        </div>
      )}
      
      <div className="back-to-login">
        <button type="button" onClick={() => navigate('/')}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;