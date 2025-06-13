import React, { use, useState } from 'react';
import './discover.css';
import { useNavigate,useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios'; // if not already imported

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('reviews');
  const [modalSource, setModalSource] = useState(null); // 'wishlist' or 'grid'
  const [products, setProducts] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [showWishlist, setShowWishlist] = useState(false);
  const minOrder = Number(selectedProduct?.minOrder || 1);
const quantity = Number(selectedProduct?.quantity || 0);
const threshold = Number(selectedProduct?.threshold || 0);
const maxOrderable = Math.max(0, quantity - threshold);


  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [recommendations, setRecommendations] = useState([]);

   const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/token', { 
        withCredentials: true 
      });
      setCurrentUser(response.data.user_token || response.data.id);
    } catch (error) {
      console.error('Error fetching current user:', error);
      alert('Error fetching current user. Please Login.');
    }
  };
  useEffect(() => {
  if (!fetchCurrentUser) {
    navigate('/'); // or your login route
  }
}, [currentUser,navigate]);

useEffect(() => {
  if (currentUser !== null) {
    fetchProducts();
    fetchWishlist();
    fetchRecommendations(); 
  }
}, [currentUser]);

  const isOwnProduct = (product) => {
  return product.user_token === currentUser;
};
const fetchRecommendations = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/recommendations", {
      credentials: "include"
    });
    const data = await res.json();
    setRecommendations(data.recommendations || []);
  } catch (err) {
    console.error("Failed to load recommendations:", err);
  }
};



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
          threshold: stock.minThreshold,
          seller: stock.user_info.seller || 'Unknown Seller',
          supplier:stock.supplier,
          user_token:stock.user_info.user_token,
          sellerType: stock.user_info.sellerType,
          location: stock.user_info.location || 'Unknown',
          rating: stock.rating,
          reviews: stock.reviewCount,
          image: stock.image_id
            ? `/image/${stock.image_id}`
            : (stock.image && stock.image.length === 24
              ? `/image/${stock.image}`
              : (stock.image?.startsWith('/') ? stock.image : `/static/uploads/${stock.image}`)),
          category: stock.category?.toLowerCase() || 'misc',
          quantity: stock.quantity,
          inStock: (stock.quantity -stock.minThreshold)> 0,
          discount: stock.discount,
          createdAt: stock.addedAt
        }));
        setProducts(formatted);
      })
      .catch(err => console.error("Failed to fetch stocks:", err))
      .finally(() => setLoading(false));
  };

useEffect(() => {
  fetchCurrentUser(); // Fetch current user when component mounts
  fetchProducts();
  fetchWishlist();
  fetchRecommendations(); 

}, []);

  const toggleWishlist = async (product) => {
  const exists = wishlist.find((item) => item.stock_id === product.id);
  if (exists) {
    await removeFromWishlist(product.id);
  } else {
    await addToWishlist(product.id);
  }

  // ✅ Always fetch the latest wishlist after toggling
  fetchWishlist();
};


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
    setPlacingOrder(true);
    setShowBuyModal(false);
    axios.post('http://localhost:5000/api/orders/new', {
      productId: selectedProduct.id,
      quantity: parseInt(buyQuantity),
      totalPrice: parseFloat((selectedProduct.price * buyQuantity).toFixed(2))
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    })
    .then(() => {
      alert("🛒 Order placed successfully!");
      window.location.reload();
    })
    .catch(err => {
      console.error("❌ Error placing order:", err.response?.data || err.message);
      alert(err.message);
      if (!fetchCurrentUser()){
        alert("Failed to place order.Login!!");
      } 

    }).finally(() => {
      setPlacingOrder(false);
 // ✅ Stop loading
    });
  };

  const addToWishlist = async (productId) => {
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stock_id: productId }),
      });
      if (res.ok) {
        console.log('Added to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/remove/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        console.log('Removed from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const res = await fetch('http://localhost:5000/api/wishlist/show', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      } else {
        console.error('Failed to fetch wishlist');
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.stock_id === productId);
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

        <div className="header-actions">
          <button 
            className="wishlist-header-btn" 
            onClick={() => setShowWishlist(!showWishlist)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Wishlist ({wishlist.length})
          </button>

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
      </div>

      {/* Wishlist Modal */}
      {showWishlist && (
        <div className="inquiry-modal" style={{ zIndex: 1000 }}>
          <div className="wishlist-modal" style={{ 
            maxWidth: '800px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>My Wishlist ({wishlist.length} items)</h2>
              <button 
                onClick={() => setShowWishlist(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {wishlistLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Loading wishlist...</div>
              </div>
            ) : wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>💔</div>
                <h3>Your wishlist is empty</h3>
                <p>Start adding products to your wishlist!</p>
              </div>
            ) : (
              <div className="wishlist-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {wishlist.map((item,index) => (
                  <div key={item.wishlist_id|| item.stock_id || index} className="product-card" style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        removeFromWishlist(item.stock_id);
                        setWishlist(prev => prev.filter(w => w.wishlist_id !== item.wishlist_id));
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                    >
                      ×
                    </button>

                    <div className="product-image-container">
                      {item.product.image && (
                        <img
                          src={`http://localhost:5000${item.product.image || '/placeholder.jpg'}`}
                          alt={item.product.name}
                          className="product-image"
                          onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                        />
                      )}
                      {!item.product.inStock && (
                        <div className="out-of-stock-overlay">
                          <span>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <h3 className="product-name">{item.product.name}</h3>
                      <div className="product-price">
                        <span className="current-price">₹{item.product.price.toLocaleString()}</span>
                        {item.product.discount > 0 && (
                          <span className="original-price">
                            ₹{Math.round(item.product.price / (1 - item.product.discount / 100)).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="seller-info">
                        <div className="seller-details">
                          <span className="seller-name">{item.product.seller?.name || 'Unknown'}</span>
<span className={`seller-type name ${item.product.seller?.type || 'Unknown'}`}>
  {item.product.seller?.type === 'Retail' ? '🏪' : '🏭'} {item.product.seller?.type || 'Unknown'}
</span>
                          </div>
                         <div className="seller-location">📍 {item.product.seller?.location || 'Unknown'}</div>
                 
                      </div>

                      <div className="product-stats">
                        <div className="rating">
                          <span className="rating-stars"onClick={()=>navigate(`/dash`)}>⭐</span>
                          <span className="rating-value">{item.product.rating}</span>
                          <span className="rating-count">({item.product.reviews})</span>
                        </div>
                        <div className="min-order">
                          Min Order: {item.product.minOrder} units
                        </div>
                      </div>

                      <div className="product-actions">
                        <button
                          className="inquire-btn"
                          disabled={!item.product.inStock}
                          onClick={() => {
                            const productForModal = {
                              id: item.product.id,
                              name: item.product.name,
                              price: item.product.price,
                              quantity: item.product.quantity,
                              threshold: item.product.minThreshold,
                              seller: item.product.seller,
                              sellerType: item.product.sellerType,
                              location: item.product.location,
                              rating: item.product.rating,
                              reviews: item.product.reviews,
                              image: item.product.image,
                              discount: item.product.discount
                            };
                            setModalSource('wishlist');
                            setSelectedProduct(productForModal);
                            setBuyQuantity(Number(item.product.minOrder)||1);
                            setShowBuyModal(true);
                            setShowWishlist(false);
                          }}
                        >
                          {item.product.inStock ? 'Buy Now' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
           {!showBuyModal && loading ? (
            <h1 className="section-title">Wait a moment...</h1>
            ) : (
              <h2 className="section-title">
                {loading ? 'Loading products...' : `${filteredProducts.length} Products Found`}
              </h2>
            )}
            <div className="sort-options">
              <select className="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="reviews">Sort by Number of Reviews</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-indicator"></div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.slice(0, 2).map((product, index) => (
              <div key={`${product.id}-${index}`} className="product-card">
                {/* Your existing product card JSX */}
                {product.discount > 0 && (
                  <div className="discount-badge">
                    {product.discount}% OFF
                  </div>
                )}

                  <div className="product-image-container">
                    {product.image ? (
                      <img
                        src={`http://localhost:5000${product.image || '/placeholder.jpg'}`}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                      />
                    ) : null}
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
                        <span className="rating-stars"onClick={()=>navigate(`/dash`)}>⭐</span>
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
                        disabled={!product.inStock || isOwnProduct(product)}
                        onClick={() => {
                          setModalSource('grid');
                          setSelectedProduct(product);
                          const minOrder = Number(product.minOrder);
                          setBuyQuantity(isNaN(minOrder) ? 1 : minOrder);
                          setShowBuyModal(true);
                        }}
                      >
                        {!product.inStock
                        ? 'Out of Stock'
                        : isOwnProduct(product)
                        ? 'Your Product'
                        : 'Buy Now'}
                      </button>
                      {!isOwnProduct(product) &&(
                      <button
                        className="wishlist-btn"
                        onClick={() => toggleWishlist(product)}
                        title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'red' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>)}
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length > 0 && (
  <div className="recommendation-section">
    <h3 className="recommendation-title">🌟 Recommended for You</h3>
    <div className="recommendation-grid">
      {recommendations.map((product) => (
        <div
          key={product.id}
          className="recommendation-card"
          onClick={() => {
            setSelectedProduct(product);
            setBuyQuantity(1);
            setShowBuyModal(true);
          }}
        >
          <div className="recommendation-badge">Recommended</div>
          <img
            src={`http://localhost:5000${product.image}`}
            alt={product.name}
            className="recommendation-image"
            onError={(e) => {
              e.target.src = "/placeholder.jpg";
            }}
          />
          <div className="recommendation-info">
            <div className="recommendation-name">{product.name}</div>
            <div className="recommendation-price">₹{product.price?.toLocaleString()}</div>
            {product.rating && (
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                ⭐ {product.rating} ({product.reviews || 0})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

  {filteredProducts.slice(2).map((product, index) => (
    <div key={`${product.id}-after-${index}`} className="product-card">
      {/* Your existing product card JSX - same as above */}
      {product.discount > 0 && (
        <div className="discount-badge">
          {product.discount}% OFF
        </div>
      )}
<div className="product-image-container">
                    {product.image ? (
                      <img
                        src={`http://localhost:5000${product.image || '/placeholder.jpg'}`}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                      />
                    ) : null}
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
                        <span className="rating-stars" onClick={()=>navigate(`/dash`)}>⭐</span>
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
                        disabled={!product.inStock || isOwnProduct(product)}
                        onClick={() => {
                          setSelectedProduct(product);
setBuyQuantity(Number(product.minOrder) || 1);
                          setShowBuyModal(true);
                        }}
                      >
                        {!product.inStock
                        ? 'Out of Stock'
                        : isOwnProduct(product)
                        ? 'Your Product'
                        : 'Buy Now'}
                      </button>

                     {!isOwnProduct(produtc) &&( <button
                        className="wishlist-btn"
                        onClick={() => toggleWishlist(product)}
                        title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'red' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>)}
                    </div>
                  </div>
                </div>
  ))}
</div>
  
          )}
        </div>
      </div>
          
      {/* Buy Modal */}
      {showBuyModal && selectedProduct && (() => {
        const maxOrderable = Math.max(0, selectedProduct.quantity - selectedProduct.threshold);
        return (
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
                    <span className="seller-name">{selectedProduct.seller.name}</span>
                    <span className="seller-name">{selectedProduct.seller.name}</span>
                    <span className={`seller-type name ${selectedProduct.sellerType}`}>
                      {selectedProduct.sellerType === 'retailer' ? '🏪' : '🏭'} {selectedProduct.sellerType}
                    </span>
                  </div>
                  <div className="seller-location">📍 {selectedProduct.location}</div>
                </div>

                <div className="product-stats">
                  <div className="rating">
                    <span className="rating-stars"onClick={()=>navigate(`/dash`)}>⭐</span>
                    <span className="rating-value">{selectedProduct.rating}</span>
                    <span className="rating-count">({selectedProduct.reviews})</span>
                  </div>
                  <div className="min-order">Stock: {selectedProduct.quantity}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <button
                      className='wishlist-btn'
                      onClick={() => setBuyQuantity(prev => Math.max(minOrder, prev - 1))}
                      disabled={buyQuantity <= minOrder}
                      title={buyQuantity <= minOrder ? 'Minimum order limit reached' : 'Decrease quantity'}
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