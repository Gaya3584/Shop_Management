import React, { useEffect } from 'react';
import './splash.css';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Auto-finish after 4 seconds to allow animations to complete
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 4000);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, [onFinish]);
  return (
    <div className="splash-container">
      <div className="background-gradient"></div>
      
      {/* Main Content */}
      <div className="content-wrapper">
        <h1 className="app-title">Welcome t Shopsy</h1>
        <p className="app-subtitle">Manage your stocks effeciently!</p>
        
        {/* Animation Container */}
        <div className="animation-container">
          {/* Step 1: Shopping */}
          <div className="step step-1">
            <div className="icon-container">
              <div className="shopping-cart">
                <div className="cart-body"></div>
                <div className="cart-handle"></div>
                <div className="cart-wheels">
                  <div className="wheel wheel-1"></div>
                  <div className="wheel wheel-2"></div>
                </div>
                <div className="cart-items">
                  <div className="item item-1"></div>
                  <div className="item item-2"></div>
                  <div className="item item-3"></div>
                </div>
              </div>
            </div>
            <span className="step-label">Browse & Select</span>
          </div>

          {/* Arrow 1 */}
          <div className="arrow arrow-1">
            <div className="arrow-line"></div>
            <div className="arrow-head"></div>
          </div>

          {/* Step 2: Ordering */}
          <div className="step step-2">
            <div className="icon-container">
              <div className="phone">
                <div className="phone-screen">
                  <div className="app-icon"></div>
                  <div className="order-button">
                    <div className="button-text"></div>
                  </div>
                </div>
              </div>
            </div>
            <span className="step-label">Place Order</span>
          </div>

          {/* Arrow 2 */}
          <div className="arrow arrow-2">
            <div className="arrow-line"></div>
            <div className="arrow-head"></div>
          </div>

          {/* Step 3: Delivery */}
          <div className="step step-3">
            <div className="icon-container">
              <div className="delivery-truck">
                <div className="truck-cabin"></div>
                <div className="truck-body"></div>
                <div className="truck-wheels">
                  <div className="truck-wheel wheel-1"></div>
                  <div className="truck-wheel wheel-2"></div>
                </div>
                <div className="delivery-smoke">
                  <div className="smoke-puff puff-1"></div>
                  <div className="smoke-puff puff-2"></div>
                  <div className="smoke-puff puff-3"></div>
                </div>
              </div>
            </div>
            <span className="step-label">Fast Delivery</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="loading-container">
          <div className="loading-dots">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
          <p className="loading-text">Loading your experience...</p>
          {onFinish && (
            <button 
              className="skip-button" 
              onClick={onFinish}
              aria-label="Skip splash screen"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="floating-elements">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
        <div className="floating-circle circle-4"></div>
      </div>
    </div>
  );
};

export default SplashScreen;