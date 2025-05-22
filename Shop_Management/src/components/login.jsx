import React, { useState, useCallback } from 'react';
import bg from '../assets/bgshop.png';
import '../components/login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showPassword, setShowPassword] = useState(false);


    // Input change handler with error handling
    const handleInputChange = useCallback((e) => {
        try {
            const { name, value, type, checked } = e.target;
            const inputValue = type === 'checkbox' ? checked : value;
            
            setFormData(prev => ({
                ...prev,
                [name]: inputValue
            }));

            // Clear field-specific error when user starts typing
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        } catch (error) {
            console.error('Error handling input change:', error);
        }
    }, [errors]);

    // Form validation
    const validateForm = useCallback(() => {
        try {
            const newErrors = {};

            // Username validation
            if (!formData.username || formData.username.trim().length === 0) {
                newErrors.username = 'Username is required';
            } else if (formData.username.trim().length < 3) {
                newErrors.username = 'Username must be at least 3 characters long';
            }

            // Password validation
            if (!formData.password || formData.password.length === 0) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters long';
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        } catch (error) {
            console.error('Error validating form:', error);
            setSubmitError('An error occurred during validation. Please try again.');
            return false;
        }
    }, [formData]);

    // Form submission handler
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        try {
            setIsLoading(true);
            setSubmitError('');

            // Validate form
            if (!validateForm()) {
                return;
            }

            // Simulate API call - replace with your actual login logic
            const loginData = {
                username: formData.username.trim(),
                password: formData.password,
                remember: formData.remember
            };

            // Example API call (replace with your actual implementation)
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Login failed: ${response.status}`);
            }

            const result = await response.json();
            
            // Handle successful login
            console.log('Login successful:', result);
            
            // Store token if provided
            if (result.token) {
                if (formData.remember) {
                    localStorage.setItem('authToken', result.token);
                } else {
                    sessionStorage.setItem('authToken', result.token);
                }
            }

            // Redirect or update app state
            // window.location.href = '/dashboard'; // or use React Router
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle different types of errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setSubmitError('Network error. Please check your connection and try again.');
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                setSubmitError('Invalid username or password. Please try again.');
            } else if (error.message.includes('429')) {
                setSubmitError('Too many login attempts. Please try again later.');
            } else {
                setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm]);

    // Image error handler
    const handleImageError = useCallback((e) => {
        try {
            console.warn('Background image failed to load');
            e.target.style.display = 'none';
        } catch (error) {
            console.error('Error handling image error:', error);
        }
    }, []);
    

    return (
        <div className='login-container'>
            <img 
                src={bg} 
                alt='Background' 
                className='background-image'
                onError={handleImageError}
                loading="lazy"
            />
            <div className='login-box'>
                <div className='login-header'>
                    <h1 className='login-title'>Sign In to Your Account</h1>
                    <hr />
                </div>
                
                <form className='login-form' onSubmit={handleSubmit} noValidate>
                    {submitError && (
                        <div className='error-message' style={{ 
                            color: '#e74c3c', 
                            backgroundColor: '#fdf2f2', 
                            padding: '10px', 
                            borderRadius: '4px', 
                            marginBottom: '15px',
                            border: '1px solid #fecaca'
                        }}>
                            {submitError}
                        </div>
                    )}

                    <div className='input-group'>
                        <label htmlFor='username' className='input-label'>Username</label>
                        <input 
                            type='text' 
                            id='username' 
                            name='username'
                            className={`input-field ${errors.username ? 'error' : ''}`}
                            placeholder='Enter your username' 
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            autoComplete="username"
                            required 
                        />
                        {errors.username && (
                            <span className='field-error' style={{ color: '#e74c3c', fontSize: '14px' }}>
                                {errors.username}
                            </span>
                        )}
                    </div>

                    <div className='input-group'>
                        <label htmlFor='password' className='input-label'>Password</label>
                        <div style={{ position: 'relative' }}>
    <input 
        type={showPassword ? 'text' : 'password'}
        id='password' 
        name='password'
        className={`input-field ${errors.password ? 'error' : ''}`}
        placeholder='Enter your password' 
        value={formData.password}
        onChange={handleInputChange}
        disabled={isLoading}
        autoComplete="current-password"
        required 
    />
    <span 
        onClick={() => setShowPassword(!showPassword)} 
        style={{
            position: 'absolute',
            top: '50%',
            right: '16px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#666'
        }}
    >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
</div>

                        {errors.password && (
                            <span className='field-error' style={{ color: '#e74c3c', fontSize: '14px' }}>
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <div className='checkbox-group'>
                        <label htmlFor='remember' className='remember-label'>
                            <input 
                                type='checkbox' 
                                id='remember' 
                                name='remember'
                                className='input-checkbox'
                                checked={formData.remember}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                            Remember Me
                        </label>
                        <a href='/forgot-password' className='forgot-password-link'>
                            Forgot Password?
                        </a>
                    </div>

                    <div className='input-group'>
                        <button 
                            type='submit' 
                            className={`login-button particle-effect ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            <span>{isLoading ? 'Signing In...' : 'Login'}</span>
                        </button>
                    </div>

                    <div className='input-group'>
                        <p className='login-footer'>
                            Don't have an account? 
                            <a href='/register' className='register-link'> Register here</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}