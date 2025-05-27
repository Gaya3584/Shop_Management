import React from 'react';
import './profile.css';

const Profile = () => {
  return (
    <div className="profile-container1">
      <div className="profile-card1">
        <div className="profile-header1">
          <div className="profile-image-container1">
            <img 
              src="/api/placeholder/150/150" 
              alt="Profile" 
              className="profile-image1"
            />
          </div>
          <div className="profile-basic-info1">
            <h1 className="owner-name">Lakshmi Menon</h1>
            <h2 className="shop-name">Gaya3 Bakery</h2>
            <span className="shop-type-badge">Retail</span>
          </div>
        </div>
        
        <div className="profile-details1">
          <div className="detail-section">
            <h3>Contact Information</h3>
            <div className="contact-grid">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-info">
                  <label>Email</label>
                  <a href="mailto:lakshmimenon2020cps@gmail.com" className="contact-value">
                    lakshmimenon2020cps@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div className="contact-info">
                  <label>Phone</label>
                  <a href="tel:8086370637" className="contact-value">
                    +91 80863 70637
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
                <span className="info-value">Gaya3 Bakery</span>
              </div>
              <div className="info-row">
                <span className="info-label">Business Type:</span>
                <span className="info-value">Retail</span>
              </div>
              <div className="info-row">
                <span className="info-label">Owner:</span>
                <span className="info-value">Lakshmi Menon</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-actions1">
          <button className="btn btn-primary">Edit Profile</button>
          <button className="btn btn-secondary">Contact</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;