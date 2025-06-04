import React, { useState, useEffect} from 'react';
import { 
  Search, Filter, Calendar, ChevronDown, Eye, Phone, MessageCircle, 
  Printer, CheckCircle, XCircle, Clock, Package, MapPin, DollarSign,
  TrendingUp, ShoppingBag, Users, BarChart3, Star, Edit, Trash2,
  Download, RefreshCw, Bell, Menu, X, Plus, ArrowRight, ArrowLeft
} from 'lucide-react';
import './orders.css';

const OrderManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('buying');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [buyingOrders, setBuyingOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

 
  useEffect(() => {
    const fetchData = () => {
      if (activeTab === 'buying') {
        fetchBuyOrders();
      } else {
        fetchSellOrders();
      }
    };

    fetchData(); // Initial fetch

    const intervalId = setInterval(fetchData, 10000); // 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [activeTab]);
  const fetchBuyOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/purchases', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      const transformed = data.buyingOrders.map(transformOrder);
      setBuyingOrders(transformed);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

const fetchSellOrders = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/orders/sales', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.message) {
      console.error(data.message);
    } else {
      const transformed = data.sellingOrders.map(transformOrder); 
      setSellingOrders(transformed);
    }
    console.log("Fetching sales...");
    console.log("Response:", data);
  } catch (error) {
    console.error("Error fetching orders:", error);
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

    //Search Logic
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'buying' ? 
        order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) :
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus&&matchesDate;
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

 const handleStatusUpdate = async (orderId, newStatus) => {
  try {
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
      // Optionally: refetch or update local state
      if (activeTab === 'buying') 
        {
          fetchBuyOrders();
        }
      else{
          fetchSellOrders();
      } 
    
    setShowModal(false);
    setSelectedOrder(null);
  }else {
      console.error(result.message);
    }
  } catch (error) {
    console.error("Error updating order status:", error);
  }
};

const transformOrder = (order) => ({
  id: order._id,
  items: [ // assume one product per order for now
    {
      name: order.name, 
      quantity: order.quantity,
      price: order.total_price/order.quantity,
    },
  ],
  totalAmount: order.total_price,
  paymentMethod: 'Cash', // or however you're handling it
  orderDate: order.orderedAt,
  status: order.status,
  shopName: order.shopName,
  customerName: order.customerName,
  shopContact: order.shopPhone,
  customerContact: order.customerPhone,
  deliveryAddress: order.customerAddress,
  timeline: [
    {
      stage: 'Order Placed',
      time: order.orderedAt,
      completed: true,
    },
    {
      stage: 'Accepted',
      time: null,
      completed: order.status !== 'pending',
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
          {/* {activeTab === 'selling' && (
            
            <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)} className="status-select">
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>  
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <button className="action-btn action-phone">
                <Phone className="action-icon" />
              </button>
              <button className="action-btn action-message">
                <MessageCircle className="action-icon" />
              </button> 
          </select>
          )}*/}
        </div>
      </div>
    </div>
  );

  const OrderModal = ({ order, onClose,handleStatusUpdate }) => {
    if (!order) return null;

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
          
          <div className="modal-content">
            {/* Order Info */}
            <div className="order-info-grid">
              <div className="info-item">
                <label className="info-label">Order Name</label>
                <p className="info-value">{order.items[0].name}</p>
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

            {/* Actions */}
            {activeTab === 'selling' && order.status === 'pending' && (
              <div className="modal-actions">
                <button 
                    disabled={isLoading} 
                    onClick={() => handleStatusUpdate(order.id, 'accepted').finally(()=>setIsLoading(false))}
                    className='action-button accept-btn'
                  >
                  Accept Order
                </button>
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                  className="action-button reject-btn"
                >
                  Reject Order
                </button>
              </div>
            )}
            {activeTab === 'buying' && order.status === 'pending' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                  className="action-button reject-btn"
                >
                  Cancel
                </button>
              </div>
            )}

            {activeTab === 'selling' && order.status === 'accepted' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'dispatched')}
                  className="action-button dispatch-btn"
                >
                  Mark as Dispatched
                </button>
              </div>
            )}

            {activeTab === 'selling' && order.status === 'dispatched' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'delivered')}
                  className="action-button deliver-btn"
                >
                  Mark as Delivered
                </button>
              </div>
            )}

            <div className="utility-actions">
              <button className="utility-btn print-btn">
                <Printer className="utility-icon" />
                Print Invoice
              </button>
              <button className="utility-btn download-btn">
                <Download className="utility-icon" />
                Download
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
            <div className="notification-bell">
              <Bell className="bell-icon" />
              {notifications > 0 && (
                <span className="notification-badgeo">
                  {notifications}
                </span>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="header-btn">
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

        {/* Analytics */}

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
          {filteredOrders.map((order,index) => (
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
    </div>
  );
};

export default OrderManagementSystem;