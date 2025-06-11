import React, { useState } from 'react';
import { X, Send, Coffee } from 'lucide-react';
import './ratingModal.css';

const RatingModal = ({ order, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        orderId: order.id,
        productName: order.items[0].name,
        rating,
        review: review.trim(),
        shopName: order.shopName
      });
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCupClick = (value) => {
    setRating(value);
  };

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal-container">
        <div className="rating-modal-header">
          <div className="rating-modal-title-section">
            <h2 className="rating-modal-title">Rate Your Experience</h2>
            <button onClick={onClose} className="rating-modal-close-btn">
              <X className="close-icon" />
            </button>
          </div>
        </div>

        <div className="rating-modal-content">
          <div className="product-info">
            <h3 className="product-name">{order.items[0].name}</h3>
            <p className="shop-name">from {order.shopName}</p>
          </div>

          <form onSubmit={handleSubmit} className="rating-form">
            <div className="rating-section">
              <h4 className="rating-title">How satisfied are you with this product?</h4>
              
              <div className="cup-rating-container">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div
                    key={value}
                    className={`cup-container ${rating >= value ? 'active' : ''}`}
                    onClick={() => handleCupClick(value)}
                  >
                    <div className="cup-wrapper">
                      <div className="cup">
                        <div 
                          className="cup-fill"
                          style={{
                            height: rating >= value ? `${(value / 5) * 100}%` : '0%'
                          }}
                        ></div>
                        <div className="cup-handle"></div>
                      </div>
                      <div className="cup-steam">
                        <div className="steam-line steam-1"></div>
                        <div className="steam-line steam-2"></div>
                        <div className="steam-line steam-3"></div>
                      </div>
                    </div>
                    <span className="cup-label">{value}</span>
                  </div>
                ))}
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
                Skip for now
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="submit-icon" />
                    Submit Review
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