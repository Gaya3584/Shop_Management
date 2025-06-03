import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaTrash } from 'react-icons/fa';
import './settings.css';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [profileData, setProfileData] = useState({
    ownerName: '',
    shopName: '',
    shopType: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile', { 
        method: 'GET', 
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.message) {
        setError(data.message);
      } else {
        setUser(data);
        setProfileData({
          ownerName: data.ownerName || '',
          shopName: data.shopName || '',
          shopType: data.shopType || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Failed to fetch profile data');
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event) => {
    setSelectedImage(event.target.files[0]);
    if (event.target.files[0]) {
      setUploadMessage(`Selected: ${event.target.files[0].name}`);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      setUploadMessage('Please select an image first');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    try {
      const response = await fetch('http://localhost:5000/api/upload_img', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.message === 'Image uploaded successfully') {
        setUploadMessage('Image uploaded successfully!');
        await loadProfile();
        setSelectedImage(null);
      } else {
        setUploadMessage('Image upload failed.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadMessage('Error uploading image.');
    }
  };

  const handleImageDelete = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/delete_img', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.message === 'Image deleted successfully') {
        setUploadMessage('Image deleted successfully!');
        setSelectedImage(null);
        await loadProfile();
      } else {
        setUploadMessage('Image deletion failed.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadMessage('Error deleting image.');
    }
  };

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/edit_profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.message === 'Profile updated successfully') {
        setUser(data.user);
        setUploadMessage('Profile updated successfully!');
        await loadProfile();
      } else {
        setError(data.message || 'Failed to update profile');
        if (data.errors) {
          setError(data.errors.join(', '));
        }
      }
    } catch (err) {
      console.error("Update error:", err);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/change_password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.message === 'Password updated successfully') {
        setUploadMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error("Password update error:", err);
      setError('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:5000/api/delete_account', {
          method: 'DELETE',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.message === 'Account deleted successfully') {
          alert('Account deleted successfully');
          window.location.href = '/login';
        } else {
          setError(data.message || 'Failed to delete account');
        }
      } catch (err) {
        console.error("Delete account error:", err);
        setError('Failed to delete account');
      }
    }
  };

  if (!user) {
    return (
      <div className="settings-container">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Profile Image Section */}
      <section className="settings-section">
        <h3>Profile Picture</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }} className='cont1'>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}className='cont2'>
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #667eea',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
              />
            ) : (
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d',
                fontWeight: '500',
                fontSize: '14px',
                border: '3px solid #667eea'
              }}>
                No Image
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={handleCameraClick}
                className="save-btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Select Image
              </button>
              <button 
                onClick={handleImageUpload}
                className="save-btn"
                disabled={!selectedImage}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <FaUpload style={{ marginRight: '0.5rem' }} />
                Upload
              </button>
              <button 
                onClick={handleImageDelete}
                className="delete-btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <FaTrash style={{ marginRight: '0.5rem' }} />
                Delete
              </button>
            </div>
            
            {uploadMessage && (
              <p style={{
                margin: '0.5rem 0',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                color: '#2e7d32',
                border: '1px solid #c8e6c9'
              }}>
                {uploadMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Profile Information Section */}
      <section className="settings-section">
        <h3>Profile Information</h3>
        <input 
          type="text" 
          placeholder="Owner Name" 
          value={profileData.ownerName}
          onChange={(e) => handleProfileInputChange('ownerName', e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Shop Name" 
          value={profileData.shopName}
          onChange={(e) => handleProfileInputChange('shopName', e.target.value)}
        />
        <select
          value={profileData.shopType}
          onChange={(e) => handleProfileInputChange('shopType', e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '2px solid #e1e8ed',
            borderRadius: '12px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.8)',
            boxSizing: 'border-box'
          }}
        >
          <option value="">Select Shop Type</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="service">Service</option>
          <option value="restaurant">Restaurant</option>
          <option value="other">Other</option>
        </select>
        <input 
          type="email" 
          placeholder="Email" 
          value={profileData.email}
          onChange={(e) => handleProfileInputChange('email', e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Phone" 
          value={profileData.phone}
          onChange={(e) => handleProfileInputChange('phone', e.target.value)}
        />
        <button 
          className="save-btn" 
          onClick={saveProfile}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </section>

      {/* Security Section */}
      <section className="settings-section">
        <h3>Security</h3>
        <input 
          type="password" 
          placeholder="Current Password" 
          value={passwordData.currentPassword}
          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
        />
        <input 
          type="password" 
          placeholder="New Password" 
          value={passwordData.newPassword}
          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Confirm New Password" 
          value={passwordData.confirmPassword}
          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
        />
        <button 
          className="save-btn" 
          onClick={updatePassword}
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </section>

      {/* Preferences Section */}
      <section className="settings-section">
        <h3>Preferences</h3>
        <label>
          <input 
            type="checkbox" 
            checked={preferences.darkMode}
            onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
          /> 
          Enable Dark Mode
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={preferences.notifications}
            onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
          /> 
          Enable Notifications
        </label>
      </section>

      {/* Danger Zone Section */}
      <section className="settings-section">
        <h3>Danger Zone</h3>
        <button className="delete-btn" onClick={deleteAccount}>
          Delete Account
        </button>
      </section>

      {/* Error Messages */}
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 0',
          color: '#c53030'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Settings;