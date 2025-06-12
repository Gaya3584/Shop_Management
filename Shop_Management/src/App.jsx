import './App.css'
import SignUp from './components/SignUp'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'
import Disc from './components/discover'
import Stock from './components/stock'
import Pro from './components/profile'
import Analysis from './components/analysis'
import Order from './components/orders'
import Help from './components/help';
import Settings from './components/settings';
import Notifications from './components/Notifications';
import Pass from'./components/forgot_pass';
import ResetPassword from './components/resetpass';
import SplashScreen from './components/splash';
import { useState } from 'react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSplashFinish = () => {
    setIsTransitioning(true);
    
    // Wait for transition animation to complete
    setTimeout(() => {
      setIsLoading(false);
      setIsTransitioning(false);
    }, 800); // 800ms transition duration
  };

  return (
    <Router>
      {isLoading ? (
        <div className={`splash-wrapper ${isTransitioning ? 'fade-out' : ''}`}>
          <SplashScreen onFinish={handleSplashFinish} />
        </div>
      ) : (
        <div className="main-app fade-in">
          <Routes>
            <Route path="/" element={<Log />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dash" element={<Dash />} />
            <Route path="/disc" element={<Disc />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/profile" element={<Pro />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications/>}/>
            <Route path='/forgot-password' element={<Pass/>}/>
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;