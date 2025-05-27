import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './dash.css';
import stockIcon from '../assets/stock.png';
import Lens from '../assets/lens.png';
import Bar from '../assets/bar.png';
import 'animate.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userToken = localStorage.getItem('user_token');

  const userEmail = location.state?.userEmail || 'Guest';
  const userData = location.state?.userData;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const handleLogout = (e) => {
  e.preventDefault();
  
  if (window.confirm('Are you sure you want to logout?')) {
    // Clear user data
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    
    // Close sidebar if it's open
    toggleSidebar();
    
    // Redirect to login
    navigate('/');
  }
};

  return (
    <div className="dashboard-container">
      {/* Overlay for both mobile and desktop */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">Dashboard</h2>
          <button 
            onClick={toggleSidebar}
            className="close-btn"
          >
            ✕
          </button>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-container">
            <div className="profile-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-info">
              <h3 className="username">{userEmail}</h3>
              <p className="user-email">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <ul className="nav-list">
            <li>
              <a href="#" className="nav-link" onClick={toggleSidebar}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9,22 9,12 15,12 15,22"></polyline>
                </svg>
                <span className="nav-text">Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="nav-link" onClick={toggleSidebar}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="m13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="nav-text">Notifications</span>
                <span className="notification-badge">3</span>
              </a>
            </li>
            <li>
              <a href="#" className="nav-link" onClick={toggleSidebar}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span className="nav-text">Orders</span>
              </a>
            </li>
            
            <li>
              <a href="#" className="nav-link" onClick={toggleSidebar}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="nav-text">Settings</span>
              </a>
            </li>
            <li>
              <a href="#" className="nav-link" onClick={toggleSidebar}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12" y2="17" />
                </svg>
                <span className="nav-text">Help</span>
              </a>
            </li>

            <li>
              <a href="#" className="nav-link" onClick={handleLogout}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
                <span className="nav-text">Logout</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-content">
            <button 
              onClick={toggleSidebar}
              className="menu-btn"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>
            <h1 className="page-title">Welcome to Shopsy!</h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content-area">
          
          <div className="dashboard-grid">
            {/* Sample Cards */}
            <div className="dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-title">Stocks</h3>
                <img src={stockIcon} alt="Stock chart icon" style={{ width: '150px', height: '150px' }}/>
              </div>
              <hr></hr>
              <p className="card-description">Manage your stocks</p>
              <div className="card-value stats-value">
                <button onClick={() => navigate(`/stock/}`)}>View My Stocks</button>
              </div>
            </div>
            
            <div className="dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-title">Discover</h3>
                <img src={Lens} alt="Lens icon" style={{ width: '150px', height: '150px' }}/>
              </div>
              <hr></hr>
              <p className="card-description">Find your products from other stores</p>
              <div className="card-value activity-value">
<button onClick={() => navigate(`/disc/}`)}>
      Discover Products
    </button>              </div>
            </div>
            
            <div className="dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-title">Analysis</h3>
                <img src={Bar} alt="Bar icon" style={{ width: '150px', height: '150px' }}/>
              </div>
                <hr></hr>
              <p className="card-description">View detailed reports</p>
              <div className="card-value tasks-value">
                <button>Get Reports</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;