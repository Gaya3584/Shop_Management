import React, { use, useState } from 'react';
import './discover.css';
import { useNavigate,useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios'; // if not already imported




const DiscoverPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  

    const fetchProducts = () => {
        setLoading(true);
        axios.get('http://localhost:5000/api/stocks/public', { withCredentials: true })
          .then(response => {
            const rawStocks = response.data.stocks;
            const formatted = rawStocks.map(stock => ({
              id: stock._id,
              name: stock.name,
              price: stock.price,
              minOrder: stock.minOrder,
              seller: stock.user_info.seller || 'Unknown Seller',
              sellerType: stock.user_info.sellerType,
              location: stock.user_info.location || 'Unknown',
              rating: stock.rating,
              reviews: stock.reviews,
              image: stock.image,
              category: stock.category || 'misc',
              inStock: stock.quantity > 0,
              discount: stock.discount
            }));
            setProducts(formatted);
          })
          .catch(err => console.error("Failed to fetch stocks:", err))
          .finally(() => setLoading(false));
      };

  useEffect(() => {
    fetchProducts();
  }, []);



  const categories = [
    { id: 'all', name: 'All Categories', icon: '🛍️' },
    { id: 'food', name: 'Food & Beverages', icon: '🍽️' },
    { id: 'clothing', name: 'Clothing & Textiles', icon: '👕' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'beauty', name: 'Beauty & Care', icon: '💄' },
    { id: 'accessories', name: 'Accessories', icon: '👜' },
    { id: 'home', name: 'Home & Furniture', icon: '🏠' },
    { id: 'misc', name: 'Miscellaneous', icon: '!' }
  ];

    const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesBusinessType = selectedBusinessType === 'all' || product.sellerType === selectedBusinessType;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesBusinessType && matchesPrice;
  });

  return (
    <div className="discover-container">
      {/* Header Section */}
      <div className="discover-header">
        <div className="header-content">
          <h1 className="discover-title">Discover Products</h1>
          <p className="discover-subtitle">Connect with retailers and wholesalers across India</p>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search products, sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <button 
  className="back-button" 
  onClick={() => navigate(`/dash`)}
>
  <svg
    className="home-icon"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 19-7-7 7-7"></path>
    <path d="M19 12H5"></path>
  </svg>
  Back to Dashboard
</button>

      </div>

      <div className="discover-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filter-section">
  <h3 className="filter-title">Categories</h3>
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="category-dropdown"
  >
    <option value="" disabled hidden>
      Choose Category
    </option>
    {categories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ))}
  </select>
</div>


          <div className="filter-section">
            <h3 className="filter-title">Business Type</h3>
            <div className="business-type-filters">
              <button
                onClick={() => setSelectedBusinessType('all')}
                className={`business-btn ${selectedBusinessType === 'all' ? 'active' : ''}`}
              >
                All Businesses
              </button>
              <button
                onClick={() => setSelectedBusinessType('Retail')}
                className={`business-btn ${selectedBusinessType === 'Retail' ? 'active' : ''}`}
              >
                🏪 Retailers
              </button>
              <button
                onClick={() => setSelectedBusinessType('Whole-Sale')}
                className={`business-btn ${selectedBusinessType === 'Whole-Sale' ? 'active' : ''}`}
              >
                🏭 Wholesalers
              </button>
            </div>
          </div>

          
        </div>
        
        {/* Products Grid */}
        <div className="products-section">
          <div className="products-header">
            <h2 className="section-title">
              {loading ? 'Loading products...' : `${filteredProducts.length} Products Found`}
            </h2>
            <div className="sort-options">
              <select className="sort-select">
                <option value="relevance">Sort by Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

        {loading ? (
    <div className="loading-indicator" ></div>
  ) : filteredProducts.length === 0 ? (
    <div className="no-results">
      <div className="no-results-icon">🔍</div>
      <h3>No products found</h3>
      <p>Try adjusting your search or filter criteria</p>
    </div>
  ) : ( <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                {product.discount > 0 && (
                  <div className="discount-badge">
                    {product.discount}% OFF
                  </div>
                )}
                
                <div className="product-image-container">
                  {product.image ? (<img 
                    src={`http://localhost:5000${product.image}`}
                    alt={product.name}
                    className="product-image"/>):null
                  }
                  {!product.inStock && (
                    <div className="out-of-stock-overlay">
                      <span>Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString()}</span>
                    {product.discount > 0 && (
                      <span className="original-price">
                        ₹{Math.round(product.price / (1 - product.discount / 100)).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="seller-info">
                    <div className="seller-details">
                      <span className="seller-name">{product.seller}</span>
                      <span className={`seller-type name ${product.sellerType}`}>
                        {product.sellerType === 'retailer' ? '🏪' : '🏭'} {product.sellerType}
                      </span>
                    </div>
                    <div className="seller-location">📍 {product.location}</div>
                  </div>

                  <div className="product-stats">
                    <div className="rating">
                      <span className="rating-stars">⭐</span>
                      <span className="rating-value">{product.rating}</span>
                      <span className="rating-count">({product.reviews})</span>
                    </div>
                    <div className="min-order">
                      Min Order: {product.minOrder} units
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                className="inquire-btn"
                disabled={!product.inStock}
                onClick={() => {
                  setSelectedProduct(product);
                  setShowInquiryModal(true);
                }}
                 >
                    {product.inStock ? 'Send Inquiry' : 'Out of Stock'}
                  </button>
                    <button className="wishlist-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>)}
        </div>
      </div>
      {showInquiryModal && (
  <div className="inquiry-modal">
    <div className="inquiry-modal-content">
      <h3>Send Inquiry to {selectedProduct?.seller}</h3>
      <textarea
        placeholder="Type your message..."
        value={inquiryMessage}
        onChange={(e) => setInquiryMessage(e.target.value)}
      />
      <div className="modal-actions">
        <button
          onClick={() => {
            setShowInquiryModal(false);
            setInquirySuccess(true);
            setInquiryMessage('');
          }}
          className="send-btn"
        >
          Send Message
        </button>
        <button onClick={() => setShowInquiryModal(false)} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    {inquirySuccess && (
      <div className="inquiry-success">
        Message has been sent! The seller will contact you as soon as possible.
        <button onClick={() => setInquirySuccess(false)} className='clos-btn'>Close</button>
      </div>
    )}
    
    </div>
  );
};

export default DiscoverPage;