import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notificationCount = notifications.length;


  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log('Fetching notifications...');
        const res = await axios.get('http://localhost:5000/api/notifications', { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('API Response:', res.data);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        alert('Error loading notifications');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderIcon = (type) => {
    switch (type) {
      case 'stock-added': return '📦';
      case 'order-placed': return '🛒';
      case 'order-accepted': return '✅';
      case 'order-pending': return '🔔';
      case 'order-cancelled': return '❌';
      case 'order-rejected': return '🚫';
      case 'order-delivered': return '🚚';
      default: return '🔔';
    }
  };

  const getSectionTitle = (type) => {
    switch (type) {
      case 'order-placed':
      case 'order-accepted':
        return 'Orders Placed & Accepted';
      case 'order-cancelled':
      case 'order-rejected':
        return 'Orders Cancelled & Rejected';
      case 'order-pending':
        return 'Pending Orders';
      case 'order-delivered':
        return 'Delivered Orders';
      case 'stock-added':
        return 'Stock Updates';
      default:
        return 'Other Notifications';
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'order-placed':
      case 'order-accepted':
        return '✅';
      case 'order-cancelled':
      case 'order-rejected':
        return '❌';
      case 'order-pending':
        return '⏳';
      case 'order-delivered':
        return '🚚';
      case 'stock-added':
        return '📦';
      default:
        return '📋';
    }
  };

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    let groupKey;
    
    if (notification.type === 'order-placed' || notification.type === 'order-accepted') {
      groupKey = 'order-placed';
    } else if (notification.type === 'order-cancelled' || notification.type === 'order-rejected') {
      groupKey = 'order-cancelled';
    } else {
      groupKey = notification.type;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(notification);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h3 style={{ 
            margin: 0, 
            color: '#374151', 
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Loading Notifications...
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0', 
            color: '#6b7280',
            fontSize: '0.9rem'
          }}>
            Please wait while we fetch your updates
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📢 Notifications
            </h1>
            <p style={{
              color: '#6b7280',
              margin: '0.5rem 0 0',
              fontSize: '1.1rem'
            }}>
              Stay updated with your latest activities
            </p>
          </div>
          <button 
            onClick={() => navigate('/dash')} 
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              padding: '0.8rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
            }}
          >
            ⬅ Back to Dashboard
          </button>
        </div>

        {/* Notifications Content */}
        {notifications.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>🔔</div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#374151',
              margin: '0 0 0.5rem',
              fontWeight: '600'
            }}>
              No notifications yet
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem',
              margin: 0
            }}>
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.keys(groupedNotifications).map((groupKey) => (
              <div 
                key={groupKey}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Section Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  padding: '1.5rem 2rem',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {getSectionIcon(groupKey)}
                    </span>
                    {getSectionTitle(groupKey)}
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '20px'
                    }}>
                      {groupedNotifications[groupKey].length}
                    </span>
                  </h3>
                </div>

                {/* Notifications List */}
                <div style={{ padding: '1rem' }}>
                  {groupedNotifications[groupKey].map((note, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        marginBottom: index < groupedNotifications[groupKey].length - 1 ? '1rem' : '0',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '2rem',
                        marginRight: '1.2rem',
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        borderRadius: '12px',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {renderIcon(note.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          color: '#374151',
                          fontWeight: '500',
                          lineHeight: '1.5',
                          marginBottom: '0.5rem'
                        }}>
                          {note.message}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            color: '#6b7280',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            🕐 {new Date(note.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;