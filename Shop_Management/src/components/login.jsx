import React, { useState, useCallback } from 'react';
import bg from '../assets/bgshop.png';
import { Link, useLocation } from 'react-router-dom';
import '../components/login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';




export default function Login() {
    const location = useLocation();
    const successMessage = location.state?.successMessage || '';
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
// Use this token to fetch user-specific data from backend


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

            // email validation
            if (!formData.email || formData.email.trim().length === 0) {
                newErrors.email = 'email is required';
            } else if (formData.email.trim().length < 3) {
                newErrors.email = 'email must be at least 3 characters long';
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
// In your login.jsx, update the handleSubmit function around line 85-95:

// Replace your handleSubmit function with this corrected version:

const [showResendOption, setShowResendOption] = useState(false);
const [resendLoading, setResendLoading] = useState(false);

const handleImageError = useCallback((e) => {
    try {
        console.warn('Background image failed to load');
        e.target.style.display = 'none';
    } catch (error) {
        console.error('Error handling image error:', error);
    }
}, []);

const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
        setIsLoading(true);
        setSubmitError('');
        setShowResendOption(false); // Reset resend option
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const loginData = {
            email: formData.email.trim(),
            password: formData.password,
            remember: formData.remember
        };
        
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (response.ok) {
            // Login successful
            console.log('Login successful, navigating to dashboard...');
            const emailToSend = formData.email.trim();
            
            setFormData({
                email: '',
                password: '',
                remember: false
            });
            
            navigate(`/dash`, {
                state: {
                    successMessage: 'Login successful!',
                    userEmail: emailToSend,
                }
            });
            
        } else {
            // Handle different error scenarios
            if (response.status === 403 && result.message === 'Email not verified') {
                setSubmitError('Please verify your email before logging in. Check your inbox for the verification link.');
                setShowResendOption(true); // Show resend option
            } else if (response.status === 401) {
                setSubmitError('Invalid email or password. Please try again.');
            } else if (response.status === 404) {
                setSubmitError('No account found with this email address.');
            } else {
                setSubmitError(result.message || 'Login failed. Please try again.');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            setSubmitError('Network error. Please check your connection and try again.');
        } else if (error.message.includes('429')) {
            setSubmitError('Too many login attempts. Please try again later.');
        } else {
            setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
}, [formData, validateForm, navigate]);

// Function to resend verification email
const handleResendVerification = useCallback(async () => {
    try {
        setResendLoading(true);
        
        const response = await fetch('http://localhost:5000/api/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: formData.email.trim() }),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            setSubmitError('Verification email sent! Please check your inbox.');
            setShowResendOption(false);
        } else {
            setSubmitError(result.message || 'Failed to resend verification email.');
        }
        
    } catch (error) {
        console.error('Resend verification error:', error);
        setSubmitError('Failed to resend verification email. Please try again.');
    } finally {
        setResendLoading(false);
    }
}, [formData.email]);

// JSX for the resend button (add this in your render method)
const ResendVerificationButton = () => (
    showResendOption && (
        <div className="mt-2 text-center">
            <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50"
            >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
        </div>
    )
);
    return (
        <div className='login-containerx'>
            <img 
                src={bg} 
                alt='Background' 
                className='background-imagex'
                onError={handleImageError}
                loading="lazy"
            />
            <div className='login-boxx'>
                <div className='login-headerx'>
                    <h1 className='login-titlex'>Sign In to Your Account</h1>
                    <hr />
                </div>
                {successMessage && <h2 className="successMessagex">{successMessage}</h2>}
                <form className='login-formx' onSubmit={handleSubmit} noValidate>
                    {submitError && (
                        <div className='error-messagex' style={{ 
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

                    <div className='input-groupx'>
                        <label htmlFor='email' className='input-labelx'>Email</label>
                        <input 
                            type='text' 
                            id='email' 
                            name='email'
                            className={`input-fieldx ${errors.email ? 'errorx' : ''}`}
                            placeholder='Enter your Email' 
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            autoComplete="email"
                            required 
                        />
                        {errors.email && (
                            <span className='field-errorx' style={{ color: '#e74c3c', fontSize: '14px' }}>
                                {errors.email}
                            </span>
                        )}
                    </div>

                    <div className='input-groupx'>
                        <label htmlFor='password' className='input-labelx'>Password</label>
                        <div style={{ position: 'relative' }}>
    <input 
        type={showPassword ? 'text' : 'password'}
        id='password' 
        name='password'
        className={`input-fieldx ${errors.password ? 'errorx' : ''}`}
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
                            <span className='field-errorx' style={{ color: '#e74c3c', fontSize: '14px' }}>
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <div className='checkbox-groupx'>
                        <label htmlFor='remember' className='remember-labelx'>
                            <input 
                                type='checkbox' 
                                id='remember' 
                                name='remember'
                                className='input-checkboxx'
                                checked={formData.remember}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                            Remember Me
                        </label>
                        <a href='/forgot-password' className='forgot-password-linkx'>
                            Forgot Password?
                        </a>
                    </div>

                    <div className='input-groupx'>
                        <button 
                            type='submit' 
                            className={`login-buttonx particle-effectx ${isLoading ? 'loadingx' : ''}`}
                            disabled={isLoading}
                        >
                            <span>{isLoading ? 'Signing In...' : 'Login'}</span>
                        </button>
                    </div>
                    <button onClick={handleResendVerification} className="btnx">Verify Email</button>

                    <div className='input-groupx'>
                        <p className='login-footerx'> Don't have an account? <Link to="/signup"> Register here</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
}