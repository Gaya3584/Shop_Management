import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, Calendar, ChevronDown, Eye, Phone, MessageCircle, 
  Printer, CheckCircle, XCircle, Clock, Package, MapPin, DollarSign,
  TrendingUp, ShoppingBag, Users, BarChart3, Star, Edit, Trash2,
  Download, RefreshCw, Bell, Menu, X, Plus, ArrowRight, ArrowLeft, Truck
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RatingModal from './ratingModal';
import './orders.css';

const OrderManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('buying');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const invoiceRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [deliveredOrder, setDeliveredOrder] = useState(null);
  const [showStockPrompt, setShowStockPrompt] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);
  const [prevBuyingOrders, setPrevBuyingOrders] = useState([]);
  const [addedToStockOrders, setAddedToStockOrders] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [buyingOrders, setBuyingOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        });
        setNotificationCount(res.data.countUnread || 0);
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 900000);
    return () => clearInterval(interval);
  }, []);

  // Transform order data
  const transformOrder = (order) => ({
    id: order._id,
    items: [
      {
        name: order.name, 
        quantity: order.quantity,
        price: order.total_price / order.quantity,
      },
    ],
    totalAmount: order.total_price,
    paymentMethod: 'Cash',
    orderDate: order.orderedAt,
    status: order.status,
    shopName: order.shopName,
    customerName: order.customerName,
    shopContact: order.shopPhone,
    customerContact: order.customerPhone,
    deliveryAddress: order.customerAddress,
    hasReview: order.hasReview || false,
    timeline: [
      {
        stage: 'Order Placed',
        time: order.orderedAt,
        completed: true,
      },
      {
        stage: 'Accepted',
        time: null,
        completed: order.status ==='accepted'||order.status === 'dispatched' || order.status === 'delivered',
      },
      {
        stage: 'Dispatched',
        time: null,
        completed: order.status === 'dispatched' || order.status === 'delivered',
      },
      {
        stage: 'Delivered',
        time: null,
        completed: order.status === 'delivered',
      },
    ],
  });
  const handleOpenReview = async (order) => {
        const existing = await fetchExistingReview(order.id);
        const enrichedOrder = { ...order, existingRating: existing };
        setOrderToRate(enrichedOrder);
        setShowRatingModal(true);
      };
  const fetchExistingReview = async (orderId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/reviews/${orderId}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) return null;
    return await response.json();  // expected: { rating, review }
  } catch (err) {
    console.error("Error fetching existing review:", err);
    return null;
  }
};


const handleRatingSubmit = async (ratingData) => {
  try {
    const response = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(ratingData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Review submitted successfully:', result);
      alert('✅ Thank you for your review!');
      fetchData(); // Refresh orders
    } else {
      console.error('Error submitting review:', result.message);
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('❌ Failed to submit review. Please try again.');
  }
};


  // Handle adding to stock
  const handleAddToStock = async (order) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5000/api/orders/add-to-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          order_id: order.id,
          supplier: order.shopName
        })
      });
      console.log("Sending to stock:", order.id, order.shopName);

      const result = await response.json();

      if (response.ok) {
        console.log(result.message);
        setAddedToStockOrders(prev => [...prev, order.id]);
        alert(`✅ ${result.message}`);
        fetchBuyOrders();
      } else {
        console.error(result.message);
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding to stock:", error);
      alert('❌ Failed to add to stock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check stock status for orders
  const checkStockStatus = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/stock-status`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();
      return result.addedToStock || false;
    } catch (error) {
      console.error("Error checking stock status:", error);
      return false;
    }
  };

  // Fetch data based on active tab
  const fetchData = () => {
    setIsLoading(true); 
    if (activeTab === 'buying') {
      fetchBuyOrders();
    } else {
      fetchSellOrders();
    }
    console.log("Successfully refreshed...");
  };

  // Fetch buying orders
  const fetchBuyOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/purchases', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      const transformed = data.buyingOrders.map(transformOrder);

      // Get stock status for each order
      const ordersWithStockStatus = await Promise.all(
        transformed.map(async (order) => {
          const addedToStock = await checkStockStatus(order.id);
          return { ...order, addedToStock };
        })
      );

      // Detect newly delivered orders and show rating modal
      ordersWithStockStatus.forEach((newOrder) => {
        const prevOrder = prevBuyingOrders.find(o => o.id === newOrder.id);
        if (prevOrder && prevOrder.status !== 'delivered' && newOrder.status === 'delivered') {
          setDeliveredOrder(newOrder);
          setShowStockPrompt(true);
          
          // Show rating modal after a short delay if no review exists
          if (!newOrder.hasReview) {
            setTimeout(() => {
              setOrderToRate(newOrder);
              setShowRatingModal(true);
            }, 2000);
          }
        }
      });

      setBuyingOrders(ordersWithStockStatus);
      setPrevBuyingOrders(ordersWithStockStatus);
      
      // Update addedToStockOrders state
      const stockAddedOrders = ordersWithStockStatus
        .filter(order => order.addedToStock)
        .map(order => order.id);
      setAddedToStockOrders(stockAddedOrders);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch selling orders
  const fetchSellOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/orders/sales', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.message) {
        console.error(data.message);
        alert('Error fetching current user. Please login.');
      navigate('/');
    } else {
        const transformed = data.sellingOrders.map(transformOrder); 
        setSellingOrders(transformed);
      }
      console.log("Fetching sales...");
      console.log("Response:", data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and interval setup
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 900000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Handle status updates
  const handleStatusUpdate = async (orderId, newStatus) => {
  try {
    setIsLoading(true);
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(result.message);

      // ✅ Update correct order list based on tab
      if (activeTab === 'buying') {
  setBuyingOrders(prev =>
    prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
  );
} else if (activeTab === 'selling') {
  setSellingOrders(prev =>
    prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
  );
}if (selectedOrder?.id === orderId) {
  setSelectedOrder(prev => {
    const updatedTimeline = prev.timeline.map(stage => {
      if (stage.stage === 'Accepted') {
        return { ...stage, completed: ['accepted', 'dispatched', 'delivered'].includes(newStatus) };
      }
      if (stage.stage === 'Dispatched') {
        return { ...stage, completed: ['dispatched', 'delivered'].includes(newStatus) };
      }
      if (stage.stage === 'Delivered') {
        return { ...stage, completed: newStatus === 'delivered' };
      }
      return stage;
    });

    return {
      ...prev,
      status: newStatus,
      timeline: updatedTimeline
    };
  });
}



      alert(`✅ Order status updated to ${newStatus}`);
    } else {
      console.error(result.message);
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error("Error updating status:", error);
    alert('❌ Failed to update status. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const currentOrders = activeTab === 'buying' ? buyingOrders : sellingOrders;

  // Filter and search logic
  const filteredOrders = currentOrders.filter(order => {
    const orderDate = new Date(order.orderDate);
    const now = new Date();

    // Date Filter Logic
    let matchesDate = true;
    if (dateRange === 'today') {
      matchesDate = orderDate.toDateString() === now.toDateString();
    } else if (dateRange === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      matchesDate = orderDate >= oneWeekAgo && orderDate <= now;
    } else if (dateRange === 'month') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      matchesDate = orderDate >= oneMonthAgo && orderDate <= now;
    }

    // Search Logic
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'buying' ? 
        order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) :
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="status-icon" />;
      case 'accepted': return <CheckCircle className="status-icon" />;
      case 'dispatched': return <Package className="status-icon" />;
      case 'delivered': return <CheckCircle className="status-icon" />;
      case 'rejected': return <XCircle className="status-icon" />;
      case 'cancelled': return <XCircle className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Order Card Component
  const OrderCard = ({ order }) => (
    <div className="order-card" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-name">{order.items[0].name}</h3>
          <p className="order-customer">
            {activeTab === 'buying' ? order.shopName : order.customerName}
          </p>
        </div>
        <span className={`status-badge ${getStatusClass(order.status)}`}>
          {getStatusIcon(order.status)}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      
      <div className="order-details">
        <div className="order-detail-item">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">{formatCurrency(order.totalAmount)}</span>
        </div>
        <div className="order-detail-item">
          <span className="detail-label">Payment:</span>
          <span className="detail-value">{order.paymentMethod}</span>
        </div>
        <div className="order-detail-item">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{formatDateTime(order.orderDate)}</span>
        </div>
      </div>
      
      <div className="order-footer">
        {Array.isArray(order.items) && (
          <span className="items-count">{order.items.length} items</span>
        )}
        <div className="order-actions">
          <button className="action-btn action-view">
            <Eye className="action-icon" />
          </button>
          {/* Rate Product button for delivered buying orders */}
          {activeTab === 'buying' && order.status === 'delivered' && (
         <button
            className="action-btn action-rate"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReview(order); // instead of setOrderToRate(...)
            }}
            title={order.hasReview ? "Edit your review" : "Rate this product"}
          >
            {order.hasReview ? (
              <Edit className="action-icon" />
            ) : (
              <Star className="action-icon" />
            )}
          </button>
        )}
        </div>
      </div>

      {/* Add to Stock button for buying orders */}
      {activeTab === 'buying' && order.status !== 'rejected' && order.status !== 'cancelled' &&(
        <div className="order-stock-action">
          <button
            className={`action-button stock-btn ${
              order.status !== 'delivered' || order.addedToStock || isLoading ? 'disabled' : ''
            }`}
            disabled={order.status !== 'delivered' || order.addedToStock || isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (order.status === 'delivered' && !order.addedToStock) {
                handleAddToStock(order);
              }
            }}
          >
            {isLoading ? 'Loading...' : 
             order.addedToStock ? '✅ Added to the Stock' : 
             'Add to Stock'}
          </button>
        </div>
      )}
    </div>
  );

  // Order Modal Component
    const OrderModal = ({ order, onClose, handleStatusUpdate }) => {
      
    if (!order) return null;
    
    const handlePrint = () => {
      const productName = order?.items?.[0]?.name?.replace(/\s+/g, '_') || 'product';
      const orderId = order?.id?.slice(-6) || 'order';
      const originalTitle = document.title;
      const fileTitle = `Invoice_${productName}_${orderId}`;

      const printContents = invoiceRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.title = fileTitle;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      document.title = originalTitle;
      window.location.reload();
    };
   

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-title-section">
              <h2 className="modal-title">Order Details</h2>
              <button onClick={onClose} className="modal-close-btn">
                <X className="close-icon" />
              </button>
            </div>
          </div>
          <div className="full-content">
            <div className="modal-content" ref={invoiceRef}>
              {/* Order Info */}
              <div className="order-info-grid">
                <div className="info-item">
                  <label className="info-label">Order Name</label>
                  <p className="info-value">{order.items[0].name}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Order ID</label>
                  <p className="info-value">{order.id}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Status</label>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Customer/Shop Info */}
              <div className="contact-info-section">
                <h3 className="section-title">
                  {activeTab === 'buying' ? 'Shop Information' : 'Customer Information'}
                </h3>
                <div className="contact-details">
                  <p className="contact-name">
                    <strong>{activeTab === 'buying' ? order.shopName : order.customerName}</strong>
                  </p>
                  <p className="contact-item">
                    <Phone className="contact-icon" />
                    {activeTab === 'buying' ? order.shopContact : order.customerContact}
                  </p>
                  <p className="contact-item">
                    <MapPin className="contact-icon" />
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="items-section">
                <h3 className="section-title">Order Items</h3>
                <div className="items-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <p className="item-name">{item.name}</p>
                        <p className="item-quantity">Qty: {item.quantity}</p>
                      </div>
                      <p className="item-price">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="timeline-section">
                <h3 className="section-title">Order Timeline</h3>
                <div className="timeline-list">
                  {order.timeline.map((stage, index) => (
                    <div key={index} className={`timeline-item ${stage.completed ? 'completed' : 'pending'}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <p className="timeline-stage">{stage.stage}</p>
                        {stage.time && <p className="timeline-time">{formatDateTime(stage.time)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="instructions-section">
                  <h3 className="instructions-title">Special Instructions</h3>
                  <p className="instructions-text">{order.specialInstructions}</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            {activeTab === 'selling' && (order.status==='pending'|| order.status==='placed') && (
              <div className="modal-actions">
                <button 
                  disabled={isLoading} 
                  onClick={() => handleStatusUpdate(order.id, 'accepted')}
                  className='action-button accept-btn'
                >
                  {isLoading ? 'Processing...' : 'Accept Order'}
                </button>
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                  className="action-button reject-btn"
                  disabled={isLoading}
                >
                  Reject Order
                </button>
              </div>
            )}
            {activeTab==='buying'&& (order.status==='pending'||order.status==='placed') &&(
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                  className="action-button reject-btn"
                  disabled={isLoading}
                >
                  Cancel Order
                </button>
              </div>
            )
            }
            {activeTab === 'buying' && (
              <div className="order-stock-action">
                <button
                  className={`action-button stock-btn ${order.status !== 'delivered' || order.addedToStock ? 'disabled' : ''}`}
                  disabled={order.status !== 'delivered' || order.addedToStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (order.status === 'delivered' && !order.addedToStock) {
                      setDeliveredOrder(order);
                      setShowStockPrompt(true);
                    }
                  }}
                >
                  {order.addedToStock ? '✅ Added to Stock' : 'Add to Stock'}
                </button>
              </div>
            )}

            {/* Rate Product button in modal */}
            {activeTab === 'buying' && order.status === 'delivered' && (
                <button 
                  className="action-btn action-rate"
                  onClick={(e) => {
                    e.stopPropagation();
                   handleOpenReview(order);
                  }}
                  title={order.hasReview ? "Edit your review" : "Rate this product"}
                >
                  {order.hasReview ? (
                    <Edit className="action-icon" />
                  ) : (
                    <Star className="action-icon" />
                  )}
                </button>
              )}

            {activeTab === 'selling' && order.status === 'accepted' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'dispatched')}
                  className="action-button dispatch-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Mark as Dispatched'}
                </button>
              </div>
            )}

            {activeTab === 'selling' && order.status === 'dispatched' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'delivered')}
                  className="action-button deliver-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Mark as Delivered'}
                </button>
              </div>
            )}

            <div className="utility-actions">
              <button className="utility-btn print-btn" onClick={handlePrint}>
                <Printer className="utility-icon" />
                Print Invoice
              </button>
              <button className="utility-btn download-btn" onClick={handlePrint}>
                <Download className="utility-icon" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Single Truck Rating Modal Component
  const SingleTruckRatingModal = ({ order, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const [submittedRating, setSubmittedRating] = useState(0);

    const satisfactionLevels = [
      'Very Poor',
      'Poor', 
      'Average',
      'Good',
      'Excellent'
    ];

    const handleSubmit = useCallback(async () => {
      if (rating === 0) {
        alert('Please select a rating');
        return;
      }
      
      setSubmittedRating(rating);
      setIsSubmitting(true);
      setHoverRating(0); // Clear any hover state
      
      try {
        await handleRatingSubmit({
          order_id: order.id,
          orderName: order.items[0].name,
          rating,
          review: review.trim() || '',
          shopName: order.shopName
        });
        
        setShowThankYou(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } catch (error) {
        console.error("Error submitting review", error);
        alert("Failed to submit review.");
      } finally {
        setIsSubmitting(false);
      }
    }, [rating, review, order, handleRatingSubmit, onClose]);

    const handleTruckClick = useCallback((value) => {
    setRating(value);
    setHoverRating(0); // Clear hover when clicking
  }, []);

    const handleTruckHover = useCallback((value) => {
    if (!isSubmitting) { // Don't allow hover during submission
      setHoverRating(value);
    }
  }, [isSubmitting]);

  const handleTruckLeave = useCallback(() => {
    if (!isSubmitting) { // Don't clear hover during submission
      setHoverRating(0);
    }
  }, [isSubmitting]);

     const displayRating = useMemo(() => {
    return hoverRating || rating;
  }, [hoverRating, rating]);


    if (showThankYou) {
      return (
        <div className="modal-overlay">
          <div className="modal-container single-truck-rating-modal">
            <div className="thank-you-content">
              <div className="thank-you-truck">
                <div className="single-truck-container final-truck">
                  <div className="truck-body">
                    <div className="truck-cargo" style={{ height: `${(submittedRating / 5) * 100}%` }}>
                      <div className="cargo-items">
                        {[...Array(submittedRating)].map((_, i) => (
                          <div key={i} className="cargo-item" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                    <div className="truck-cab">
                      <Truck className="truck-icon" />
                    </div>
                    <div className="rating-number">{submittedRating}</div>
                  </div>
                  <div className="truck-wheels">
                    <div className="wheel wheel-1"></div>
                    <div className="wheel wheel-2"></div>
                  </div>
                </div>
              </div>
              <h2 className="thank-you-title">Thank You for Your Feedback!</h2>
              <p className="thank-you-message">Your review helps us improve our service</p>
              <div className="loading-truck">
                <Truck className="loading-truck-icon" />
                <span className="loading-rating">{submittedRating}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-overlay">
        <div className="modal-container single-truck-rating-modal">
          <div className="modal-header">
            <div className="modal-title-section">
              <h2 className="modal-title">Rate Your Delivery Experience</h2>
              <button className="modal-close-btn" onClick={onClose}>
                <X className="close-icon" />
              </button>
            </div>
          </div>
          <div className="modal-content">
            <div className="product-info">
              <h3 className="product-name">{order.items[0].name}</h3>
              <p className="shop-name">from {order.shopName}</p>
            </div>

            <div className="rating-section">
              <h4 className="rating-title">How satisfied are you with this delivery?</h4>
              
              <div className="single-truck-rating-container">
                <div className="single-truck-container">
                  <div className="truck-body">
                    <div 
                      className="truck-cargo"
                      style={{
                        height: `${(displayRating / 5) * 100}%`
                      }}
                    >
                      <div className="cargo-items">
                        {displayRating > 0 && [...Array(displayRating)].map((_, i) => (
                          <div key={i} className="cargo-item" />
                        ))}
                      </div>
                    </div>
                    <div className="truck-cab">
                      <Truck className="truck-icon" />
                    </div>
                    {displayRating > 0 && (
                      <div className="rating-number">{displayRating}</div>
                    )}
                  </div>
                  <div className="truck-wheels">
                    <div className="wheel wheel-1"></div>
                    <div className="wheel wheel-2"></div>
                  </div>
                </div>
              </div>

              <div className="rating-controls">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={`rating-btn ${displayRating >= value ? 'active' : ''}`}
                    onClick={() => handleTruckClick(value)}
                    onMouseEnter={() => handleTruckHover(value)}
                    onMouseLeave={handleTruckLeave}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {displayRating > 0 && (
                <div className="rating-feedback">
                  <p className="rating-text">{satisfactionLevels[displayRating - 1]}</p>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, index) => (
                      <span
                        key={index}
                        className={`star ${index < displayRating ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="review-section">
              <label htmlFor="review" className="review-label">
                Share your thoughts (optional)
              </label>
              <textarea
                id="review"
                placeholder="Tell us about your delivery experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows="4"
                className="review-textarea"
                maxLength={500}
              />
              <div className="character-count">
                {review.length}/500 characters
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
                disabled={isSubmitting}
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                className="submit-btn"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft className="back-icon" />
        </button>
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Order Management</h1>
            <div className="notification-bell" onClick={() => navigate(`/notifications`)}>
              <Bell className="bell-icon" />
              {notificationCount > 0 && (
                <span className="notification-badgeo">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="header-btn" onClick={fetchData}>
              <RefreshCw className="header-icon" />
            </button>
            <button className="header-btn mobile-menu">
              <Menu className="header-icon" />
            </button>
          </div>
        </div>
      </header>

      <div className="main-contento">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('buying')}
            className={`tab-button ${activeTab === 'buying' ? 'active' : ''}`}
          >
            <ShoppingBag className="tab-icon" />
            My Purchases
          </button>
          <button
            onClick={() => setActiveTab('selling')}
            className={`tab-button ${activeTab === 'selling' ? 'active' : ''}`}
          >
            <Package className="tab-icon" />
            My Sales
          </button>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-section">
          <div className="search-filter-content">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={`Search by Order ID or ${activeTab === 'buying' ? 'Shop Name' : 'Customer Name'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-controls">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="filter-button"
              >
                <Filter className="filter-icon" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="orders-grid">
          {filteredOrders.map((order, index) => (
            <OrderCard key={order.id || order._id || index} order={order} />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <Package className="empty-icon" />
            <h3 className="empty-title">No orders found</h3>
            <p className="empty-description">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : `No ${activeTab === 'buying' ? 'purchases' : 'sales'} available`
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => { setShowModal(false); setSelectedOrder(null); }} 
          handleStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Single Truck Rating Modal */}
      {showRatingModal && orderToRate && (
        <SingleTruckRatingModal
          order={orderToRate}
          existingRating={orderToRate.existingRating || null}
          onClose={() => {
            setShowRatingModal(false);
            setOrderToRate(null);
          }}
        />
      )}


      {/* Stock Prompt Modal */}
      {showStockPrompt && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Add to Stocks</h3>
              <button onClick={() => setShowStockPrompt(false)} className="modal-close-btn">
                <X className="close-icon" />
              </button>
            </div>
            <div className="modal-content">
              <p>
                Do you want to add <strong>{deliveredOrder?.items[0].name}</strong> (Qty: {deliveredOrder?.items[0].quantity}) to your stock?
              </p>
              <div className="modal-actions">
                <button
                  className={`action-button accept-btn ${isLoading ? 'disabled' : ''}`}
                  disabled={isLoading}
                  onClick={async () => {
                    if (deliveredOrder) {
                      await handleAddToStock(deliveredOrder);
                      setShowStockPrompt(false);
                      setDeliveredOrder(null);
                    }
                  }}
                >
                  {isLoading ? 'Adding...' : 'Yes, Add to Stock'}
                </button>
                <button
                  className="action-button reject-btn"
                  onClick={() => {
                    setShowStockPrompt(false);
                    setDeliveredOrder(null);
                  }}
                  disabled={isLoading}
                >
                  No, Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementSystem;