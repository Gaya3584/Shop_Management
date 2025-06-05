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
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('reviews');
  const [products, setProducts] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  

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
              threshold:stock.minThreshold,
              seller: stock.user_info.seller || 'Unknown Seller',
              sellerType: stock.user_info.sellerType,
              location: stock.user_info.location || 'Unknown',
              rating: stock.rating,
              reviews: stock.reviews,
              image: stock.image_id
  ? `/image/${stock.image_id}`
  : (stock.image && stock.image.length === 24
      ? `/image/${stock.image}`
      : (stock.image?.startsWith('/') ? stock.image : `/static/uploads/${stock.image}`)),
              category: stock.category?.toLowerCase() || 'misc',
              quantity:stock.quantity,
              inStock: stock.quantity > 0,
              discount: stock.discount,
              createdAt:stock.addedAt
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
  }).sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

   const handlePlaceOrder = () => {
      if (buyQuantity > selectedProduct.quantity) {
        alert("Cannot buy more than in stock");
        return;
      }

      axios.post('http://localhost:5000/api/orders/new', {
        productId: selectedProduct.id,
        quantity: parseInt(buyQuantity),
        totalPrice: parseFloat((selectedProduct.price * buyQuantity).toFixed(2))
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      })
      .then(() => {
        setShowBuyModal(false);
        alert("🛒 Order placed successfully!");
      })
      .catch(err => {
        console.error("❌ Error placing order:", err.response?.data || err.message);
        alert("Failed to place order.");
      });
    };


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
              <select className="sort-select"  value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="reviews">Sort by Number of Reviews</option>
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
                    src={`http://localhost:5000${product.image || '/placeholder.png'}`}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />):null
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
                          setBuyQuantity(1);
                          setShowBuyModal(true);
                        }}>
                        {product.inStock ? 'Buy Now' : 'Out of Stock'}
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
            {showBuyModal && selectedProduct && (() => {
  const maxOrderable = Math.max(0, selectedProduct.quantity - selectedProduct.threshold);
              return(
        <div className="inquiry-modal">
          <div className="product-card" style={{ maxWidth: 500 }}>
            <div className="product-image-container">
              <img
                src={`http://localhost:5000${selectedProduct.image}`}
                alt={selectedProduct.name}
                className="product-image"
              />
            </div>

            <div className="product-info">
              <h3 className="product-name">{selectedProduct.name}</h3>
              <div className="product-price">
                <span className="current-price">₹{selectedProduct.price.toLocaleString()}</span>
                {selectedProduct.discount > 0 && (
                  <span className="original-price">
                    ₹{Math.round(selectedProduct.price / (1 - selectedProduct.discount / 100)).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="seller-info">
                <div className="seller-details">
                  <span className="seller-name">{selectedProduct.seller}</span>
                  <span className={`seller-type name ${selectedProduct.sellerType}`}>
                    {selectedProduct.sellerType === 'retailer' ? '🏪' : '🏭'} {selectedProduct.sellerType}
                  </span>
                </div>
                <div className="seller-location">📍 {selectedProduct.location}</div>
              </div>

              <div className="product-stats">
                <div className="rating">
                  <span className="rating-stars">⭐</span>
                  <span className="rating-value">{selectedProduct.rating}</span>
                  <span className="rating-count">({selectedProduct.reviews})</span>
                </div>
                <div className="min-order">Stock: {selectedProduct.quantity}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
                <button
                  onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                  className="wishlist-btn"
                >
                  -
                </button>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{buyQuantity}</div>
                <button
                    onClick={() => setBuyQuantity(prev => (prev < maxOrderable ? prev + 1 : prev))}
                    className="wishlist-btn"
                    disabled={buyQuantity >= maxOrderable}
                    title={
                      buyQuantity >= maxOrderable
                        ? 'Reached the maximum orderable quantity'
                        : 'Increase quantity'
                    }
                  >
                    +
                  </button>
              </div>

              <div className="price-display">
                Total: ₹{(selectedProduct.price * buyQuantity).toLocaleString()}
              </div>

              <div className="product-actions">
                <button className="inquire-btn" onClick={handlePlaceOrder}>
                  Confirm Buy
                </button>
                <button className="cancel-btn" onClick={() => setShowBuyModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        );
    })()}    
    </div>
  );
};

export default DiscoverPage;