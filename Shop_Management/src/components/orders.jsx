import React, { useState, useEffect } from 'react';
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

  // Sample data for orders (buying perspective)
  const buyingOrders = [
    {
      id: 'ORD-2024-001',
      shopName: 'Tech Electronics Store',
      shopContact: '+91 98765 43210',
      orderDate: '2024-06-02T10:30:00',
      status: 'delivered',
      totalAmount: 15999,
      paymentMethod: 'UPI',
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 8999 },
        { name: 'Phone Case', quantity: 2, price: 3500 }
      ],
      deliveryAddress: '123 Main St, Kochi, Kerala 682001',
      specialInstructions: 'Handle with care',
      timeline: [
        { stage: 'Order Placed', time: '2024-06-02T10:30:00', completed: true },
        { stage: 'Accepted', time: '2024-06-02T10:45:00', completed: true },
        { stage: 'Dispatched', time: '2024-06-02T14:00:00', completed: true },
        { stage: 'Delivered', time: '2024-06-02T18:30:00', completed: true }
      ]
    },
    {
      id: 'ORD-2024-002',
      shopName: 'Fresh Grocers',
      shopContact: '+91 98765 43211',
      orderDate: '2024-06-02T14:15:00',
      status: 'pending',
      totalAmount: 2850,
      paymentMethod: 'Cash',
      items: [
        { name: 'Organic Vegetables', quantity: 3, price: 1200 },
        { name: 'Rice (5kg)', quantity: 1, price: 800 },
        { name: 'Cooking Oil', quantity: 1, price: 850 }
      ],
      deliveryAddress: '456 Park Road, Kochi, Kerala 682002',
      specialInstructions: 'Call before delivery',
      timeline: [
        { stage: 'Order Placed', time: '2024-06-02T14:15:00', completed: true },
        { stage: 'Accepted', time: '', completed: false },
        { stage: 'Dispatched', time: '', completed: false },
        { stage: 'Delivered', time: '', completed: false }
      ]
    }
  ];

  // Sample data for orders (selling perspective)
  const sellingOrders = [
    {
      id: 'ORD-2024-003',
      customerName: 'Rahul Sharma',
      customerContact: '+91 98765 43212',
      orderDate: '2024-06-02T09:20:00',
      status: 'accepted',
      totalAmount: 4500,
      paymentMethod: 'UPI',
      items: [
        { name: 'Coffee Beans (1kg)', quantity: 2, price: 2000 },
        { name: 'Green Tea', quantity: 1, price: 500 }
      ],
      deliveryAddress: '789 Coffee Street, Kochi, Kerala 682003',
      specialInstructions: 'Deliver between 2-4 PM',
      timeline: [
        { stage: 'Order Placed', time: '2024-06-02T09:20:00', completed: true },
        { stage: 'Accepted', time: '2024-06-02T09:35:00', completed: true },
        { stage: 'Dispatched', time: '', completed: false },
        { stage: 'Delivered', time: '', completed: false }
      ]
    },
    {
      id: 'ORD-2024-004',
      customerName: 'Priya Nair',
      customerContact: '+91 98765 43213',
      orderDate: '2024-06-02T11:45:00',
      status: 'pending',
      totalAmount: 1299,
      paymentMethod: 'Online',
      items: [
        { name: 'Handmade Soap Set', quantity: 1, price: 899 },
        { name: 'Essential Oil', quantity: 1, price: 400 }
      ],
      deliveryAddress: '321 Garden View, Kochi, Kerala 682004',
      specialInstructions: 'Gift wrap requested',
      timeline: [
        { stage: 'Order Placed', time: '2024-06-02T11:45:00', completed: true },
        { stage: 'Accepted', time: '', completed: false },
        { stage: 'Dispatched', time: '', completed: false },
        { stage: 'Delivered', time: '', completed: false }
      ]
    }
  ];

  const currentOrders = activeTab === 'buying' ? buyingOrders : sellingOrders;

  // Filter and search logic
  const filteredOrders = currentOrders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'buying' ? 
        order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) :
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  const handleStatusUpdate = (orderId, newStatus) => {
    console.log(`Updating order ${orderId} to ${newStatus}`);
  };


  const OrderCard = ({ order }) => (
    <div className="order-card" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-id">{order.id}</h3>
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
        <span className="items-count">{order.items.length} items</span>
        <div className="order-actions">
          <button className="action-btn action-view">
            <Eye className="action-icon" />
          </button>
          {activeTab === 'selling' && (
            <>
              <button className="action-btn action-phone">
                <Phone className="action-icon" />
              </button>
              <button className="action-btn action-message">
                <MessageCircle className="action-icon" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const OrderModal = ({ order, onClose }) => {
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

            {/* Actions */}
            {activeTab === 'selling' && order.status === 'pending' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'accepted')}
                  className="action-button accept-btn"
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
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
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
        />
      )}
    </div>
  );
};

export default OrderManagementSystem;