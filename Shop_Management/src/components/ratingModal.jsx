import React, { useState, useEffect } from 'react';
import { X, Send, Edit3 } from 'lucide-react';
import './ratingModal.css';

const RatingModal = ({ order, onClose, onSubmit, existingRating = null }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing] = useState(!!existingRating);

  const ratingLabels = {
    1: 'Disappointing',
    2: 'Below Average',
    3: 'Good Enough',
    4: 'Great',
    5: 'Extremely Satisfied'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        order_id: order.id, // ✅ Fixed key
        rating,
        review: review.trim() 
      });
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`Failed to ${isEditing ? 'update' : 'submit'} review. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
  };

  // Generate realistic product displays based on rating
  const generateProducts = (currentRating) => {
    const products = [];
    const productsPerLevel = 2;
    const totalProducts = currentRating * productsPerLevel;
    
    for (let i = 0; i < totalProducts; i++) {
      const delay = i * 0.15;
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      products.push(
        <div 
          key={i} 
          className="product-item"
          style={{ 
            animationDelay: `${delay}s`,
            left: `${15 + col * 25}%`,
            top: `${20 + row * 30}%`,
          }}
        >
          <div className="product-box"></div>
          <div className="product-shine"></div>
        </div>
      );
    }
    return products;
  };

  // Generate customers based on rating
  const generateCustomers = (currentRating) => {
    const customers = [];
    const customerCount = Math.min(currentRating - 1, 4);
    
    for (let i = 0; i < customerCount; i++) {
      const delay = (currentRating * 2 + i) * 0.2;
      customers.push(
        <div 
          key={i} 
          className="customer-figure"
          style={{ 
            animationDelay: `${delay}s`,
            left: `${20 + i * 15}%`
          }}
        >
          <div className="customer-head"></div>
          <div className="customer-body"></div>
          <div className="customer-shadow"></div>
        </div>
      );
    }
    return customers;
  };

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal-container">
        <div className="rating-modal-header">
          <div className="rating-modal-title-section">
            <h2 className="rating-modal-title">
              {isEditing ? 'Edit Your Review' : 'Rate Your Experience'}
            </h2>
            <button onClick={onClose} className="rating-modal-close-btn">
              <X className="close-icon" />
            </button>
          </div>
        </div>

        <div className="rating-modal-content">
          <div className="product-info">
            <h3 className="product-name">{order?.items?.[0]?.name || 'Product'}</h3>
            <p className="shop-name">from {order?.shopName || 'Shop'}</p>
            {isEditing && (
              <div className="edit-indicator">
                <Edit3 className="edit-icon" />
                <span>Editing your review</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="rating-form">
            <div className="rating-section">
              <h4 className="rating-title">How satisfied are you with this product?</h4>
              
              <div className="shop-rating-container">
                <div className="modern-shop">
                  {/* Shop Structure */}
                  <div className="shop-foundation"></div>
                  <div className="shop-walls">
                    <div className="wall-texture"></div>
                  </div>
                  
                  {/* Shop Windows */}
                  <div className="shop-window left-window">
                    <div className="window-frame">
                      <div className="window-glass">
                        <div className="glass-reflection"></div>
                        <div className="window-display">
                          {rating > 0 && generateProducts(Math.min(rating, 3))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shop-window right-window">
                    <div className="window-frame">
                      <div className="window-glass">
                        <div className="glass-reflection"></div>
                        <div className="window-display">
                          {rating > 2 && generateProducts(Math.max(0, rating - 2))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shop Door */}
                  <div className="shop-door">
                    <div className="door-frame">
                      <div className="door-panel">
                        <div className="door-handle"></div>
                        <div className="door-glass">
                          <div className="door-reflection"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shop Sign */}
                  <div className="shop-sign">
                    <div className="sign-board">
                      <div className="sign-text">SHOP</div>
                      <div className="sign-glow"></div>
                    </div>
                  </div>
                  
                  {/* Lighting Effects */}
                  {rating > 0 && (
                    <div className="shop-lighting">
                      <div className="ambient-light"></div>
                      {rating >= 3 && <div className="warm-glow"></div>}
                      {rating >= 4 && <div className="success-aura"></div>}
                    </div>
                  )}
                  
                  {/* Street and Customers */}
                  <div className="street-area">
                    <div className="sidewalk"></div>
                    <div className="street-lighting"></div>
                    {rating > 1 && (
                      <div className="customer-area">
                        {generateCustomers(rating)}
                      </div>
                    )}
                  </div>
                  
                  {/* Premium Effects for High Ratings */}
                  {rating >= 5 && (
                    <div className="premium-effects">
                      <div className="sparkle sparkle-1"></div>
                      <div className="sparkle sparkle-2"></div>
                      <div className="sparkle sparkle-3"></div>
                      <div className="success-rays"></div>
                    </div>
                  )}
                </div>

                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rating-btn ${rating >= value ? 'active' : ''}`}
                      onClick={() => handleRatingClick(value)}
                    >
                      <span className="rating-number">{value}</span>
                      <span className="rating-star">⭐</span>
                    </button>
                  ))}
                </div>
              </div>

              {rating > 0 && (
                <div className="rating-feedback">
                  <p className="rating-text">{ratingLabels[rating]}</p>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, index) => (
                      <span
                        key={index}
                        className={`star ${index < rating ? 'filled' : ''}`}
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
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience with this product..."
                className="review-textarea"
                rows={4}
                maxLength={500}
              />
              <div className="character-count">
                {review.length}/500 characters
              </div>
            </div>

            <div className="rating-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
                disabled={isSubmitting}
              >
                {isEditing ? 'Cancel' : 'Skip for now'}
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    {isEditing ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="submit-icon" />
                    {isEditing ? 'Update Review' : 'Submit Review'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;