import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCheck, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Loading states for different operations
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [markingAllAsUnread, setMarkingAllAsUnread] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState({});

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const res = await axios.get('http://localhost:5000/api/notifications', { 
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('API Response:', res.data);
      setNotifications(res.data.notifications || []);
      setNotificationCount(res.data.countUnread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      alert('Error loading notifications');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    setMarkingAsRead(prev => ({ ...prev, [id]: true }));
    
    // Optimistic update - immediately update UI
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, readOrNot: true } : notif
      )
    );

    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        withCredentials: true,
      });
      // Success - UI already updated optimistically
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, readOrNot: false } : notif
        )
      );
      alert('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(prev => ({ ...prev, [id]: false }));
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllAsRead(true);
    
    // Optimistic update - immediately update UI
    const originalNotifications = [...notifications];
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, readOrNot: true }))
    );

    try {
      await axios.patch('http://localhost:5000/api/notifications/mark-all-read', {}, {
        withCredentials: true,
      });
      // Success - UI already updated optimistically
    } catch (err) {
      console.error('Error marking all as read:', err);
      // Revert optimistic update on error
      setNotifications(originalNotifications);
      alert('Failed to mark all notifications as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const markAllAsUnread = async () => {
    setMarkingAllAsUnread(true);
    
    // Optimistic update - immediately update UI
    const originalNotifications = [...notifications];
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, readOrNot: false }))
    );

    try {
      await axios.patch('http://localhost:5000/api/notifications/mark-all-unread', {}, {
        withCredentials: true,
      });
      // Success - UI already updated optimistically
    } catch (err) {
      console.error('Error marking all as unread:', err);
      // Revert optimistic update on error
      setNotifications(originalNotifications);
      alert('Failed to mark all notifications as unread');
    } finally {
      setMarkingAllAsUnread(false);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'stock-added': return '📦';
      case 'order-placed': return '🛒';
      case 'order-accepted': return '✅';
      case 'order-cancelled': return '❌';
      case 'order-rejected': return '🚫';
      case 'order-delivered': return '🚚';
      case 'stock-low':
      case 'stock-low-stock': return '❗';
      default: return '🔔';
    }
  };

  const getSectionTitle = (type) => {
    switch (type) {
      case 'order-placed':
        return 'Orders Placed';
      case 'order-accepted':
        return 'Orders Accepted';
      case 'order-cancelled':
        return 'Orders Cancelled';
      case 'order-rejected':
        return 'Orders Rejected';
      case 'order-delivered':
        return 'Delivered Orders';
      case 'stock-added':
        return 'Stock Added';
      case 'stock-low':
      case 'stock-low-stock':
        return 'Stock Low Alerts';
      default:
        return 'Other Notifications';
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'order-placed':
        return '🛒';
      case 'order-accepted':
        return '✅';
      case 'order-cancelled':
        return '❌';
      case 'order-rejected':
        return '🚫';
      case 'order-delivered':
        return '🚚';
      case 'stock-added':
        return '📦';
      case 'stock-low':
      case 'stock-low-stock':
        return '📉';
      default:
        return '📋';
    }
  };

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    let groupKey;
    
    if (notification.type === 'stock-low-stock' || notification.type === 'stock-low') {
      groupKey = 'stock-low';
    } else {
      groupKey = notification.type;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(notification);
    return acc;
  }, {});

  // Check if all notifications are read or unread
  const allNotificationsRead = notifications.length > 0 && notifications.every(note => note.readOrNot);
  const allNotificationsUnread = notifications.length > 0 && notifications.every(note => !note.readOrNot);

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
          background: 'linear-gradient(135deg,rgb(106, 93, 121) 0%,rgb(40, 51, 102) 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📢 Notifications
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0.5rem 0 0',
              fontSize: '1.1rem'
            }}>
              Stay updated with your latest activities
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={markAllAsRead}
              disabled={allNotificationsRead || notifications.length === 0 || markingAllAsRead}
              style={{
                background: allNotificationsRead || notifications.length === 0 || markingAllAsRead
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '0.8rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: allNotificationsRead || notifications.length === 0 || markingAllAsRead ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: allNotificationsRead || notifications.length === 0 || markingAllAsRead
                  ? '0 4px 15px rgba(156, 163, 175, 0.3)' 
                  : '0 4px 15px rgba(16, 185, 129, 0.3)',
                minWidth: 'fit-content',
                opacity: allNotificationsRead || notifications.length === 0 || markingAllAsRead ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!allNotificationsRead && notifications.length > 0 && !markingAllAsRead) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!allNotificationsRead && notifications.length > 0 && !markingAllAsRead) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {markingAllAsRead ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CheckCheck size={18} />
              )}
              {markingAllAsRead ? 'Marking...' : 'Mark All as Read'}
            </button>

            <button
              onClick={markAllAsUnread}
              disabled={allNotificationsUnread || notifications.length === 0 || markingAllAsUnread}
              style={{
                background: allNotificationsUnread || notifications.length === 0 || markingAllAsUnread
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '0.8rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: allNotificationsUnread || notifications.length === 0 || markingAllAsUnread ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: allNotificationsUnread || notifications.length === 0 || markingAllAsUnread
                  ? '0 4px 15px rgba(156, 163, 175, 0.3)' 
                  : '0 4px 15px rgba(245, 158, 11, 0.3)',
                minWidth: 'fit-content',
                opacity: allNotificationsUnread || notifications.length === 0 || markingAllAsUnread ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!allNotificationsUnread && notifications.length > 0 && !markingAllAsUnread) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!allNotificationsUnread && notifications.length > 0 && !markingAllAsUnread) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
                }
              }}
            >
              {markingAllAsUnread ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RotateCcw size={18} />
              )}
              {markingAllAsUnread ? 'Marking...' : 'Mark All as Unread'}
            </button>
            
            <button 
              onClick={() => navigate('/dash')} 
              style={{
                background: 'linear-gradient(135deg, rgb(85, 86, 155) 0%, #8b5cf6 100%)',
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
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                minWidth: 'fit-content'
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
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
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
                  background: 'linear-gradient(135deg,rgb(90, 67, 116) 0%,rgb(50, 60, 102) 100%)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Section Header */}
                <div style={{
                  background: 'linear-gradient(135deg,rgb(117, 82, 141) 0%,rgb(69, 83, 114) 100%)',
                  padding: '1.5rem 2rem',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {getSectionIcon(groupKey)}
                    </span>
                    {getSectionTitle(groupKey)}
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
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
                      key={note._id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: note.readOrNot ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        marginBottom: index < groupedNotifications[groupKey].length - 1 ? '1rem' : '0',
                        transition: 'all 0.3s ease',
                        opacity: note.readOrNot ? 0.7 : 1,
                        position: 'relative'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }} onClick={()=>{ 
                        if (groupKey.startsWith('stock')) {
                            navigate('/stock');
                          } else {
                            navigate('/orders');
                          }
                        }}
                    >
                      {note.readOrNot && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={14} />
                        </div>
                      )}
                      
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
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}>
                          <span style={{
                            color: '#6b7280',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            🕐 {new Date(note.timestamp).toLocaleString()}
                          </span>
                          
                          {!note.readOrNot && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(note._id);
                              }}
                              disabled={markingAsRead[note._id]}
                              style={{
                                background: markingAsRead[note._id] 
                                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: markingAsRead[note._id] ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: markingAsRead[note._id]
                                  ? '0 2px 8px rgba(156, 163, 175, 0.3)'
                                  : '0 2px 8px rgba(59, 130, 246, 0.3)',
                                flexShrink: 0,
                                opacity: markingAsRead[note._id] ? 0.6 : 1
                              }}
                              onMouseOver={(e) => {
                                if (!markingAsRead[note._id]) {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!markingAsRead[note._id]) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                                }
                              }}
                            >
                              {markingAsRead[note._id] ? (
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Check size={14} />
                              )}
                              {markingAsRead[note._id] ? 'Marking...' : 'Mark as Read'}
                            </button>
                          )}
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
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Notifications;