import './SignUp.css';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ownerName: '',
    shopName: '',
    shopLocation: '',
    shopType: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner Name required';
    if (!formData.shopName.trim()) newErrors.shopName = 'Shop Name is required';
    if (!formData.shopLocation.trim()) newErrors.shopLocation = 'Shop Location is required';
    if (!formData.shopType) newErrors.shopType = 'Please select shop type';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validate()) return;

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          shopName: formData.shopName,
          shopLocation: formData.shopLocation,
          shopType: formData.shopType,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'SignUp Failed!');
      }

      setSubmitSuccess('SignUp successful! Forwarding to login...');
      setFormData({
        ownerName: '',
        shopName: '',
        shopLocation: '',
        shopType: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      navigate('/', { state: { successMessage: 'Registered successfully! Now verify your email, then login.' } });

    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signupContainer">
      <div className="rightPane">
        <div className="holographic-card">
          <form className="signupForm" onSubmit={handleSubmit}>
            <h1 id="heading">Register/Sign Up</h1>
            {submitError && <p style={{ color: "red" }}>{submitError}</p>}
            {submitSuccess && <p style={{ color: "green" }}>{submitSuccess}</p>}

            <label>Shop Owner Name:</label>
            <input
              type="text"
              name="ownerName"
              placeholder="Enter your full name: Example: John Doe"
              value={formData.ownerName}
              onChange={handleChange}
            />
            {errors.ownerName && <p style={{ color: "orange" }}>{errors.ownerName}</p>}

            <label>Shop Name:</label>
            <input
              type="text"
              name="shopName"
              placeholder="Enter your shop name: Example: Aishwarya Bakery"
              value={formData.shopName}
              onChange={handleChange}
            />
            {errors.shopName && <p style={{ color: "orange" }}>{errors.shopName}</p>}

            <label>Shop Location:</label>
            <input
              type="text"
              name="shopLocation"
              placeholder="Enter your shop location: Example: MG Road"
              value={formData.shopLocation}
              onChange={handleChange}
            />
            {errors.shopLocation && <p style={{ color: "orange" }}>{errors.shopLocation}</p>}

            <label>Shop Type:</label>
            <select
              id="shopType"
              name="shopType"
              value={formData.shopType}
              onChange={handleChange}
            >
              <option value="" disabled>--Select Whole-Sale/Retail--</option>
              <option value="Whole-Sale">Whole-Sale</option>
              <option value="Retail">Retail</option>
            </select>
            {errors.shopType && <p style={{ color: "orange" }}>{errors.shopType}</p>}

            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Eg: useremail@something.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p style={{ color: "orange" }}>{errors.email}</p>}

            <label>Phone Number:</label>
            <input
              type="tel"
              name="phone"
              placeholder="10 digit number Eg:8086370637"
              pattern="[0-9]{10}"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <p style={{ color: "orange" }}>{errors.phone}</p>}

            <label>Set Password:</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', cursor: 'pointer' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
            {errors.password && <p style={{ color: "orange" }}>{errors.password}</p>}

            <label>Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Retype previous password to confirm"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p style={{ color: "orange" }}>{errors.confirmPassword}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Submit'}
            </button>

            <label id="toLogin">
              Already have an account? Go to <Link to="/">Login</Link>
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
