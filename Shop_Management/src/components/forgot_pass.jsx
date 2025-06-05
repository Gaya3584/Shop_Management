import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './forg.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const res = await fetch("http://localhost:5000/api/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || 'Reset link sent to your email');
        setMessageType('success');
        setEmail(''); // Clear email field on success
      } else {
        setMessage(data.message || 'Something went wrong');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage("Network error. Please try again.");
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Your Password?</h2>
      <p>Enter your registered email address and we'll send you a link to reset your password.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" disabled={isLoading || !email.trim()}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${messageType}`}>
          <p>{message}</p>
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

export default ForgotPassword;