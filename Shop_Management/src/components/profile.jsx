import React, { useState, useEffect, useRef } from 'react';
import {FaUpload, FaTrash} from 'react-icons/fa';
import './profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
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
        setEditData({
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
        await loadAll();
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
        await loadAll();
      } else {
        setUploadMessage('Image deletion failed.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadMessage('Error deleting image.');
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startEditing = () => {
    setIsEditing(true);
    setError(null);
    setUploadMessage('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      ownerName: user.ownerName || '',
      shopName: user.shopName || '',
      shopType: user.shopType || '',
      email: user.email || '',
      phone: user.phone || ''
    });
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
        body: JSON.stringify(editData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.message === 'Profile updated successfully') {
        setUser(data.user);
        setUploadMessage('Profile updated successfully!');
        setIsEditing(false); // Disable editing mode
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

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="profile-container1">
      <div className="profile-card1">
        <div className="profile-header1">
          
          <div className="profile-image-container1">
            
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="profile-image1"
              />
            ) : (
              <div className="placeholder-image">No Image</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <div className="camera-icon-container" onClick={handleCameraClick}>
              <svg className="camera-icon" viewBox="0 0 24 24">
                <path d="M12 15.2c1.6 0 3-1.3 3-3s-1.4-3-3-3s-3 1.3-3 3S10.4 15.2 12 15.2z M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"/>
              </svg>
            </div>
            
            
            <div className="button-group">

<button onClick={handleImageUpload} className="btn btn-upload">
  <FaUpload />
</button>

              <button onClick={handleImageDelete} className="btn btn-delete">
                <FaTrash />
              </button>
            </div>
            
            {uploadMessage && (
              <p className="upload-message">{uploadMessage}</p>
            )}
            
          </div>
          
          <div className="profile-basic-info1">
            {isEditing ? (
              <div className="edit-form">
                
                <input
                  type="text"
                  value={editData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  placeholder="Owner Name"
                  className="edit-input"
                />
                <input
                  type="text"
                  value={editData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  placeholder="Shop Name"
                  className="edit-input"
                />
                <select
                  value={editData.shopType}
                  onChange={(e) => handleInputChange('shopType', e.target.value)}
                  className="edit-select"
                >
                  <option value="">Select Shop Type</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="service">Service</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="other">Other</option>
                </select>
                
              </div>
            ) : (
              <>
                <h1 className="owner-name">{user.ownerName}</h1>
                <h2 className="shop-name">{user.shopName}</h2>
                <span className="shop-type-badge">{user.shopType}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="profile-details1">
          <div className="detail-section">
            <h3>Contact Information</h3>
            {isEditing ? (
              <div className="edit-contact-form">
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email"
                  className="edit-input"
                />
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Phone"
                  className="edit-input"
                />
              </div>
            ) : (
              <div className="contact-grid">
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div className="contact-info">
                    <label>Email</label>
                    <a href={`mailto:${user.email}`} className="contact-value">
                      {user.email}
                    </a>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon">📱</div>
                  <div className="contact-info">
                    <label>Phone</label>
                    <a href={`tel:${user.phone}`} className="contact-value">
                      {user.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="detail-section">
            <h3>Business Information</h3>
            <div className="business-info">
              <div className="info-row">
                <span className="info-label">Shop Name:</span>
                <span className="info-value">{user.shopName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Business Type:</span>
                <span className="info-value">{user.shopType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Owner:</span>
                <span className="info-value">{user.ownerName}</span>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message" style={{color: 'red', padding: '10px'}}>
            {error}
          </div>
        )}
        
        <div className="profile-actions1">
          {isEditing ? (
            <>
              <button 
                className="btn btn-primary" 
                onClick={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={cancelEditing}
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={startEditing}>
              Edit Profile
            </button>
          )}
          <button className="btn btn-back" onClick={() => window.history.back()}>
        Back</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
