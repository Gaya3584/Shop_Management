import React, { useState } from 'react';
import './dash.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Overlay for mobile */}
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
          <h2 className="sidebar-title">Shopsy</h2>
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
              <h3 className="username">John Doe</h3>
              <p className="user-email">john.doe@email.com</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <ul className="nav-list">
            <li>
              <a href="#" className="nav-link">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9,22 9,12 15,12 15,22"></polyline>
                </svg>
                <span className="nav-text">Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="nav-link">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="m13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="nav-text">Notifications</span>
                <span className="notification-badge"></span>
              </a>
            </li>
            <li>
              <a href="#" className="nav-link">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span className="nav-text">Orders</span>
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
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>
            <h1 className="page-title">Welcome to Dashboard!</h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content-area">
          <div className="dashboard-grid">
            {/* Sample Cards */}
            <div className="dashboard-card">
              <h3 className="card-title">Stocks</h3>
              <p className="card-description"></p>
              <div className="card-value stats-value"></div>
            </div>
            
            <div className="dashboard-card">
              <h3 className="card-title">Discover</h3>
              <p className="card-description"></p>
              <div className="card-value activity-value"></div>
            </div>
            
            <div className="dashboard-card">
              <h3 className="card-title">Analysis</h3>
              <p className="card-description"></p>
              <div className="card-value tasks-value"></div>
            </div>
            
        
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;