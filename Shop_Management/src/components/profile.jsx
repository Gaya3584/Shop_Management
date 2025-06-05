import React, { useState, useEffect } from 'react';
import './profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

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
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Failed to fetch profile data');
    }
  };

  if (!user) {
    return (
      <div className="profile-container1">
        <div className="profile-card1">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading profile...
          </div>
        </div>
      </div>
    );
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
          </div>
          
          <div className="profile-basic-info1">
            <h1 className="owner-name">{user.ownerName}</h1>
            <h2 className="shop-name">{user.shopName}</h2>
            <span className="shop-type-badge">{user.shopType}</span>
          </div>
        </div>
        
        <div className="profile-details1">
          <div className="detail-section">
            <h3>Contact Information</h3>
            <div className="contact-grid">
              <div className="contact-item">
                <div className="contact-info">
                  <label>Email</label>
                  <a href={`mailto:${user.email}`} className="contact-value">
                    {user.email}
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-info">
                  <label>Phone</label>
                  <a href={`tel:${user.phone}`} className="contact-value">
                    {user.phone}
                  </a>
                </div>
              </div>
            </div>
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
                <span className="profile info-label">Owner:</span>
                <span className="profile info-value">{user.ownerName}</span>
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
          <button className="btn btn-back" onClick={() => window.history.back()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;