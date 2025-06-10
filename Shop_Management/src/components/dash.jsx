import React, { useState,useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './dash.css';
import axios from 'axios';
import stockIcon from '../assets/stock.png';
import Lens from '../assets/lens.png';
import Bar from '../assets/bar.png';
import 'animate.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/profile', {
            withCredentials: true, 
          });
          const data = res.data;
          if (data.message) {
            setError(data.message);
          } else {
            setUser(data);
          }
        } catch (err) {
          console.error('User fetch failed:', err);
        }
      };

      fetchUser();
    }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const toggleChat = () => setChatOpen(!chatOpen);
  // Inside Dashboard component:
const [chatInput, setChatInput] = useState("");
const [chatMessages, setChatMessages] = useState([
  { sender: "bot", text: "Hi! How can I help you today?" },
]);

const handleSendMessage = async () => {
  if (!chatInput.trim()) return;
  const userText = chatInput.trim();

  setChatMessages([...chatMessages, { sender: "user", text: userText }]);
  setChatInput("");

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ message: userText }),
    });
    const data = await res.json();
    setChatMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
  } catch (err) {
    console.error("Error sending message:", err);
    setChatMessages((prev) => [...prev, { sender: "bot", text: "Server error." }]);
  }
};


  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        });
        setNotificationCount(res.data.count || 0);
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    };

    fetchNotificationCount(); // initial fetch
    const interval = setInterval(fetchNotificationCount, 50000); // auto-refresh every 5 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);


  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  

    const handleLogout = async (e) => {
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to logout?')) {
      try{
        // Clear user data
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Close sidebar if it's open
      toggleSidebar();
      
      // Redirect to login
      navigate('/');
      }catch (error) {
        console.error('Logout failed:', error);
        alert('Error logging out. Please try again.');
      }
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile`);
  };
  const handleNotiClick = () => {
    navigate(`/notifications`);
  };
  const handleOrdersClick = () => {
    navigate(`/orders`);
  }
  const handleSettingsClick = () => {
    navigate(`/settings`);
  }
  const handleHelpClick = () => {
    navigate(`/help`);
  }
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
            <div className="profile-icon" onClick={handleProfileClick}>               
              {user && user.image ? (
                <img
                  src={user.image}
                  alt="Profile"
                  className="profile-image1"
                />
              ) : (
                <div className="placeholder-image">No Image</div>
              )}  
            </div>             
            <div className="profile-info">               
              <h3 className="username">{user?.ownerName || 'No Name'}</h3>
              <h3 className="useremail">{user?.email || 'No Email'}</h3>      
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
              <a href="#" className="nav-link" onClick={() => { toggleSidebar(); handleNotiClick(); }}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="m13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="nav-text">Notifications</span>
                <span className="notification-badge">{notificationCount}</span>
              </a>
            </li>
            <li>
              <div className="nav-link" onClick={() => { toggleSidebar(); handleOrdersClick(); }}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span className="nav-text">Orders</span>
              </div>
            </li>

            
            <li>
              <div className="nav-link" onClick={() => { toggleSidebar(); handleSettingsClick(); }}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="nav-text">Settings</span>
              </div>
            </li>
            <li>
              <div className="nav-link" onClick={() => { toggleSidebar(); handleHelpClick(); }}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12" y2="17" />
                </svg>
                <span className="nav-text">Help</span>
              </div>
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
                <button onClick={() => navigate(`/stock`)}>View My Stocks</button>              </div>
              </div>
            
            <div className="dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-title">Discover</h3>
                <img src={Lens} alt="Lens icon" style={{ width: '150px', height: '150px' }}/>
              </div>
              <hr></hr>
              <p className="card-description">Find your products from other stores</p>
              <div className="card-value activity-value">
                <button onClick={() => navigate(`/disc`)}>
                    Discover Products
                  </button>        
              </div>
            </div>
            
            <div className="dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-title">Analysis</h3>
                <img src={Bar} alt="Bar icon" style={{ width: '150px', height: '150px' }}/>
              </div>
                <hr></hr>
              <p className="card-description">View detailed reports</p>
              <div className="card-value tasks-value">
                <button onClick={()=>navigate(`/analysis`)}>Get Reports</button>
              </div>
            </div>
            {/* Floating Chat Icon */}
<div className="chat-toggle-btn" onClick={toggleChat}>
  💬
</div>

{/* Chat Box */}
{chatOpen && (
  <div className="chatbox">
    <div className="chatbox-header">
      <span>Chat Assistant</span>
      <button className="chatbox-close" onClick={toggleChat}>✕</button>
    </div>
    <div className="chatbox-body">
  {chatMessages.map((msg, idx) => (
    <div key={idx} className={`chat-message ${msg.sender}`}>
      {msg.text}
    </div>
  ))}
</div>

<div className="chatbox-footer">
  <input
    type="text"
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
    placeholder="Type your message..."
  />
  <button onClick={handleSendMessage}>Send</button>
</div>

    
  </div>
)}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;